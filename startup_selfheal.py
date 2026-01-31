import subprocess
import time
import logging
from council_notification import council_notify

# List of containers to check
CONTAINERS_TO_CHECK = [
    "council_dashboard",
    "council_db",
    "council_visualizer"
]  # Add or edit container names as needed

HEALTHCHECK_CMD_TEMPLATE = "docker inspect --format='{{{{.State.Health.Status}}}}' {name}"
RESTART_CMD_TEMPLATE = "docker restart {name}"
LOG_FILE = "council_multi_startup.log"
CHECK_INTERVAL = 30  # seconds between checks
MAX_ATTEMPTS = 10    # Number of times to retry before trying restart

logging.basicConfig(filename=LOG_FILE, level=logging.INFO)

def check_health(container_name):
    try:
        result = subprocess.check_output(
            HEALTHCHECK_CMD_TEMPLATE.format(name=container_name), shell=True
        ).decode().strip()
        logging.info(f"{container_name} health: {result}")
        return result == "healthy"
    except Exception as e:
        logging.error(f"{container_name} health check error: {e}")
        return False

def self_heal(container_name):
    try:
        council_notify(
            f"Initiating self-healing: restarting {container_name}",
            subject=f"Council Master: {container_name} Auto-Recovery",
            severity="warning",
            container=container_name,
        )
        subprocess.check_call(RESTART_CMD_TEMPLATE.format(name=container_name), shell=True)
        logging.info(f"{container_name} restarted for self-healing.")
        council_notify(
            f"{container_name} restarted for self-healing.",
            subject=f"Council Master: {container_name} Restarted",
            severity="info",
            container=container_name,
        )
        time.sleep(60)
        return check_health(container_name)
    except Exception as e:
        logging.error(f"{container_name} self-healing failed: {e}")
        council_notify(
            f"{container_name} self-healing failed: {e}",
            subject=f"Council Master: {container_name} Self-Healing Failed",
            severity="error",
            container=container_name,
        )
        return False

def main():
    unhealthy = []
    for name in CONTAINERS_TO_CHECK:
        attempt = 0
        healthy = False
        while attempt < MAX_ATTEMPTS:
            healthy = check_health(name)
            if healthy:
                logging.info(f"{name} healthy — no action required.")
                break
            logging.warning(f"{name} unhealthy (attempt {attempt+1}/{MAX_ATTEMPTS}). Retrying.")
            time.sleep(CHECK_INTERVAL)
            attempt += 1
        if not healthy:
            unhealthy.append(name)
            council_notify(f"{name} is unhealthy after {MAX_ATTEMPTS} attempts. Initiating self-healing.", subject=f"Council Master: {name} Unhealthy", severity="warning", container=name)

    if unhealthy:
        for name in unhealthy:
            logging.warning(f"{name} health check failed repeatedly. Initiating self-healing.")
            healed = self_heal(name)
            status = "HEALTHY" if healed else "UNHEALTHY after self-heal"
            print(f"{name}: {status}")
            logging.info(f"{name}: {status}")
            council_notify(f"{name}: {status}", subject=f"Council Master: {name} Status", severity=("info" if healed else "error"), container=name)
    else:
        print("All containers are healthy.")

if __name__ == "__main__":
    main()

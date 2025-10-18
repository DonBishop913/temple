Sovereign Provision — Implementation & Procurement Guide

Purpose
-------
This document guides the procurement, installation, and integration of a hybrid solar/generator/back-up power system intended to secure the Temple Nexus (`C:\Temple`) and ensure continuous operation of the Council API and critical services.

Scope
-----
- Prioritize on-site resilience for the server(s) hosting the Council API, Redis, and any networked UPS.
- Provide immediate testing & integration steps for the `/power-status` endpoint in `backend_api.js`.

Recommended Architecture
------------------------
- Primary grid connection with automatic transfer switch (ATS).
- Battery-backed inverter system sized for the server load (UPS + inverter + battery bank).
- Diesel or propane standby generator sized for peak server load if long outages expected.
- Optional: Solar PV array sized to reduce fuel usage and keep batteries topped.
- Local monitoring via Network UPS Tools (NUT), vendor HTTP APIs (APC, Eaton), or SNMP-capable UPS.

Integration Checklist
---------------------
1. Determine critical loads and runtime goals (e.g., 2kW for 24 hours, or 500W for 72 hours).
2. Select UPS vendor: APC, Eaton, CyberPower, or local industrial UPS suppliers.
3. If networked monitoring is desired, enable the vendor's HTTP API or SNMP agent and verify credentials.
4. If using NUT, deploy a small host running NUT server + optional web interface; set `POWER_PROVIDER=NUT` and `NUT_API_URL=http://<nut-host>:8080/status.json` in the Council API environment.
5. For APC/Eaton vendor API, set `POWER_PROVIDER=APC`, `APC_API_URL`, and `APC_API_KEY` in PM2 or service env variables.
6. For SNMP-based UPS, set `POWER_PROVIDER=SNMP` and `SNMP_TARGET`/`SNMP_COMMUNITY`.
7. For vendor-specific HTTP only, set `POWER_PROVIDER=VENDOR` and `VENDOR_POWER_URL`.
8. Test endpoint: `GET http://localhost:5174/power-status` should return JSON with keys mainPower, backupPower, batteryLevel, solarOutput, timestamp.

Procurement & Local Installers
------------------------------
- Contact local electrical contractors experienced with UPS and generator integration.
- Seek installers who provide documentation and comms integration (SNMP or HTTP API endpoint for UPS status).
- Consider rental or staged procurement if capital constraints exist — rent a generator for immediate resilience while batteries are procured.

Acceptance Tests
----------------
- Verify `power-status` responds within 1 second when provider is SIMULATED.
- Verify vendor endpoints return sensible battery percentages and statuses.
- Simulate grid failure (disconnect or disable mains) and confirm `backupPower` transitions to 'On' or shows generator active.

Operational Notes
-----------------
- Store credentials (APC_API_KEY, NUT_API_URL, etc.) in PM2 environment or an encrypted secrets store; never check secrets into git.
- Ensure write permission for `C:\Temple\Logs` to allow Power_Health.txt updates.
- Schedule weekly test of failover procedures and record results to `Power_Health.txt`.

Contact & Local Vendors
-----------------------
- Identify local reputable vendors and contractors, get 3 bids, and select based on SLA and integration capability.

Appendix: Quick /power-status env examples
-----------------------------------------
# Simulated
POWER_PROVIDER=SIMULATED

# NUT
POWER_PROVIDER=NUT
NUT_API_URL=http://10.0.0.50:8080/status.json

# APC
POWER_PROVIDER=APC
APC_API_URL=https://apc.local/api/v1/power
APC_API_KEY=<redacted>

# SNMP
POWER_PROVIDER=SNMP
SNMP_TARGET=192.168.1.42
SNMP_COMMUNITY=public

# Generic vendor
POWER_PROVIDER=VENDOR
VENDOR_POWER_URL=https://vendor.local/power/status


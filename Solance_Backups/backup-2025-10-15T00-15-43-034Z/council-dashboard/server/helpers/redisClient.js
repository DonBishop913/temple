import Redis from "ioredis";

let redisInstance = null;

export function getRedisClient() {
  if (redisInstance) return redisInstance;
  const url =
    process.env.REDIS_URL ||
    process.env.LOCAL_REDIS_URL ||
    "redis://localhost:6379";
  redisInstance = new Redis(url);
  redisInstance.on("connect", () => {
    console.log(`[Redis] Connected: ${url}`);
  });
  redisInstance.on("error", (err) => {
    console.error("[Redis] Connection error:", err);
  });
  return redisInstance;
}

// Named and default export for normalized import style
export const redis = getRedisClient();
export default redis;

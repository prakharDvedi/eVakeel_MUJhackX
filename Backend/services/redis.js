const Redis = require("ioredis");

// Default to localhost, but allow config via ENV
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redis = new Redis(redisUrl, {
  // If Redis is down, don't crash the app, just fail silently or retry based on strategy
  // maxRetriesPerRequest: 1, // Fail fast if you want
  retryStrategy: function (times) {
    if (times > 3) {
      // After 3 retries, stop trying to connect for a while to avoid log spam
      // Return null to stop retrying, or a delay in ms
      // Here we wait 10 seconds before trying again
      return 10000;
    }
    return Math.min(times * 100, 3000);
  },
});

let isRedisConnected = false;

redis.on("connect", () => {
  isRedisConnected = true;
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  // Suppress heavy error logging if we know it's down
  if (isRedisConnected) {
    console.error("❌ Redis Connection Error:", err.message);
  }
  isRedisConnected = false;
});

module.exports = {
  /**
   * Get value from Redis. Returns null if not found or Redis is down.
   */
  get: async (key) => {
    if (!isRedisConnected) return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Set value in Redis with TTL (seconds). Fails silently if Redis is down.
   */
  set: async (key, value, ttl = 3600) => {
    if (!isRedisConnected) return;
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttl);
    } catch (e) {
      // Ignore error
    }
  },

  // allow direct access if needed, but risky if not checked
  client: redis,
};

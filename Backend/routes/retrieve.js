const aiProxy = require("../services/aiProxy");
const redis = require("../services/redis");

module.exports = async function (fastify, opts) {
  fastify.post("/search", async (request, reply) => {
    const { query, top_k = 5, domain = null } = request.body || {};
    if (!query)
      return reply
        .code(400)
        .send({ status: "error", error: "query is required" });

    const cacheKey = `retrieve:${query}_${top_k}_${domain || "all"}`;

    try {
      // 1. Try Cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        request.log.info({ msg: "Cache Hit", key: cacheKey });
        return reply.send({ status: "ok", data: cached, source: "cache" });
      }

      // 2. Fetch from Source (AI)
      const resp = await aiProxy.callAI("retrieve", { query, top_k, domain });

      // 3. Save to Cache (Background)
      redis.set(cacheKey, resp, 3600 * 24); // 24 hours

      return reply.send({ status: "ok", data: resp, source: "api" });
    } catch (err) {
      request.log.error(err);
      return reply
        .code(502)
        .send({ status: "error", error: "Retrieve failed" });
    }
  });
};

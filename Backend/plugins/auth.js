const fp = require("fastify-plugin");

module.exports = fp(async function (fastify, opts) {
  fastify.decorate("authenticate", async function (request, reply) {
    // BYPASS AUTHENTICATION: Always inject anonymous user
    request.user = {
      uid: "anonymous",
      email: "anonymous@evakeel.com",
      name: "Anonymous User",
      claims: { uid: "anonymous" },
    };
    return;
  });
});

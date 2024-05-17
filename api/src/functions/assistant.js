require("dotenv/config");

const { Readable } = require("node:stream");
const { app } = require("@azure/functions");

USE_STREAM = false;

app.setup({ enableHttpStream: true });
app.http("assistant", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);
    const query = await request.text();

    if (USE_STREAM) {
      const { processQueryGenerator } = require("../utils/query");
      return {
        headers: {
          'Content-Type': 'text/plain',
          "Transfer-Encoding": "chunked"
        }, body: Readable.from(processQueryGenerator(query))
      };
    }
    else {
      const { processQuery } = require("../utils/ns-query");
      return {
        headers: {
          'Content-Type': 'text/plain',
        }, body: processQuery(query)
      };
    }

  },
});

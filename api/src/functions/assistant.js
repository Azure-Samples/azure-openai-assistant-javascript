require("dotenv/config");

const { Readable } = require("node:stream");
const { app } = require("@azure/functions");
const { processQueryGenerator } = require("../utils/query");

app.setup({ enableHttpStream: true });
app.http("assistant", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);
    const query = await request.text();

    return {
      headers: {
        'Content-Type': 'text/plain',
        "Transfer-Encoding": "chunked"
      }, body: Readable.from(processQueryGenerator(query))
    };
  },
});

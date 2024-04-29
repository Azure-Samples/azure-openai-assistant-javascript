const dotenv = require("dotenv");
dotenv.config();

const { app } = require("@azure/functions");
app.setup({ enableHttpStream: true });

const OpenAI = require("openai");

const assistantDefinition = require("../assistant-financial.json");

const {
  ASSISTANT_ID,
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_API_VERSION,
  AZURE_OPENAI_ENDPOINT,
  AZURE_DEPLOYMENT_NAME,
  // TODO: uncomment this when https://github.com/openai/openai-node/pull/718 is merged
  //   AZURE_CLIENT_ID,
  //   AZURE_TENANT_ID,
} = process.env;

console.log(`ASSISTANT_ID: ${ASSISTANT_ID}`);
console.log(`AZURE_OPENAI_API_KEY: ${AZURE_OPENAI_API_KEY}`);
console.log(`AZURE_OPENAI_API_VERSION: ${AZURE_OPENAI_API_VERSION}`);
console.log(`AZURE_OPENAI_ENDPOINT: ${AZURE_OPENAI_ENDPOINT}`);

// Important: Errors handlings are removed intentionally. If you are using this sample in production
// please add proper errors handling.

async function initAzureOpenAI() {
  // TODO: uncomment this when https://github.com/openai/openai-node/pull/718 is merged
  //   console.log("Using Azure OpenAI (w/ AAD) ...");
  //   const credential = new DefaultAzureCredential({
  //     managedIdentityClientId: AZURE_CLIENT_ID,
  //     tenantId: AZURE_TENANT_ID,
  //   });
  //   const { token } = await credential.getToken(
  //     "https://cognitiveservices.azure.com/.default"
  //   );
  //   return new OpenAI({
  //     baseURL: `${AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "")}/openai`,
  //     defaultQuery: { "api-version": AZURE_OPENAI_API_VERSION },
  //     defaultHeaders: { Authorization: `Bearer ${token}` },
  //   });
  return new OpenAI({
    apiKey: AZURE_OPENAI_API_KEY,
    baseURL: `${AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "")}/openai`,
    defaultQuery: { "api-version": AZURE_OPENAI_API_VERSION },
    defaultHeaders: { "api-key": AZURE_OPENAI_API_KEY },
  });
}



async function* processQuery(userQuery) {
  // Step 0: Connect and acquire an OpenAI instance
  const openai = await initAzureOpenAI();
  console.log("OpenAI instance acquired");

  // Step 1: Retrieve or Create an Assistant
  const assistant = ASSISTANT_ID
    ? await openai.beta.assistants.retrieve(ASSISTANT_ID)
    : await openai.beta.assistants.create(assistantDefinition);

  // Step 2: Create a Thread
  const thread = await openai.beta.threads.create();

  // Step 3: Add a Message to the Thread
  const message = await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: userQuery,
  });

  // Step 4: Create a Run (and stream the response)
  const run = openai.beta.threads.runs.stream(thread.id, {
    assistant_id: assistant.id,
    stream: true,
  });

  for await (const chunk of run) {
    const { event, data } = chunk;
    console.log({ event, data });

    if (event === "thread.message.delta") {
      const delta = data.delta;

      if (delta) {
        const content = delta.content[0]?.text?.value || "";
        yield Buffer.from(content);
      }
    } else if (event === "thread.run.requires_action") {
      yield* handleRequiresAction(openai, data, data.id, data.thread_id);
    }
    // else if ... handle the other events as needed
  }
}

async function* handleRequiresAction(openai, run, runId, threadId) {
  try {
    const toolOutputs = await Promise.all(
      run.required_action.submit_tool_outputs.tool_calls.map(
        async (toolCall) => {
          if (toolCall.function.name === "getStockPrice") {
            return {
              tool_call_id: toolCall.id,
              output: await getStockPrice(
                JSON.parse(toolCall.function.arguments).symbol
              ),
            };
          }
          return toolCall;
        }
      )
    );

    // Submit all the tool outputs at the same time
    yield* submitToolOutputs(openai, toolOutputs, runId, threadId);
  } catch (error) {
    console.error("Error processing required action:", error);
  }
}

async function* submitToolOutputs(openai, toolOutputs, runId, threadId) {
  try {
    // Use the submitToolOutputsStream helper
    const asyncStream = openai.beta.threads.runs.submitToolOutputsStream(
      threadId,
      runId,
      { tool_outputs: toolOutputs }
    );
    for await (const chunk of asyncStream) {
      if (chunk.event === "thread.message.delta") {
        // stream message back to UI
        const delta = chunk.data.delta;

        if (delta) {
          const content = delta.content[0]?.text?.value || "";
          yield Buffer.from(content);
        }
      }
      // else if ... handle the other events as needed
    }
  } catch (error) {
    console.error("Error submitting tool outputs:", error);
  }
}

async function getStockPrice(symbol) {
  console.log("fetching fake closing stock value for symbol:".symbol);
  return Promise.resolve("" + Math.random(10) * 1000); // simulate network request
}

// API definition

app.http("assistant", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);
    const query = await request.text();
    context.log(`Received query: ${query}`)

    return { body: processQuery(query) };
  },
});

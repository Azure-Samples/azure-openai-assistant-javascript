const { Readable } = require("node:stream");
const dotenv = require("dotenv");
dotenv.config();

const { app } = require("@azure/functions");
app.setup({ enableHttpStream: true });

const { AzureOpenAI } = require("openai");
const { DefaultAzureCredential, getBearerTokenProvider } = require("@azure/identity");

const {
  ASSISTANT_ID,
  AZURE_DEPLOYMENT_NAME,
} = process.env;

// Important: Errors handlings are removed intentionally. If you are using this sample in production
// please add proper error handling.

async function initAzureOpenAI() {
    console.log("Using Azure OpenAI (w/ Microsoft Entra ID) ...");
    const credential = new DefaultAzureCredential();
    const azureADTokenProvider = getBearerTokenProvider(credential, "https://cognitiveservices.azure.com/.default");
    return new AzureOpenAI({
      azureADTokenProvider,
    });
}

const assistantDefinition = {
  name: "Finance Assistant",
  instructions:
    "You are a personal finance assistant. Retrieve the latest closing price of a stock using its ticker symbol.",
  tools: [
    {
      type: "function",
      function: {
        name: "getStockPrice",
        description:
          "Retrieve the latest closing price of a stock using its ticker symbol.",
        parameters: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "The ticker symbol of the stock",
            },
          },
          required: ["symbol"],
        },
      },
    },
  ],
  model: AZURE_DEPLOYMENT_NAME,
};

async function* processQuery(userQuery) {
  // Step 0: Connect and acquire an OpenAI instance
  const openai = await initAzureOpenAI();

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
        yield content;
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
          yield content;
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

    return { body: Readable.from(processQuery(query)) };
  },
});

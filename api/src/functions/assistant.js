require("dotenv/config");

const { Readable } = require("node:stream");
const { app } = require("@azure/functions");
app.setup({ enableHttpStream: true });

const { AzureOpenAI } = require("openai");
const { DefaultAzureCredential, getBearerTokenProvider } = require("@azure/identity");

const mailer = require("./acs");

const {
  ASSISTANT_ID,
  AZURE_DEPLOYMENT_NAME,
  EMAIL_RECEIVER
} = process.env;

// Important: Errors handlings are removed intentionally. If you are using this sample in production
// please add proper error handling.

async function initAzureOpenAI(context) {
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
    "You are a personal finance assistant. Retrieve the latest closing price of a stock using its ticker symbol. You also know how to generate a full body email in both plain text and html.",
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
    {
      type: "function",
      function: {
        name: "writeAndSendEmail",
        description:
          "Provides an email subject, and body content in plain text, and the same body in html",
        parameters: {
          type: "object",
          properties: {
            subject: {
              type: "string",
              description: "The subject of the email. Limit to maximum 50 characters",
            },
            text: {
              type: "string",
              description: "The body text of the email in plain text",
            },
            html: {
              type: "string",
              description: "The body text of the email in html",
            },
          },
          required: ["subject", "text", "html"],
        },
      },
    }
  ],
  model: AZURE_DEPLOYMENT_NAME,
};

async function* processQuery(userQuery, context) {
  console.log('Step 0: Connect and acquire an OpenAI instance');
  const openai = await initAzureOpenAI(context);

  console.log('Step 1: Retrieve or Create an Assistant');
  const assistant = ASSISTANT_ID
    ? await openai.beta.assistants.retrieve(ASSISTANT_ID)
    : await openai.beta.assistants.create(assistantDefinition);

  console.log('Step 2: Create a Thread');
  const thread = await openai.beta.threads.create();

  console.log('Step 3: Add a Message to the Thread');
  const message = await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: userQuery,
  });

  console.log('Step 4: Create a Run (and stream the response)');
  const run = openai.beta.threads.runs.stream(thread.id, {
    assistant_id: assistant.id,
    stream: true,
  });

  console.log('Step 5: Read streamed response', { run });
  for await (const chunk of run) {
    const { event, data } = chunk;

    if (event === "thread.message.delta") {
      const delta = data.delta;

      if (delta) {
        const value = delta.content[0]?.text?.value || "";
        yield value;
        console.log('Processed thread.message.delta', { value });
      }
    } else if (event === "thread.run.requires_action") {
      yield* handleRequiresAction(openai, data, data.id, data.thread_id, context);
    }
    // else if ... handle the other events as needed
  }

  console.log('Done!');
}

async function* handleRequiresAction(openai, run, runId, threadId, context) {
  console.log('Handle Function Calling', {required_action: run.required_action.submit_tool_outputs.tool_calls});
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
          } else if (toolCall.function.name === "writeAndSendEmail") {
            const args = JSON.parse(toolCall.function.arguments);
            return {
              tool_call_id: toolCall.id,
              output: await writeAndSendEmail(
                args.subject,
                args.text,
                args.html
              ),
            };
          }
          return toolCall;
        }
      )
    );

    // Submit all the tool outputs at the same time
    yield* submitToolOutputs(openai, toolOutputs, runId, threadId, context);
  } catch (error) {
    context.error("Error processing required action:", error);
  }
}

async function* submitToolOutputs(openai, toolOutputs, runId, threadId, context) {
  try {
    // Use the submitToolOutputsStream helper
    console.log('Call Tool output and stream the response');
    const asyncStream = openai.beta.threads.runs.submitToolOutputsStream(
      threadId,
      runId,
      { tool_outputs: toolOutputs }
    );
    for await (const chunk of asyncStream) {
      if (chunk.event === "thread.message.delta") {
        // stream message back to UI
        const { delta } = chunk.data;

        if (delta) {
          const value = delta.content[0]?.text?.value || "";
          yield value;
          console.log('Processed thread.message.delta (tool output)', { value });
        }
      }
      // else if ... handle the other events as needed
    }
  } catch (error) {
    context.error("Error submitting tool outputs:", error);
  }
}

// Functions Callings

async function getStockPrice(symbol) {
  return Promise.resolve("" + Math.random(10) * 1000); // simulate network request
}

async function writeAndSendEmail(subject, text, html) {
  const info = await mailer.sendEmail({
    to: EMAIL_RECEIVER, subject, text, html
  });
  console.log({info})
}

// API definition

app.http("assistant", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    console.log(`Http function processed request for url "${request.url}"`);
    const query = await request.text();

    return {
      headers: {
        'Content-Type': 'text/plain',
        "Transfer-Encoding": "chunked"
      }, body: Readable.from(processQuery(query, context))
    };
  },
});

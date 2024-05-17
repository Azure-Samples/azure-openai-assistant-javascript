require("dotenv/config");
const {
  ASSISTANT_ID
} = process.env;

const { assistantDefinition } = require("./assistant-def");
const { initAzureOpenAI } = require("./client");
const { createAndProcessRunsStreamsGenerator } = require("./function-calling");

exports.processQueryGenerator = async function* processQueryGenerator(userQuery) {
  console.log('Step 0: Connect and acquire an OpenAI instance');
  const openai = await initAzureOpenAI();

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

  yield* createAndProcessRunsStreamsGenerator({openai, assistant, thread});

  console.log('Done!');

}
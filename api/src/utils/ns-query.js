const handleRequiresAction = async (run) => {
  // Check if there are tools that require outputs
  if (
    run.required_action &&
    run.required_action.submit_tool_outputs &&
    run.required_action.submit_tool_outputs.tool_calls
  ) {
    // Loop through each tool in the required action section
    const toolOutputs = run.required_action.submit_tool_outputs.tool_calls.map(
      (tool) => {
        if (tool.function.name === "getCurrentTemperature") {
          return {
            tool_call_id: tool.id,
            output: "57",
          };
        } else if (tool.function.name === "getRainProbability") {
          return {
            tool_call_id: tool.id,
            output: "0.06",
          };
        }
      },
    );

    // Submit all tool outputs at once after collecting them in a list
    if (toolOutputs.length > 0) {
      run = await client.beta.threads.runs.submitToolOutputsAndPoll(
        thread.id,
        run.id,
        { tool_outputs: toolOutputs },
      );
      console.log("Tool outputs submitted successfully.");
    } else {
      console.log("No tool outputs to submit.");
    }

    // Check status after submitting tool outputs
    return handleRunStatus(run);
  }
};

const handleRunStatus = async (run) => {
  // Check if the run is completed
  if (run.status === "completed") {
    let messages = await client.beta.threads.messages.list(thread.id);
    console.log(messages.data);
    return messages.data;
  } else if (run.status === "requires_action") {
    console.log(run.status);
    return await handleRequiresAction(run);
  } else {
    console.error("Run did not complete:", run);
  }
};

expots.processQuery = async function processQuery() {
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

  await createAndProcessRuns({openai, assistant, thread});
}

handleRunStatus(run);
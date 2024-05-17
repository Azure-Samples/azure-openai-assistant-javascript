const { getStockPrice, writeAndSendEmail } = require("./function-calling-def");

async function handleRequiresAction(run) {
  // Check if there are tools that require outputs
  if (
    run.required_action &&
    run.required_action.submit_tool_outputs &&
    run.required_action.submit_tool_outputs.tool_calls
  ) {
    // Loop through each tool in the required action section
    const toolOutputs = run.required_action.submit_tool_outputs.tool_calls.map(
      async (tool) => {
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

exports.handleRunStatus = async function handleRunStatus(run) {
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
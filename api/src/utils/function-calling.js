const { getStockPrice, writeAndSendEmail } = require("./function-calling-def");

exports.createAndProcessRunsStreamsGenerator = async function* createAndProcessRunsStreamsGenerator({openai, assistant, thread}) {

  console.log('Step 4: Create a Run (and stream the response)');
  const run = openai.beta.threads.runs.stream(thread.id, {
    assistant_id: assistant.id,
    stream: true,
  });
  console.log('Step 5: Read streamed response');
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
      yield* handleRequiresActionGenerator(openai, data, data.id, data.thread_id);
    }
    // else if ... handle the other events as needed
  }
}

async function* handleRequiresActionGenerator(openai, run, runId, threadId) {
  console.log('Handle Function Calling', { required_action: run.required_action.submit_tool_outputs.tool_calls });
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
    yield* submitToolOutputsGenerator(openai, toolOutputs, runId, threadId);
  } catch (error) {
    console.error("Error processing required action:", error);
  }
}

async function* submitToolOutputsGenerator(openai, toolOutputs, runId, threadId) {
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
    console.error("Error submitting tool outputs:", error);
  }
}
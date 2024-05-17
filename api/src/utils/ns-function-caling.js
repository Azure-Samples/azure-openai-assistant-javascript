exports.createAndProcessRuns = async function createAndProcessRuns({ openai, assistant, thread }) {
  
  console.log('Step 4: Create a Run');
  const run = openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id,
  });
  console.log('Step 5: Read response');
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
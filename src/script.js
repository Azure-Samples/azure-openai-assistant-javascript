async function submitQuery(userQuery) {
  const response = await fetch("/api/assistant", {
    method: "POST",
    body: userQuery,
  });

  if (!response.ok) {
    console.log(response.statusText);
  }

  return response.body;
}

(async function () {
  const outputRef = document.querySelector("#outputRef");
  const userQueryRef = document.querySelector("#userQueryRef");

  userQueryRef.value =
    "Based on the latest financial and current stock market value, can you generate a brief summary that provides insights into the current state of Microsoft? Retrieve the latest closing price of a stock using its ticker symbol.";

  document
    .querySelector("#submitQueryRef")
    .addEventListener("click", async (event) => {
      const { value } = userQueryRef;
      if (value) {
        outputRef.classList.remove("hidden");
        outputRef.innerHTML = "Your Financial Assistant is thinking...";
        const stream = await submitQuery(value);
        outputRef.innerHTML = "";
        for await (const chunk of stream) {
          const delta = new TextDecoder().decode(chunk);
          outputRef.innerHTML += delta;
          outputRef.scrollTop = outputRef.scrollHeight; // scroll to bottom
        }
      }
    });
})();

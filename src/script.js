let aborter = new AbortController();

const outputRef = document.querySelector("#outputRef");
const loadingRef = document.querySelector("#loadingRef");
const userQueryRef = document.querySelector("#userQueryRef");
const cancelQueryRef = document.querySelector("#cancelQueryRef");
const submitQueryRef = document.querySelector("#submitQueryRef");

userQueryRef.value =
  "Based on the latest financial and current stock market value, can you generate a brief summary that provides insights into the current state of Microsoft? Retrieve the latest closing price of a stock using its ticker symbol.";

cancelQueryRef.addEventListener("click", () => {
  aborter.abort();
  aborter = new AbortController();
  cancelQueryRef.classList.add("hidden");
  submitQueryRef.classList.remove("hidden");
  loadingRef.classList.add("hidden");
});

submitQueryRef
  .addEventListener("click", async (event) => {
    const { value } = userQueryRef;
    if (value) {

      loadingRef.classList.remove("hidden");
      outputRef.classList.add("hidden");
      cancelQueryRef.classList.remove("hidden");
      submitQueryRef.classList.add("hidden");

      const stream = await submitQuery(value);
      loadingRef.classList.add("hidden");

      outputRef.innerHTML = "";
      outputRef.classList.remove("hidden");

      for await (const chunk of stream) {
        if (aborter.signal.aborted) throw signal.reason;
        insertText(chunk)();
      }

      cancelQueryRef.classList.add("hidden");
      submitQueryRef.classList.remove("hidden");
      loadingRef.classList.add("hidden");

      if (outputRef.innerHTML === "") {
        outputRef.innerHTML = "Your Assistant could not fetch data. Please try again!"
      }
    }
  });

const insertText = chunk => () => {
  const delta = new TextDecoder().decode(chunk);
  outputRef.innerHTML += delta;
  outputRef.scrollTop = outputRef.scrollHeight; // scroll to bottom
};


async function submitQuery(userQuery) {

  const { API_URL = 'http://localhost:7071' } = import.meta.env;

  const response = await fetch(`${API_URL}/api/assistant`, {
    method: "POST",
    body: userQuery,
    signal: aborter.signal
  });

  if (!response.ok) {
    console.log(response.statusText);
  }

  return response.body;
}

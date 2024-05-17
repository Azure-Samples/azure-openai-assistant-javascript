let aborter = new AbortController();
let autoAbortTimeout = null;

const outputRef = document.querySelector("#outputRef");
const loadingRef = document.querySelector("#loadingRef");
const userQueryRef = document.querySelector("#userQueryRef");
const cancelQueryRef = document.querySelector("#cancelQueryRef");
const submitQueryRef = document.querySelector("#submitQueryRef");
const statusLabelRef = document.querySelector("#statusLabelRef");

userQueryRef.value =
  "Based on the latest financial data and current stock market trends, can you provide a detailed analysis of Microsoft's current state? Please include insights into their recent performance, market position, and future outlook. Additionally, retrieve and include the latest closing price of Microsoft's stock using its ticker symbol (MSFT). Send me the full analysis by email.";

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
      statusLabelRef.innerHTML = "waiting";
      outputRef.innerHTML = "";

      loadingRef.classList.remove("hidden");
      outputRef.classList.add("hidden");
      cancelQueryRef.classList.remove("hidden");
      submitQueryRef.classList.add("hidden");

      autoTimeout();
      submitQuery(value);
    }
  });

function autoTimeout() {
  autoAbortTimeout = setTimeout(() => {
    cancelQueryRef.click();
    outputRef.classList.remove("hidden");
    if (outputRef.innerHTML === "") {
      outputRef.innerHTML = "Your Assistant could not fetch data. Please try again!"
    }
  }, 60_000); // cancel request if it times out
}

function submitQuery(body) {
  const { API_URL = 'http://localhost:7071' } = import.meta.env;
  fetch(`${API_URL}/api/assistant`, {
    body,
    method: "POST",
    signal: aborter.signal
  }).then(response => response.body)
    .then(processReadableStream);
}

function processReadableStream(stream) {
  stream.pipeTo(new WritableStream({
    write(chunk, controller) {
      const value = new TextDecoder().decode(chunk);
      if (value.startsWith('@')) {
        statusLabelRef.innerHTML = value.replace('@', '');
        return;
      }

      loadingRef.classList.add("hidden");
      outputRef.classList.remove("hidden");

      outputRef.innerHTML += value;
      outputRef.scrollTop = outputRef.scrollHeight; // scroll to bottom
    },
    start(controller) {
      clearTimeout(autoAbortTimeout); // cancel 
    },
    close(controller) {
      cancelQueryRef.classList.add("hidden");
      submitQueryRef.classList.remove("hidden");
      loadingRef.classList.add("hidden");
      outputRef.classList.remove("hidden");
      if (outputRef.innerHTML === "") {
        outputRef.innerHTML = "Whoops, something went wrong. Please try again!"
      }
    },
    abort(reason) {
      console.log(reason);
    },
  })).catch(console.error);
}
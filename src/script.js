let aborter = new AbortController();
let autoAbortTimeout = null;

const outputRef = document.querySelector("#outputRef");
const loadingRef = document.querySelector("#loadingRef");
const userQueryRef = document.querySelector("#userQueryRef");
const cancelQueryRef = document.querySelector("#cancelQueryRef");
const submitQueryRef = document.querySelector("#submitQueryRef");

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

      loadingRef.classList.remove("hidden");
      outputRef.classList.add("hidden");
      cancelQueryRef.classList.remove("hidden");
      submitQueryRef.classList.add("hidden");

      autoTimeout();
      submitQuery(value, insertText);
    }
  });

function autoTimeout() {
  autoAbortTimeout = setTimeout(() => {
    cancelQueryRef.click();

    if (outputRef.innerHTML === "") {
      outputRef.innerHTML = "Your Assistant could not fetch data. Please try again!"
    }

  }, 30_000); // in case, cancel request after 30 of timeout

}

function insertText(chunk) {
  const delta = new TextDecoder().decode(chunk);
  outputRef.innerHTML += delta;
  outputRef.scrollTop = outputRef.scrollHeight; // scroll to bottom
};


function submitQuery(userQuery, cb) {

  const { API_URL = 'http://localhost:7071' } = import.meta.env;

  fetch(`${API_URL}/api/assistant`, {
    method: "POST",
    body: userQuery,
    signal: aborter.signal
  }).then(response => response.body)
    .then(rs => processReadableStream(rs, cb));
}

function processReadableStream(rs, cb) {

  rs.pipeTo(new WritableStream({
    write(chunk, controller) {
      cb(chunk);
    },
    start(controller) {
      outputRef.innerHTML = "";
      loadingRef.classList.add("hidden");
      outputRef.classList.remove("hidden");
      clearTimeout(autoAbortTimeout); // cancel 
    },
    close(controller) {
      cancelQueryRef.classList.add("hidden");
      submitQueryRef.classList.remove("hidden");
      loadingRef.classList.add("hidden");
    },
    abort(reason) {
      console.log(reason);
    },
  })).catch(console.error);

  return rs;
}
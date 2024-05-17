require("dotenv/config");
const { DefaultAzureCredential } = require("@azure/identity");
const { EmailClient } = require("@azure/communication-email");
const { CommunicationIdentityClient } = require("@azure/communication-identity");


exports.sendEmail = async function ({ to, subject, text, html }) {
  const endpoint = "https://openai-assistants-demo-build-2024.unitedstates.communication.azure.com";
  let credential = new DefaultAzureCredential();
  const client = new CommunicationIdentityClient(endpoint, credential);
  await client.createUserAndToken(["email"]);

  const POLLER_WAIT_TIME = 10
  try {
    const message = {
      // Note: make sure to connect an Email Domain using Azure
      senderAddress: "<DoNotReply@88d1ed48-238c-434d-901d-1e7a8c7f08d4.azurecomm.net>",
      content: {
        subject: subject,
        plainText: text,
        html
      },
      recipients: {
        to: [
          {
            address: to,
            displayName: "Azure OpenAI Assistants",
          },
        ],
      },
    };

    const poller = await client.beginSend(message);

    if (!poller.getOperationState().isStarted) {
      throw "Poller was not started."
    }

    let timeElapsed = 0;
    while (!poller.isDone()) {
      poller.poll();
      console.log("Email send polling in progress");

      await new Promise(resolve => setTimeout(resolve, POLLER_WAIT_TIME * 1000));
      timeElapsed += 10;

      if (timeElapsed > 18 * POLLER_WAIT_TIME) {
        throw "Polling timed out.";
      }
    }

    if (poller.getResult().status === KnownEmailSendStatus.Succeeded) {
      console.log(`Successfully sent the email (operation id: ${poller.getResult().id})`);
    }
    else {
      throw poller.getResult().error;
    }
  } catch (e) {
    console.log(e);
  }
}
require("dotenv/config");
require('whatwg-fetch');
const { Client } = require("@microsoft/microsoft-graph-client");
const { TokenCredentialAuthenticationProvider } = require("@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials");
const { ClientSecretCredential } = require("@azure/identity");

const {
  AZURE_CLIENT_ID,
  AZURE_CLIENT_SECRET,
  AZURE_TENANT_ID
} = process.env;



// Follow guide: https://github.com/microsoftgraph/msgraph-sdk-javascript?tab=readme-ov-file#1-register-your-application

exports.sendEmail = async function ({ to, subject, text, html }) {
  console.log(AZURE_CLIENT_ID,AZURE_CLIENT_SECRET, AZURE_TENANT_ID);


  const credential = new ClientSecretCredential(AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET);
  const authProvider = new TokenCredentialAuthenticationProvider(credential, { scopes: ["https://graph.microsoft.com/.default"] });
  
  const client = Client.init({
    defaultVersion: "v1.0",
    debugLogging: true,
    authProvider,
  });
  const mail = {
    subject,
    toRecipients: [
      {
        emailAddress: {
          address: to,
        },
      },
    ],
    body: {
      content: html,
      contentType: "html",
    },
  };
  try {
    let response = await client.api("/me/sendMail").post({ message: mail });
    console.log(response);
  } catch (error) {
    throw error;
  }
}
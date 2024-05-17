const { AzureOpenAI } = require("openai");
const { DefaultAzureCredential, getBearerTokenProvider } = require("@azure/identity");

exports.initAzureOpenAI = async function initAzureOpenAI() {
  console.log("Using Azure OpenAI (w/ Microsoft Entra ID) ...");
  const credential = new DefaultAzureCredential();
  const azureADTokenProvider = getBearerTokenProvider(credential, "https://cognitiveservices.azure.com/.default");
  return new AzureOpenAI({
    azureADTokenProvider,
  });
}
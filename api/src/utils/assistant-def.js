require("dotenv/config");
const {
  AZURE_DEPLOYMENT_NAME
} = process.env;

exports.assistantDefinition = {
  name: "Finance Assistant",
  instructions:
    "You are a personal finance assistant. Retrieve the latest closing price of a stock using its ticker symbol. You also know how to generate a full body email in both plain text and html.",
  tools: [
    {
      type: "function",
      function: {
        name: "getStockPrice",
        description:
          "Retrieve the latest closing price of a stock using its ticker symbol.",
        parameters: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "The ticker symbol of the stock",
            },
          },
          required: ["symbol"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "writeAndSendEmail",
        description:
          "Provides an email subject, and body content in plain text, and the same body in html",
        parameters: {
          type: "object",
          properties: {
            subject: {
              type: "string",
              description: "The subject of the email. Limit to maximum 50 characters",
            },
            text: {
              type: "string",
              description: "The body text of the email in plain text",
            },
            html: {
              type: "string",
              description: "The body text of the email in html",
            },
          },
          required: ["subject", "text", "html"],
        },
      },
    }
  ],
  model: AZURE_DEPLOYMENT_NAME,
};
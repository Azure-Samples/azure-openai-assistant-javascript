<div align="center">

# Serverless Azure OpenAI Assistant Quick Start<br> Function Calling

[![Open project in GitHub Codespaces](https://img.shields.io/badge/Codespaces-Open-blue?style=flat-square&logo=github)](https://codespaces.new/Azure-Samples/azure-openai-assistant-javascript?hide_repo_select=true&ref=main&quickstart=true)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Azure-Samples/azure-openai-assistant-javascript/build-test.yaml?style=flat-square&label=Build)](https://github.com/Azure-Samples/azure-openai-assistant-javascript/actions)
![Node version](https://img.shields.io/badge/Node.js->=20-3c873a?style=flat-square)
[![License](https://img.shields.io/badge/License-MIT-pink?style=flat-square)](LICENSE)

Azure OpenAI Assistants allows you to create AI assistants tailored to your needs through custom instructions and augmented by advanced tools like code interpreter, and custom functions. In this article, we provide an in-depth walkthrough of getting started with the Assistants API.

(Like and fork this sample to receive lastest changes and updates)

[![Overview](https://img.shields.io/badge/Getting%20Started-blue?style=flat-square)](#overview)
[![Get started](https://img.shields.io/badge/Get%20Started-blue?style=flat-square)](#get-started)
[![Run the sample](https://img.shields.io/badge/Run%20the%20Sample-blue?style=flat-square)](#run-the-sample)
[![Deploy the sample to Azure](https://img.shields.io/badge/Deploy%20to%20Azure-blue?style=flat-square)](#deploy-the-sample-to-azure)
[![Resources](https://img.shields.io/badge/Resources-blue?style=flat-square)](#resources)
[![Contributing](https://img.shields.io/badge/Contributing-blue?style=flat-square)](#contributing)
[![Troubleshooting](https://img.shields.io/badge/Troubleshooting-blue?style=flat-square)](#troubleshooting)
[![Give us a star](https://img.shields.io/badge/⭐%20Give%20us%20a%20star-blue?style=flat-square)](https://github.com/Azure-Samples/azure-openai-assistant-javascript/stargazers)
  <img src="./docs/azure-openai-assistant-demo.png" alt="Screenshot showing the assistant app in action" width="640px" />

</div>

This sample shows how to quickly get started with [OpenAI Assistant](https://learn.microsoft.com/azure/ai-services/openai/how-to/assistant) on Azure. The application is hosted on [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/overview) and [Azure Functions](https://learn.microsoft.com/azure/azure-functions/functions-overview?pivots=programming-language-javascript). You can use it as a starting point for building more complex Assistant and Agent applications.

## Features

This project demonstrates how to build a simple Assistant application using Azure OpenAI Assistants. The Assistant can help you: 
- Retrieve financial information, such as stock values.
- Answer questions.
- Send emails, 
- Run custom functions.

## Architecture Diagram

<div align="center">
  <img src="./docs/architecture-diagram-assistant-javascript.png" alt="Screenshot showing the assistant app high level diagram" width="640px" />
</div>

This application is built around two main components:

- A simple HTML page with a vanilla CSS and JavaScript files, and hosted on [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/overview). The code is located in the [`src`](./src/) folder.

- A serverless API built with [Azure Functions](https://learn.microsoft.com/azure/azure-functions/functions-overview?pivots=programming-language-javascript) and using OpenAI JavaScript SDK. The code is located in the [`api`](./api/) folder.

## Getting Started

You have a few options for getting started with this template. The quickest way to get started is [GitHub Codespaces](#github-codespaces), since it will setup all the tools for you, but you can also [set it up locally](#local-environment). You can also use a [VS Code dev container](#vs-code-dev-containers)

This template uses `gpt-35-turbo` version `1106`  which may not be available in all Azure regions. Check for [up-to-date region availability](https://learn.microsoft.com/azure/ai-services/openai/concepts/models#standard-deployment-model-availability) and select a region during deployment accordingly

  * We recommend using `swedencentral`

### GitHub Codespaces

You can run this template virtually by using GitHub Codespaces. The button will open a web-based VS Code instance in your browser:

1. Open the template (this may take several minutes)
    [![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/Azure-Samples/azure-openai-assistant-javascript?hide_repo_select=true&ref&quickstart=true)
2. Open a terminal window
3. Sign into your Azure account:

    ```shell
     azd auth login --use-device-code
    ```
4. Provision the Azure resources and deploy your code:

    ```shell
     azd up
    ```
5. Open a terminal and navigate to the root of the project, then run the API server first:

    ```bash
     npm install --prefix api
     npm start --prefix api
    ```

6. Open another terminal and navigate to the root of the project, then run the webapp server:

    ```bash
     npm install
     npm start
    ```

Open the URL `http://localhost:4280` in your browser to interact with the Assistant.

### VS Code Dev Containers

A related option is VS Code Dev Containers, which will open the project in your local VS Code using the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers):

1. Start Docker Desktop (install it if not already installed)
2. Open the project:
    [![Open in Dev Containers](https://img.shields.io/static/v1?style=for-the-badge&label=Dev%20Containers&message=Open&color=blue&logo=visualstudiocode)](https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/Azure-Samples/azure-openai-assistant-javascript)
3. In the VS Code window that opens, once the project files show up (this may take several minutes), open a terminal window.
4. Sign into your Azure account:

    ```shell
     azd auth login
    ```
4. Provision the Azure resources and deploy your code:

    ```shell
     azd up
    ```
5. Open a terminal and navigate to the root of the project, then run the API server first:

    ```bash
     npm install --prefix api
     npm start --prefix api
    ```
6. Open another terminal and navigate to the root of the project, then run the webapp server:

    ```bash
     npm install
     npm start
    ```
8. Configure a CI/CD pipeline:

    ```shell
    azd pipeline config
    ```

### Local Environment

#### Prerequisites

You need to install following tools to work on your local machine:

- [Node.js LTS](https://nodejs.org/download/)
- [Azure Developer CLI](https://aka.ms/azure-dev/install)
- [SWA CLI](https://github.com/Azure/static-web-apps-cli)
- [Git](https://git-scm.com/downloads)
- [PowerShell 7+](https://github.com/powershell/powershell) _(for Windows users only)_
  - **Important**: Ensure you can run `pwsh.exe` from a PowerShell command. If this fails, you likely need to upgrade PowerShell.
  - Instead of Powershell, you can also use Git Bash or WSL to run the Azure Developer CLI commands.
- (Optional - if you are not using SWA CLI) [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local?tabs=macos%2Cisolated-process%2Cnode-v4%2Cpython-v2%2Chttp-trigger%2Ccontainer-apps&pivots=programming-language-javascript) _(should be installed automatically with NPM, only install manually if the API fails to start)_
- This template uses `gpt-35-turbo` version `1106` which may not be available in all Azure regions. Check for [up-to-date region availability](https://learn.microsoft.com/azure/ai-services/openai/concepts/models#standard-deployment-model-availability) and select a region during deployment accordingly
  * We recommend using `swedencentral`

Then you can get the project code:

1. [**Fork**](https://github.com/Azure-Samples/azure-openai-assistant-javascript/fork) the project to create your own copy of this repository.
2. On your forked repository, select the **Code** button, then the **Local** tab, and copy the URL of your forked repository.
3. Open a terminal and run this command to clone the repo: <code> git clone &lt;your-repo-url&gt; </code>

#### Quickstart (with Azure OpenAI models)

1. Bring down the template code:

    ```shell
    azd init --template azure-openai-assistant-javascript
    ```

    This will perform a git clone

2. Sign into your Azure account:

    ```shell
     azd auth login
    ```

3. Install all dependencies:

    ```bash
     npm install
     npm install --prefix api
    ```
4. Provision and deploy the project to Azure:

    ```shell
    azd up
    ```
4. Configure a CI/CD pipeline:

    ```shell
    azd pipeline config
    ```

Once your deployment is complete, you should see a `.env` file in the `api` folder. This file contains the environment variables needed to run the application using Azure resources.

Also, in order for the Assistant to send emails, you need to provide the following env variables in the `./api/.env` file:

```
EMAIL_RECEIVER="your email address"
EMAIL_SENDER_NAME="Azure OpenAI Assistant"
EMAIL_SENDER_USERNAME="sender email address"
# Generate an application password from the MFA mobile application
EMAIL_SENDER_APP_PASSWORD="foobar" 
```

**Important: Please follow [this guide](https://support.microsoft.com/account-billing/manage-app-passwords-for-two-step-verification-d6dc8c6d-4bf7-4851-ad95-6d07799387e9) to generate an Application Password if you are using MFA.**

#### Local Development

To run the sample, run the following commands, which will start the web app, and the API locally.

1. Open a terminal and navigate to the root of the project, then run the API server first:

    ```bash
     npm start --prefix api
    ```
2. Open another terminal and navigate to the root of the project, then run the webapp server:

    ```bash
     npm start
    ```

Open the URL `http://localhost:4280` in your browser to interact with the Assistant.

## Guidance

### Region Availability

This template uses `gpt-35-turbo` version `1106` which may not be available in all Azure regions. Check for [up-to-date region availability](https://learn.microsoft.com/azure/ai-services/openai/concepts/models#standard-deployment-model-availability) and select a region during deployment accordingly
  * We recommend using `swedencentral`

### Costs

Pricing varies per region and usage, so it isn't possible to predict exact costs for your usage.
However, you can use the [Azure pricing calculator](https://azure.com/e/bf51ef20b57a4da08e47511938ad5415) for the resources below to get an estimate.

- Azure Container Apps: Consumption plan, Free for the first 2M executions. Pricing per execution and memory used. [Pricing](https://azure.microsoft.com/en-us/pricing/details/container-apps/)
- Azure OpenAI: Standard tier, GPT and Ada models. Pricing per 1K tokens used, and at least 1K tokens are used per question. [Pricing](https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/)

> [!WARNING]
> To avoid unnecessary costs, remember to take down your app if it's no longer in use, either by deleting the resource group in the Portal or running `azd down --purge`.

### Security

> [!NOTE]
> When implementing this template please specify whether the template uses Managed Identity or Key Vault

This template has either [Managed Identity](https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview) or Key Vault built in to eliminate the need for developers to manage these credentials. Applications can use managed identities to obtain Microsoft Entra tokens without having to manage any credentials. Additionally, we have added a [GitHub Action tool](https://github.com/microsoft/security-devops-action) that scans the infrastructure-as-code files and generates a report containing any detected issues. To ensure best practices in your repo we recommend anyone creating solutions based on our templates ensure that the [Github secret scanning](https://docs.github.com/code-security/secret-scanning/about-secret-scanning) setting is enabled in your repos.


## Resources

Here are some resources to learn more about the technologies used in this sample:

- [Get started using Azure OpenAI Assistants (Preview)](https://learn.microsoft.com/azure/ai-services/openai/assistants-quickstart?tabs=command-line%2Ctypescript&pivots=programming-language-javascript)
- [Generative AI For Beginners](https://github.com/microsoft/generative-ai-for-beginners)
- [Azure OpenAI Service](https://learn.microsoft.com/azure/ai-services/openai/overview)
- [Azure Cosmos DB for MongoDB vCore](https://learn.microsoft.com/azure/cosmos-db/mongodb/vcore/)
- [Azure OpenAI Assistant Builder](https://github.com/Azure-Samples/azure-openai-assistant-builder)
- [Chat + Enterprise data with Azure OpenAI and Azure AI Search](https://github.com/Azure-Samples/azure-search-openai-javascript)

You can also find [more Azure AI samples here](https://github.com/Azure-Samples/azureai-samples).

## Troubleshooting

If you can't find a solution to your problem, please [open an issue](https://github.com/Azure-Samples/azure-openai-assistant-javascript/issues) in this repository.

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.

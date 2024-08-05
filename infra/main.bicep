targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the the environment which is used to generate a short unique hash used in all resources.')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

param resourceGroupName string = ''
param webappName string = 'webapp'
param apiServiceName string = 'api'
param appServicePlanName string = ''
param storageAccountName string = ''
param webappLocation string // Set in main.parameters.json

// Azure OpenAI -- Cognitive Services
param assistantId string = '' // Set in main.parameters.json

param blobContainerName string = 'files'

var assistantGpt = {
  modelName: 'gpt-35-turbo'
  deploymentName: 'gpt-35-turbo'
  deploymentVersion: '1106'
  deploymentCapacity: 10
}

param OPENAI_FUNCTION_CALLING_SKIP_SEND_EMAIL string = 'true' // Set in main.parameters.json
param openAiLocation string // Set in main.parameters.json
param openAiSkuName string = 'S0' // Set in main.parameters.json
param openAiUrl string = '' // Set in main.parameters.json
param openAiApiVersion string // Set in main.parameters.json

param principalId string // Set in main.parameters.json
@description('Flag to decide where to create OpenAI role for current user')
param createRoleForUser bool = true

var finalOpenAiUrl = empty(openAiUrl) ? 'https://${openAi.outputs.name}.openai.azure.com' : openAiUrl
var abbrs = loadJsonContent('abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var tags = { 'azd-env-name': environmentName }

// Organize resources in a resource group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: !empty(resourceGroupName) ? resourceGroupName : '${abbrs.resourcesResourceGroups}${environmentName}'
  location: location
  tags: tags
}

// The application frontend webapp
module webapp './core/host/staticwebapp.bicep' = {
  name: '${abbrs.webStaticSites}web-${resourceToken}'
  scope: resourceGroup
  params: {
    name: !empty(webappName) ? webappName : '${abbrs.webStaticSites}web-${resourceToken}'
    location: webappLocation
    tags: union(tags, { 'azd-service-name': webappName })
    rg: resourceGroup.name
  }
}

// The application backend API
module api './core/host/functions.bicep' = {
  name: 'api'
  scope: resourceGroup
  params: {
    name: '${abbrs.webSitesFunctions}api-${resourceToken}'
    location: location
    tags: union(tags, { 'azd-service-name': apiServiceName })
    allowedOrigins: [webapp.outputs.uri]
    alwaysOn: false
    runtimeName: 'node'
    runtimeVersion: '20'
    appServicePlanId: appServicePlan.outputs.id
    storageAccountName: storage.outputs.name
    managedIdentity: true
    appSettings: {
      AZURE_OPENAI_ENDPOINT: finalOpenAiUrl
      AZURE_DEPLOYMENT_NAME: assistantGpt.deploymentName
      OPENAI_API_VERSION: openAiApiVersion
      OPENAI_FUNCTION_CALLING_SKIP_SEND_EMAIL: OPENAI_FUNCTION_CALLING_SKIP_SEND_EMAIL
     }
  }
  dependsOn: empty(openAiUrl) ? [] : [openAi]
}

// Compute plan for the Azure Functions API
module appServicePlan './core/host/appserviceplan.bicep' = {
  name: 'appserviceplan'
  scope: resourceGroup
  params: {
    name: !empty(appServicePlanName) ? appServicePlanName : '${abbrs.webServerFarms}${resourceToken}'
    location: location
    tags: tags
    sku: {
      name: 'Y1'
      tier: 'Dynamic'
    }
  }
}

module storage './core/storage/storage-account.bicep' = {
  name: 'storage'
  scope: resourceGroup
  params: {
    name: !empty(storageAccountName) ? storageAccountName : '${abbrs.storageStorageAccounts}${resourceToken}'
    location: location
    tags: tags
    allowBlobPublicAccess: false
    containers: [
      {
        name: blobContainerName
        publicAccess: 'None'
      }
    ]
  }
}

module openAi 'core/ai/cognitiveservices.bicep' = if (empty(openAiUrl)) {
  name: 'openai'
  scope: resourceGroup
  params: {
    name: '${abbrs.cognitiveServicesAccounts}${resourceToken}'
    location: openAiLocation
    tags: tags
    sku: {
      name: openAiSkuName
    }
    disableLocalAuth: true
    deployments: [
      {
        name: assistantGpt.deploymentName
        model: {
          format: 'OpenAI'
          name: assistantGpt.modelName
          version: assistantGpt.deploymentVersion
        }
        sku: {
          name: 'Standard'
          capacity: assistantGpt.deploymentCapacity
        }
      }
    ]
  }
}

// Roles

// User roles
module openAiRoleUser 'core/security/role.bicep' = if (createRoleForUser) {
  scope: resourceGroup
  name: 'openai-role-user'
  params: {
    principalId: principalId
    // Cognitive Services OpenAI Contributor
    roleDefinitionId: 'a001fd3d-188f-4b5d-821b-7da978bf7442'
    principalType: 'User'
  }
}

// System roles
module openAiRoleApi 'core/security/role.bicep' = {
  scope: resourceGroup
  name: 'openai-role-api'
  params: {
    principalId: api.outputs.identityPrincipalId
    // Cognitive Services OpenAI Contributor
    roleDefinitionId: 'a001fd3d-188f-4b5d-821b-7da978bf7442'
    principalType: 'ServicePrincipal'
  }
}

output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_RESOURCE_GROUP string = resourceGroup.name

output AZURE_OPENAI_ENDPOINT string = finalOpenAiUrl
output AZURE_DEPLOYMENT_NAME string = assistantGpt.deploymentName
output ASSISTANT_ID string = assistantId
output OPENAI_API_VERSION string = openAiApiVersion

output WEBAPP_URL string = webapp.outputs.uri
output API_URL string = api.outputs.uri

output OPENAI_FUNCTION_CALLING_SKIP_SEND_EMAIL string = OPENAI_FUNCTION_CALLING_SKIP_SEND_EMAIL

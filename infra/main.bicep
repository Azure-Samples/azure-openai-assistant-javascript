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
param storageAccountName string = ''
var abbrs = loadJsonContent('abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var tags = { 'azd-env-name': environmentName }
param webappLocation string // Set in main.parameters.json

param searchServiceName string = ''

// OpenAI Cognitive Services
param chatModelName string // Set in main.parameters.json
param chatDeploymentName string = chatModelName
param chatModelVersion string // Set in main.parameters.json
param chatDeploymentCapacity int = 30
param embeddingsModelName string // Set in main.parameters.json
param embeddingsModelVersion string // Set in main.parameters.json
param embeddingsDeploymentName string = embeddingsModelName
param embeddingsDeploymentCapacity int = 30

var finalOpenAiUrl = empty(openAiUrl) ? 'https://${openAi.outputs.name}.openai.azure.com' : openAiUrl
var storageUrl = 'https://${storage.outputs.name}.blob.${environment().suffixes.storage}'
var searchUrl = 'https://${search.outputs.name}.search.windows.net'

// The free tier does not support managed identity (required) or semantic search (optional)
@allowed(['basic', 'standard', 'standard2', 'standard3', 'storage_optimized_l1', 'storage_optimized_l2'])
param searchServiceSkuName string

param openAiLocation string // Set in main.parameters.json
param openAiSkuName string = 'S0'
param openAiUrl string = ''

param blobContainerName string = 'files'

// Id of the user or app to assign application roles
param principalId string = ''

// Set automated deployment flag
param isContinuousDeployment bool // Set in main.parameters.json

// Organize resources in a resource group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: !empty(resourceGroupName) ? resourceGroupName : '${abbrs.resourcesResourceGroups}${environmentName}'
  location: location
  tags: tags
}

// The application frontend webapp
module webapp './core/host/staticwebapp.bicep' = {
  name: 'webapp'
  scope: resourceGroup
  params: {
    name: !empty(webappName) ? webappName : '${abbrs.webStaticSites}web-${resourceToken}'
    location: webappLocation
    tags: union(tags, { 'azd-service-name': webappName })
  }
}

module search 'core/search/search-services.bicep' = {
  name: 'search'
  scope: resourceGroup
  params: {
    name: !empty(searchServiceName) ? searchServiceName : '${abbrs.searchSearchServices}${resourceToken}'
    location: location
    tags: tags
    disableLocalAuth: true
    authOptions: null
    sku: {
      name: searchServiceSkuName
    }
  }
}
// Storage for Azure Functions API and Blob storage
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
        name: chatDeploymentName
        model: {
          format: 'OpenAI'
          name: chatModelName
          version: chatModelVersion
        }
        sku: {
          name: 'Standard'
          capacity: chatDeploymentCapacity
        }
      }
      {
        name: embeddingsDeploymentName
        model: {
          format: 'OpenAI'
          name: embeddingsModelName
          version: embeddingsModelVersion
        }
        capacity: embeddingsDeploymentCapacity
      }
    ]
  }
}

// User roles
module openAiRoleUser 'core/security/role.bicep' = if (!isContinuousDeployment) {
  scope: resourceGroup
  name: 'openai-role-user'
  params: {
    principalId: principalId
    // Cognitive Services OpenAI User
    roleDefinitionId: '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'
    principalType: 'User'
  }
}

module storageRoleUser 'core/security/role.bicep' = if (!isContinuousDeployment) {
  scope: resourceGroup
  name: 'storage-contrib-role-user'
  params: {
    principalId: principalId
    // Storage Blob Data Contributor
    roleDefinitionId: 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
    principalType: 'User'
  }
}

output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_RESOURCE_GROUP string = resourceGroup.name

output AZURE_OPENAI_API_ENDPOINT string = finalOpenAiUrl
output AZURE_OPENAI_API_DEPLOYMENT_NAME string = chatDeploymentName
output AZURE_OPENAI_API_MODEL string = chatModelName
output AZURE_OPENAI_API_MODEL_VERSION string = chatModelVersion
output AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME string = embeddingsDeploymentName
output AZURE_OPENAI_API_EMBEDDINGS_MODEL string = embeddingsModelName
output AZURE_OPENAI_API_EMBEDDINGS_MODEL_VERSION string = embeddingsModelVersion
output AZURE_STORAGE_URL string = storageUrl
output AZURE_STORAGE_CONTAINER_NAME string = blobContainerName
output AZURE_AISEARCH_ENDPOINT string = searchUrl

output WEBAPP_URL string = webapp.outputs.uri

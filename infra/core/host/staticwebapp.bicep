metadata description = 'Creates an Azure Static Web Apps instance.'
param name string
param rg string
param location string = resourceGroup().location
param tags object = {}

param sku object = {
  name: 'Standard'
  tier: 'Standard'
}

resource web 'Microsoft.Web/staticSites@2023-01-01' = {
  name: name
  location: location
  tags: tags
  sku: sku
  properties: {
    provider: 'Custom'
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// resource backendResourceId 'Microsoft.Web/sites@2021-03-01' existing = {
//   name: name
//   scope: resourceGroup(rg)
// }

// resource swamv_ui_backend_functions 'Microsoft.Web/staticSites/linkedBackends@2022-03-01' = {
//   parent: web
//   name: 'swa_backend_functions'
//   properties: {
//     backendResourceId: backendResourceId.id
//     region: location
//   }
// }

output name string = web.name
output uri string = 'https://${web.properties.defaultHostname}'
output identityPrincipalId string = web.identity.principalId
#disable-next-line outputs-should-not-contain-secrets
output DEPLOYMENT_TOKEN string = web.listSecrets(web.apiVersion).properties.apiKey

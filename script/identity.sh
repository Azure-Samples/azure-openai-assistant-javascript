#!/usr/bin/env bash
NAME="azure-openai-assistant-javascript"
AZURE_RESOURCE_GROUP="azure-openai-assistant-javascript-rg"
# id=$(az identity create -g $AZURE_RESOURCE_GROUP -n $NAME)
id=$(az identity show -g $AZURE_RESOURCE_GROUP -n $NAME)
clientId=$(echo $id | jq '.clientId')
tenantId=$(echo $id | jq '.tenantId')

echo -e "\n# Azure Managed Identity Keys" >> ./api/.env
echo -e "AZURE_CLIENT_ID=$clientId" >> ./api/.env
echo -e "AZURE_TENANT_ID=$tenantId" >> ./api/.env
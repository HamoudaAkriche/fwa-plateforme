output "resource_group_name" {
  value = azurerm_resource_group.pfe.name
}

output "postgresql_fqdn" {
  value = azurerm_postgresql_flexible_server.postgres.fqdn
}

output "aks_connect_command" {
  value = "az aks get-credentials --resource-group ${var.resource_group_name} --name ${var.aks_name}"
}
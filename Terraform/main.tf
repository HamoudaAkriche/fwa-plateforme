# 1. Groupe de Ressources
resource "azurerm_resource_group" "pfe" {
  name     = var.resource_group_name
  location = var.location
}

# 2. Réseau Virtuel (VNet)
resource "azurerm_virtual_network" "vnet" {
  name                = "aks-vnet-pfe"
  location            = azurerm_resource_group.pfe.location
  resource_group_name = azurerm_resource_group.pfe.name
  address_space       = ["10.224.0.0/16"]
}

resource "azurerm_subnet" "aks_subnet" {
  name                 = "aks-subnet"
  resource_group_name  = azurerm_resource_group.pfe.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.224.0.0/24"]
}

# 3. Cluster AKS
resource "azurerm_kubernetes_cluster" "aks" {
  name                = var.aks_name
  location            = azurerm_resource_group.pfe.location
  resource_group_name = azurerm_resource_group.pfe.name
  dns_prefix          = "fwasubscription"
  sku_tier            = "Free"

  default_node_pool {
    name           = "agentpool"
    node_count     = 1
    vm_size        = "Standard_D2s_v3"
    vnet_subnet_id = azurerm_subnet.aks_subnet.id
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin = "azure"
  }
}

# 4. PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "postgres" {
  name                   = var.db_name
  resource_group_name    = azurerm_resource_group.pfe.name
  location               = azurerm_resource_group.pfe.location
  version                = "15"
  administrator_login    = var.db_admin_user
  administrator_password = var.db_admin_password
  sku_name               = "B_Standard_B1ms"
  storage_mb             = 32768
  public_network_access_enabled = true
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_all" {
  name             = "allow-all"
  server_id        = azurerm_postgresql_flexible_server.postgres.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "255.255.255.255"
}
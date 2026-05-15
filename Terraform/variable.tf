variable "resource_group_name" {
  description = "Nom du groupe de ressources"
  type        = string
  default     = "rg-pfe-hybride"
}

variable "location" {
  description = "Région Azure"
  type        = string
  default     = "France Central"
}

variable "aks_name" {
  description = "Nom du cluster AKS"
  type        = string
  default     = "aks_fwa"
}

variable "db_name" {
  description = "Nom du serveur PostgreSQL"
  type        = string
  default     = "pfe-db-hamouda"
}

variable "db_admin_user" {
  description = "Nom d'utilisateur admin pour la DB"
  type        = string
  default     = "adminfwa"
}

variable "db_admin_password" {
  description = "Mot de passe admin pour la DB"
  type        = string
  sensitive   = true # Masque le mot de passe dans les logs Terraform
  default     = "Juniorronaldo7!"
}
variable "project_name" {
  description = "The name of your Google Cloud project"
  type        = string
}

variable "project_id" {
  description = "The ID of your Google Cloud project"
  type        = string
}

variable "web_app_display_name" {
    description = "The display name of the web app registeredd with the firebase project"
    type        = string
}

variable "firestore_region" {
    description = "region name for where the firestore database will be"
    type = string
}
variable "organization_id" {
    description = "Organization id for which the newly created project will be in"
    type = string
}
variable "billing_account" {
    description = "Billing account id for which the project will be associated with"
    type = string
}
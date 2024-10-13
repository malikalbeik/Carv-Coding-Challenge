# Terraform Configuration for Firebase Event Ticketing System

This directory contains the Terraform configuration for setting up and managing the infrastructure of our Firebase Event Ticketing System. Terraform is used to provision and manage Firebase resources in a declarative and version-controlled manner.

## Directory Structure

- `main.tf`: The primary Terraform configuration file that defines the core infrastructure components.
- `variables.tf`: Contains variable definitions used across the Terraform configuration.
- `outputs.tf`: Defines the outputs that will be displayed after Terraform applies the configuration.
- `assets/`: Directory containing additional files used in the infrastructure setup, such as Firestore rules.

## Setup

1. Ensure you have Terraform installed on your local machine. If you do not check [Installation Page](https://developer.hashicorp.com/terraform/tutorials/gcp-get-started/install-cli)
2. Configure your GCP credentials and set up the Google Cloud SDK.
3. Create a `terraform.tfvars` file. You can just rename the `terraform.tfvars.sample` and change any values in it as you see fit
4. Initialize the Terraform working directory:
   ```
   terraform init
   ```
5. Review the planned changes:
   ```
   terraform plan
   ```
6. Apply the configuration:
   ```
   terraform apply
   ```

## Key Components

- Firebase project setup
- Firestore database configuration

## Notes

- The current Firestore rules (`assets/firestore.rules`) are set to allow read and write access to all documents. This is for testing purposes only and should be updated with proper security rules before deployment to production.

For more detailed information on the overall architecture, refer to the `architecture/overall-architecture.d2` file in the project root.

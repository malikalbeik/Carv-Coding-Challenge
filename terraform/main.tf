# Create a new Google Cloud project.
resource "google_project" "default" {
  provider = google-beta.no_user_project_override

  name            = var.project_name
  project_id      = var.project_id
  org_id          = var.organization_id
  billing_account = var.billing_account

  # Required for the project to display in any list of Firebase projects.
  labels = {
    "firebase" = "enabled"
  }
}

# Enable the required underlying Service Usage API.
resource "google_project_service" "serviceusage" {
  provider = google-beta.no_user_project_override

  project = google_project.default.project_id
  service = "serviceusage.googleapis.com"

  # Don't disable the service if the resource block is removed by accident.
  disable_on_destroy = false
}

# Enable the required underlying Firebase Management API.
resource "google_project_service" "firebase" {
  provider = google-beta.no_user_project_override

  project = google_project.default.project_id
  service = "firebase.googleapis.com"

  # Don't disable the service if the resource block is removed by accident.
  disable_on_destroy = false
}

# Enable Firebase services for the new project created above.
resource "google_firebase_project" "default" {
  provider = google-beta

  project = google_project.default.project_id

  # Wait until the required APIs are enabled.
  depends_on = [
    google_project_service.firebase,
    google_project_service.serviceusage,
  ]
}

# Create a Firebase Web App in the new project created above.
resource "google_firebase_web_app" "default" {
  provider        = google-beta
  project         = google_firebase_project.default.project
  display_name    = var.web_app_display_name
  deletion_policy = "DELETE"
}

# Enable required APIs for Cloud Firestore.
resource "google_project_service" "firestore" {
  provider = google-beta

  project = google_firebase_project.default.project
  for_each = toset([
    "firestore.googleapis.com",
    "firebaserules.googleapis.com",
  ])
  service = each.key

  # Don't disable the service if the resource block is removed by accident.
  disable_on_destroy = false
}

# Provision the Firestore database instance.
resource "google_firestore_database" "default" {
  provider         = google-beta
  project          = google_firebase_project.default.project
  name             = "(default)"
  location_id      = var.firestore_region
  type             = "FIRESTORE_NATIVE"
  concurrency_mode = "PESSIMISTIC"

  depends_on = [
    google_project_service.firestore
  ]
}

resource "google_project_service" "pubsub" {
  provider           = google-beta
  project            = google_firebase_project.default.project
  service            = "pubsub.googleapis.com"
  disable_on_destroy = false
}

# Create a ruleset of Firestore Security Rules from a local file.
resource "google_firebaserules_ruleset" "firestore" {
  provider = google-beta

  project = google_firebase_project.default.project
  source {
    files {
      name    = "firestore.rules"
      content = file("assets/firestore.rules")
    }
  }

  # Wait for Firestore to be provisioned before creating this ruleset.
  depends_on = [
    google_firestore_database.default,
  ]
}

# Release the ruleset for the Firestore instance.
resource "google_firebaserules_release" "firestore" {
  provider = google-beta

  name         = "cloud.firestore" # must be cloud.firestore
  ruleset_name = google_firebaserules_ruleset.firestore.name
  project      = google_firebase_project.default.project

  # Wait for Firestore to be provisioned before releasing the ruleset.
  depends_on = [
    google_firestore_database.default,
  ]

  lifecycle {
    replace_triggered_by = [
      google_firebaserules_ruleset.firestore
    ]
  }
}

# Enable required APIs for Cloud Functions and Artifact Registry (for deploying Cloud Functions).
resource "google_project_service" "cloud_functions_and_artifact_registry" {
  provider = google-beta

  project = google_firebase_project.default.project
  for_each = toset([
    "cloudfunctions.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com"
  ])
  service = each.key

  # Don't disable the service if the resource block is removed by accident.
  disable_on_destroy = false
}

# Enable Artifact Registry API explicitly to handle deployment dependencies for functions
resource "google_project_service" "artifact_registry" {
  provider           = google-beta
  project            = google_firebase_project.default.project
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

# Add Pub/Sub Topic
resource "google_pubsub_topic" "purchases_queue" {
  name    = var.purchases_queue_name
  project = google_firebase_project.default.project
}

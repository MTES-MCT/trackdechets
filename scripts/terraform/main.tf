terraform {
  required_providers {
    scalingo = {
      source = "Scalingo/scalingo"
      version = "1.0.1"
    }
  }
}

variable "scalingo_api_token" {}
variable "scalingo_app_name" {
  type = string
  description = "App name"
}
variable "scalingo_region" {
  type    = string
  default = "osc-fr1"
  description = "The Scalingo region used. osc-fr1 (default) or osc-secnum-fr1."
}
variable "github_branch" {
  type = string
  description = "Github branch name to link to."
}
variable "api_environment_secrets" {}

provider "scalingo" {
  api_token = "${var.scalingo_api_token}"
  region = "${var.scalingo_region}"
}

data "scalingo_scm_integration" "github" {
  scm_type = "github"
}

resource "scalingo_app" "front" {
  name = "trackdechets-${var.scalingo_app_name}-front"

  environment = {
    PROCFILE="apps/Procfile.front"
    NO_INDEX="true"
    BUILD_ENV="recette"
    VITE_ALLOW_TEST_COMPANY="true"
    VITE_HOSTNAME="${var.scalingo_app_name}.trackdechets.beta.gouv.fr"
    VITE_API_ENDPOINT="https://api.${var.scalingo_app_name}.trackdechets.beta.gouv.fr"
    VITE_NOTIFIER_ENDPOINT="https://notifier.${var.scalingo_app_name}.trackdechets.beta.gouv.fr"
    VITE_CONTACT_EMAIL="contact@trackdechets.beta.gouv.fr"
    VITE_DEVELOPERS_ENDPOINT="https://developers.trackdechets.fr"
    VITE_SIB_CHAT="0"
    VITE_URL_SCHEME="https"
    VITE_VERIFY_COMPANY="false"
  }

  force_https = true
}

resource "scalingo_app" "api" {
  name = "trackdechets-${var.scalingo_app_name}-api"

  environment = merge({
    PROCFILE="apps/Procfile.back"
    API_PORT="$PORT"
    API_HOST="api.${var.scalingo_app_name}.trackdechets.beta.gouv.fr"
    UI_HOST="${var.scalingo_app_name}.trackdechets.beta.gouv.fr"
    NODE_ENV="demo"
    REDIS_URL="$SCALINGO_REDIS_URL"
    ELASTIC_SEARCH_URL="$SCALINGO_ELASTICSEARCH_URL"
    DATABASE_URL="$SCALINGO_POSTGRESQL_URL"
    NPM_CONFIG_PRODUCTION="false"
    TZ="Europe/Paris"
    API_URL_SCHEME="https"
    UI_URL_SCHEME="https"
    ALLOW_TEST_COMPANY="true"
    VERIFY_COMPANY="false"
    EMAIL_BACKEND="console"
    NOTIFY_DREAL_WHEN_FORM_DECLINED="false"
    PDF_WATERMARK="display"
    SESSION_COOKIE_HOST="trackdechets.beta.gouv.fr"
    SESSION_COOKIE_SECURE="true"
    SESSION_NAME="${var.scalingo_app_name}.trackdechets.connect.sid"
  }, var.api_environment_secrets)

  force_https = true
}


resource "scalingo_app" "notifier" {
  name = "trackdechets-${var.scalingo_app_name}-notifier"

  environment = {
    PROCFILE="apps/Procfile.notifier"
    NOTIFIER_PORT="$PORT"
    NOTIFIER_HOST="notifier.${var.scalingo_app_name}.trackdechets.beta.gouv.fr"
    UI_HOST="${var.scalingo_app_name}.trackdechets.beta.gouv.fr"
    UI_URL_SCHEME="https"
    REDIS_URL="${lookup(scalingo_app.api.all_environment, "SCALINGO_REDIS_URL", "n/c")}"
    NODE_ENV="demo"
    NPM_CONFIG_PRODUCTION="false"
    TZ="Europe/Paris"
  }

  force_https = true
}

resource "scalingo_addon" "api_psql" {
  provider_id = "scalingo-postgresql"
  plan        = "postgresql-sandbox"
  app         = "${scalingo_app.api.id}"
}

resource "scalingo_addon" "api_redis" {
  provider_id = "scalingo-redis"
  plan        = "redis-sandbox"
  app         = "${scalingo_app.api.id}"
}

resource "scalingo_addon" "api_es" {
  provider_id = "scalingo-elasticsearch"
  plan        = "elasticsearch-sandbox"
  app         = "${scalingo_app.api.id}"
}

resource "scalingo_addon" "api_mongo" {
  provider_id = "scalingo-mongodb"
  plan        = "mongo-sandbox"
  app         = "${scalingo_app.api.id}"
}

resource "scalingo_scm_repo_link" "api_link" {
  auth_integration_uuid           = data.scalingo_scm_integration.github.id
  app                             = "${scalingo_app.api.id}"
  source                          = "https://github.com/MTES-MCT/trackdechets"
  branch                          = "${var.github_branch}"
  auto_deploy_enabled             = true
}

resource "scalingo_scm_repo_link" "ui_link" {
  auth_integration_uuid           = data.scalingo_scm_integration.github.id
  app                             = "${scalingo_app.front.id}"
  source                          = "https://github.com/MTES-MCT/trackdechets"
  branch                          = "${var.github_branch}"
  auto_deploy_enabled             = true
}

resource "scalingo_scm_repo_link" "notifier_link" {
  auth_integration_uuid           = data.scalingo_scm_integration.github.id
  app                             = "${scalingo_app.notifier.id}"
  source                          = "https://github.com/MTES-MCT/trackdechets"
  branch                          = "${var.github_branch}"
  auto_deploy_enabled             = true
}

resource "scalingo_domain" "domain_front" {
  common_name = "${var.scalingo_app_name}.trackdechets.beta.gouv.fr"
  app = "${scalingo_app.front.id}"
}

resource "scalingo_domain" "domain_api" {
  common_name = "api.${var.scalingo_app_name}.trackdechets.beta.gouv.fr"
  app = "${scalingo_app.api.id}"
}

resource "scalingo_domain" "domain_notifier" {
  common_name = "notifier.${var.scalingo_app_name}.trackdechets.beta.gouv.fr"
  app = "${scalingo_app.notifier.id}"
}
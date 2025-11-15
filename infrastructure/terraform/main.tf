terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend S3 pour stocker l'état Terraform
  # À décommenter après avoir créé le bucket
  # backend "s3" {
  #   bucket = "transport-terraform-state"
  #   key    = "prod/terraform.tfstate"
  #   region = "eu-west-1"
  # }
}

provider "aws" {
  region = var.aws_region
}
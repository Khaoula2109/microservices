variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "eu-west-1"
}

variable "cluster_name" {
  description = "EKS Cluster Name"
  type        = string
  default     = "transport-cluster"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.28"

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.public_subnets

  cluster_endpoint_public_access = true

  # Groupe de nœuds managés
  eks_managed_node_groups = {
    general = {
      name = "general-node-group"

      instance_types = ["t3.micro"]
      capacity_type  = "ON_DEMAND"

      min_size     = 1
      max_size     = 3
      desired_size = 1

      labels = {
        role = "general"
      }
    }
  }

  # Addons EKS
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
  }
}

variable "aws_region" {
  type        = string
  description = "The target AWS region to deploy infrastructure."
  default     = "us-east-1"
}

variable "aws_account_id" {
  type        = string
  description = "Your unique AWS Account ID to ensure global uniqueness for S3 Buckets."
  default     = "123456789012" # Place user AWS Account ID
}

variable "environment" {
  type        = string
  description = "Infrastructure stage identifier tag."
  default     = "production"
}

variable "ec2_key_name" {
  type        = string
  description = "Name of the AWS EC2 SSH keypair for remote console access."
  default     = "resuscreen-ssh-key"
}

variable "ec2_ami_id" {
  type        = string
  description = "Amazon Machine Image ID for the EC2 backend instance. Matches standard Amazon Linux 2 in us-east-1."
  default     = "ami-0c7217cdde317cfec" 
}

variable "db_password" {
  type        = string
  description = "Secure password for the isolated RDS PostgreSQL database administrator account."
  default     = "SuperSecurePassword123!"
  sensitive   = true
}

variable "github_repo_url" {
  type        = string
  description = "Public GitHub repo URL to clone on EC2 boot (e.g. https://github.com/user/repo.git). Leave empty to configure manually."
  default     = ""
}

variable "domain_name" {
  type        = string
  description = "Optional custom domain for Route 53 alias to CloudFront (e.g. app.example.com)."
  default     = ""
}

variable "route53_zone_id" {
  type        = string
  description = "Route 53 hosted zone ID for domain_name. Required when domain_name is set."
  default     = ""
}

# ==========================================
# Terraform Infrastructure Blueprint (AWS)
# ==========================================

terraform {
  required_version = ">= 1.2.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# 1. isolated VPC Network Setup
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "${var.environment}-resuscreen-vpc"
  }
}

# Internet Gateway for Public Routing
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "${var.environment}-vpc-igw"
  }
}

# 2. VPC Subnets Definition
# Public Subnets (EC2 instances)
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.environment}-public-subnet-1"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.environment}-public-subnet-2"
  }
}

# Private Subnets (RDS isolation - RDS requires at least 2 AZs!)
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "${var.aws_region}a"
  tags = {
    Name = "${var.environment}-private-subnet-1"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${var.aws_region}b"
  tags = {
    Name = "${var.environment}-private-subnet-2"
  }
}

# Public Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }
  tags = {
    Name = "${var.environment}-public-rt"
  }
}

# Map public subnets to public route tables
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# 3. Security Groups (Firewalls)
# Security Group for Backend EC2 Host
resource "aws_security_group" "ec2_sg" {
  name        = "${var.environment}-ec2-security-group"
  description = "Allows SSH, HTTP traffic to reverse proxy Nginx & backend Node API"
  vpc_id      = aws_vpc.main.id

  # SSH Access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP Traffic (Nginx)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS Traffic (SSL Nginx)
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Node API API Direct Inbound
  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound Ingress (Anywhere)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-ec2-sg"
  }
}

# Security Group for Database RDS (PostgreSQL) - RESTRICTED TO EC2 ACCESS ONLY!
resource "aws_security_group" "rds_sg" {
  name        = "${var.environment}-rds-security-group"
  description = "Allows PostgreSQL traffic strictly from EC2 Instance Security Group"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id] # Strictly bound to EC2 SG!
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-rds-sg"
  }
}

# 4. AWS S3 Static Web Hosting (Frontend hosting)
resource "aws_s3_bucket" "frontend_bucket" {
  bucket        = "${var.environment}-resuscreen-frontend-${var.aws_account_id}"
  force_destroy = true
  tags = {
    Name = "${var.environment}-frontend-s3"
  }
}

resource "aws_s3_bucket_website_configuration" "frontend_web_config" {
  bucket = aws_s3_bucket.frontend_bucket.id
  index_document {
    suffix = "index.html"
  }
  error_document {
    key = "index.html"
  }
}

# Allow public read policy on S3 (required for CloudFront S3 origin without OAC in this demo)
resource "aws_s3_bucket_public_access_block" "frontend_bucket_pab" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "allow_public_access" {
  bucket = aws_s3_bucket.frontend_bucket.id
  depends_on = [aws_s3_bucket_public_access_block.frontend_bucket_pab]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
      }
    ]
  })
}

# 5. AWS RDS PostgreSQL Database Instance (created before EC2 for user_data wiring)
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "${var.environment}-rds-subnet-group"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]
  tags = {
    Name = "${var.environment}-rds-subnet-group"
  }
}

resource "aws_db_instance" "postgresql_rds" {
  allocated_storage      = 20
  max_allocated_storage  = 100
  db_name                = "resume_screening_db"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t3.micro"
  username               = "postgres"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true
  publicly_accessible    = false

  tags = {
    Name = "${var.environment}-postgres-db"
  }
}

# 6. EC2 Backend Compute Instance + Elastic IP
resource "aws_instance" "backend_ec2" {
  ami                    = var.ec2_ami_id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public_1.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  key_name               = var.ec2_key_name
  user_data              = local.ec2_user_data

  depends_on = [aws_db_instance.postgresql_rds]

  tags = {
    Name = "${var.environment}-resuscreen-backend"
  }
}

resource "aws_eip" "backend_eip" {
  instance = aws_instance.backend_ec2.id
  domain   = "vpc"

  tags = {
    Name = "${var.environment}-resuscreen-backend-eip"
  }
}

locals {
  ec2_user_data = <<-USERDATA
#!/bin/bash
set -e
exec > /var/log/user-data.log 2>&1

yum update -y
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs git
npm install -g pm2
amazon-linux-extras install nginx1 -y
systemctl start nginx
systemctl enable nginx

mkdir -p /var/www/backend
chown -R ec2-user:ec2-user /var/www/backend

if [ -n "${var.github_repo_url}" ]; then
  sudo -u ec2-user git clone ${var.github_repo_url} /var/www/backend 2>/dev/null || sudo -u ec2-user git -C /var/www/backend pull
fi

if [ -f /var/www/backend/nginx.conf ]; then
  cp /var/www/backend/nginx.conf /etc/nginx/nginx.conf
  systemctl restart nginx
fi

cat > /var/www/backend/backend/.env <<ENVFILE
PORT=5000
NODE_ENV=production
DB_HOST=${aws_db_instance.postgresql_rds.address}
DB_USER=postgres
DB_PASSWORD=${var.db_password}
DB_DATABASE=resume_screening_db
DB_PORT=5432
DB_SSL=true
ENVFILE
chown ec2-user:ec2-user /var/www/backend/backend/.env
chmod 600 /var/www/backend/backend/.env

# Wait for RDS to accept connections
for i in $(seq 1 36); do
  timeout 2 bash -c "cat < /dev/null > /dev/tcp/${aws_db_instance.postgresql_rds.address}/5432" 2>/dev/null && break
  sleep 10
done

if [ -d /var/www/backend/backend ]; then
  cd /var/www/backend/backend
  sudo -u ec2-user npm install --only=production
  sudo -u ec2-user pm2 start src/server.js --name server || sudo -u ec2-user pm2 reload server
  sudo -u ec2-user pm2 save
  env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
fi
USERDATA
}

# 7. AWS CloudFront CDN (S3 frontend + /api proxy to EC2 Nginx)
resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend_bucket.bucket}"
  }

  origin {
    domain_name = aws_instance.backend_ec2.public_dns
    origin_id     = "EC2-API-${aws_instance.backend_ec2.id}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  # API traffic → EC2 Nginx (must be before default S3 behavior)
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "EC2-API-${aws_instance.backend_ec2.id}"

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend_bucket.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # SPA client-side routing: serve index.html on S3 403/404
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Environment = var.environment
  }
}

# 8. Route 53 (optional custom domain → CloudFront)
resource "aws_route53_record" "app_alias" {
  count = var.domain_name != "" && var.route53_zone_id != "" ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.s3_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.s3_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

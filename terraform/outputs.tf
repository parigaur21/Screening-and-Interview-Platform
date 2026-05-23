output "s3_static_website_endpoint" {
  value       = aws_s3_bucket_website_configuration.frontend_web_config.website_endpoint
  description = "The raw HTTP S3 bucket website URL."
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.frontend_bucket.bucket
  description = "S3 bucket name for frontend deploy (GitHub secret AWS_S3_BUCKET_NAME)."
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.s3_distribution.id
  description = "CloudFront distribution ID (GitHub secret AWS_CLOUDFRONT_DIST_ID)."
}

output "cloudfront_distribution_domain" {
  value       = aws_cloudfront_distribution.s3_distribution.domain_name
  description = "The low-latency CloudFront CDN Domain Name serving your frontend."
}

output "ec2_backend_public_ip" {
  value       = aws_eip.backend_eip.public_ip
  description = "Elastic IP of the EC2 backend (SSH and direct API checks)."
}

output "rds_database_endpoint" {
  value       = aws_db_instance.postgresql_rds.endpoint
  description = "The isolated database endpoint for PostgreSQL RDS."
}

output "custom_domain_url" {
  value       = var.domain_name != "" ? "https://${var.domain_name}" : ""
  description = "Custom domain URL when Route 53 is configured."
}

# DevOps & CI/CD Complete Setup Guide

This document provides a comprehensive overview of the entire CI/CD pipeline and DevOps infrastructure for the Resume Screening Project.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Docker Setup](#docker-setup)
3. [Jenkins CI/CD Pipeline](#jenkins-cicd-pipeline)
4. [AWS Infrastructure (Terraform)](#aws-infrastructure-terraform)
5. [Deployment Workflow](#deployment-workflow)
6. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

## Architecture Overview

```
┌─────────────────┐
│  Git Repository │
│  (main/develop) │
└────────┬────────┘
         │ Webhook
         ▼
┌─────────────────────────────────────┐
│      Jenkins CI/CD Pipeline         │
├─────────────────────────────────────┤
│ 1. Checkout Code                    │
│ 2. Run Tests (Backend/Frontend)     │
│ 3. Build Docker Images              │
│ 4. Push to Registry                 │
│ 5. Plan/Apply Terraform             │
│ 6. Deploy to AWS                    │
│ 7. Run Smoke Tests                  │
└─────────────┬───────────────────────┘
              │
      ┌───────┴───────┐
      ▼               ▼
 Dev Environment  Production (AWS)
 (Docker Compose) (ECS/EC2 + RDS)
```

## Docker Setup

### Multi-Service Application

The application consists of 3 main services:

1. **PostgreSQL Database** (postgres:15-alpine)
   - Port: 5432
   - Volume: `postgres_data` (persistent storage)
   - Environment: Dev credentials (change for production)

2. **Node.js Backend API** (node:18-alpine)
   - Port: 5000
   - Depends on: PostgreSQL
   - Responsibilities: REST API, Authentication, AI services

3. **React Frontend** (nginx:alpine)
   - Port: 3000
   - Depends on: Backend API
   - Responsibilities: User interface, static assets

### Running Locally

```bash
# Build images
docker-compose -f docker/docker-compose.yml build

# Start services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down

# Remove all data
docker-compose -f docker/docker-compose.yml down -v
```

### Health Checks

```bash
# Backend health
curl http://localhost:5000/health

# Frontend
curl http://localhost:3000

# Database
psql -h localhost -U postgres -d resume_screening_db
```

## Jenkins CI/CD Pipeline

### Pipeline Stages

| Stage | Trigger | Description |
|-------|---------|-------------|
| Checkout | Always | Clone repository code |
| Backend Tests | Always | Run npm test on backend |
| Frontend Tests | Always | Run npm test on frontend |
| Build Docker Images | Always | Build Docker images |
| Push to Registry | main only | Push images to Docker registry |
| Deploy - Dev | develop only | Deploy to dev via docker-compose |
| Terraform Plan | main only | Plan infrastructure changes |
| Terraform Apply | main only | Apply infrastructure (manual approval) |
| Smoke Tests | main only | Verify deployment health |

### Branch Strategy

- **develop**: Development branch
  - Triggers: Dev deployment via docker-compose
  - Tests: Run all tests
  - Deploy to: Local Docker environment

- **main**: Production branch
  - Triggers: Full CI/CD pipeline
  - Tests: Run all tests
  - Push: Docker images to registry
  - Deploy to: AWS (requires approval)
  - Tests: Smoke tests post-deployment

### Setting Up Jenkins

See [JENKINS_SETUP.md](./JENKINS_SETUP.md) for detailed instructions on:
- Installing Jenkins via Docker
- Installing required plugins
- Configuring credentials
- Creating pipeline jobs
- Setting up GitHub webhooks

### Credentials Required

All credentials must be configured in Jenkins as described in [AWS_DOCKER_SETUP.md](./AWS_DOCKER_SETUP.md):

```
✓ docker-registry-url
✓ docker-registry-username
✓ docker-registry-password
✓ aws-access-key-id
✓ aws-secret-access-key
✓ aws-region
```

## AWS Infrastructure (Terraform)

### Resources Managed by Terraform

1. **VPC & Networking**
   - VPC with 10.0.0.0/16 CIDR block
   - 2 Public subnets (for EC2)
   - 2 Private subnets (for RDS)
   - Internet Gateway, Route Tables

2. **Security Groups**
   - EC2 Security Group (SSH, HTTP/HTTPS)
   - RDS Security Group (PostgreSQL port 5432)

3. **EC2 Instances**
   - Application servers for Docker containers
   - Auto Scaling Group (optional)
   - Load Balancer (optional)

4. **RDS Database**
   - PostgreSQL instance
   - Multi-AZ deployment
   - Automated backups

### Terraform Files

- `terraform/main.tf`: Core infrastructure resources
- `terraform/variables.tf`: Input variables
- `terraform/outputs.tf`: Output values
- `terraform/terraform.tfvars`: Environment-specific values

### Deploying Infrastructure

```bash
cd terraform

# Initialize Terraform
terraform init

# Review changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# View outputs
terraform output

# Destroy (for cleanup)
terraform destroy
```

### Environment Variables

Create `terraform/terraform.tfvars`:

```hcl
aws_region     = "us-east-1"
environment    = "production"
instance_type  = "t3.micro"
db_engine      = "postgres"
db_version     = "15.2"
```

## Deployment Workflow

### Development Flow (develop branch)

```
1. Developer pushes to develop
   ↓
2. GitHub webhook triggers Jenkins
   ↓
3. Jenkins runs tests
   ↓
4. Jenkins builds Docker images
   ↓
5. Jenkins deploys via docker-compose (local)
   ↓
6. Developer tests in local environment
```

### Production Flow (main branch)

```
1. Developer creates Pull Request
   ↓
2. Code review & tests run
   ↓
3. PR merged to main
   ↓
4. GitHub webhook triggers Jenkins
   ↓
5. Jenkins runs tests
   ↓
6. Jenkins builds Docker images
   ↓
7. Jenkins pushes to Docker registry
   ↓
8. Jenkins plans Terraform changes
   ↓
9. Manual approval required
   ↓
10. Jenkins applies Terraform
    ↓
11. Jenkins runs smoke tests
    ↓
12. Deployment complete
```

## Monitoring & Troubleshooting

### Check Jenkins Pipeline

1. Navigate to Jenkins dashboard
2. Click on job name
3. View **Build History**
4. Click build number
5. Check **Console Output** for logs

### Common Issues

#### Docker not found in Jenkins
```bash
docker exec jenkins apt-get update && apt-get install -y docker.io
docker exec jenkins usermod -aG docker jenkins
```

#### Terraform not found
```bash
docker exec jenkins apt-get install -y terraform
```

#### Git clone fails
- Check GitHub credentials in Jenkins
- Verify SSH key or personal access token
- Check repository URL in pipeline

#### Tests fail
- Review console output for error messages
- Check test scripts in `backend/package.json` and `frontend/package.json`
- Verify environment variables are set

#### Docker push fails
- Verify Docker registry credentials
- Check registry URL
- Ensure image tag format is correct

#### AWS permissions errors
- Verify IAM user has required permissions
- Check AWS credentials in Jenkins
- Verify AWS region is set correctly

### Logs

```bash
# Jenkins logs
docker logs jenkins

# View Jenkins home
docker exec jenkins ls -la /var/jenkins_home

# Check credentials
docker exec jenkins cat /var/jenkins_home/credentials.xml | grep -i "docker"
```

### Testing Individual Components

```bash
# Test backend API
cd backend
npm install
npm test
npm start

# Test frontend
cd frontend
npm install
npm test
npm run build

# Test Docker build
docker build -f docker/Dockerfile.backend -t test:backend ./backend
docker build -f docker/Dockerfile.frontend -t test:frontend ./frontend

# Test docker-compose
docker-compose -f docker/docker-compose.yml config
docker-compose -f docker/docker-compose.yml up --dry-run
```

## Security Considerations

1. **Credentials**: All secrets must be stored in Jenkins credential store
2. **IAM**: Use least privilege principle for AWS IAM roles
3. **Network**: Restrict security group ingress rules
4. **Database**: Use strong passwords, enable encryption
5. **Registry**: Use private Docker registries, enable scanning
6. **Logs**: Rotate Jenkins logs, archive securely

## Performance Optimization

1. **Docker layer caching**: Organize Dockerfiles for better caching
2. **Parallel tests**: Run backend and frontend tests in parallel
3. **Build agents**: Use multiple Jenkins agents for concurrent builds
4. **Registry**: Use local registry mirror to reduce pull times
5. **Database**: Enable query logging and optimize slow queries

## Next Steps

1. **Set up monitoring**: CloudWatch, Prometheus, or similar
2. **Add notifications**: Slack, email alerts for pipeline status
3. **Database migrations**: Implement automated schema migrations
4. **Load testing**: Add performance tests to pipeline
5. **Backup strategy**: Implement RDS snapshots and S3 backups
6. **Disaster recovery**: Plan for failover and recovery

## Quick Reference

### Useful Commands

```bash
# Docker
docker ps                           # List running containers
docker logs <container>             # View container logs
docker-compose up -d                # Start services
docker-compose down                 # Stop services

# Terraform
terraform init                      # Initialize
terraform plan                      # Review changes
terraform apply                     # Apply changes
terraform destroy                   # Destroy infrastructure

# Jenkins
docker exec jenkins jenkins-cli ...  # Run Jenkins CLI
curl http://localhost:8082/api/json # Check Jenkins status

# Git
git checkout develop                # Switch to develop
git pull origin develop             # Update branch
git push origin feature/xyz         # Push changes
```

## Support & Documentation

- [Jenkins Setup](./JENKINS_SETUP.md)
- [AWS & Docker Setup](./AWS_DOCKER_SETUP.md)
- [Docker Compose File](./docker/docker-compose.yml)
- [Jenkinsfile](./Jenkinsfile)
- [Terraform Configuration](./terraform/)

---

**Last Updated**: May 2026
**Version**: 1.0

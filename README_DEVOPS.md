# Resume Screening DevOps Project

Complete DevOps infrastructure setup for the Resume Screening Application, featuring Docker containerization, Jenkins CI/CD pipeline, and Terraform-based AWS infrastructure provisioning.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Components](#components)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

## Quick Start

### For Windows Users (PowerShell)

```powershell
# Clone or navigate to the project
cd DevOpsProject

# Run setup script with interactive menu
.\setup-devops.ps1 -Command menu

# Or start directly
.\setup-devops.ps1 -Command start
```

### For Linux/macOS Users (Bash)

```bash
# Clone or navigate to the project
cd DevOpsProject

# Make script executable
chmod +x setup-devops.sh

# Run setup script with interactive menu
./setup-devops.sh menu

# Or start directly
./setup-devops.sh start
```

### After Services Start

1. **Access Jenkins**: http://localhost:8082
2. **Get Initial Password**: Check setup script output or run:
   ```
   .\setup-devops.ps1 -Command password    # Windows
   ./setup-devops.sh password               # Linux/Mac
   ```
3. **Complete Jenkins Setup**: Follow the setup wizard
4. **Configure Credentials**: See [AWS_DOCKER_SETUP.md](./AWS_DOCKER_SETUP.md)

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Git Repository                          │
│                  (GitHub/GitLab/etc)                       │
└────────────────────┬─────────────────────────────────────┘
                     │ Webhook Trigger
                     ▼
┌────────────────────────────────────────────────────────────┐
│              Jenkins CI/CD Pipeline                        │
├────────────────────────────────────────────────────────────┤
│ • Code Checkout                                            │
│ • Backend Tests (Node.js)                                  │
│ • Frontend Tests (React)                                   │
│ • Build Docker Images                                      │
│ • Push to Registry                                         │
│ • Plan & Apply Terraform                                  │
│ • Deploy & Verify                                         │
└────────────┬─────────────────────────────────┬────────────┘
             │                                 │
      ┌──────▼──────┐                ┌────────▼─────────┐
      │     Dev      │                │   Production     │
      │ (Docker      │                │   (AWS/Cloud)    │
      │ Compose)     │                │                  │
      │              │                │ • EC2 Instances  │
      │ • Database   │                │ • RDS Database   │
      │ • Backend    │                │ • Load Balancer  │
      │ • Frontend   │                │ • Auto Scaling   │
      └──────────────┘                └──────────────────┘
```

## Components

### 1. **Docker Setup** 📦
- Multi-service orchestration (PostgreSQL, Node.js Backend, React Frontend)
- Development environment with docker-compose
- Production-ready Dockerfiles with multi-stage builds

**Files:**
- `docker/docker-compose.yml` - Application services
- `docker/docker-compose.jenkins.yml` - DevOps services
- `docker/Dockerfile.backend` - Backend image
- `docker/Dockerfile.frontend` - Frontend image

### 2. **Jenkins CI/CD** 🔄
- Automated build and deployment pipeline
- Branch-based triggers (develop/main)
- Integrated testing, building, and deployment
- Docker and Terraform orchestration

**Files:**
- `Jenkinsfile` - Pipeline definition
- `JENKINS_SETUP.md` - Setup instructions

### 3. **AWS Infrastructure** ☁️
- VPC with public/private subnets
- Security groups and network ACLs
- EC2 instances and RDS database
- Auto Scaling and Load Balancing

**Files:**
- `terraform/main.tf` - Infrastructure code
- `terraform/variables.tf` - Input variables
- `terraform/outputs.tf` - Output values
- `terraform/terraform.tfvars.example` - Example configuration

### 4. **DevOps Tools** 🛠️
- Docker Registry (private)
- Registry UI (web interface)
- Nginx Reverse Proxy
- Jenkins Server

## Prerequisites

### System Requirements
- **OS**: Windows, macOS, or Linux
- **RAM**: Minimum 8GB (16GB recommended)
- **Disk**: Minimum 20GB free space
- **CPU**: 4 cores (8 recommended)

### Software Requirements

| Tool | Version | Purpose |
|------|---------|---------|
| Docker Desktop | 20.10+ | Container runtime |
| Docker Compose | 1.29+ | Multi-container orchestration |
| Git | 2.30+ | Version control |
| Terraform | 1.2+ | Infrastructure provisioning |
| AWS CLI | 2.0+ | AWS credential management |

### Installation

#### Docker Desktop
- **Windows/macOS**: Download from https://www.docker.com/products/docker-desktop
- **Linux**: 
  ```bash
  sudo apt-get update
  sudo apt-get install -y docker.io docker-compose
  sudo usermod -aG docker $USER
  ```

#### Terraform
- Download from https://www.terraform.io/downloads
- Extract and add to PATH

#### AWS CLI
```bash
pip install awscli
```

## Getting Started

### Step 1: Clone and Setup

```bash
# Navigate to project
cd DevOpsProject

# Verify prerequisites
docker --version
docker-compose --version
```

### Step 2: Start DevOps Services

**Windows:**
```powershell
.\setup-devops.ps1 -Command start
```

**Linux/macOS:**
```bash
./setup-devops.sh start
```

### Step 3: Access Services

| Service | URL | Notes |
|---------|-----|-------|
| Jenkins | http://localhost:8082 | See setup output or the initial admin password in Jenkins logs |
| Docker Registry | http://localhost:5001 | Use this URL in Jenkins registry credentials |

### Step 4: Configure Jenkins

1. Complete initial setup wizard
2. Install recommended plugins
3. Configure credentials (see [AWS_DOCKER_SETUP.md](./AWS_DOCKER_SETUP.md))
4. Create pipeline job pointing to your Git repository

### Step 5: Connect Repository

1. Create GitHub webhook pointing to: `http://your-jenkins:8082/github-webhook/`
2. Push code to trigger pipeline

## Configuration

### Jenkins Credentials

Create these credentials in Jenkins (Manage Jenkins → Manage Credentials):

```
✓ docker-registry-url (Secret text)
✓ docker-registry-username (Username with password)
✓ docker-registry-password (Username with password)
✓ aws-access-key-id (AWS Credentials)
✓ aws-secret-access-key (AWS Credentials)
✓ aws-region (Secret text)
```

See [AWS_DOCKER_SETUP.md](./AWS_DOCKER_SETUP.md) for detailed setup.

### Terraform Variables

Create `terraform/terraform.tfvars`:

```hcl
aws_region      = "us-east-1"
environment     = "production"
instance_type   = "t3.micro"
db_instance_type = "db.t3.micro"
```

See `terraform/terraform.tfvars.example` for all available variables.

### Pipeline Branches

| Branch | Action | Deployment |
|--------|--------|-----------|
| develop | Build & Test | Dev (docker-compose) |
| main | Full Pipeline | AWS (Terraform) |

## Deployment

### Development Deployment

Push to `develop` branch - Jenkins automatically deploys via docker-compose:

```bash
git checkout develop
git push origin develop
# Jenkins triggers automatically
```

### Production Deployment

1. Create Pull Request to `main`
2. Code review and tests pass
3. Merge to `main`
4. Jenkins builds and pushes images
5. Jenkins plans Terraform changes
6. **Approve in Jenkins** to apply changes
7. Infrastructure deployed to AWS

### Manual Deployment

```bash
# Build and test locally
docker-compose -f docker/docker-compose.yml build
docker-compose -f docker/docker-compose.yml up -d

# Deploy infrastructure
cd terraform
terraform init
terraform plan
terraform apply

# Monitor deployment
curl http://your-app-url/health
```

## Monitoring & Troubleshooting

### Health Checks

```bash
# Check all services
.\setup-devops.ps1 -Command health    # Windows
./setup-devops.sh health               # Linux/Mac

# Individual checks
curl http://localhost:8082/login       # Jenkins
curl http://localhost:5001/v2/         # Docker Registry
curl http://localhost:3000             # Frontend
curl http://localhost:5000/health      # Backend
```

### View Logs

```bash
# All services
.\setup-devops.ps1 -Command logs

# Specific service
docker logs jenkins-server
docker logs resuscreen-backend
docker logs resuscreen-frontend
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Docker socket permission denied | Run: `docker exec jenkins usermod -aG docker jenkins` |
| Terraform not found | Install from https://www.terraform.io/downloads |
| Jenkins plugins fail to install | Wait longer, Jenkins is initializing |
| Docker Registry returns 404 | Verify image is pushed: `docker images` |
| AWS credentials error | Check credentials configured in Jenkins |

See [JENKINS_SETUP.md](./JENKINS_SETUP.md) and [AWS_DOCKER_SETUP.md](./AWS_DOCKER_SETUP.md) for more troubleshooting.

## Script Commands

### Windows (PowerShell)

```powershell
.\setup-devops.ps1 -Command start       # Start all services
.\setup-devops.ps1 -Command stop        # Stop all services
.\setup-devops.ps1 -Command restart     # Restart services
.\setup-devops.ps1 -Command status      # Show service status
.\setup-devops.ps1 -Command logs        # View logs
.\setup-devops.ps1 -Command health      # Check health
.\setup-devops.ps1 -Command password    # Get Jenkins password
.\setup-devops.ps1 -Command plugins     # Install plugins
.\setup-devops.ps1 -Command registry    # Configure registry
.\setup-devops.ps1 -Command clean       # Remove all containers
```

### Linux/macOS (Bash)

```bash
./setup-devops.sh start                 # Start all services
./setup-devops.sh stop                  # Stop all services
./setup-devops.sh restart               # Restart services
./setup-devops.sh status                # Show service status
./setup-devops.sh logs                  # View logs
./setup-devops.sh health                # Check health
./setup-devops.sh password              # Get Jenkins password
./setup-devops.sh plugins               # Install plugins
./setup-devops.sh registry              # Configure registry
./setup-devops.sh clean                 # Remove all containers
```

## Documentation

### Main Guides

1. **[CI_CD_DEVOPS_GUIDE.md](./CI_CD_DEVOPS_GUIDE.md)** - Complete overview
2. **[JENKINS_SETUP.md](./JENKINS_SETUP.md)** - Jenkins installation & configuration
3. **[AWS_DOCKER_SETUP.md](./AWS_DOCKER_SETUP.md)** - AWS & Docker Registry setup

### Configuration Files

- `Jenkinsfile` - CI/CD pipeline stages
- `docker-compose.yml` - Application services
- `docker-compose.jenkins.yml` - DevOps services
- `nginx-devops.conf` - Reverse proxy configuration
- `terraform/` - Infrastructure as code

## Project Structure

```
DevOpsProject/
├── Jenkinsfile                      # CI/CD Pipeline
├── nginx-devops.conf                # Nginx reverse proxy
├── setup-devops.sh                  # Linux/Mac setup script
├── setup-devops.ps1                 # Windows setup script
├── CI_CD_DEVOPS_GUIDE.md           # Complete guide
├── JENKINS_SETUP.md                 # Jenkins setup
├── AWS_DOCKER_SETUP.md             # AWS & Docker setup
├── README.md                        # This file
├── backend/                         # Node.js backend
│   ├── package.json
│   └── src/
├── frontend/                        # React frontend
│   ├── package.json
│   └── src/
├── docker/                          # Docker configuration
│   ├── docker-compose.yml
│   ├── docker-compose.jenkins.yml
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
└── terraform/                       # Infrastructure code
    ├── main.tf
    ├── variables.tf
    ├── outputs.tf
    └── terraform.tfvars.example
```

## Security Best Practices

1. ✅ Store credentials in Jenkins secret store only
2. ✅ Use IAM roles for AWS access
3. ✅ Rotate access keys regularly
4. ✅ Restrict security group rules
5. ✅ Enable database encryption
6. ✅ Use HTTPS for all communications
7. ✅ Never commit secrets to version control

## Performance Tips

1. Use Docker layer caching effectively
2. Run tests in parallel
3. Use multiple Jenkins agents
4. Cache npm dependencies
5. Optimize database queries
6. Use CDN for static assets

## Support & Contributing

- Issues: Report via Git issues
- Pull Requests: Follow Git flow
- Documentation: Update relevant .md files

## License

[Specify your license here]

## Authors

- DevOps Team
- Project Created: May 2026

## Changelog

### Version 1.0 (May 2026)
- Initial setup with Docker, Jenkins, and Terraform
- Multi-service application orchestration
- Complete CI/CD pipeline
- AWS infrastructure provisioning

---

**Last Updated**: May 24, 2026

For detailed information, see the documentation files linked above.

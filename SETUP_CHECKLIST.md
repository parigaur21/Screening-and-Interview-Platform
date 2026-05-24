# CI/CD DevOps Setup Checklist

Use this checklist to track your setup progress.

## ✓ Phase 1: Prerequisites (5-10 minutes)

- [ ] Docker Desktop installed
- [ ] Docker Compose installed
- [ ] Git installed and configured
- [ ] Terminal/PowerShell access available
- [ ] AWS account created (for production)
- [ ] Docker Hub account or ECR repository created
- [ ] GitHub/GitLab repository access

**Verify:**
```bash
docker --version
docker-compose --version
git --version
terraform --version
```

## ✓ Phase 2: Local DevOps Setup (10-15 minutes)

- [ ] Navigate to DevOpsProject directory
- [ ] Run setup script (Windows or Linux/Mac)
- [ ] Services started successfully
- [ ] Jenkins accessible at http://localhost:8082
- [ ] Docker Registry accessible at localhost:5001

**Commands:**
```powershell
# Windows
.\setup-devops.ps1 -Command start

# Linux/Mac
./setup-devops.sh start
```

**Verify services:**
```bash
docker-compose -f docker/docker-compose.jenkins.yml ps
```

## ✓ Phase 3: Jenkins Initial Setup (15-20 minutes)

- [ ] Retrieve initial admin password
- [ ] Complete Jenkins setup wizard
- [ ] Create admin user
- [ ] Skip plugin installation (recommended for first run)
- [ ] Install recommended plugins
- [ ] Create a test job

**Commands:**
```powershell
# Get initial password
.\setup-devops.ps1 -Command password    # Windows
./setup-devops.sh password               # Linux/Mac
```

**Manual plugin installation:**
```powershell
# Windows
.\setup-devops.ps1 -Command plugins

# Linux/Mac
./setup-devops.sh plugins
```

**Required plugins:**
- Pipeline
- Docker Commons
- GitHub Integration (or GitLab/Bitbucket)
- Credentials Binding
- AWS Credentials
- Blue Ocean

## ✓ Phase 4: Credentials Configuration (10-15 minutes)

### Docker Registry Credentials

- [ ] Create Docker registry account (Docker Hub/ECR)
- [ ] Generate access token
- [ ] Add to Jenkins:
  - [ ] `docker-registry-url` (Secret text)
  - [ ] `docker-registry-username` (Username/password)
  - [ ] `docker-registry-password` (Username/password)

**Reference:** [AWS_DOCKER_SETUP.md](./AWS_DOCKER_SETUP.md)

### AWS Credentials

- [ ] Create IAM user for Terraform (optional)
- [ ] Generate access key and secret
- [ ] Add to Jenkins:
  - [ ] `aws-access-key-id` (AWS Credentials)
  - [ ] `aws-secret-access-key` (AWS Credentials)
  - [ ] `aws-region` (Secret text - e.g., us-east-1)

**Reference:** [AWS_DOCKER_SETUP.md](./AWS_DOCKER_SETUP.md)

### Git Credentials (Optional)

- [ ] Generate GitHub/GitLab personal access token
- [ ] Add to Jenkins:
  - [ ] `git-credentials` (Username/password)

## ✓ Phase 5: Pipeline Job Setup (10-15 minutes)

- [ ] Create new Pipeline job in Jenkins
- [ ] Configure Git repository URL
- [ ] Set script path to `Jenkinsfile`
- [ ] Configure GitHub webhook (if using GitHub)
- [ ] Set build triggers
- [ ] Run first test build

**Jenkins Job Configuration:**
```
Name: resume-screening-devops
Type: Pipeline
Repository: [Your Git URL]
Script path: Jenkinsfile
Triggers: GitHub hook, Poll SCM
```

## ✓ Phase 6: Test Pipeline Execution (15-20 minutes)

### Development Branch Test
- [ ] Push test code to `develop` branch
- [ ] Verify Jenkins triggers automatically
- [ ] Check pipeline stages:
  - [ ] Checkout
  - [ ] Backend Tests
  - [ ] Frontend Tests
  - [ ] Build Docker Images
  - [ ] Deploy (docker-compose)
- [ ] Verify application runs at http://localhost:3000

### Production Branch Test
- [ ] Push to `main` branch (after code review)
- [ ] Verify Jenkins triggers
- [ ] Verify credentials are used
- [ ] Review terraform plan
- [ ] **Approve** terraform apply (manual step)
- [ ] Verify infrastructure deployment to AWS

## ✓ Phase 7: Infrastructure Provisioning (15-30 minutes)

- [ ] Review Terraform variables
- [ ] Configure `terraform/terraform.tfvars`
- [ ] Run terraform init locally (optional):
  ```bash
  cd terraform
  terraform init
  terraform plan
  terraform apply
  ```
- [ ] Verify AWS resources created:
  - [ ] VPC created
  - [ ] Subnets created
  - [ ] Security groups created
  - [ ] EC2 instances running (if auto-apply)
  - [ ] RDS database created (if auto-apply)
- [ ] Record output values

**Note:** Jenkins will handle terraform apply on main branch push

## ✓ Phase 8: Verification & Monitoring (10-15 minutes)

### Local Verification
- [ ] Backend API responds at http://localhost:5000/health
- [ ] Frontend loads at http://localhost:3000
- [ ] Database connection working
- [ ] Docker images built correctly

**Commands:**
```bash
# Test backend
curl http://localhost:5000/health

# Test frontend
curl http://localhost:3000

# View logs
docker logs resuscreen-backend
docker logs resuscreen-frontend
docker logs resuscreen-db

# Test database
docker exec resuscreen-db psql -U postgres -d resume_screening_db -c "SELECT version();"
```

### Jenkins Verification
- [ ] All stages complete successfully
- [ ] Test reports available
- [ ] Build artifacts stored
- [ ] Logs accessible
- [ ] Blue Ocean dashboard shows green builds

### Production Verification (if deployed)
- [ ] AWS resources visible in console
- [ ] Application accessible via load balancer
- [ ] Database accessible from app servers
- [ ] CloudWatch monitoring active
- [ ] Backup configured

## ✓ Phase 9: Monitoring & Logging (Optional but Recommended)

- [ ] Configure CloudWatch monitoring (AWS)
- [ ] Set up email notifications (Jenkins)
- [ ] Set up Slack integration (optional)
- [ ] Enable Jenkins log rotation
- [ ] Configure RDS backup retention
- [ ] Test alert notifications

## ✓ Phase 10: Documentation & Handover

- [ ] Update project README with setup details
- [ ] Document custom configurations
- [ ] Create runbook for common tasks
- [ ] Document backup/recovery procedures
- [ ] Share credentials with team (securely)
- [ ] Schedule team training session

## Common Commands Reference

### Quick Start
```bash
# Start all services
.\setup-devops.ps1 -Command start

# Check status
.\setup-devops.ps1 -Command status

# View logs
.\setup-devops.ps1 -Command logs

# Stop services
.\setup-devops.ps1 -Command stop
```

### Docker Operations
```bash
# Build images
docker-compose -f docker/docker-compose.yml build

# Start application
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop application
docker-compose -f docker/docker-compose.yml down
```

### Jenkins Operations
```bash
# Access Jenkins
http://localhost:8082

# View console output
Click on build → Console Output

# Restart Jenkins
docker exec jenkins-server systemctl restart jenkins

# Check Jenkins logs
docker logs jenkins-server
```

### Terraform Operations
```bash
cd terraform

# Initialize
terraform init

# Plan changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# Destroy resources
terraform destroy

# View current state
terraform show
```

## Troubleshooting Quick Fixes

| Issue | Fix |
|-------|-----|
| Docker daemon not running | Start Docker Desktop |
| Port already in use | Change port in docker-compose |
| Permission denied | Run with `sudo` or check user groups |
| Jenkins not accessible | Wait 30 seconds and refresh browser |
| Tests fail in pipeline | Check logs in Jenkins console output |
| Terraform apply fails | Verify AWS credentials and permissions |
| Docker images can't push | Check registry credentials in Jenkins |

## Additional Resources

- [CI_CD_DEVOPS_GUIDE.md](./CI_CD_DEVOPS_GUIDE.md) - Full DevOps guide
- [JENKINS_SETUP.md](./JENKINS_SETUP.md) - Jenkins detailed setup
- [AWS_DOCKER_SETUP.md](./AWS_DOCKER_SETUP.md) - AWS & Docker registry
- [Jenkinsfile](./Jenkinsfile) - Pipeline definition
- [Terraform Docs](https://www.terraform.io/docs)
- [Docker Docs](https://docs.docker.com)

## Estimated Total Time

- **First-time setup**: 2-3 hours
- **Subsequent deployments**: 10-15 minutes
- **Infrastructure changes**: 15-30 minutes

---

**Last Updated**: May 24, 2026

Once you've completed this checklist, your DevOps pipeline is ready for production use!

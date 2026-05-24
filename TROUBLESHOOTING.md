# DevOps Troubleshooting Guide

Comprehensive troubleshooting solutions for common issues in the CI/CD/DevOps setup.

## Table of Contents

1. [Docker Issues](#docker-issues)
2. [Jenkins Issues](#jenkins-issues)
3. [Pipeline Issues](#pipeline-issues)
4. [Terraform Issues](#terraform-issues)
5. [Network & Connectivity](#network--connectivity)
6. [Performance Issues](#performance-issues)
7. [Database Issues](#database-issues)
8. [Security Issues](#security-issues)

## Docker Issues

### Docker Daemon Not Running

**Error:** `Cannot connect to Docker daemon`

**Solution:**
```bash
# Windows: Start Docker Desktop
# Mac: Open Docker.app from Applications
# Linux:
sudo systemctl start docker

# Verify
docker ps
```

### Docker Socket Permission Denied

**Error:** `Permission denied while trying to connect to the Docker daemon socket`

**Solution:**
```bash
# Linux only
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker ps
```

### Port Already in Use

**Error:** `Bind for 0.0.0.0:8082 failed: port is already allocated`

**Solution:**

Option 1: Kill existing container
```bash
docker ps
docker stop <container_id>
```

Option 2: Use different port in docker-compose
```bash
# Edit docker-compose file
# Change "8082:8080" to "8089:8080"
```

Option 3: Find and stop process using port
```bash
# Windows
netstat -ano | findstr :8082
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8082
kill -9 <PID>
```

### Docker Image Build Fails

**Error:** `failed to solve with frontend dockerfile.v0`

**Solution:**
```bash
# Clear Docker build cache
docker system prune -a

# Rebuild
docker-compose -f docker/docker-compose.yml build --no-cache
```

### Docker Compose File Not Found

**Error:** `file not found: docker-compose.yml`

**Solution:**
```bash
# Navigate to correct directory
cd DevOpsProject

# Verify file exists
ls -la docker-compose.yml

# Specify full path
docker-compose -f ./docker/docker-compose.yml up -d
```

## Jenkins Issues

### Jenkins Not Starting

**Error:** `Container exits with error code`

**Solution:**
```bash
# Check logs
docker logs jenkins-server

# Increase memory
docker-compose -f docker/docker-compose.jenkins.yml down
# Edit docker-compose.jenkins.yml and increase Xmx value
docker-compose -f docker/docker-compose.jenkins.yml up -d
```

### Jenkins UI Not Accessible

**Error:** `Connection refused at http://localhost:8082`

**Solution:**
```bash
# Wait for Jenkins to start (can take 1-2 minutes)
sleep 60
curl http://localhost:8082

# Check if container is running
docker ps | grep jenkins

# Check logs
docker logs jenkins-server

# Restart container
docker restart jenkins-server
```

### Initial Admin Password Not Found

**Error:** `Cannot retrieve Jenkins initial admin password`

**Solution:**
```powershell
# Windows PowerShell
.\setup-devops.ps1 -Command password

# Linux/Mac
./setup-devops.sh password

# Manual check
docker logs jenkins-server | grep -i "initial setup"

# Alternative: Check Jenkins config
docker exec jenkins-server cat /var/jenkins_home/secrets/initialAdminPassword
```

### Plugins Fail to Install

**Error:** `Failed to download plugin`

**Solution:**
```bash
# Wait for Jenkins to fully initialize
sleep 120

# Try again
docker exec jenkins-server jenkins-plugin-cli --plugins pipeline docker-commons

# Or install via Jenkins UI:
# Manage Jenkins → Plugin Manager → Available → Search and install

# If still failing, restart
docker restart jenkins-server
```

### Jenkins Out of Memory

**Error:** `java.lang.OutOfMemoryError`

**Solution:**
```bash
# Stop services
docker-compose -f docker/docker-compose.jenkins.yml down

# Edit docker-compose.jenkins.yml
# Increase JAVA_OPTS value:
# - JAVA_OPTS=-Xmx4g -Xms1g  (increase Xmx)

# Restart
docker-compose -f docker/docker-compose.jenkins.yml up -d
```

### Cannot Access Jenkins behind Nginx

**Error:** `403 Forbidden` or `Bad Request`

**Solution:**
```bash
# Check Nginx config
docker exec devops-nginx cat /etc/nginx/nginx.conf

# Verify proxy headers are set correctly:
# proxy_set_header X-Forwarded-For
# proxy_set_header X-Forwarded-Proto

# Check logs
docker logs devops-nginx
docker logs jenkins-server
```

## Pipeline Issues

### Pipeline Job Not Triggering

**Error:** `Build not starting on push`

**Solution:**

1. **Check GitHub webhook:**
   - Go to GitHub Repo Settings → Webhooks
   - Verify URL: `http://jenkins-url:8082/github-webhook/`
   - Check delivery logs for errors

2. **Check Jenkins poll configuration:**
   ```
   Manage Jenkins → Configure System → GitHub
   Set API URL and add credentials
   ```

3. **Enable polling as fallback:**
   ```
   Job Configuration → Build Triggers
   Check: Poll SCM
   Set schedule: H/5 * * * * (every 5 minutes)
   ```

4. **Test webhook manually:**
   ```bash
   curl -X POST http://localhost:8082/github-webhook/ \
     -H "Content-Type: application/json" \
     -d '{"action":"opened"}'
   ```

### Git Clone Fails in Pipeline

**Error:** `fatal: unable to access repository`

**Solution:**

1. **Check credentials:**
   ```
   Job → Configure → Pipeline → Git section
   Verify Repository URL format
   Check credentials are set
   ```

2. **Fix SSH URL format:**
   ```
   Wrong: git@github.com:user/repo.git
   Right: https://github.com/user/repo.git
   ```

3. **Test SSH key (if using SSH):**
   ```bash
   docker exec jenkins-server ssh-keyscan github.com >> ~/.ssh/known_hosts
   ```

4. **Add personal access token:**
   ```
   GitHub Settings → Developer settings → Personal access tokens
   Generate token with repo access
   Add to Jenkins Credentials
   ```

### Tests Fail in Pipeline

**Error:** `npm test` or test script fails

**Solution:**

1. **Check environment variables:**
   ```groovy
   echo env
   printenv
   ```

2. **Install dependencies:**
   ```bash
   docker exec resuscreen-backend npm install
   ```

3. **Run tests locally:**
   ```bash
   cd backend
   npm install
   npm test
   ```

4. **Check test configuration:**
   - Verify `package.json` has test script
   - Check test framework installed
   - Review test output logs

5. **Skip tests if not available:**
   ```groovy
   sh 'npm test || echo "No tests found"'
   ```

### Docker Build Fails

**Error:** `docker build exited with code 1`

**Solution:**

1. **Check Dockerfile:**
   ```bash
   docker build -f docker/Dockerfile.backend -t test:1 ./backend
   ```

2. **Review error message:**
   - Look for missing dependencies
   - Check file paths
   - Verify base image availability

3. **Build with no cache:**
   ```bash
   docker build --no-cache -f docker/Dockerfile.backend -t test:1 ./backend
   ```

4. **Pull latest base images:**
   ```bash
   docker pull node:18-alpine
   docker pull nginx:alpine
   ```

### Pipeline Timeout

**Error:** `Build timed out after X minutes`

**Solution:**

1. **Increase timeout in Jenkinsfile:**
   ```groovy
   options {
       timeout(time: 1, unit: 'HOURS')
   }
   ```

2. **Optimize stages:**
   - Cache npm dependencies
   - Run tests in parallel
   - Move heavy operations to post-build

3. **Use agents with more resources:**
   ```groovy
   agent {
       docker {
           image 'node:18-alpine'
           args '-v /cache:/cache'
       }
   }
   ```

## Terraform Issues

### Terraform Init Fails

**Error:** `Error: Terraform not installed` or `error initializing`

**Solution:**

1. **Install Terraform:**
   - Download from https://www.terraform.io/downloads
   - Add to PATH
   - Verify: `terraform version`

2. **Check working directory:**
   ```bash
   cd terraform
   pwd
   ls -la
   ```

3. **Clear terraform cache:**
   ```bash
   rm -rf .terraform
   rm .terraform.lock.hcl
   terraform init
   ```

### AWS Credentials Error

**Error:** `Error: error configuring Terraform AWS Provider`

**Solution:**

1. **Verify credentials:**
   ```bash
   aws configure
   aws sts get-caller-identity
   ```

2. **Set environment variables:**
   ```bash
   export AWS_ACCESS_KEY_ID=your_key
   export AWS_SECRET_ACCESS_KEY=your_secret
   export AWS_REGION=us-east-1
   ```

3. **Check IAM permissions:**
   ```bash
   aws iam get-user
   aws iam list-policies --scope Local
   ```

4. **In Jenkins, verify credentials:**
   - Manage Jenkins → Manage Credentials
   - Verify aws-access-key-id, aws-secret-access-key exist

### Terraform Plan/Apply Fails

**Error:** `Error: Error acquiring the state lock`

**Solution:**

1. **Fix state lock:**
   ```bash
   cd terraform
   terraform force-unlock <LOCK_ID>
   ```

2. **Check state file permissions:**
   ```bash
   ls -la terraform.tfstate
   chmod 600 terraform.tfstate
   ```

3. **Review error details:**
   ```bash
   terraform apply -refresh=true
   ```

4. **Validate configuration:**
   ```bash
   terraform validate
   ```

### Resource Already Exists

**Error:** `Error: resource already exists`

**Solution:**

1. **Check AWS console:**
   - Verify if resource already exists
   - Delete manually or import to state

2. **Import existing resource:**
   ```bash
   terraform import aws_instance.example i-0123456789
   ```

3. **Refresh state:**
   ```bash
   terraform refresh
   terraform plan
   ```

## Network & Connectivity

### Cannot Connect to Services

**Error:** `Connection refused` or `No route to host`

**Solution:**

1. **Check service status:**
   ```bash
   docker ps
   docker-compose -f docker/docker-compose.yml ps
   ```

2. **Check network:**
   ```bash
   docker network ls
   docker network inspect devops-network
   ```

3. **Check firewall:**
   ```bash
   # Linux
   sudo ufw status
   sudo ufw allow 8080/tcp
   
   # Windows
   # Settings → Windows Defender Firewall → Allow app through firewall
   ```

4. **Test connectivity:**
   ```bash
   curl http://localhost:8082
   curl http://jenkins:8080  (from docker)
   telnet localhost 8082
   ```

### DNS Resolution Fails

**Error:** `Name resolution failed` or `getaddrinfo failed`

**Solution:**

```bash
# Check Docker network DNS
docker exec jenkins-server cat /etc/resolv.conf

# Restart service
docker-compose -f docker/docker-compose.jenkins.yml restart

# Check Docker daemon
docker info | grep DNS
```

### Certificate Validation Fails

**Error:** `certificate verify failed` or `SSL: CERTIFICATE_VERIFY_FAILED`

**Solution:**

1. **For self-signed certs:**
   ```bash
   export NODE_TLS_REJECT_UNAUTHORIZED=0  # Dev only!
   ```

2. **Install proper certificates:**
   - Use Let's Encrypt
   - Update nginx-devops.conf with proper cert paths

3. **Skip verification in Jenkins (dev only):**
   ```groovy
   sh 'curl -k https://example.com'  // -k ignores cert errors
   ```

## Performance Issues

### Slow Pipeline Execution

**Solution:**

1. **Run stages in parallel:**
   ```groovy
   parallel {
       stage('Backend Tests') { ... }
       stage('Frontend Tests') { ... }
   }
   ```

2. **Cache dependencies:**
   ```bash
   docker run -v jenkins_home:/var/jenkins_home ...
   ```

3. **Optimize Dockerfiles:**
   - Order commands from least to most frequently changed
   - Use .dockerignore
   - Multi-stage builds

4. **Use faster base images:**
   - Alpine images are smaller
   - Use slim variants

### High CPU/Memory Usage

**Solution:**

1. **Limit resources:**
   ```yaml
   services:
     jenkins:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 2G
   ```

2. **Monitor usage:**
   ```bash
   docker stats
   ```

3. **Prune unused resources:**
   ```bash
   docker system prune -a
   docker volume prune
   ```

## Database Issues

### Database Connection Failed

**Error:** `Connection refused` to PostgreSQL

**Solution:**

```bash
# Check database status
docker ps | grep postgres

# Check logs
docker logs resuscreen-db

# Test connection
docker exec resuscreen-db psql -U postgres -c "SELECT version();"

# Verify credentials
docker-compose -f docker/docker-compose.yml logs db
```

### Database Port Conflict

**Error:** `Bind for 0.0.0.0:5432 failed`

**Solution:**

```bash
# Use different port
# Edit docker-compose.yml:
# ports:
#   - "5433:5432"  # Use 5433 instead

# Or kill existing postgres
lsof -i :5432
kill -9 <PID>
```

## Security Issues

### Secrets Leaked

**Error:** Found credentials in git history

**Solution:**

1. **Rotate credentials immediately:**
   - Change all passwords
   - Regenerate tokens
   - Update in Jenkins

2. **Remove from history:**
   ```bash
   git filter-branch --tree-filter 'rm -f <file>' HEAD
   git push --force-with-lease
   ```

3. **Use .gitignore:**
   ```
   *.env
   .env.*
   terraform.tfvars
   terraform.tfvars.json
   ```

### Unauthorized Access

**Error:** `401 Unauthorized` or `403 Forbidden`

**Solution:**

1. **Check credentials:**
   - Verify API tokens not expired
   - Check permissions
   - Regenerate if needed

2. **Check CORS headers:**
   ```bash
   curl -i http://localhost:3000
   ```

3. **Review logs:**
   ```bash
   docker logs resuscreen-backend
   docker logs devops-nginx
   ```

---

## Getting Help

1. **Check logs first:**
   ```bash
   docker logs <container_name>
   docker-compose logs -f
   ```

2. **Review documentation:**
   - [CI_CD_DEVOPS_GUIDE.md](./CI_CD_DEVOPS_GUIDE.md)
   - [JENKINS_SETUP.md](./JENKINS_SETUP.md)
   - [AWS_DOCKER_SETUP.md](./AWS_DOCKER_SETUP.md)

3. **Search online:**
   - Docker: https://docs.docker.com
   - Jenkins: https://jenkins.io/doc
   - Terraform: https://www.terraform.io/docs

4. **Ask for help:**
   - Create GitHub issue
   - Contact DevOps team

---

**Last Updated**: May 24, 2026

If you encounter issues not covered here, check the service logs and the main documentation files.

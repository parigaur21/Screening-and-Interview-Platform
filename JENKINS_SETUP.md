# Jenkins CI/CD Setup Guide

This guide walks through setting up Jenkins for the Resume Screening DevOps Project.

## Prerequisites

- Docker installed on your system
- At least 2GB RAM and 10GB disk space for Jenkins
- Access to the project repository (GitHub, GitLab, Bitbucket, etc.)
- AWS Account (for Terraform deployments)
- Docker Registry account (Docker Hub, ECR, or self-hosted)

## 1. Jenkins Installation via Docker

### Run Jenkins Container

```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /usr/bin/docker:/usr/bin/docker \
  jenkins/jenkins:lts
```

### Get Initial Admin Password

```bash
docker logs jenkins | grep -A 5 "Jenkins initial setup is required"
```

### Access Jenkins

- If you started Jenkins using the `docker run` command above, navigate to: `http://localhost:8080`
- If you started the DevOps compose stack from `docker/docker-compose.jenkins.yml`, use: `http://localhost:8082`

Paste the admin password and follow the installation wizard.

## 2. Install Required Jenkins Plugins

After initial setup, go to **Manage Jenkins → Plugin Manager** and install:

1. **Pipeline** - For declarative pipelines
2. **Docker Pipeline** - For Docker integration
3. **GitHub Integration** (or GitLab/Bitbucket as needed)
4. **Credentials Binding** - For managing secrets
5. **AWS Credentials** - For AWS authentication
6. **Blue Ocean** - For better pipeline visualization
7. **SonarQube Scanner** - For code quality analysis (optional)
8. **JUnit** - For test reporting

To install via CLI:
```bash
docker exec jenkins jenkins-plugin-cli --plugins \
  pipeline \
  docker-commons \
  github \
  credentials-binding \
  aws-credentials \
  blueocean \
  junit
```

## 3. Configure Jenkins Credentials

### 3.1 Docker Registry Credentials

1. Go to **Manage Jenkins → Manage Credentials → System → Global credentials**
2. Click **Add Credentials**
3. Choose **Username with password**
4. Fill in:
   - Username: Your Docker Hub username
   - Password: Your Docker Hub password/token
   - ID: `docker-registry-username`
   - Description: Docker Registry Username

5. Repeat for:
   - ID: `docker-registry-password` (for password)
   - ID: `docker-registry-url` (Secret text with your registry URL, e.g., `docker.io/yourname`)

### 3.2 AWS Credentials

1. Go to **Manage Jenkins → Manage Credentials**
2. Click **Add Credentials** (choose **AWS Credentials**)
3. Fill in:
   - Access Key ID: Your AWS access key
   - Secret Access Key: Your AWS secret key
   - ID: `aws-access-key-id`

4. Add another for region:
   - Choose **Secret text**
   - Secret: Your AWS region (e.g., `us-east-1`)
   - ID: `aws-region`

### 3.3 GitHub/GitLab Token (Optional - for webhooks)

1. Generate a personal access token in your Git provider
2. Go to **Manage Jenkins → Manage Credentials**
3. Click **Add Credentials** (choose **Username with password**)
4. Fill in:
   - Username: `git` (or your username)
   - Password: Your personal access token
   - ID: `git-credentials`

## 4. Create a Jenkins Pipeline Job

1. Go to Jenkins dashboard
2. Click **New Item**
3. Enter job name: `resume-screening-devops`
4. Select **Pipeline**
5. Click **OK**

### Configure Pipeline

In the job configuration:

1. **General Tab:**
   - Check: "Build whenever a push event is posted"

2. **Pipeline Tab:**
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: Your project repository URL
   - Branch: `*/main` (or your default branch)
   - Script Path: `Jenkinsfile`

3. **Build Triggers Tab:**
   - Check: "GitHub hook trigger for GITScm polling"

4. Click **Save**

## 5. GitHub Webhook Setup (Optional)

To trigger builds automatically on push:

1. Go to your GitHub repository → Settings → Webhooks
2. Click **Add webhook**
3. Payload URL: `http://your-jenkins-url:8082/github-webhook/` (or your own Jenkins URL)
4. Content type: `application/json`
5. Select: **Just the push event**
6. Click **Add webhook**

## 6. Environment Variables for Jenkinsfile

Make sure these credentials are available in Jenkins:

| Credential ID | Type | Value |
|---|---|---|
| `docker-registry-url` | Secret text | Your Docker registry URL |
| `docker-registry-username` | Username/password | Docker login credentials |
| `docker-registry-password` | Username/password | Docker login credentials |
| `aws-access-key-id` | AWS Credentials | Your AWS access key |
| `aws-secret-access-key` | AWS Credentials | Your AWS secret key |
| `aws-region` | Secret text | e.g., `us-east-1` |

## 7. Jenkins Agent Configuration

For distributed builds, configure Jenkins agents:

1. Go to **Manage Jenkins → Manage Nodes and Clouds**
2. Click **New Node**
3. Configure your agent with:
   - Labels: `docker` (so pipeline uses agent with Docker)
   - Remote root directory: `/var/jenkins`

## 8. Verify Setup

1. Navigate to Jenkins job
2. Click **Build Now**
3. Check **Console Output** for:
   - Successful checkout from Git
   - Dependency installation
   - Test execution
   - Docker image builds
   - Pipeline completion

## Troubleshooting

### Docker not accessible from Jenkins
```bash
docker exec jenkins usermod -aG docker jenkins
```

### Terraform not installed
```bash
docker exec jenkins apt-get update && apt-get install -y terraform
```

### Permission denied errors
```bash
docker exec jenkins chown -R jenkins:jenkins /var/jenkins_home
```

## Next Steps

1. Configure code quality checks (SonarQube)
2. Set up deployment notifications (Slack, email)
3. Implement automated database migrations
4. Configure log aggregation (ELK Stack)
5. Set up monitoring and alerting

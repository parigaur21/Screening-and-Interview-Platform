# AWS & Docker Registry Setup

This guide covers setting up AWS credentials and Docker registry for your CI/CD pipeline.

## 1. Docker Registry Setup

### Option A: Docker Hub

#### Prerequisites
- Docker Hub account at https://hub.docker.com
- Account must have a repository created

#### Create Personal Access Token

1. Log into Docker Hub
2. Go to **Account Settings → Security → Personal access tokens**
3. Click **Generate New Token**
4. Name: `jenkins-token` or similar
5. Permissions: **Read & Write**
6. Copy the token

#### Add to Jenkins

In Jenkins, create these credentials:

**Credential 1:**
- Type: Username with password
- Username: `docker-registry-username`
- Password: Your Docker Hub username
- ID: `docker-registry-username`

**Credential 2:**
- Type: Secret text
- Secret: Your personal access token
- ID: `docker-registry-password`

**Credential 3:**
- Type: Secret text
- Secret: `docker.io/yourusername` (your Docker registry URL)
- ID: `docker-registry-url`

### Option B: AWS ECR (Elastic Container Registry)

#### Prerequisites
- AWS Account
- AWS CLI installed: `pip install awscli`
- IAM user with ECR permissions

#### Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name resuscreen-backend \
  --region us-east-1

aws ecr create-repository \
  --repository-name resuscreen-frontend \
  --region us-east-1
```

#### Get Registry URL

```bash
aws ecr describe-repositories \
  --repository-names resuscreen-backend \
  --region us-east-1 \
  --query 'repositories[0].repositoryUri' \
  --output text
```

Output will be: `123456789.dkr.ecr.us-east-1.amazonaws.com/resuscreen-backend`

#### Login to ECR

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
```

#### Add to Jenkins

**Credential 1:**
- Type: AWS Credentials
- Access Key ID: Your AWS access key
- Secret Access Key: Your AWS secret key
- ID: `aws-credentials`

**Credential 2:**
- Type: Secret text
- Secret: Your ECR registry URL
- ID: `docker-registry-url`

## 2. AWS Configuration for Terraform

### Create IAM User for Terraform

```bash
# Create user
aws iam create-user --user-name terraform-ci

# Create access key
aws iam create-access-key --user-name terraform-ci

# Create inline policy
aws iam put-user-policy --user-name terraform-ci \
  --policy-name terraform-policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "ec2:*",
          "rds:*",
          "vpc:*",
          "iam:*",
          "s3:*",
          "logs:*"
        ],
        "Resource": "*"
      }
    ]
  }'
```

### Add AWS Credentials to Jenkins

1. Go to **Manage Jenkins → Manage Credentials**
2. Click **Add Credentials**
3. Kind: **AWS Credentials**
4. Fill in:
   - Access Key ID: From `aws iam create-access-key` output
   - Secret Access Key: From above
   - ID: `aws-access-key-id`
   - Description: AWS Credentials for Terraform

5. Add another credential for region:
   - Kind: **Secret text**
   - Secret: `us-east-1` (or your region)
   - ID: `aws-region`
   - Description: AWS Region

## 3. Local Docker Registry (Optional)

For private registry without external dependencies:

```bash
# Run local registry
docker run -d \
  --name registry \
  -p 5001:5000 \
  -v registry-data:/var/lib/registry \
  registry:2

# Allow insecure registry (add to Docker daemon.json)
# For Windows (Docker Desktop):
# Settings → Docker Engine → Add:
# "insecure-registries": ["localhost:5001"]

# For Linux:
# Edit /etc/docker/daemon.json and restart Docker

# Test
docker tag resuscreen-backend:latest localhost:5001/resuscreen-backend:latest
docker push localhost:5001/resuscreen-backend:latest
```

## 4. Credentials for Jenkins Environment

Create these credentials in Jenkins for use in Jenkinsfile:

| Variable Name | Type | Jenkins ID |
|---|---|---|
| `REGISTRY` | Secret text | `docker-registry-url` |
| `REGISTRY_USERNAME` | Username with password | `docker-registry-username` |
| `REGISTRY_PASSWORD` | Username with password | `docker-registry-password` |
| `AWS_ACCESS_KEY_ID` | AWS Credentials | `aws-access-key-id` |
| `AWS_SECRET_ACCESS_KEY` | AWS Credentials | `aws-secret-access-key` |
| `AWS_REGION` | Secret text | `aws-region` |

## 5. Test Credentials

### Test Docker Registry
```bash
docker login -u yourusername -p yourtoken docker.io
docker pull docker.io/yourusername/resuscreen-backend:latest
```

### Test AWS Credentials
```bash
aws configure
# Enter credentials when prompted

aws ec2 describe-instances --region us-east-1
```

### Test in Jenkins
1. Create a test job with:
```groovy
pipeline {
    agent any
    stages {
        stage('Test Credentials') {
            steps {
                echo 'Docker login...'
                sh 'docker ps'
                echo 'AWS check...'
                sh 'aws sts get-caller-identity'
            }
        }
    }
}
```

## 6. Security Best Practices

1. **Never commit credentials** to version control
2. **Use IAM roles** in production instead of long-term access keys
3. **Rotate access keys** regularly
4. **Use separate credentials** for dev/staging/prod
5. **Limit IAM permissions** to minimum required
6. **Enable MFA** on AWS root account
7. **Encrypt sensitive data** in Jenkins secrets storage

## 7. Troubleshooting

### Docker login fails
```bash
# Check credentials
cat ~/.docker/config.json

# Re-authenticate
docker logout
docker login docker.io
```

### AWS credentials not found
```bash
# Check AWS credentials file
cat ~/.aws/credentials

# Set environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1
```

### ECR authentication fails
```bash
# Get fresh token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
```

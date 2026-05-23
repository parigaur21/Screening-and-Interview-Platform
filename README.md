# AI ResuScreen: Cloud-Based AI Resume Screening & Interview Platform

AI ResuScreen is a premium, enterprise-grade recruiter web application and cloud architecture suite. It utilizes dynamic matching algorithms and real-time LLM engines to automatically screen candidate resumes, estimate experience levels, and conduct an immersive mock technical interview.

This repository is designed as a **Production-Ready DevOps & Cloud Monorepo**, containing a React SPA frontend, an Express Node.js API backend, containerized Docker local environments, automated Terraform AWS configurations, and GitHub Actions CI/CD workflows.

---

## 🌟 System Architecture

```text
               +-------------------------------------------------------+
               |                    CLIENT BROWSER                     |
               +-------------------------------------------------------+
                     | (1) Resolve DNS          | (2) Get Web Assets
                     v                          v
             +---------------+          +----------------+
             |  Route 53 DNS |          |  CloudFront    |
             +---------------+          |  Global CDN    |
                                        +----------------+
                                                | Origin Pull
                                                v
                                        +----------------+
                                        |  AWS S3 Bucket |
                                        | (Static SPA)   |
                                        +----------------+
                     |
                     | (3) HTTPS /api/* via CloudFront
                     v
             +---------------+
             |  EC2 Instance |  <---- Reverse Proxy (Nginx :80)
             | (Express App) |  <---- Process Controller (PM2)
             +---------------+
                     |
                     | (4) Intranets Inbound Traffic (Private Subnet - Port 5432)
                     v
             +---------------+          +----------------------+
             |    AWS RDS    |          |   Google Gemini AI   | (Optional Live API Integration)
             | (PostgreSQL)  |          |   Heuristic Fallback | (Offline Auto-Evaluation)
             +---------------+          +----------------------+
```

---

## ⚡ Quick Start: Zero-Friction Local Sandbox

You can boot up the entire platform (React frontend, Node API backend, and PostgreSQL database) locally in **one command** using Docker Compose.

### Prerequisites
Make sure you have [Docker and Docker Compose](https://www.docker.com/) installed on your machine.

### Run with Docker Compose
Navigate to the `docker/` folder and run the multi-container configuration:
```bash
cd docker
docker-compose up --build
```

- **Frontend Application Workspace**: [http://localhost:3000](http://localhost:3000)
- **Backend API Diagnostic Page**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Local Sandbox Database**: PostgreSQL listening on `localhost:5432`

---

## 📂 Repository File Blueprint

```text
/
├── frontend/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/       # Premium Glassmorphism UI Components
│   │   │   ├── Dashboard.jsx         # Analytics, pipeline totals, job lists
│   │   │   ├── ResumeUploader.jsx    # Drag-and-drop ingestion, AI screening loader
│   │   │   ├── CandidateScreening.jsx# Recruiters tables database & Detail drawer panels
│   │   │   └── MockInterview.jsx     # Conversational arena, voice simulator, progress gauges
│   │   ├── styles/
│   │   │   └── theme.css     # Design tokens, gradients, animations (Vanilla CSS)
│   │   ├── App.jsx           # Main Navigation sidebar routing & Job drawers
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Node.js Express Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js         # Unified Database Switcher (SQLite local / PostgreSQL RDS production)
│   │   ├── controllers/      # REST API Controllers (Jobs, Candidates, Interviews)
│   │   ├── models/
│   │   │   └── schemas.js    # Data Table creation SQL blueprints
│   │   ├── services/
│   │   │   └── aiService.js  # Dual-Mode AI Ingestion Engine (Local heuristics / Gemini API)
│   │   └── server.js         # API Server entrance and path routing
│   ├── package.json
│   └── .env.example
├── docker/                   # Containerization
│   ├── Dockerfile.frontend   # Multi-stage compile -> Alpine Nginx serving
│   ├── Dockerfile.backend    # Lightweight running environment
│   └── docker-compose.yml    # Unified multi-service local sandbox (FE, BE, DB)
├── terraform/                # Infrastructure as Code (IaC)
│   ├── main.tf               # Provisions VPC, S3, CloudFront, EC2, RDS PostgreSQL
│   ├── variables.tf          # Parameter variables
│   ├── terraform.tfvars.example
│   └── outputs.tf            # Exposes endpoints coordinates on apply
├── .github/
│   └── workflows/            # Automation Pipelines
│       ├── frontend-deploy.yml  # Automated Vite builds -> sync S3 -> invalidate CloudFront
│       └── backend-deploy.yml   # Establish SSH EC2 tunnels -> git pull -> PM2 hot reloads
└── nginx.conf                # Reverse proxy config for EC2 hosting Nginx server
```

---

## 🎯 Alignment: The 12-Step Deployment Flow

This project directly maps to the exact cloud deployment checklist:

### 1. Push Code to GitHub
Repository is organized as a clean monorepo. Create a repository on GitHub, add this folder as the remote, and push to trigger deployment integrations:
```bash
git init
git add .
git commit -m "feat: complete platform code, docker, terraform & workflows"
git remote add origin YOUR_GITHUB_REPO_URL
git branch -M main
git push -u origin main
```

### 2. Build Frontend (React / Vite)
Managed in [.github/workflows/frontend-deploy.yml](file:///.github/workflows/frontend-deploy.yml#L27-L40). Automatically invokes Node.js inside runner instances, installs packages, and compiles distribution folders inside `frontend/dist`.

### 3. Upload Frontend Build Files to S3
Managed in [.github/workflows/frontend-deploy.yml](file:///.github/workflows/frontend-deploy.yml#L49-L52). Synchronizes compiled files directly to the S3 hosting bucket via:
`aws s3 sync frontend/dist/ s3://AWS_S3_BUCKET_NAME --delete`

### 4. Put CloudFront in Front of S3
Managed in [terraform/main.tf](terraform/main.tf). CloudFront serves the S3 SPA and proxies `/api/*` to EC2 Nginx. Invalidates CDN cache on pushes via:
`aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"`

### 5. Launch EC2 Instance for Backend
Managed in [terraform/main.tf](file:///terraform/main.tf#L255-L281). Provisions an `aws_instance` compute node inside a public VPC subnet and binds dedicated ports.

### 6. Install Runtime on EC2 (Node.js, Git, PM2, Nginx)
Managed in [terraform/main.tf](file:///terraform/main.tf#L255-L270) inside the `user_data` templates. Executes an automated Shell script upon boot:
- Installs Node.js v18.x and Git via packet managers.
- Installs **PM2** globally to monitor and run Node processes.
- Installs and enables **Nginx** as a background service.

### 7. Deploy Backend Code to EC2
Managed in [.github/workflows/backend-deploy.yml](file:///.github/workflows/backend-deploy.yml#L23-L41). Establish secure SSH tunnels on port 22 using AWS Private SSH key tokens, pulls repository updates directly on the EC2 VM, and reloads the API backend using:
`pm2 reload server || pm2 start src/server.js --name "server"`

### 8. Create RDS Database (PostgreSQL)
Managed in [terraform/main.tf](file:///terraform/main.tf#L283-L308). Configures an isolated `aws_db_instance` engines PostgreSQL v15.x inside private subnets, preventing public ingress.

### 9. Allow EC2 Security Group to Access RDS
Managed in [terraform/main.tf](file:///terraform/main.tf#L141-L168) under `aws_security_group.rds_sg`. Inbound database rules permit Port `5432` ingress **strictly** from the designated EC2 security group ID.

### 10. Add RDS Credentials in EC2 Environment Variables
Terraform `user_data` writes `/var/www/backend/backend/.env` with RDS host, user, password, and SSL flags on EC2 boot. If RDS keys are missing at runtime, the app falls back to SQLite locally.

### 11. Frontend Calls Backend API URL
[frontend/src/App.jsx](frontend/src/App.jsx) uses `http://localhost:5000/api` in dev. In AWS production it uses the relative path `/api`, which CloudFront routes to EC2 Nginx → Express on port 5000 ([nginx.conf](nginx.conf)). Optional override: set GitHub secret `VITE_API_URL` or build-time env.

### 12. Connect Domain Using Route 53 (Optional)
Set `domain_name` and `route53_zone_id` in `terraform.tfvars` to create an alias A record to CloudFront. Without a custom domain, use the `cloudfront_distribution_domain` output.

---

## Required inputs before deploying

| Input | Where to get it | Used for |
|-------|-----------------|----------|
| AWS Access Key ID / Secret | IAM user with programmatic access | `aws configure`, GitHub secrets |
| AWS Account ID (12 digits) | AWS Console | `terraform.tfvars` → `aws_account_id` |
| AWS Region | e.g. `us-east-1` | Terraform and workflows |
| EC2 key pair name + `.pem` file | EC2 → Key Pairs | `ec2_key_name`, SSH, `EC2_SSH_PRIVATE_KEY` secret |
| RDS password | You choose (strong) | `terraform.tfvars` → `db_password` |
| GitHub repo URL | Your repository | `git remote`, optional `github_repo_url` in tfvars |

### GitHub repository secrets (after `terraform apply`)

| Secret | Terraform output |
|--------|------------------|
| `AWS_ACCESS_KEY_ID` | IAM |
| `AWS_SECRET_ACCESS_KEY` | IAM |
| `AWS_S3_BUCKET_NAME` | `s3_bucket_name` |
| `AWS_CLOUDFRONT_DIST_ID` | `cloudfront_distribution_id` |
| `EC2_HOST_IP` | `ec2_backend_public_ip` (Elastic IP) |
| `EC2_SSH_PRIVATE_KEY` | Full contents of your `.pem` file |
| `VITE_API_URL` | Optional; default `/api` via CloudFront |

Copy [terraform/terraform.tfvars.example](terraform/terraform.tfvars.example) to `terraform/terraform.tfvars` and fill in your values (never commit `terraform.tfvars`).

---

## Step-by-step production AWS deployment

### Phase A: Terraform (steps 3–10, 4, 12 optional)

```bash
aws configure
cd terraform
cp terraform.tfvars.example terraform.tfvars   # edit with your values
terraform init
terraform plan
terraform apply
```

Save outputs: `cloudfront_distribution_domain`, `s3_bucket_name`, `cloudfront_distribution_id`, `ec2_backend_public_ip`, `rds_database_endpoint`.

EC2 boot (if `github_repo_url` is set in tfvars) automatically clones the repo, configures Nginx, writes `.env`, and starts PM2. Allow 5–10 minutes after apply for RDS and user-data to finish.

### Phase B: GitHub (step 1) and CI/CD secrets

```bash
git init
git add .
git commit -m "feat: AI ResuScreen DevOps monorepo"
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git branch -M main
git push -u origin main
```

Add GitHub secrets from the table above. Push changes under `frontend/` or `backend/` to trigger deploy workflows.

### Phase C: Frontend deploy (steps 2–4)

**GitHub Actions:** push to `main` with changes in `frontend/`.

**Manual:**

```bash
cd frontend
npm ci
npm run build
aws s3 sync dist/ s3://YOUR_BUCKET_NAME --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

Open `https://<cloudfront_distribution_domain>`.

### Phase D: Backend deploy (steps 5–7)

**GitHub Actions:** push to `main` with changes in `backend/`.

**Manual fallback (SSH):**

```bash
ssh -i /path/to/resuscreen-ssh-key.pem ec2-user@EC2_PUBLIC_IP
cd /var/www/backend && git pull
cd backend && npm install --only=production
pm2 reload server
```

### Phase E: Route 53 (step 12, optional)

In `terraform.tfvars`, set `domain_name` and `route53_zone_id`, then `terraform apply`. Point your registrar NS records to the Route 53 hosted zone if needed.

---

## Verification checklist

After deploy, confirm each step:

| Check | Command / action | Expected |
|-------|------------------|----------|
| RDS reachable from EC2 | `curl http://localhost/api/health` on EC2 | `"database":"AWS RDS PostgreSQL"` |
| API via CloudFront | `curl https://YOUR_CF_DOMAIN/api/health` | HTTP 200 JSON healthy |
| Frontend loads | Browser → CloudFront URL | React app UI |
| API from browser | DevTools Network → `/api/jobs` | Same CloudFront host, no `:5000` |
| S3 assets | AWS Console → S3 bucket | `index.html`, JS/CSS in `dist/` |
| GitHub frontend workflow | Actions tab | Build, S3 sync, invalidation succeed |
| GitHub backend workflow | Actions tab | SSH, git pull, PM2 reload succeed |

**Troubleshooting**

- EC2 setup still running: `sudo tail -f /var/log/user-data.log`
- PM2 status: `pm2 list` and `pm2 logs server`
- CloudFront stale assets: run invalidation or wait for TTL
- Destroy stack when done: `cd terraform && terraform destroy`

**Estimated cost:** ~$30–50/month if EC2, RDS, and CloudFront run 24/7.
#   S c r e e n i n g - a n d - I n t e r v i e w - P l a t f o r m  
 
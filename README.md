# AI ResuScreen

AI ResuScreen is a cloud-based AI-powered recruitment platform designed to simplify and automate the hiring process. The platform enables recruiters to upload resumes, screen candidates intelligently, and conduct mock technical interviews through an interactive web application.

This project demonstrates a complete full-stack deployment workflow using modern DevOps and cloud technologies including Docker, Jenkins, AWS EC2, PostgreSQL, and CI/CD pipelines.

## Features

* AI-powered resume screening
* Resume upload and candidate management
* Mock interview platform
* Interactive recruiter dashboard
* Full-stack containerized deployment
* CI/CD automation with Jenkins
* PostgreSQL database integration
* Cloud deployment on AWS

## Tech Stack

### Frontend

* React.js
* Vite
* CSS

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL

### DevOps & Cloud

* Docker
* Docker Compose
* Jenkins
* AWS EC2
* GitHub CI/CD

## Architecture

The application follows a containerized microservice-style architecture:

* Frontend served through Docker container
* Backend API running on Node.js
* PostgreSQL database container
* Jenkins pipeline for automated deployment
* Hosted on AWS EC2

## CI/CD Workflow

The Jenkins pipeline automates:

* GitHub repository integration
* Dependency installation
* Docker image building
* Container deployment
* Smoke testing

## Deployment

The platform is deployed on AWS EC2 using Docker containers and Jenkins automation. The deployment pipeline enables automatic updates whenever new code is pushed to GitHub.

## Future Enhancements

* JWT Authentication
* AI interview evaluation system
* Resume storage using AWS S3
* HTTPS and custom domain support
* Kubernetes deployment
* Monitoring and logging integration

## Author

Pari Gaur

GitHub: [https://github.com/parigaur21](https://github.com/parigaur21)

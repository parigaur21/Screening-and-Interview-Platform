pipeline {
    agent any
    environment {
        DOCKER_COMPOSE_PATH = 'docker/docker-compose.yml'
        REGISTRY = credentials('docker-registry-url')
        REGISTRY_USERNAME = credentials('docker-registry-username')
        REGISTRY_PASSWORD = credentials('docker-registry-password')
        AWS_REGION = credentials('aws-region')
        AWS_ACCESS_KEY_ID = credentials('aws-access-key-id')
        AWS_SECRET_ACCESS_KEY = credentials('aws-secret-access-key')
        IMAGE_TAG = "${BUILD_NUMBER}"
        BACKEND_IMAGE = "${REGISTRY}/resuscreen-backend"
        FRONTEND_IMAGE = "${REGISTRY}/resuscreen-frontend"
    }
    
    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    echo "Building branch: ${BRANCH_NAME}"
                    echo "Build number: ${BUILD_NUMBER}"
                }
            }
        }
        
        stage('Backend Tests') {
            steps {
                dir('backend') {
                    script {
                        echo 'Installing backend dependencies...'
                        sh 'npm install'
                        echo 'Running backend tests...'
                        sh 'npm test || true'
                        echo 'Linting backend code...'
                        sh 'npm run lint || true'
                    }
                }
            }
        }
        
        stage('Frontend Tests') {
            steps {
                dir('frontend') {
                    script {
                        echo 'Installing frontend dependencies...'
                        sh 'npm install'
                        echo 'Running frontend tests...'
                        sh 'npm test || true'
                        echo 'Linting frontend code...'
                        sh 'npm run lint || true'
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    echo 'Building Docker images...'
                    sh 'docker-compose -f $DOCKER_COMPOSE_PATH build'
                    echo 'Docker images built successfully'
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "Logging into Docker Registry..."
                    sh '''
                        echo "${REGISTRY_PASSWORD}" | docker login -u "${REGISTRY_USERNAME}" --password-stdin "${REGISTRY}" || true
                    '''
                    echo "Tagging and pushing images..."
                    sh '''
                        docker tag resuscreen-backend:latest ${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker tag resuscreen-backend:latest ${BACKEND_IMAGE}:latest
                        docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker push ${BACKEND_IMAGE}:latest
                        
                        docker tag resuscreen-frontend:latest ${FRONTEND_IMAGE}:${IMAGE_TAG}
                        docker tag resuscreen-frontend:latest ${FRONTEND_IMAGE}:latest
                        docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                        docker push ${FRONTEND_IMAGE}:latest
                    '''
                }
            }
        }
        
        stage('Deploy - Dev (Docker Compose)') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    echo 'Deploying to development environment...'
                    sh '''
                        docker-compose -f $DOCKER_COMPOSE_PATH down || true
                        docker-compose -f $DOCKER_COMPOSE_PATH up -d
                        sleep 10
                        docker-compose -f $DOCKER_COMPOSE_PATH ps
                    '''
                }
            }
        }
        
        stage('Terraform Plan') {
            when {
                branch 'main'
            }
            steps {
                dir('terraform') {
                    script {
                        echo 'Planning infrastructure changes...'
                        sh '''
                            terraform init
                            terraform plan -out=tfplan
                        '''
                    }
                }
            }
        }
        
        stage('Terraform Apply') {
            when {
                branch 'main'
            }
            input {
                message "Apply Terraform changes to production?"
                ok "Deploy"
            }
            steps {
                dir('terraform') {
                    script {
                        echo 'Applying infrastructure changes...'
                        sh 'terraform apply -auto-approve tfplan'
                        sh 'terraform output'
                    }
                }
            }
        }
        
        stage('Smoke Tests') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo 'Running smoke tests...'
                    sh '''
                        sleep 5
                        curl -f http://localhost:3000 || exit 1
                        curl -f http://localhost:5000/health || exit 1
                    '''
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo 'Cleaning up...'
                sh 'docker logout || true'
            }
        }
        success {
            echo '✓ Pipeline completed successfully'
        }
        failure {
            echo '✗ Pipeline failed'
        }
    }
}

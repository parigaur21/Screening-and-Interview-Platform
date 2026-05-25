pipeline {
agent any

```
environment {
    DOCKER_COMPOSE_PATH = 'docker/docker-compose.yml'
    AWS_REGION = 'eu-north-1'
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

    stage('Backend Setup') {
        steps {
            dir('backend') {
                script {
                    echo 'Installing backend dependencies...'
                    sh 'npm install'
                }
            }
        }
    }

    stage('Frontend Setup') {
        steps {
            dir('frontend') {
                script {
                    echo 'Installing frontend dependencies...'
                    sh 'npm install'
                }
            }
        }
    }

    stage('Build Docker Images') {
        steps {
            script {
                echo 'Building Docker images...'

                sh '''
                    docker-compose -f docker/docker-compose.yml down || true
                    docker-compose -f docker/docker-compose.yml build
                '''

                echo 'Docker images built successfully'
            }
        }
    }

    stage('Deploy Application') {
        steps {
            script {
                echo 'Deploying application...'

                sh '''
                    docker-compose -f docker/docker-compose.yml up -d
                '''

                echo 'Deployment completed'
            }
        }
    }

    stage('Smoke Tests') {
        steps {
            script {
                echo 'Running smoke tests...'

                sh '''
                    sleep 10
                    curl -f http://localhost:3000 || exit 1
                    curl -f http://localhost:5000 || exit 1
                '''

                echo 'Smoke tests passed'
            }
        }
    }
}

post {
    success {
        echo '✓ Pipeline completed successfully'
    }

    failure {
        echo '✗ Pipeline failed'
    }

    always {
        echo 'Pipeline execution finished'
    }
}
```

}

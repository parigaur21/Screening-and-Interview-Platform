pipeline {
agent any

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
                sh 'npm install'
            }
        }
    }

    stage('Frontend Setup') {
        steps {
            dir('frontend') {
                sh 'npm install'
            }
        }
    }

    stage('Build Docker Images') {
        steps {
            sh '''
                docker-compose -f docker/docker-compose.yml down || true
                docker-compose -f docker/docker-compose.yml build
            '''
        }
    }

    stage('Deploy Application') {
        steps {
            sh '''
                docker-compose -f docker/docker-compose.yml up -d
            '''
        }
    }

    stage('Smoke Tests') {
        steps {
            sh '''
                sleep 10
                curl -f http://localhost:3000
                curl -f http://localhost:5000
            '''
        }
    }
}

post {
    success {
        echo 'Pipeline completed successfully'
    }

    failure {
        echo 'Pipeline failed'
    }

    always {
        echo 'Pipeline execution finished'
    }
}


}

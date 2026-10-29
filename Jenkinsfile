
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Building Notification Management System v2'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build --build-arg APP_VERSION=v2 -t thiru247/notification-system:v2 .'
            }
        }
    }
}

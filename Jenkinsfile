
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out Notification Management System'
                checkout scm
            }
        }

        stage('Verify Project') {
            steps {
                powershell 'Get-ChildItem'
                powershell 'Write-Output "Notification Management System checkout successful."'
            }
        }
    }

    post {
        success {
            echo 'GitHub checkout and project verification completed!'
        }
        failure {
            echo 'Pipeline failed. Check the Console Output.'
        }
    }
}

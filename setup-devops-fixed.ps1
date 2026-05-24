# ==========================================
# CI/CD DevOps Setup Script (PowerShell)
# ==========================================
# Usage: .\setup-devops-fixed.ps1 -Command "start"

param(
    [ValidateSet('start', 'stop', 'restart', 'clean', 'logs', 'status', 'health', 'password', 'menu')]
    [string]$Command = 'menu'
)

$DOCKER_COMPOSE_FILE = "docker/docker-compose.jenkins.yml"

# ==========================================
# Functions
# ==========================================

function Write-Header {
    param([string]$Text)
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "✓ $Text" -ForegroundColor Green
}

function Write-Error-Message {
    param([string]$Text)
    Write-Host "✗ $Text" -ForegroundColor Red
}

function Write-Warning-Message {
    param([string]$Text)
    Write-Host "⚠ $Text" -ForegroundColor Yellow
}

function Check-Dependencies {
    Write-Header "Checking Dependencies"
    
    if ((Get-Command docker -ErrorAction SilentlyContinue) -eq $null) {
        Write-Error-Message "Docker is not installed"
        Write-Host "Download: https://www.docker.com/products/docker-desktop"
        exit 1
    }
    Write-Success "Docker found"
    
    if ((Get-Command docker-compose -ErrorAction SilentlyContinue) -eq $null) {
        Write-Error-Message "Docker Compose not found"
        exit 1
    }
    Write-Success "Docker Compose found"
}

function Start-Services {
    Write-Header "Starting DevOps Services"
    
    if (!(Test-Path $DOCKER_COMPOSE_FILE)) {
        Write-Error-Message "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    }
    
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    Write-Success "Services started"
    
    Write-Host ""
    Write-Header "Service Access Information"
    Write-Host "Jenkins UI:        http://localhost:8082" -ForegroundColor Green
    Write-Host "Docker Registry:   http://localhost:5001" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting 15 seconds for services..."
    Start-Sleep -Seconds 15
    
    Check-Services-Health
}

function Stop-Services {
    Write-Header "Stopping DevOps Services"
    docker-compose -f $DOCKER_COMPOSE_FILE down
    Write-Success "Services stopped"
}

function Restart-Services {
    Write-Header "Restarting DevOps Services"
    docker-compose -f $DOCKER_COMPOSE_FILE restart
    Write-Success "Services restarted"
}

function Clean-Services {
    Write-Header "Cleaning Up DevOps Services"
    Write-Warning-Message "This will remove all containers, volumes, and data"
    
    $confirm = Read-Host "Continue? (yes/no)"
    if ($confirm -eq "yes") {
        docker-compose -f $DOCKER_COMPOSE_FILE down -v
        Write-Success "Cleanup complete"
    } else {
        Write-Warning-Message "Cleanup cancelled"
    }
}

function Check-Services-Health {
    Write-Header "Checking Service Health"
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8082/login" -TimeoutSec 5 -ErrorAction Stop
        Write-Success "Jenkins is responding"
    } catch {
        Write-Warning-Message "Jenkins is still starting (takes up to 1 minute)..."
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5001/v2/" -TimeoutSec 5 -ErrorAction Stop
        Write-Success "Docker Registry is responding"
    } catch {
        Write-Warning-Message "Docker Registry is starting..."
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5001/v2/" -TimeoutSec 5 -ErrorAction Stop
        Write-Success "Registry UI is responding"
    } catch {
        Write-Warning-Message "Registry UI is starting..."
    }
}

function Show-Logs {
    Write-Header "Service Logs"
    docker-compose -f $DOCKER_COMPOSE_FILE logs -f
}

function Show-Status {
    Write-Header "Service Status"
    docker-compose -f $DOCKER_COMPOSE_FILE ps
}

function Get-Jenkins-Password {
    Write-Header "Getting Jenkins Initial Password"
    
    $JENKINS_CONTAINER = "jenkins-server"
    $isRunning = docker ps --filter "name=$JENKINS_CONTAINER" --format "table" | Select-String $JENKINS_CONTAINER
    
    if ($null -eq $isRunning) {
        Write-Error-Message "Jenkins container not running"
        return
    }
    
    Write-Host "Looking for initial admin password..."
    $logs = docker logs $JENKINS_CONTAINER 2>&1 | Out-String
    
    if ($logs -like "*initialAdminPassword*") {
        Write-Host ""
        Write-Host "Password found in logs. Please check:" -ForegroundColor Green
        Write-Host "docker logs jenkins-server | findstr initialAdminPassword" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "Access Jenkins at: http://localhost:8082" -ForegroundColor Green
        Write-Host "Follow the setup wizard to retrieve the password" -ForegroundColor Yellow
    }
}

function Show-Menu {
    Write-Host ""
    Write-Header "DevOps Setup Menu"
    Write-Host "1. Start services" -ForegroundColor Cyan
    Write-Host "2. Stop services"
    Write-Host "3. Restart services"
    Write-Host "4. View service status"
    Write-Host "5. View logs"
    Write-Host "6. Get Jenkins password"
    Write-Host "7. Check service health"
    Write-Host "0. Exit"
    Write-Host ""
}

# ==========================================
# Main Script
# ==========================================

switch ($Command) {
    'start' {
        Check-Dependencies
        Start-Services
    }
    'stop' {
        Stop-Services
    }
    'restart' {
        Restart-Services
    }
    'clean' {
        Clean-Services
    }
    'logs' {
        Show-Logs
    }
    'status' {
        Show-Status
    }
    'health' {
        Check-Services-Health
    }
    'password' {
        Get-Jenkins-Password
    }
    'menu' {
        Check-Dependencies
        Show-Menu
        
        $choice = Read-Host "Enter your choice (0-7)"
        
        switch ($choice) {
            1 { Start-Services }
            2 { Stop-Services }
            3 { Restart-Services }
            4 { Show-Status }
            5 { Show-Logs }
            6 { Get-Jenkins-Password }
            7 { Check-Services-Health }
            0 { Write-Host "Exiting..."; exit 0 }
            default { Write-Error-Message "Invalid choice" }
        }
    }
    default {
        Write-Host 'Usage: .\setup-devops-fixed.ps1 -Command start|stop|restart|clean|logs|status|health|password|menu'
    }
}

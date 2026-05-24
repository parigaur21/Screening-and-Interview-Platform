#!/usr/bin/env pwsh
# DevOps Setup Script for Windows (PowerShell)

param(
    [string]$Command = 'start'
)

$COMPOSE_FILE = "docker/docker-compose.jenkins.yml"

function Start-DevOps {
    Write-Host "Starting DevOps services..." -ForegroundColor Green
    docker-compose -f $COMPOSE_FILE up -d
    Write-Host "Services started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Jenkins:        http://localhost:8082" -ForegroundColor Cyan
    Write-Host "Docker Registry: http://localhost:5001" -ForegroundColor Cyan
    Write-Host ""
    Start-Sleep -Seconds 10
    docker-compose -f $COMPOSE_FILE ps
}

function Stop-DevOps {
    Write-Host "Stopping DevOps services..." -ForegroundColor Yellow
    docker-compose -f $COMPOSE_FILE down
    Write-Host "Services stopped!" -ForegroundColor Green
}

function Status-DevOps {
    Write-Host "Service Status:" -ForegroundColor Green
    docker-compose -f $COMPOSE_FILE ps
}

switch ($Command) {
    'start' { Start-DevOps }
    'stop' { Stop-DevOps }
    'status' { Status-DevOps }
    default { Write-Host "Usage: .\setup-devops-simple.ps1 -Command start|stop|status" }
}

# Tender Hub Docker Production Testing Script (PowerShell)
# This script helps manage the Docker production environment for local testing

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$Service
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        Write-Error "Docker is not running. Please start Docker and try again."
        exit 1
    }
}

# Function to build the application
function Build-Application {
    Write-Status "Building Tender Hub production image..."
    docker-compose -f docker-compose.production.yml build --no-cache
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Build completed successfully!"
    } else {
        Write-Error "Build failed!"
        exit 1
    }
}

# Function to start the services
function Start-Services {
    Write-Status "Starting Tender Hub production environment..."
    docker-compose -f docker-compose.production.yml up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Status "Waiting for services to be healthy..."
        Start-Sleep -Seconds 10
        
        Write-Success "Services are starting up!"
        Write-Status "Application will be available at: http://localhost:3000"
        Write-Status "Database is available at: localhost:5432"
        Write-Status "Redis is available at: localhost:6379"
        Write-Status "Check service status with: .\scripts\docker-production.ps1 status"
    } else {
        Write-Error "Failed to start services!"
        exit 1
    }
}

# Function to stop the services
function Stop-Services {
    Write-Status "Stopping Tender Hub production environment..."
    docker-compose -f docker-compose.production.yml down
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Services stopped successfully!"
    } else {
        Write-Error "Failed to stop services!"
        exit 1
    }
}

# Function to restart the services
function Restart-Services {
    Write-Status "Restarting Tender Hub production environment..."
    Stop-Services
    Start-Services
}

# Function to show logs
function Show-Logs {
    if ($Service) {
        Write-Status "Showing logs for service: $Service"
        docker-compose -f docker-compose.production.yml logs -f $Service
    } else {
        Write-Status "Showing logs for all services..."
        docker-compose -f docker-compose.production.yml logs -f
    }
}

# Function to show service status
function Show-Status {
    Write-Status "Service status:"
    docker-compose -f docker-compose.production.yml ps
}

# Function to run database migrations
function Run-Migrations {
    Write-Status "Running database migrations..."
    docker-compose -f docker-compose.production.yml exec app npm run db:migrate
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database migrations completed!"
    } else {
        Write-Error "Database migrations failed!"
        exit 1
    }
}

# Function to seed the database
function Seed-Database {
    Write-Status "Seeding database with initial data..."
    docker-compose -f docker-compose.production.yml exec app npm run db:seed
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database seeding completed!"
    } else {
        Write-Error "Database seeding failed!"
        exit 1
    }
}

# Function to clean up everything
function Clean-Environment {
    Write-Warning "This will remove all containers, volumes, and images. Are you sure? (y/N)"
    $response = Read-Host
    if ($response -match "^[yY]([eE][sS])?$") {
        Write-Status "Cleaning up Docker environment..."
        docker-compose -f docker-compose.production.yml down -v --rmi all
        docker system prune -f
        Write-Success "Cleanup completed!"
    } else {
        Write-Status "Cleanup cancelled."
    }
}

# Function to show help
function Show-Help {
    Write-Host "Tender Hub Docker Production Testing Script (PowerShell)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\scripts\docker-production.ps1 [COMMAND] [SERVICE]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor White
    Write-Host "  build     Build the production Docker image" -ForegroundColor Gray
    Write-Host "  start     Start the production environment" -ForegroundColor Gray
    Write-Host "  stop      Stop the production environment" -ForegroundColor Gray
    Write-Host "  restart   Restart the production environment" -ForegroundColor Gray
    Write-Host "  logs      Show logs for all services (or specify service name)" -ForegroundColor Gray
    Write-Host "  status    Show service status" -ForegroundColor Gray
    Write-Host "  migrate   Run database migrations" -ForegroundColor Gray
    Write-Host "  seed      Seed database with initial data" -ForegroundColor Gray
    Write-Host "  clean     Clean up all Docker resources (destructive)" -ForegroundColor Gray
    Write-Host "  help      Show this help message" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\scripts\docker-production.ps1 build" -ForegroundColor Gray
    Write-Host "  .\scripts\docker-production.ps1 start" -ForegroundColor Gray
    Write-Host "  .\scripts\docker-production.ps1 logs app" -ForegroundColor Gray
    Write-Host "  .\scripts\docker-production.ps1 migrate" -ForegroundColor Gray
}

# Main script logic
Test-Docker

switch ($Command.ToLower()) {
    "build" {
        Build-Application
    }
    "start" {
        Start-Services
    }
    "stop" {
        Stop-Services
    }
    "restart" {
        Restart-Services
    }
    "logs" {
        Show-Logs
    }
    "status" {
        Show-Status
    }
    "migrate" {
        Run-Migrations
    }
    "seed" {
        Seed-Database
    }
    "clean" {
        Clean-Environment
    }
    "help" {
        Show-Help
    }
    default {
        if ($Command) {
            Write-Error "Unknown command: $Command"
            Write-Host ""
        }
        Show-Help
        if ($Command) { exit 1 }
    }
}
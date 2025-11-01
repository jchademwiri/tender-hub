#!/bin/bash

# Tender Hub Docker Production Testing Script
# This script helps manage the Docker production environment for local testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to build the application
build() {
    print_status "Building Tender Hub production image..."
    docker-compose -f docker-compose.production.yml build --no-cache
    print_success "Build completed successfully!"
}

# Function to start the services
start() {
    print_status "Starting Tender Hub production environment..."
    docker-compose -f docker-compose.production.yml up -d
    
    print_status "Waiting for services to be healthy..."
    sleep 10
    
    # Check service health
    if docker-compose -f docker-compose.production.yml ps | grep -q "Up (healthy)"; then
        print_success "Services are running and healthy!"
        print_status "Application is available at: http://localhost:3000"
        print_status "Database is available at: localhost:5432"
        print_status "Redis is available at: localhost:6379"
    else
        print_warning "Some services may not be healthy yet. Check logs with: $0 logs"
    fi
}

# Function to stop the services
stop() {
    print_status "Stopping Tender Hub production environment..."
    docker-compose -f docker-compose.production.yml down
    print_success "Services stopped successfully!"
}

# Function to restart the services
restart() {
    print_status "Restarting Tender Hub production environment..."
    stop
    start
}

# Function to show logs
logs() {
    if [ -n "$2" ]; then
        print_status "Showing logs for service: $2"
        docker-compose -f docker-compose.production.yml logs -f "$2"
    else
        print_status "Showing logs for all services..."
        docker-compose -f docker-compose.production.yml logs -f
    fi
}

# Function to show service status
status() {
    print_status "Service status:"
    docker-compose -f docker-compose.production.yml ps
}

# Function to run database migrations
migrate() {
    print_status "Running database migrations..."
    docker-compose -f docker-compose.production.yml exec app npm run db:migrate
    print_success "Database migrations completed!"
}

# Function to seed the database
seed() {
    print_status "Seeding database with initial data..."
    docker-compose -f docker-compose.production.yml exec app npm run db:seed
    print_success "Database seeding completed!"
}

# Function to clean up everything
clean() {
    print_warning "This will remove all containers, volumes, and images. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up Docker environment..."
        docker-compose -f docker-compose.production.yml down -v --rmi all
        docker system prune -f
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to show help
help() {
    echo "Tender Hub Docker Production Testing Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build     Build the production Docker image"
    echo "  start     Start the production environment"
    echo "  stop      Stop the production environment"
    echo "  restart   Restart the production environment"
    echo "  logs      Show logs for all services (or specify service name)"
    echo "  status    Show service status"
    echo "  migrate   Run database migrations"
    echo "  seed      Seed database with initial data"
    echo "  clean     Clean up all Docker resources (destructive)"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build"
    echo "  $0 start"
    echo "  $0 logs app"
    echo "  $0 migrate"
}

# Main script logic
case "$1" in
    build)
        check_docker
        build
        ;;
    start)
        check_docker
        start
        ;;
    stop)
        check_docker
        stop
        ;;
    restart)
        check_docker
        restart
        ;;
    logs)
        check_docker
        logs "$@"
        ;;
    status)
        check_docker
        status
        ;;
    migrate)
        check_docker
        migrate
        ;;
    seed)
        check_docker
        seed
        ;;
    clean)
        check_docker
        clean
        ;;
    help|--help|-h)
        help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        help
        exit 1
        ;;
esac
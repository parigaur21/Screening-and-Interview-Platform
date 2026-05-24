#!/bin/bash

# ==========================================
# CI/CD DevOps Setup Script
# ==========================================
# This script automates the setup of Jenkins, Docker Registry, and supporting services
# Usage: ./setup-devops.sh [start|stop|restart|clean]

set -e

COMMAND=${1:-start}
DOCKER_COMPOSE_FILE="docker/docker-compose.jenkins.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==========================================
# Functions
# ==========================================

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

check_dependencies() {
    print_header "Checking Dependencies"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Please install Docker from https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    print_success "Docker found: $(docker --version)"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        echo "Please install Docker Compose"
        exit 1
    fi
    print_success "Docker Compose found: $(docker-compose --version)"
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        print_warning "Terraform not found - required for Terraform stages in pipeline"
        echo "Install from: https://www.terraform.io/downloads"
    else
        print_success "Terraform found: $(terraform version | head -n 1)"
    fi
}

setup_directories() {
    print_header "Setting Up Directories"
    
    # Create certs directory for SSL certificates
    if [ ! -d "certs" ]; then
        mkdir -p certs
        print_success "Created certs directory"
    fi
    
    # Create self-signed certificates if they don't exist
    if [ ! -f "certs/cert.pem" ] || [ ! -f "certs/key.pem" ]; then
        print_warning "Self-signed SSL certificates not found"
        echo "Generating self-signed certificates for development..."
        
        openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem \
            -days 365 -nodes -subj "/CN=localhost" 2>/dev/null
        
        print_success "Generated self-signed certificates"
        print_warning "These are for development only - use proper certificates in production"
    else
        print_success "SSL certificates found"
    fi
}

start_services() {
    print_header "Starting DevOps Services"
    
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        print_error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    print_success "Services started"
    echo ""
    print_header "Service Access Information"
    echo -e "Jenkins UI:        ${GREEN}http://localhost:8082${NC}"
    echo -e "Docker Registry:   ${GREEN}http://localhost:5001${NC}"
    echo -e "Jenkins DB (Postgres): ${GREEN}localhost:5433${NC}"
    echo ""
    echo "Waiting for services to be ready..."
    sleep 10
    
    # Check service health
    check_services_health
}

stop_services() {
    print_header "Stopping DevOps Services"
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    print_success "Services stopped"
}

restart_services() {
    print_header "Restarting DevOps Services"
    docker-compose -f "$DOCKER_COMPOSE_FILE" restart
    print_success "Services restarted"
}

clean_services() {
    print_header "Cleaning Up DevOps Services"
    print_warning "This will remove all containers, volumes, and data"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" down -v
        print_success "Cleanup complete"
    else
        print_warning "Cleanup cancelled"
    fi
}

check_services_health() {
    print_header "Checking Service Health"
    
    # Check Jenkins
    if curl -sf http://localhost:8082/login > /dev/null 2>&1; then
        print_success "Jenkins is healthy"
    else
        print_warning "Jenkins is starting... (this may take a minute)"
    fi
    
    # Check Registry
    if curl -sf http://localhost:5001/v2/ > /dev/null 2>&1; then
        print_success "Docker Registry is healthy"
    else
        print_warning "Docker Registry is starting..."
    fi
}

show_logs() {
    print_header "Showing Service Logs"
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
}

show_status() {
    print_header "Service Status"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
}

setup_jenkins_plugins() {
    print_header "Installing Jenkins Plugins"
    
    JENKINS_CONTAINER="jenkins-server"
    
    if ! docker ps | grep -q $JENKINS_CONTAINER; then
        print_error "Jenkins container not running"
        return 1
    fi
    
    echo "Installing required plugins..."
    docker exec $JENKINS_CONTAINER jenkins-plugin-cli --plugins \
        pipeline \
        docker-commons \
        github \
        credentials-binding \
        aws-credentials \
        blueocean \
        junit || print_warning "Some plugins may already be installed"
    
    print_success "Plugin installation complete"
}

get_jenkins_password() {
    print_header "Getting Jenkins Initial Password"
    
    JENKINS_CONTAINER="jenkins-server"
    
    if ! docker ps | grep -q $JENKINS_CONTAINER; then
        print_error "Jenkins container not running"
        return 1
    fi
    
    echo "Looking for initial admin password..."
    PASSWORD=$(docker logs $JENKINS_CONTAINER 2>/dev/null | grep -A 5 "Jenkins initial setup is required" | grep -oP '(?<=\>)[a-f0-9]+(?=\<)' | head -1)
    
    if [ -z "$PASSWORD" ]; then
        print_warning "Could not retrieve password from logs"
        echo "Try accessing http://localhost:8082 and check the setup wizard"
    else {
        echo ""
        print_success "Initial Admin Password:"
        echo -e "${GREEN}$PASSWORD${NC}"
        echo ""
        echo "Use this password to complete Jenkins setup at: http://localhost:8082"
    fi
}

configure_docker_insecure_registry() {
    print_header "Configuring Docker for Insecure Registry"
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        DAEMON_JSON="/etc/docker/daemon.json"
        
        if [ ! -f "$DAEMON_JSON" ]; then
            echo '{"insecure-registries": ["localhost:5001"]}' | sudo tee $DAEMON_JSON > /dev/null
        else
            # Add to existing file
            sudo cp $DAEMON_JSON $DAEMON_JSON.bak
            sudo cat $DAEMON_JSON | jq '. += {"insecure-registries": ["localhost:5001"]}' | sudo tee $DAEMON_JSON > /dev/null
        fi
        
        sudo systemctl restart docker
        print_success "Docker daemon configured for insecure registry"
    else
        print_warning "Manual configuration needed for this OS"
        echo "On Docker Desktop (Mac/Windows):"
        echo "1. Open Docker Desktop Preferences"
        echo "2. Go to Docker Engine"
        echo "3. Add to the JSON:"
        echo '   "insecure-registries": ["localhost:5001"]'
        echo "4. Click Apply & Restart"
    fi
}

# ==========================================
# Main Menu
# ==========================================

show_menu() {
    echo ""
    print_header "DevOps Setup Menu"
    echo "1. Start services"
    echo "2. Stop services"
    echo "3. Restart services"
    echo "4. View service status"
    echo "5. View logs"
    echo "6. Get Jenkins password"
    echo "7. Install Jenkins plugins"
    echo "8. Configure Docker registry"
    echo "9. Check service health"
    echo "10. Clean all data (destructive)"
    echo "0. Exit"
    echo ""
}

# ==========================================
# Main Script
# ==========================================

case $COMMAND in
    start)
        check_dependencies
        setup_directories
        start_services
        get_jenkins_password
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    clean)
        clean_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    health)
        check_services_health
        ;;
    plugins)
        setup_jenkins_plugins
        ;;
    password)
        get_jenkins_password
        ;;
    registry)
        configure_docker_insecure_registry
        ;;
    menu)
        show_menu
        read -p "Enter your choice (0-10): " choice
        case $choice in
            1) start_services ;;
            2) stop_services ;;
            3) restart_services ;;
            4) show_status ;;
            5) show_logs ;;
            6) get_jenkins_password ;;
            7) setup_jenkins_plugins ;;
            8) configure_docker_insecure_registry ;;
            9) check_services_health ;;
            10) clean_services ;;
            0) exit 0 ;;
            *) print_error "Invalid choice" ;;
        esac
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|clean|logs|status|health|plugins|password|registry|menu}"
        echo ""
        echo "Examples:"
        echo "  $0 start         - Start all DevOps services"
        echo "  $0 stop          - Stop all services"
        echo "  $0 restart       - Restart all services"
        echo "  $0 logs          - View service logs"
        echo "  $0 menu          - Show interactive menu"
        exit 1
        ;;
esac

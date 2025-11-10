#!/bin/bash

# AI-CRM Serverless 一键安装脚本
# 该脚本会检查环境并引导安装

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${CYAN}💡 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_title() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查 Node.js 版本
check_node_version() {
    if ! command_exists node; then
        print_error "未检测到 Node.js"
        echo "请安装 Node.js 18.17.0 或更高版本"
        echo "访问: https://nodejs.org/"
        return 1
    fi
    
    NODE_VERSION=$(node -v | sed 's/v//')
    REQUIRED_VERSION="18.17.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_error "Node.js 版本过低 (当前: $NODE_VERSION, 要求: >= $REQUIRED_VERSION)"
        return 1
    fi
    
    print_success "Node.js 版本: $NODE_VERSION"
    return 0
}

# 检查 npm
check_npm() {
    if ! command_exists npm; then
        print_error "未检测到 npm"
        return 1
    fi
    
    NPM_VERSION=$(npm -v)
    print_success "npm 版本: $NPM_VERSION"
    return 0
}

# 检查 PostgreSQL
check_postgresql() {
    if command_exists psql; then
        PG_VERSION=$(psql --version | awk '{print $3}')
        print_success "PostgreSQL 已安装: $PG_VERSION"
        return 0
    elif command_exists postgres; then
        PG_VERSION=$(postgres --version | awk '{print $3}')
        print_success "PostgreSQL 已安装: $PG_VERSION"
        return 0
    else
        print_warning "未检测到 PostgreSQL"
        print_info "请确保 PostgreSQL 已安装并正在运行"
        echo ""
        echo "安装方法："
        echo "  Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
        echo "  macOS (Homebrew): brew install postgresql@14"
        echo "  Windows: https://www.postgresql.org/download/windows/"
        return 0
    fi
}

# 主函数
main() {
    clear
    print_title "AI-CRM Serverless 一键安装脚本"
    
    echo "欢迎使用 AI-CRM Serverless 安装脚本！"
    echo "本脚本将检查您的系统环境并引导您完成安装。"
    echo ""
    
    # 检查环境
    print_info "正在检查系统环境..."
    echo ""
    
    if ! check_node_version; then
        exit 1
    fi
    
    if ! check_npm; then
        exit 1
    fi
    
    check_postgresql
    
    echo ""
    print_success "环境检查完成！"
    echo ""
    
    # 检查是否已安装依赖
    if [ ! -d "node_modules" ]; then
        print_info "未检测到 node_modules 目录"
        print_info "正在安装项目依赖..."
        echo ""
        
        npm install
        
        if [ $? -ne 0 ]; then
            print_error "依赖安装失败"
            exit 1
        fi
        
        echo ""
        print_success "依赖安装完成"
    else
        print_success "项目依赖已安装"
    fi
    
    echo ""
    print_info "即将启动交互式安装向导..."
    echo ""
    
    read -p "按 Enter 键继续..."
    
    # 运行安装向导
    npm run install-wizard
    
    if [ $? -eq 0 ]; then
        echo ""
        print_success "安装完成！"
        echo ""
        echo "您可以执行以下命令启动开发服务器："
        echo -e "  ${CYAN}npm run dev${NC}"
        echo ""
    else
        echo ""
        print_error "安装过程中出现错误"
        echo "请检查错误信息并重试"
        exit 1
    fi
}

# 捕获 Ctrl+C
trap 'echo ""; print_warning "安装已取消"; exit 1' INT

# 运行主函数
main

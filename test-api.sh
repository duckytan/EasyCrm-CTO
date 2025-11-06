#!/bin/bash

# AI-CRM Serverless API 测试脚本
# 使用方法: ./test-api.sh <BASE_URL>
# 示例: ./test-api.sh https://your-app.vercel.app

set -e

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查参数
if [ -z "$1" ]; then
  echo -e "${RED}错误: 请提供 API 基础 URL${NC}"
  echo "使用方法: ./test-api.sh <BASE_URL>"
  echo "示例: ./test-api.sh https://your-app.vercel.app"
  echo "      ./test-api.sh http://localhost:3000"
  exit 1
fi

BASE_URL="$1"
echo -e "${YELLOW}测试 API: ${BASE_URL}${NC}\n"

# 1. 健康检查
echo -e "${YELLOW}[1/6] 测试健康检查...${NC}"
HEALTH_RESPONSE=$(curl -s "${BASE_URL}/api/health")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}✓ 健康检查通过${NC}"
  echo "   响应: $HEALTH_RESPONSE"
else
  echo -e "${RED}✗ 健康检查失败${NC}"
  echo "   响应: $HEALTH_RESPONSE"
  exit 1
fi
echo ""

# 2. 登录测试
echo -e "${YELLOW}[2/6] 测试登录...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"accessToken"'; then
  echo -e "${GREEN}✓ 登录成功${NC}"
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  echo "   Access Token 已获取"
else
  echo -e "${RED}✗ 登录失败${NC}"
  echo "   响应: $LOGIN_RESPONSE"
  exit 1
fi
echo ""

# 3. 测试客户列表（认证保护）
echo -e "${YELLOW}[3/6] 测试客户列表（需要认证）...${NC}"
CUSTOMERS_RESPONSE=$(curl -s "${BASE_URL}/api/customers" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$CUSTOMERS_RESPONSE" | grep -q '"data"'; then
  CUSTOMER_COUNT=$(echo "$CUSTOMERS_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
  echo -e "${GREEN}✓ 客户列表获取成功${NC}"
  echo "   当前客户数: ${CUSTOMER_COUNT:-0}"
else
  echo -e "${RED}✗ 客户列表获取失败${NC}"
  echo "   响应: $CUSTOMERS_RESPONSE"
  exit 1
fi
echo ""

# 4. 测试创建客户
echo -e "${YELLOW}[4/6] 测试创建客户...${NC}"
RANDOM_PHONE="138$(printf "%08d" $((RANDOM % 100000000)))"
CREATE_CUSTOMER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/customers" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"测试客户\",
    \"phone\": \"${RANDOM_PHONE}\",
    \"company\": \"测试公司\",
    \"categoryId\": \"CAT001\",
    \"intentionLevel\": \"A\"
  }")

if echo "$CREATE_CUSTOMER_RESPONSE" | grep -q '"id"'; then
  CUSTOMER_ID=$(echo "$CREATE_CUSTOMER_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✓ 客户创建成功${NC}"
  echo "   客户 ID: $CUSTOMER_ID"
  echo "   电话: $RANDOM_PHONE"
else
  echo -e "${RED}✗ 客户创建失败${NC}"
  echo "   响应: $CREATE_CUSTOMER_RESPONSE"
  exit 1
fi
echo ""

# 5. 测试获取客户详情
echo -e "${YELLOW}[5/6] 测试获取客户详情...${NC}"
CUSTOMER_DETAIL=$(curl -s "${BASE_URL}/api/customers/${CUSTOMER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$CUSTOMER_DETAIL" | grep -q '"name":"测试客户"'; then
  echo -e "${GREEN}✓ 客户详情获取成功${NC}"
  echo "   客户名: 测试客户"
  echo "   公司: 测试公司"
else
  echo -e "${RED}✗ 客户详情获取失败${NC}"
  echo "   响应: $CUSTOMER_DETAIL"
  exit 1
fi
echo ""

# 6. 测试仪表盘统计
echo -e "${YELLOW}[6/6] 测试仪表盘统计...${NC}"
DASHBOARD_RESPONSE=$(curl -s "${BASE_URL}/api/dashboard/statistics" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$DASHBOARD_RESPONSE" | grep -q '"monthSummary"'; then
  echo -e "${GREEN}✓ 仪表盘统计获取成功${NC}"
  echo "   包含月度摘要、客户统计、意向分布等数据"
else
  echo -e "${RED}✗ 仪表盘统计获取失败${NC}"
  echo "   响应: $DASHBOARD_RESPONSE"
  exit 1
fi
echo ""

# 7. 清理测试数据（可选）
echo -e "${YELLOW}[清理] 删除测试客户...${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "${BASE_URL}/api/customers/${CUSTOMER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -w "%{http_code}")

if [ "${DELETE_RESPONSE: -3}" = "204" ] || [ "${DELETE_RESPONSE: -3}" = "200" ]; then
  echo -e "${GREEN}✓ 测试客户已删除${NC}"
else
  echo -e "${YELLOW}⚠ 测试客户删除可能失败，请手动清理${NC}"
fi
echo ""

# 测试完成
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 所有测试通过！API 工作正常！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Access Token (有效期15分钟):"
echo "$ACCESS_TOKEN"
echo ""
echo "你现在可以使用这个 Token 来测试其他 API 接口"
echo "示例:"
echo "  curl ${BASE_URL}/api/customers \\"
echo "    -H 'Authorization: Bearer ${ACCESS_TOKEN}'"

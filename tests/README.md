# AI-CRM 测试套件说明

## 概述

本测试套件使用 Vitest 编写，覆盖了 AI-CRM Serverless 后端的核心功能。

## 测试结构

```
tests/
├── api/
│   ├── auth.test.ts          # 认证接口测试
│   ├── customers.test.ts     # 客户管理接口测试
│   └── health.test.ts        # 健康检查测试
├── utils/
│   ├── jwt.test.ts           # JWT 工具函数测试
│   └── middleware.test.ts    # 中间件测试
├── helpers/
│   └── testServer.ts         # 测试服务器辅助工具
└── setup/
    └── testDb.ts             # 测试数据库设置
```

## 测试覆盖范围

### 1. JWT 工具测试 (`tests/utils/jwt.test.ts`)
- ✅ Access Token 生成与验证
- ✅ Refresh Token 生成与验证
- ✅ Token 对生成
- ✅ Token 解码
- ✅ 过期时间验证
- ✅ 错误处理

**测试用例数**: 22

### 2. 中间件测试 (`tests/utils/middleware.test.ts`)
- ✅ `withAuth` - JWT 认证中间件
- ✅ `withMethodCheck` - HTTP 方法检查
- ✅ `withValidation` - Zod 数据验证
- ✅ `withErrorHandler` - 错误处理
- ✅ `composeMiddleware` - 中间件组合

**测试用例数**: 18

### 3. 认证接口测试 (`tests/api/auth.test.ts`)
- ✅ 登录接口（POST /api/auth/login）
  - 成功登录返回 Token
  - 用户不存在返回 401
  - 密码错误返回 401
  - 数据验证失败返回 400
  - HTTP 方法限制
  - 限流机制（5次/15分钟）
- ✅ 刷新Token接口（POST /api/auth/refresh）
  - 成功刷新返回新Token
  - 无Token返回 400
  - 无效Token返回 401
  - 用户不存在返回 401

**测试用例数**: 10

### 4. 客户管理接口测试 (`tests/api/customers.test.ts`)
- ✅ 客户列表（GET /api/customers）
  - 分页、搜索、过滤功能
  - 需要认证
- ✅ 创建客户（POST /api/customers）
  - 数据验证
  - 手机号唯一性检查
- ✅ 客户详情（GET /api/customers/:id）
  - 返回完整客户信息及关联数据
  - 参数验证
- ✅ 更新客户（PUT /api/customers/:id）
  - 部分更新支持
  - 手机号重复检查
- ✅ 删除客户（DELETE /api/customers/:id）
  - 成功删除
  - 客户不存在返回 404

**测试用例数**: 10+

## 运行测试

### 运行所有测试
```bash
npm test
```

### 运行指定文件的测试
```bash
npx vitest run tests/utils/jwt.test.ts
npx vitest run tests/api/auth.test.ts
```

### 生成测试覆盖率报告
```bash
npm test -- --coverage
```

### Watch 模式（开发时使用）
```bash
npx vitest watch
```

## 当前测试状态

**总测试用例数**: 65  
**通过测试**: 65 ✅  
**测试文件**: 5  
**通过率**: 100%

### 测试结果
- ✅ JWT 工具函数测试（22个测试用例）
- ✅ 中间件测试（18个测试用例）
- ✅ 认证接口测试（10个测试用例）
- ✅ 客户接口测试（14个测试用例）
- ✅ 健康检查测试（1个测试用例）

### 已修复的问题
- ✅ 修复了中间件数据传递问题
  - 问题: `withValidation` 中间件没有正确传递验证后的数据
  - 解决方案: 使用泛型和rest参数来支持中间件链中的数据传递
  - 影响范围: 所有使用验证中间件的接口

## 测试最佳实践

1. **使用模拟（Mocking）**: 所有外部依赖（数据库、第三方服务）都应该被模拟
2. **独立性**: 每个测试用例应该独立运行，不依赖其他测试的执行顺序
3. **清晰命名**: 测试用例名称应该清晰描述测试的场景
4. **AAA模式**: Arrange（准备）、Act（执行）、Assert（断言）

## 下一步工作

1. 修复集成测试中的模拟配置问题
2. 添加测试覆盖率报告
3. 增加边界测试用例
4. 添加性能测试
5. 集成到 CI/CD 流程

## 环境要求

- Node.js >= 18.17.0
- npm >= 9.0.0
- Vitest >= 1.6.0
- Supertest >= 6.3.4

## 相关文档

- [DEVELOPMENT.md](../DEVELOPMENT.md) - 开发指南
- [TEST_PLAN.md](../TEST_PLAN.md) - 测试计划
- [TASK_SUMMARY.md](../TASK_SUMMARY.md) - 任务总结

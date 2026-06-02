# Visual Workflow Orchestrator

基于 AntV X6 构建的 AI 智能体工作流编辑器，提供可视化的工作流设计能力，支持多种节点类型和复杂的流程编排。

## 目录

- [项目概述](#项目概述)
- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [安装步骤](#安装步骤)
- [使用指南](#使用指南)
- [节点类型](#节点类型)
- [配置说明](#配置说明)
- [开发指南](#开发指南)
- [贡献规范](#贡献规范)
- [许可证](#许可证)
- [联系方式](#联系方式)

## 项目概述

本项目是一个功能完整的 AI 智能体工作流编辑器，支持拖拽式节点编辑、智能连线验证、循环节点嵌套等高级功能。主要特性包括：

- 可视化工作流设计界面
- 丰富的节点类型（LLM、知识库、代码执行、API 调用等）
- 智能连线验证和 DAG 结构校验
- 支持循环节点和嵌套子工作流
- 撤销/重做历史记录
- 工作流导入导出功能

## 核心功能

| 功能模块       | 描述                                                                        |
| -------------- | --------------------------------------------------------------------------- |
| **节点系统**   | 支持 15+ 种节点类型，包括开始/输出、LLM、知识库、代码执行、条件分支、循环等 |
| **连线系统**   | 智能连线验证，支持从输出桩到输入桩的连接，自动检测非法连接                  |
| **循环节点**   | 支持循环节点嵌套，内部子节点只能连接到同一循环内的其他节点                  |
| **节点面板**   | 点击连接桩或拖拽连线到空白区域自动弹出节点选择面板                          |
| **属性检查器** | 选中节点后显示属性配置面板，支持动态编辑节点参数                            |
| **历史记录**   | 完整的撤销/重做功能，支持快捷键操作                                         |
| **工作流验证** | DAG 结构验证，确保工作流无环且结构正确                                      |
| **导入导出**   | 支持 JSON 格式的工作流数据导入导出                                          |

## 技术栈

| 技术         | 版本    | 说明         |
| ------------ | ------- | ------------ |
| Vue          | ^3.4.21 | 前端框架     |
| TypeScript   | ^5.3.3  | 类型安全     |
| AntV X6      | ^3.0.0  | 图形编辑引擎 |
| Pinia        | ^3.0.4  | 状态管理     |
| Tailwind CSS | ^3.4.1  | 样式框架     |
| Vite         | ^5.0.12 | 构建工具     |
| Vitest       | ^4.1.7  | 测试框架     |

## 安装步骤

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```powershell
# 进入项目目录
cd h:\data\antvX6

# 安装依赖
npm install
```

### 运行项目

```powershell
# 开发模式（热更新）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 代码质量检查

```powershell
# ESLint 代码检查
npm run lint

# Prettier 代码格式化
npm run format

# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage
```

## 使用指南

### 快速开始

1. **启动开发服务器**：
   ```powershell
   npm run dev
   ```
2. **打开浏览器**：访问 `http://localhost:5173`
3. **创建工作流**：
   - 从左侧节点面板拖拽节点到画布
   - 点击节点连接桩创建连线
   - 使用工具栏进行撤销/重做操作
   - 通过右侧检查器编辑节点属性

### 基本操作

| 操作          | 说明                                                   |
| ------------- | ------------------------------------------------------ |
| 拖拽节点      | 从左侧面板拖拽节点到画布                               |
| 创建连线      | 点击源节点输出桩（蓝色），拖动到目标节点输入桩（绿色） |
| 删除节点/连线 | 选中后按 Delete 键                                     |
| 撤销          | Ctrl+Z                                                 |
| 重做          | Ctrl+Y                                                 |
| 多选          | 按住 Ctrl 键点击多个节点                               |
| 框选          | 在画布空白处拖动鼠标绘制选择框                         |

## 节点类型

项目支持以下节点类型：

| 节点类型       | 名称       | 描述                           |
| -------------- | ---------- | ------------------------------ |
| INPUT          | 开始       | 工作流的起始节点，设定启动参数 |
| OUTPUT         | 输出       | Web 界面输出节点，显示执行结果 |
| LLM            | 大模型     | 调用大语言模型生成回复         |
| KNOWLEDGE_BASE | 知识库     | 根据输入召回最匹配的知识       |
| PYTHON_CODE    | Python代码 | 执行自定义 Python 代码         |
| HTTP           | REST-API   | 调用外部 REST 接口             |
| BRANCH         | 选择器     | 条件分支控制                   |
| LOOP           | 循环       | 重复执行任务                   |
| LOOP_BREAK     | 循环终止   | 终止循环执行                   |
| VAR_ASSIGN     | 变量赋值   | 向可写入变量赋值               |
| VAR_AGGREGATE  | 变量汇聚   | 汇聚选择器不同分支             |
| PLUGIN         | 插件       | 通过工具访问实时数据           |
| AGENT          | 智能体     | 集成已发布智能体               |
| WORKFLOW       | 工作流     | 集成已发布工作流               |
| FILE_EXTRACT   | 文件提取   | 提取文件内容                   |

## 配置说明

### 节点注册配置

节点类型定义在 `src/config/workflow/node-registry.ts`：

```typescript
export const nodeRegistry: Record<string, NodeConfig> = {
  NODE_TYPE: {
    type: 'NODE_TYPE',
    name: '节点名称',
    icon: 'icon-name',
    iconType: 'image',
    description: '节点描述',
    ports: [
      { group: 'top', id: 'in-top' },
      { group: 'right', id: 'out-right' },
    ],
  },
};
```

### 图形配置

图形选项配置在 `src/config/workflow/graph-options.ts`：

- `background`: 画布背景设置
- `grid`: 网格配置
- `selecting`: 选择行为配置
- `connecting`: 连线行为配置
- `highlighting`: 高亮样式配置

### 环境变量

项目使用 Vite 环境变量，创建 `.env` 文件：

```env
# 开发环境
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:3000
```

## 开发指南

### 项目结构

```
src/
├── assets/           # 静态资源
│   └── images/       # 节点图标
├── components/       # Vue 组件
│   ├── common/       # 通用组件（Toast）
│   └── workflow/     # 工作流组件（编辑器、工具栏、检查器等）
├── composables/      # 组合式函数（useToast）
├── config/           # 配置文件
│   └── workflow/     # 工作流配置（节点注册、图形选项）
├── stores/           # Pinia 状态管理
│   └── graph/        # 图形状态（节点操作、连线管理、事件处理）
├── types/            # TypeScript 类型定义
├── utils/            # 工具函数（连线验证、DAG 验证、拓扑排序）
├── App.vue           # 根组件
├── main.ts           # 入口文件
└── style.css         # 全局样式
```

### 添加新节点类型

1. 在 `src/config/workflow/node-registry.ts` 中注册节点
2. 在 `src/assets/images/` 中添加节点图标
3. 在 `src/types/workflow.ts` 中添加类型定义（如需要）

### 核心模块说明

#### 状态管理（stores）

- `graphStore`: 管理图形状态，包括节点、连线、事件
- `uiStore`: 管理 UI 状态（面板显示、选中状态）
- `historyStore`: 管理操作历史
- `workflowStore`: 管理工作流数据

#### 工具函数（utils）

- `connection.ts`: 连线验证逻辑
- `dag-validator.ts`: DAG 结构验证
- `topology-sort.ts`: 拓扑排序算法
- `node-utils.ts`: 节点工具函数

## 贡献规范

### 提交规范

遵循 Conventional Commits 规范：

```
<类型>(<范围>): <主题>

<正文>

<页脚>
```

**类型说明**：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链相关

### 开发流程

1. Fork 仓库
2. 创建特性分支：`git checkout -b feature/xxx`
3. 提交代码：`git commit -m "feat(module): 添加 xxx 功能"`
4. 推送分支：`git push origin feature/xxx`
5. 创建 Pull Request

### 代码规范

- TypeScript 类型定义完整
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 Vue 3 Composition API 风格

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件：wantasy05\@qq.com

---

**Copyright (c) 2024 Visual Workflow Orchestrator**

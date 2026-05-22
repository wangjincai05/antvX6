## Context

基于 antvX6 构建可视化编排引擎，实现类似 Coze 的工作流编排功能。当前项目为空目录，需要从零开始搭建 Vue3 + TypeScript 项目框架，并集成 antvX6 图形库。

## Goals / Non-Goals

**Goals:**
- 搭建 Vue3 + TypeScript 项目框架
- 集成 antvX6 实现可视化画布
- 实现节点拖拽、动态连线、属性联动核心功能
- 配置 ESLint、Prettier、Git Hooks 确保代码质量

**Non-Goals:**
- 不实现后端服务
- 不涉及数据库设计
- 不包含部署和运维配置

## Decisions

### 技术栈选择
- **框架**: Vue 3 + TypeScript - 提供类型安全和组件化开发
- **图形库**: @antv/x6 + @antv/x6-vue - 专业的图编辑引擎
- **样式**: TailwindCSS 3 - 快速构建 UI
- **构建工具**: Vite - 快速开发和构建
- **代码规范**: ESLint + Prettier + Husky

### 架构设计
- **组件层**: WorkflowCanvas(画布)、NodePanel(节点面板)、PropertyPanel(属性面板)
- **业务层**: 节点管理、连线管理、属性联动逻辑
- **工具层**: X6 图形引擎封装、拖拽处理

### 目录结构
```
src/
├── components/          # UI组件
│   ├── WorkflowCanvas/  # 画布组件
│   ├── NodePanel/       # 节点面板
│   └── PropertyPanel/   # 属性面板
├── composables/         # 组合式函数
│   ├── useCanvas.ts     # 画布操作
│   └── useNodes.ts      # 节点管理
├── types/               # 类型定义
├── utils/               # 工具函数
└── App.vue              # 主应用
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| X6 版本兼容性 | 锁定版本号，定期更新 |
| 画布性能问题 | 使用虚拟滚动和节点复用 |
| 复杂连线逻辑 | 利用 X6 内置路由算法 |
| 拖拽体验 | 使用原生拖拽 API + X6 事件系统 |
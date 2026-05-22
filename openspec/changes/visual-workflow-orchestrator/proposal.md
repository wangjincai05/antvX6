## Why

当前业务场景中需要一个类似 Coze 的工作流编排引擎，支持节点拖拽、动态连线、属性联动等核心功能。现有的方案无法满足灵活的可视化编排需求，因此需要基于 antvX6 构建一个功能完善的可视化编排引擎。

## What Changes

- 搭建 Vue3 + TypeScript + antvX6 的项目框架
- 配置 ESLint、Prettier 代码规范工具
- 配置 Git Hooks 确保代码质量
- 实现节点拖拽功能
- 实现动态连线功能
- 实现属性联动功能
- 提供工作流编排的核心 UI 组件

## Capabilities

### New Capabilities

- `node-drag-drop`: 支持节点从侧边栏拖拽到画布
- `dynamic-connection`: 支持节点间动态连线和自动路由
- `property-linkage`: 支持节点属性联动和数据同步
- `workflow-canvas`: 提供工作流编排画布组件
- `node-library`: 提供可扩展的节点库管理

### Modified Capabilities

## Impact

- 新增 Vue3 + TypeScript 项目结构
- 依赖 antvX6、antvX6-vue、tailwindcss 等第三方库
- 配置 ESLint、Prettier、husky 等开发工具
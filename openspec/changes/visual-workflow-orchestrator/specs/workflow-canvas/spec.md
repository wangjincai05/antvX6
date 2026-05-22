## ADDED Requirements

### Requirement: 工作流画布
系统应提供工作流编排画布，支持节点的添加、删除、移动和缩放。

#### Scenario: 画布缩放
- **WHEN** 用户使用鼠标滚轮或缩放控件
- **THEN** 画布应放大或缩小

#### Scenario: 画布平移
- **WHEN** 用户按住鼠标左键拖动画布空白区域
- **THEN** 画布应跟随鼠标平移

#### Scenario: 节点选择
- **WHEN** 用户点击一个节点
- **THEN** 该节点应被高亮显示为选中状态

#### Scenario: 多选节点
- **WHEN** 用户按住 SHIFT 键点击多个节点或拖拽选择区域
- **THEN** 多个节点应被同时选中

#### Scenario: 删除节点
- **WHEN** 用户选中节点后按 DELETE 键或点击删除按钮
- **THEN** 节点及其相关连线应被删除

### Requirement: 画布工具栏
系统应提供画布工具栏，包含常用操作按钮。

#### Scenario: 清空画布
- **WHEN** 用户点击清空按钮
- **THEN** 画布上的所有节点和连线应被清除

#### Scenario: 撤销操作
- **WHEN** 用户点击撤销按钮或按 CTRL+Z
- **THEN** 上一步操作应被撤销

#### Scenario: 重做操作
- **WHEN** 用户点击重做按钮或按 CTRL+Y
- **THEN** 被撤销的操作应被恢复
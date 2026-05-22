import type { NodeType } from '@/types'

export const nodeTypes: NodeType[] = [
  {
    id: 'start',
    name: '开始节点',
    icon: '▶',
    color: '#10b981',
    description: '工作流的起始节点'
  },
  {
    id: 'end',
    name: '结束节点',
    icon: '■',
    color: '#ef4444',
    description: '工作流的结束节点'
  },
  {
    id: 'task',
    name: '任务节点',
    icon: '⚙',
    color: '#3b82f6',
    description: '执行具体任务的节点'
  },
  {
    id: 'condition',
    name: '条件节点',
    icon: '?',
    color: '#f59e0b',
    description: '根据条件分支执行'
  },
  {
    id: 'parallel',
    name: '并行节点',
    icon: '⟹',
    color: '#8b5cf6',
    description: '并行执行多个分支'
  }
]
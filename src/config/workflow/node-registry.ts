import { COLORS, PORT_COLORS } from '@/config/constants';

export interface NodeConfig {
  type: string;
  name: string;
  icon: string;
  iconType: 'emoji' | 'image';
  description: string;
  ports: { group: string; id: string }[];
}

export const nodeRegistry: Record<string, NodeConfig> = {
  INPUT: {
    type: 'INPUT',
    name: '开始',
    icon: 'icon-start',
    iconType: 'image',
    description: '工作流的起始节点，用于设定启动工作流需要的信息',
    ports: [
      { group: 'bottom', id: 'out-bottom' },
      { group: 'right', id: 'out-right' },
    ],
  },
  OUTPUT: {
    type: 'OUTPUT',
    name: '输出',
    icon: 'icon-end',
    iconType: 'image',
    description: '工作流的Web界面输出节点，用于显示工作流运行过程的结果信息',
    ports: [
      { group: 'top', id: 'in-top' },
      { group: 'left', id: 'in-left' },
    ],
  },
  LLM: {
    type: 'LLM',
    name: '大模型',
    icon: 'icon-llm',
    iconType: 'image',
    description: '调用大语言模型,使用变量和提示词生成回复',
    ports: [
      { group: 'top', id: 'in-top' },
      { group: 'left', id: 'in-left' },
      { group: 'bottom', id: 'out-bottom' },
      { group: 'right', id: 'out-right' },
    ],
  },
  KNOWLEDGE_BASE: {
    type: 'KNOWLEDGE_BASE',
    name: '知识库',
    icon: 'icon-knowledge',
    iconType: 'image',
    description: '在选定的知识中,根据输入变量召回最匹配的信息,并以列表形式返回',
    ports: [
      { group: 'top', id: 'in-top' },
      { group: 'left', id: 'in-left' },
      { group: 'bottom', id: 'out-bottom' },
      { group: 'right', id: 'out-right' },
    ],
  },
  PYTHON_CODE: {
    type: 'PYTHON_CODE',
    name: 'PYTHON代码',
    icon: 'icon-code',
    iconType: 'image',
    description: '用于执行PYTHON代码，代码中可以直接使用当前节点的输入变量',
    ports: [
      { group: 'top', id: 'in-top' },
      { group: 'left', id: 'in-left' },
      { group: 'bottom', id: 'out-bottom' },
      { group: 'right', id: 'out-right' },
    ],
  },
  HTTP: {
    type: 'HTTP',
    name: 'REST-API',
    icon: 'icon-rest',
    iconType: 'image',
    description: '可支持集成系统自带的各种类型的REST接口',
    ports: [
      { group: 'top', id: 'in-top' },
      { group: 'left', id: 'in-left' },
      { group: 'bottom', id: 'out-bottom' },
      { group: 'right', id: 'out-right' },
    ],
  },
  BRANCH: {
    type: 'BRANCH',
    name: '选择器',
    icon: 'icon-condition',
    iconType: 'image',
    description: '通过配置判断条件以及对应的执行分支，控制工作流的执行分支选择',
    ports: [
      { group: 'top', id: 'in-top' },
      { group: 'left', id: 'in-left' },
      { group: 'bottom', id: 'out-bottom' },
      { group: 'right', id: 'out-right' },
    ],
  },
  LOOP: {
    type: 'LOOP',
    name: '循环',
    icon: 'icon-loop',
    iconType: 'image',
    description: '用于通过设定循环次数和逻辑，重复执行一系列任务',
    ports: [
      { group: 'top', id: 'in-top' },
      { group: 'left', id: 'in-left' },
      { group: 'bottom', id: 'out-bottom' },
      { group: 'right', id: 'out-right' },
    ],
  },
  LOOP_BREAK: {
    type: 'LOOP_BREAK',
    name: '循环终止',
    icon: 'icon-loopEnd',
    iconType: 'image',
    description: '循环终止',
    ports: [
      { group: 'top', id: 'in-top' },
      { group: 'left', id: 'in-left' },
      { group: 'bottom', id: 'out-bottom' },
      { group: 'right', id: 'out-right' },
    ],
  },
  VAR_ASSIGN: {
    type: 'VAR_ASSIGN',
    name: '变量赋值',
    icon: 'icon-variable',
    iconType: 'image',
    description: '变量赋值节点用于向可写入变量进行变量赋值',
    ports: [
      { group: 'top', id: 'in-top' },
      { group: 'left', id: 'in-left' },
      { group: 'bottom', id: 'out-bottom' },
      { group: 'right', id: 'out-right' },
    ],
  },
  VAR_AGGREGATE: {
    type: 'VAR_AGGREGATE',
    name: '变量汇聚',
    icon: 'icon-variable',
    iconType: 'image',
    description: '变量汇聚节点用于汇聚选择器节点的不同分支到此节点上',
    ports: [
      { group: 'top', id: 'in-top' },
      { group: 'left', id: 'in-left' },
      { group: 'bottom', id: 'out-bottom' },
      { group: 'right', id: 'out-right' },
    ],
  },
  PLUGIN: {
    type: 'PLUGIN',
    name: '插件',
    icon: 'icon-plugin',
    iconType: 'image',
    description: '通过添加工具访问实时数据和执行外部操作',
    ports: [
      { group: 'top', id: 'in-top' },
      { group: 'left', id: 'in-left' },
      { group: 'bottom', id: 'out-bottom' },
      { group: 'right', id: 'out-right' },
    ],
  },
  AGENT: {
    type: 'AGENT',
    name: '智能体',
    icon: 'icon-bot',
    iconType: 'image',
    description: '集成已发布智能体，可以执行嵌套子任务',
    ports: [
      { group: 'top', id: 'in-top' },
      { group: 'left', id: 'in-left' },
      { group: 'bottom', id: 'out-bottom' },
      { group: 'right', id: 'out-right' },
    ],
  },
  WORKFLOW: {
    type: 'WORKFLOW',
    name: '工作流',
    icon: 'icon-graph',
    iconType: 'image',
    description: '集成已发布工作流，可以执行嵌套子任务',
    ports: [
      { group: 'top', id: 'in-top' },
      { group: 'left', id: 'in-left' },
      { group: 'bottom', id: 'out-bottom' },
      { group: 'right', id: 'out-right' },
    ],
  },
  FILE_EXTRACT: {
    type: 'FILE_EXTRACT',
    name: '文件提取',
    icon: 'icon-extract',
    iconType: 'image',
    description: '文件提取节点用于提取文件内容',
    ports: [
      { group: 'top', id: 'in-top' },
      { group: 'left', id: 'in-left' },
      { group: 'bottom', id: 'out-bottom' },
      { group: 'right', id: 'out-right' },
    ],
  },
};

export const portInteractionStyles = {
  default: {
    r: 2,
  },
  nodeHover: {
    r: 6,
  },
  portHover: {
    r: 8,
    fill: COLORS.primary,
    stroke: COLORS.primary,
  },
};

export const portGroups = {
  top: {
    position: 'top' as const,
    attrs: {
      circle: {
        r: portInteractionStyles.default.r,
        magnet: true,
        stroke: PORT_COLORS.input,
        strokeWidth: 2,
        fill: COLORS.nodeFill,
      },
    },
  },
  bottom: {
    position: 'bottom' as const,
    attrs: {
      circle: {
        r: portInteractionStyles.default.r,
        magnet: true,
        stroke: PORT_COLORS.output,
        strokeWidth: 2,
        fill: COLORS.nodeFill,
      },
    },
  },
  left: {
    position: 'left' as const,
    attrs: {
      circle: {
        r: portInteractionStyles.default.r,
        magnet: true,
        stroke: PORT_COLORS.input,
        strokeWidth: 2,
        fill: COLORS.nodeFill,
      },
    },
  },
  right: {
    position: 'right' as const,
    attrs: {
      circle: {
        r: portInteractionStyles.default.r,
        magnet: true,
        stroke: PORT_COLORS.output,
        strokeWidth: 2,
        fill: COLORS.nodeFill,
      },
    },
  },
};

export const getIconPath = (iconName?: string): string => {
  const iconMap: Record<string, string> = {
    'icon-start': '/src/assets/images/icon-start.png',
    'icon-llm': '/src/assets/images/icon-llm.png',
    'icon-knowledge': '/src/assets/images/icon-knowledge.png',
    'icon-code': '/src/assets/images/icon-code.png',
    'icon-rest': '/src/assets/images/icon-database.png',
    'icon-variable': '/src/assets/images/icon-variable.png',
    'icon-condition': '/src/assets/images/icon-condition.png',
    'icon-plugin': '/src/assets/images/icon-plugin.png',
    'icon-bot': '/src/assets/images/icon-bot.png',
    'icon-graph': '/src/assets/images/icon-graph.png',
    'icon-end': '/src/assets/images/icon-end.png',
    'icon-extract': '/src/assets/images/icon-database.png',
    'icon-loopEnd': '/src/assets/images/icon-loopEnd.png',
    'icon-loop': '/src/assets/images/icon-loop.png'
  }
  return iconMap[iconName || ''] || '/src/assets/images/icon-variable.png'
}
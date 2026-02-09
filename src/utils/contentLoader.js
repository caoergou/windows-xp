/**
 * 内容加载工具
 * 用于动态加载文本内容（邮件正文、QQ空间日志等）
 */

/**
 * 动态加载文本内容
 * @param {string} contentPath - 相对路径（如 "/src/data/email/content/email_chenmo_001.txt"）
 * @returns {Promise<string>} 文本内容
 */
export async function loadTextContent(contentPath) {
  try {
    // 使用 Vite 的 ?raw 导入来加载文本文件
    // 需要将路径转换为动态导入格式
    const modules = import.meta.glob('../data/**/*.txt', { as: 'raw', eager: false });

    // 查找匹配的模块
    const matchingKey = Object.keys(modules).find(key => key.includes(contentPath.split('/').pop()));

    if (matchingKey) {
      const content = await modules[matchingKey]();
      return content;
    }

    // 如果没有找到匹配的模块，尝试使用 fetch
    const response = await fetch(contentPath);
    if (!response.ok) {
      throw new Error(`Failed to load content: ${contentPath}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error loading text content:', error);
    return '[内容加载失败]';
  }
}

/**
 * 批量预加载内容（可选，用于优化性能）
 * @param {Array<string>} contentPaths - 内容路径数组
 * @returns {Promise<Map<string, string>>} 路径到内容的映射
 */
export async function preloadTextContents(contentPaths) {
  const contentMap = new Map();
  await Promise.all(
    contentPaths.map(async (path) => {
      const content = await loadTextContent(path);
      contentMap.set(path, content);
    })
  );
  return contentMap;
}

/**
 * 创建内容缓存 Hook（用于 React 组件）
 * @returns {Object} 包含 loadContent 和 getContent 方法的对象
 */
export function createContentCache() {
  const cache = new Map();

  return {
    /**
     * 加载内容（带缓存）
     * @param {string} contentPath - 内容路径
     * @returns {Promise<string>} 文本内容
     */
    async loadContent(contentPath) {
      if (cache.has(contentPath)) {
        return cache.get(contentPath);
      }

      const content = await loadTextContent(contentPath);
      cache.set(contentPath, content);
      return content;
    },

    /**
     * 获取缓存的内容（不加载）
     * @param {string} contentPath - 内容路径
     * @returns {string|null} 文本内容或 null
     */
    getContent(contentPath) {
      return cache.get(contentPath) || null;
    },

    /**
     * 清除缓存
     */
    clearCache() {
      cache.clear();
    }
  };
}

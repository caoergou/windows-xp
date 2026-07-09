/**
 * CMD 风格参数解析：支持双引号包裹的含空格参数。
 */
export const parseCmdArgs = (cmd: string): string[] => {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of cmd.trim()) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ' ' && !inQuotes) {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current || args.length > 0) {
    args.push(current);
  }

  return args;
};

/**
 * CMD 风格路径解析：支持 C:\、\、.\、..\ 以及引号路径。
 *
 * @param path 用户输入的路径字符串
 * @param currentPath 当前工作目录的完整路径数组
 * @param driveRoot C: 驱动器对应的内部路径前缀
 */
export const resolveCmdPath = (
  path: string,
  currentPath: readonly string[],
  driveRoot: readonly string[]
): string[] => {
  const normalized = path.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');

  if (normalized === '\\' || normalized === '/') {
    return [...driveRoot];
  }

  let base: string[];
  let rest: string;

  if (/^C:/i.test(normalized)) {
    const afterDrive = normalized.slice(2);
    if (afterDrive.startsWith('\\') || afterDrive.startsWith('/')) {
      rest = afterDrive.replace(/^[\\/]+/, '');
      base = [...driveRoot];
    } else {
      rest = afterDrive;
      base = [...currentPath];
    }
  } else if (normalized.startsWith('\\') || normalized.startsWith('/')) {
    rest = normalized.slice(1);
    base = ['root'];
  } else {
    rest = normalized;
    base = [...currentPath];
  }

  const parts = rest.split(/[\\/]/).filter(Boolean);
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      if (base.length > 0) base.pop();
    } else {
      base.push(part);
    }
  }

  return base;
};

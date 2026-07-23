/** CMD-style argument parsing: supports space-containing arguments wrapped in double quotes. */
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
 * CMD-style path parsing: supports C:, , ., .., and quoted paths.
 *
 * @param path User-input path string
 * @param currentPath Full path array of the current working directory
 * @param driveRoot Internal path prefix corresponding to the C: drive
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
    base = [...driveRoot];
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

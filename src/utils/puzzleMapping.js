/**
 * 谜题映射配置
 * 将文件夹路径、相册名称等映射到对应的 puzzleId
 */

export const getPuzzleIdFromPath = (path) => {
  const pathStr = Array.isArray(path) ? path.join('/') : path;

  // 父亲日志文件夹 - 第一层
  if (pathStr.includes('夏建国_工作日志')) {
    return 'father_log_layer1';
  }

  return null;
};

export const getPuzzleIdFromAlbum = (albumName, userId) => {
  // 林晓宇的加密相册
  if (userId === 'linxiaoyu' && albumName === '加密') {
    return 'album_password';
  }

  return null;
};

export const getPuzzleIdFromBlog = (blogTitle, userId) => {
  // 林晓宇的加密日志
  if (userId === 'linxiaoyu' && blogTitle === '加密日志') {
    return 'encrypted_diary';
  }

  return null;
};

export const isAuxiliaryPuzzle = (puzzleId) => {
  // 辅助谜题列表（可以跳过的谜题）
  const auxiliaryPuzzles = [];
  return auxiliaryPuzzles.includes(puzzleId);
};

#!/usr/bin/env node

/**
 * Script to extract inline content from filesystem.json to separate files
 * This makes the filesystem.json more maintainable and easier to edit
 */

const fs = require('fs');
const path = require('path');

const FILESYSTEM_JSON = path.join(__dirname, '../src/data/filesystem.json');
const CONTENT_DIR = path.join(__dirname, '../src/data/filesystem_content');

// Read filesystem.json
const filesystem = JSON.parse(fs.readFileSync(FILESYSTEM_JSON, 'utf8'));

let extractCount = 0;
const usedFilenames = new Set();

// Generate a unique, clean filename
function generateFilename(nodeName, basePath = []) {
  // Clean the name
  let cleanName = nodeName
    .replace(/\.(txt|html|md)$/i, '') // Remove extension
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, '_') // Replace special chars
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, ''); // Trim underscores

  // Add extension back
  const ext = nodeName.match(/\.(txt|html|md)$/i)?.[0] || '.txt';
  let filename = cleanName + ext;

  // Ensure uniqueness
  let counter = 1;
  while (usedFilenames.has(filename)) {
    filename = `${cleanName}_${counter}${ext}`;
    counter++;
  }

  usedFilenames.add(filename);
  return filename;
}

// Recursively process nodes
function processNode(node, currentPath = []) {
  if (!node) return;

  // If node has inline content (and it's substantial), extract it
  if (node.content && typeof node.content === 'string' && node.content.length > 100) {
    // Generate a clean filename
    const filename = generateFilename(node.name, currentPath);
    const fullPath = path.join(CONTENT_DIR, filename);

    // Write content to file
    fs.writeFileSync(fullPath, node.content, 'utf8');

    // Replace content with contentPath
    node.contentPath = `filesystem_content/${filename}`;
    delete node.content;

    extractCount++;
    console.log(`Extracted: ${filename}`);
  }

  // Recursively process children
  if (node.children) {
    for (const key in node.children) {
      processNode(node.children[key], [...currentPath, key]);
    }
  }
}

// Create content directory
if (!fs.existsSync(CONTENT_DIR)) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}

// Process filesystem
processNode(filesystem.root);

// Write updated filesystem.json
fs.writeFileSync(FILESYSTEM_JSON, JSON.stringify(filesystem, null, 2), 'utf8');

console.log(`\n✅ Extracted ${extractCount} content files`);
console.log(`📁 Content directory: ${CONTENT_DIR}`);
console.log(`📄 Updated: ${FILESYSTEM_JSON}`);

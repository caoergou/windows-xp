import { describe, it, expect } from 'vitest';
import { APP_REGISTRY, type AppRegistryEntry } from '../src/registry/apps';
import type { FileNode } from '../src/types';

const dummyFileNode: FileNode = {
  type: 'file',
  name: 'test.txt',
  content: 'test content',
};

function getSensibleProps(entry: AppRegistryEntry): unknown {
  // Prefer the first association's getProps so we exercise the props shape
  // the app is actually restored with during normal file open flows.
  const association = entry.associations?.[0];
  if (association) {
    return association.getProps(dummyFileNode);
  }

  // Fallback props for apps that are opened directly without a file node.
  switch (entry.id) {
    case 'FileProperties':
      return { fileItem: dummyFileNode, parentPath: [] };
    case 'PhotoViewer':
      return { src: '/images/test.jpg', fileItem: dummyFileNode };
    case 'Explorer':
      return { initialPath: [] };
    case 'MicrosoftPaint':
      return { src: '/images/test.bmp', fileName: 'test.bmp' };
    default:
      return {};
  }
}

describe('APP_REGISTRY restore functions', () => {
  it.each(Object.entries(APP_REGISTRY))(
    '%s restore() does not throw and returns a defined React node',
    (appId, entry) => {
      const props = getSensibleProps(entry);

      let element: React.ReactNode;
      expect(() => {
        element = entry.restore(props);
      }).not.toThrow();

      expect(element).toBeDefined();
    }
  );
});

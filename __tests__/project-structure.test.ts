import * as fs from 'fs';
import * as path from 'path';

describe('Project Structure', () => {
  const srcPath = path.join(__dirname, '..', 'src');

  it('should have all required directories', () => {
    const requiredDirs = [
      'components',
      'screens',
      'services',
      'store',
      'navigation',
      'types',
      'utils',
    ];

    requiredDirs.forEach(dir => {
      const dirPath = path.join(srcPath, dir);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });

  it('should have component subdirectories', () => {
    const componentSubDirs = ['common', 'product'];
    
    componentSubDirs.forEach(subDir => {
      const dirPath = path.join(srcPath, 'components', subDir);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });

  it('should have screen subdirectories', () => {
    const screenSubDirs = ['auth', 'main'];
    
    screenSubDirs.forEach(subDir => {
      const dirPath = path.join(srcPath, 'screens', subDir);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });

  it('should have index files in each directory', () => {
    const dirsWithIndex = [
      'components',
      'screens',
      'services',
      'store',
      'navigation',
      'types',
      'utils',
    ];

    dirsWithIndex.forEach(dir => {
      const indexPath = path.join(srcPath, dir, 'index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
    });
  });

  it('should have configuration files in root', () => {
    const rootPath = path.join(__dirname, '..');
    const configFiles = [
      'package.json',
      'tsconfig.json',
      'app.json',
      'metro.config.js',
      'babel.config.js',
      'jest.config.js',
      'jest.setup.js',
    ];

    configFiles.forEach(file => {
      const filePath = path.join(rootPath, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});
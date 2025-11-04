import fs from 'fs';
import path from 'path';

// Helper function to remove numeric prefix from filename
function removeNumericPrefix(filename: string): string {
  // Match patterns like "01-filename.md", "1-filename.md", "001-filename.md"
  return filename.replace(/^\d+[-_]?/, '');
}

// Helper function to extract numeric order from filename
function extractOrder(filename: string): number {
  const match = filename.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : Infinity;
}

export function getMarkdownContent(filePath: string, locale?: string): string {
  const docsPath = locale
    ? path.join(process.cwd(), 'docs', locale, filePath)
    : path.join(process.cwd(), 'docs', filePath);
  const content = fs.readFileSync(docsPath, 'utf8');
  return content;
}

export function getAllMarkdownFiles(locale?: string): Array<{
  category: string;
  slug: string;
  title: string;
  filePath: string;
  order: number;
}> {
  const docsBaseDir = path.join(process.cwd(), 'docs');
  const docsDir = locale ? path.join(docsBaseDir, locale) : docsBaseDir;
  const files: Array<{
    category: string;
    slug: string;
    title: string;
    filePath: string;
    order: number;
  }> = [];

  function scanDirectory(dir: string, category: string = '') {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip language directories if we're already in a language-specific directory
        if (locale || !['en', 'zh', 'fr'].includes(item)) {
          scanDirectory(fullPath, item);
        }
      } else if (item.endsWith('.md')) {
        const originalSlug = item.replace('.md', '');
        const cleanSlug = removeNumericPrefix(originalSlug);
        const order = extractOrder(originalSlug);
        const content = fs.readFileSync(fullPath, 'utf8');
        const titleMatch = content.match(/^# (.+)$/m);
        const title = titleMatch ? titleMatch[1] : cleanSlug;

        files.push({
          category,
          slug: cleanSlug,
          title,
          filePath: path.join(category, originalSlug + '.md'),
          order
        });
      }
    }
  }

  scanDirectory(docsDir);

  // Sort files by order, then by filename
  files.sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.slug.localeCompare(b.slug);
  });

  return files;
}

// Function to find a file by clean slug (without numeric prefix)
export function findMarkdownFile(cleanSlug: string, category: string, locale?: string) {
  const files = getAllMarkdownFiles(locale);
  return files.find(file =>
    file.category === category && file.slug === cleanSlug
  );
}
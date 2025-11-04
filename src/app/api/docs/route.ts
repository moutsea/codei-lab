import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAllMarkdownFiles, findMarkdownFile } from '@/lib/markdown';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');
    const list = searchParams.get('list');
    const locale = searchParams.get('locale');

    // If list parameter is provided, return all documents
    if (list === 'true') {
      const allDocs = getAllMarkdownFiles(locale || undefined);
      return NextResponse.json(allDocs);
    }

    if (!file) {
      return NextResponse.json(
        { error: 'File parameter is required' },
        { status: 400 }
      );
    }

    // Parse file path to extract category and slug
    const pathParts = file.split('/');
    if (pathParts.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid file path format. Expected: category/filename' },
        { status: 400 }
      );
    }

    const [category, filename] = pathParts;
    const cleanSlug = filename.replace('.md', '');

    // Find the actual file with numeric prefix
    const fileData = findMarkdownFile(cleanSlug, category, locale || undefined);
    if (!fileData) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Security: Only allow files within the docs directory
    const docsBaseDir = path.join(process.cwd(), 'docs');
    const docsDir = locale ? path.join(docsBaseDir, locale) : docsBaseDir;
    const requestedPath = path.join(docsDir, fileData.filePath);

    // Ensure the requested path is within the docs directory
    if (!requestedPath.startsWith(docsBaseDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if file exists
    if (!fs.existsSync(requestedPath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file content
    const content = fs.readFileSync(requestedPath, 'utf8');

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error reading documentation file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
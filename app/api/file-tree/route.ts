import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

function readDirectory(dirPath: string): FileNode[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  const nodes: FileNode[] = entries.map((entry, index) => {
    if (entry.isDirectory()) {
      return {
        id: index.toString(),
        name: entry.name,
        type: 'directory',
        children: readDirectory(path.join(dirPath, entry.name))
      };
    } else {
      return {
        id: index.toString(),
        name: entry.name,
        type: 'file'
      };
    }
  });

  return nodes;
}

export async function GET() {
  const rootDir = process.cwd(); // Use the current working directory
  const dbtDir = path.join(rootDir, 'dbt_folder');
  const fileTree = readDirectory(dbtDir);
  console.log(fileTree)
  return NextResponse.json(fileTree);
}
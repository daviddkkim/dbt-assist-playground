"use client"

import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { type editor } from 'monaco-editor';
import { useEffect, useRef, useState } from "react";
import { CodeEditor } from "@/components/ui/editor";
import { Folder, Tree, File } from "@/components/ui/filetree";

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export default function Home() {
  // Store editor reference
  const editorRef = useRef<editor.IStandaloneCodeEditor>();

  editorRef.current?.onDidChangeCursorSelection((e) => {
    console.log(e.selection)
  })

  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    fetch('/api/file-tree')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch file tree');
        }
        return response.json();
      })
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setFileTree(data);
        }
      })
      .catch(error => {
        console.error('Error fetching file tree:', error);
        setError('Failed to load file tree');
      });
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }


  const renderFileTree = (nodes: FileNode[]) => {
    return nodes.map((file, i) => {
      if (file.type === 'file') {
        return (
          <File key={i} value={i.toString()}>
            <p>{file.name}</p>
          </File>
        );
      }
      return (
        <Folder key={file.id} value={file.id} element={file.name}>
          {file.children && file.children.length > 0 && renderFileTree(file.children)}
        </Folder>
      );
    });
  }

  return (
    <main className="h-screen overflow-hidden">
      <div className="h-[36px] bg-default border-b flex items-center px-4">
        <h1 className="text-sm font-medium">dbt Assist Playground</h1>
      </div>
      <PanelGroup direction="horizontal">
        <Panel defaultSize={15} minSize={15} className="bg-secondary">
          <Accordion type="multiple" defaultValue={["item-1"]} className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="px-4 py-2">Files</AccordionTrigger>
              <AccordionContent className="px-4">
                <Tree
                  className="overflow-hidden rounded-md"
                  elements={fileTree}
                >
                  {renderFileTree(fileTree)}
                </Tree>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Panel>
        <PanelResizeHandle className="border-l" />
        <Panel minSize={85} >
          <CodeEditor />
        </Panel>
      </PanelGroup>
    </main>
  );
}

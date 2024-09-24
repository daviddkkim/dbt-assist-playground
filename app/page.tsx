"use client"

import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { Monaco } from '@monaco-editor/react';
import { Input } from "@/components/ui/input";
import { useChat } from 'ai/react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { type editor } from 'monaco-editor';
import { useEffect, useRef, useState } from "react";
import { CodeEditor } from "@/components/ui/editor";
import PromptItem from "@/components/ui/promptItem";
import { Folder, Tree, File } from "@/components/ui/filetree";
import { SQLBlock } from "@/components/ui/sql";

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export default function Home() {
  // Store editor reference
  const editorRef = useRef<editor.IStandaloneCodeEditor>();

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, _monacoInstance: Monaco): void => {
    editorRef.current = editor;
  }

  editorRef.current?.onDidChangeCursorSelection((e) => {
    console.log(e.selection)
  })

  const getSelection = (): string => {
    if (editorRef.current) {
      return editorRef.current
        .getModel()!
        .getValueInRange(editorRef.current.getSelection()!)
    } else {
      return "";
    }
  }
  const [chat, setChat] = useState([]);
  const [textInput, setTextInput] = useState("");
  const { messages, input, handleInputChange, handleSubmit, setInput } = useChat();

  const [editedCode, setEditedCode] = useState("")

  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInput(chat.toString() + "\n\n" + textInput);
  }, [chat, textInput])


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
  console.log(fileTree)

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
        <Panel minSize={30} >
          <CodeEditor />
        </Panel>
        <PanelResizeHandle className="border-l" />
        <Panel defaultSize={30} minSize={30}>
          <div className="px-4 py-2 border-b">
            <span className="text-sm font-medium">Chat</span>
          </div>
          <ScrollArea >
            <div className="flex flex-col w-full max-w-md max-h-[calc(100vh-86px)] py-2 px-4 gap-2 mx-auto">
              {chat.map(m => (
                <pre className="border rounded-md p-2 text-xs bg-secondary/50">{m}</pre>
              ))}
              {messages.map(m => (
                <div key={m.id} className="whitespace-pre-wrap">
                  {m.role === 'user' ?
                    <PromptItem context={chat} message={textInput} />

                    : <>
                      <div className="px-2 py-1 border bg-primary text-primary-foreground rounded-md w-fit text-xs">AI</div>
                      <SQLBlock text={m.content} applyFunction={setEditedCode} /></>}

                </div>
              ))}

              <form onSubmit={handleSubmit} className="py-1">
                <Input
                  value={textInput}
                  placeholder="Ask me anything..."
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </form>
            </div>
          </ScrollArea>

        </Panel>
      </PanelGroup>
    </main>
  );
}

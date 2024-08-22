"use client"

import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import Editor, { DiffEditor, useMonaco, loader, Monaco } from '@monaco-editor/react';
import { Input } from "@/components/ui/input";
import { useChat } from 'ai/react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { type editor } from 'monaco-editor';
import { useEffect, useRef, useState } from "react";
import { CodeEditor } from "@/components/ui/editor";
import PromptItem from "@/components/ui/promptItem";
import { Folder, Tree, File } from "@/components/ui/filetree";



const ELEMENTS = [
  {
    id: "1",
    isSelectable: true,
    name: "src",
    children: [
      {
        id: "2",
        isSelectable: true,
        name: "app",
        children: [
          {
            id: "3",
            isSelectable: true,
            name: "layout.tsx",
          },
          {
            id: "4",
            isSelectable: true,
            name: "page.tsx",
          },
        ],
      },
      {
        id: "5",
        isSelectable: true,
        name: "components",
        children: [
          {
            id: "6",
            isSelectable: true,
            name: "header.tsx",
          },
          {
            id: "7",
            isSelectable: true,
            name: "footer.tsx",
          },
        ],
      },
      {
        id: "8",
        isSelectable: true,
        name: "lib",
        children: [
          {
            id: "9",
            isSelectable: true,
            name: "utils.ts",
          },
        ],
      },
    ],
  },
];


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
                  {fileTree.map((file) => {
                    if (file.type === 'file') {
                      return (
                        <File key={file.id} value={file.id}>
                          <p>{file.name}</p>
                        </File>
                      )
                    }
                    return <Folder key={file.id} value={file.id} element={file.name}></Folder>
                  })}

                </Tree>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </Panel>
        <PanelResizeHandle className="border-l" />
        <Panel minSize={30} >
          <CodeEditor chat={chat} setChat={setChat} />
          {/*   <Editor
            height="100vh"
            onChange={()=>{console.log("hello")}}
            defaultLanguage="sql"
            onMount={handleEditorDidMount}
            defaultValue={`
{{
  config(
    materialized='view'
  )
}}

with customers as (

    select * from {{ ref('stg_customers') }}

),

orders as (

    select * from {{ ref('stg_orders') }}

),

customer_orders as (

    select
        customer_id,

        min(order_date) as first_order_date,
        max(order_date) as most_recent_order_date,
        count(order_id) as number_of_orders

    from orders

    group by 1

),

final as (

    select
        customers.customer_id,
        customers.first_name,
        customers.last_name,
        customer_orders.first_order_date,
        customer_orders.most_recent_order_date,
        coalesce(customer_orders.number_of_orders, 0) as number_of_orders

    from customers

    left join customer_orders using (customer_id)

)

select * from final

`}
          /> */}
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
                      {m.content}</>}

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

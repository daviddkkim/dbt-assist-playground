import React, { useState, useRef } from 'react';
import MonacoEditor from 'react-monaco-editor';

export const CodeEditor = ({chat, setChat}) => {
  const [code, setCode] = useState(`
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
   
    
    `);
  const editorRef = useRef(null);

  const onChange = (newValue) => {
    console.log('onChange', newValue);
    setCode(newValue);
  };

  const editorDidMount = (editor) => {
    console.log('editorDidMount', editor, editor.getValue(), editor.getModel());
    editorRef.current = editor;
    bindEditorEvent(editor);
    addWidgets(editor);
  };

  const bindEditorEvent = (editor) => {
    editor.onDidChangeCursorPosition((evt) => {
      const { position } = evt;
      console.log('cursor position:', position);
      addWidgets(editor, { ...position });
    });
  };
  const getSelection = (editor) => {
    const selection = editor.getSelection();
    return editor.getModel().getValueInRange(selection).trim();
  };

  const addWidgets = (editor, position = { column: 1, lineNumber: 1 }) => {
    editor.addContentWidget({
      allowEditorOverflow: true,
      getDomNode: () => {
        if (document.getElementById('editor_widget_container')) {
          return document.getElementById('editor_widget_container');
        }
        const container = document.createElement('div');
        container.id = 'editor_widget_container';
        container.style.cssText= `
        display:flex;
        border: 1px solid #d5d5d5;
        border-radius: 6px;
        `
        container.style.display = 'flex';
        container.style.gap = '5px';

        const createButton = (text, onClick) => {
          const button = document.createElement('button');
          button.onclick = onClick;
          button.innerHTML = text;
          button.style.cssText = `
            font-size: 12px;
            line-height: 20px;
            background: white;
            border-radius: 6px;
            padding: 4px 8px;
            transition: background-color 0.3s ease;
          `;
          button.onmouseover = () => {
            button.style.backgroundColor = '#f0f0f0';
          };
          button.onmouseout = () => {
            button.style.backgroundColor = 'white';
          };
          return button;
        };

        const addToChatButton = createButton('Add to chat (⌘+k)', () => {
          const selection = getSelection(editor);
          setChat(prevChat => [...prevChat, selection]);
        });

        const explainCodeButton = createButton('Generate (⌘+g)', () => {
          editor.addContentWidget({
            allowEditorOverflow: true,
            getDomNode: () => {
              if (document.getElementById('editor_widget_container_2')) {
                return document.getElementById('editor_widget_container_2');
              }
              const container = document.createElement('div');
              container.id = 'editor_widget_container_2';
              container.style.cssText= `
              display:flex;
              border: 1px solid #d5d5d5;
              background-color: white;
              border-radius: 6px;
              `
              container.style.display = 'flex';
              container.style.gap = '5px';
              
              const input = document.createElement('input');
              input.type = 'text';
              input.placeholder = 'Enter your prompt';
              input.style.cssText = `
                flex: 1;
                font-size: 12px;
                height: 30px;
                width: 100%;
                              border-radius: 6px;
                padding: 2px 4px;
              `;

              const button2 =document.createElement('button');
              button2.innerHTML = 'Generate ';
              button2.style.cssText = `
                font-size: 12px;
                line-height: 20px;
                background: white;
                border-radius: 6px;
                padding: 1px 4px;
                transition: background-color 0.3s ease;
              `;
              button2.onmouseover = () => {
                button2.style.backgroundColor = '#f0f0f0';
              };
              button2.onmouseout = () => {
                button2.style.backgroundColor = 'white';
              };

      
              container.appendChild(input);
              container.appendChild(button2);

              return container;
            },
            getId: () => 'editor.author.avatar.widget',
            getPosition: () => ({
              position: position,
              preference: [1, 2]
            })
          });
        });

        container.appendChild(addToChatButton);
        container.appendChild(explainCodeButton);

        return container;
      },
      getId: () => 'editor.author.avatar.widget',
      getPosition: () => ({
        position: position,
        preference: [1, 2]
      })
    });
  };


  const options = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true, // Changed to true for better resizing
    minimap: { enabled: false }, // Disable minimap for cleaner look
    scrollBeyondLastLine: false, // Prevents scrolling beyond the last line
  };
  
  return (
    <MonacoEditor
      width="800px"
      language="sql"
      value={code}
      options={options}
      onChange={onChange}
      editorDidMount={editorDidMount}
      theme={"vs-light"}
    />
  );
};
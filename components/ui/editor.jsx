import { DiffEditor } from '@monaco-editor/react';
import React, { useState, useRef } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { getNewGenAnswer, getEditAnswer } from '@/app/generateAnswer';
import { getCodeAboveAndBelow } from '@/lib/splitCodeFile';

export const CodeEditor = ({ }) => {


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

  const [genCode, setGenCode] = useState("")
  const [suffixAndPrefix, setSuffixAndPrefix] = useState({
    suffix: "",
    prefix: ""
  })
  const editorRef = useRef(null);

  const onChange = (newValue) => {
    setCode(newValue);
  };

  const editorDidMount = (editor) => {
    editorRef.current = editor;
    bindEditorEvent(editor);
  };

  const bindEditorEvent = (editor) => {
    var viewZoneIdInline = null;
    editor.onDidChangeCursorPosition((evt) => {
      editor.removeContentWidget({
        getId: () => 'selectionwidget',
      });
      const { position } = evt;
      if (getSelection(editor).length < 1) {
        if (editor.getModel().getLineContent(evt.position.lineNumber).trim().length === 0) {
          editor.addContentWidget({
            getDomNode: () => {
              if (document.getElementById('editor_widget_container')) {
                return document.getElementById('editor_widget_container');
              }
              const container = document.createElement('div');
              container.id = 'editor_widget_container';
              container.style.cssText = `
            display:flex;
            border-radius: 6px;
            padding-left: 24px;
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
                background: transparent;
                color: #9CA3AF;
                padding: 0px;
                border:none;
                outline: none;

                transition: background-color 0.3s ease;
              `;
                button.onmouseover = () => {
                  button.style.color = '#4B5563';
                };
                button.onmouseout = () => {
                  button.style.color = '#9CA3AF';
                };
                return button;
              };

              const explainCodeButton = createButton('Generate', () => {
                editor.changeViewZones(function (changeAccessor) {
                  if (viewZoneIdSelection !== null) {
                    changeAccessor.removeZone(viewZoneIdSelection);
                  }
                  if (viewZoneIdInline !== null) {
                    changeAccessor.removeZone(viewZoneIdInline)
  
                  }
                  editor.removeContentWidget({
                    getId: () => 'inlineGen',
                  });
                  var domNode = document.createElement("div");
                  const id = changeAccessor.addZone({
                    afterLineNumber: editor.getSelection().startLineNumber - 1,
                    heightInLines: 4,
                    domNode: domNode,
                  });
                  viewZoneIdInline = id;
                });
                editor.addContentWidget({
                  allowEditorOverflow: true,
                  getDomNode: () => {
                    if (document.getElementById('editor_widget_container_2')) {
                      return document.getElementById('editor_widget_container_2');
                    }
                    const container = document.createElement('form');
                    container.id = 'editor_widget_container_2';
                    container.style.cssText = `
              display:flex;
              border: 1px solid #d5d5d5;
              background-color: white;
              border-radius: 6px;
              width: 320px;
              padding: 4px;
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
                    const button2 = document.createElement('button');
                    button2.innerHTML = 'Generate';
                    button2.type = "submit"
                    button2.style.cssText = `
                margin-top: 4px;
                background-color: #FF694A;
                color: white;
                font-size: 12px;
                line-height: 20px;
                border-radius: 6px;
                padding: 2px 8px;
                transition: background-color 0.3s ease;
              `;
                    const handleSubmit = async (event) => {
                      event.preventDefault();
                      const button = event.target.querySelector('button');
                      button.disabled = true;
                      button.innerHTML = 'Generating...';
                      button.style.backgroundColor = '#cccccc';

                      const promptText = input.value.trim();
                      if (promptText) {
                        const selectionRange = editor.getSelection(); // Get selection range

                        const startLine = selectionRange.startLineNumber; // Start line number
                        const endLine = selectionRange.endLineNumber; // End line number
                        const { prefix, suffix } = getCodeAboveAndBelow(editor, startLine, endLine);
                        const { text } = await getNewGenAnswer({
                          prefix: prefix,
                          suffix: suffix,
                          promptText: promptText
                        });
                        setGenCode(text);
                        setSuffixAndPrefix({
                          suffix: suffix,
                          prefix: prefix
                        })
                        console.log(text)
                      } else {
                        console.log('Please enter a prompt before generating');
                      }
                    };
                    button2.onmouseover = () => {
                      button2.style.backgroundColor = '#FF4A2C';
                    };
                    button2.onmouseout = () => {
                      button2.style.backgroundColor = '#FF694A';
                    };

                    container.onsubmit = handleSubmit;

                    container.appendChild(input);
                    container.appendChild(button2);

                    return container;
                  },
                  getId: () => 'editPrompt',
                  getPosition: () => ({
                    position: { column: 1, lineNumber: editor.getSelection().startLineNumber }, // Use the current cursor position
                    preference: [1, 2]
                  })
                });
              });

              container.appendChild(explainCodeButton);

              return container;
            },
            getId: () => 'inlineGen',
            getPosition: () => ({
              position: { column: 1, lineNumber: position.lineNumber + 1 }, // Use the current cursor position
              preference: [1, 2]
            })

          })
        }
      }
    });

    var viewZoneIdSelection = null;
    editor.onDidChangeCursorSelection((evt) => {
      // Handle cursor selection change event
      const { selection } = evt;
      if (selection.endColumn !== selection.startColumn || selection.endLine !== selection.startLine) {

        editor.addContentWidget({
          allowEditorOverflow: true,
          getDomNode: () => {
            if (document.getElementById('editor_widget_container')) {
              return document.getElementById('editor_widget_container');
            }
            const container = document.createElement('div');
            container.id = 'editor_widget_container';
            container.style.cssText = `
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
            const explainCodeButton = createButton('Edit', () => {
              editor.changeViewZones(function (changeAccessor) {
                if (viewZoneIdSelection !== null) {
                  changeAccessor.removeZone(viewZoneIdSelection);
                }
                if (viewZoneIdInline !== null) {
                  changeAccessor.removeZone(viewZoneIdInline)

                }

                var domNode = document.createElement("div");
                const id = changeAccessor.addZone({
                  afterLineNumber: editor.getSelection().startLineNumber - 1,
                  heightInLines: 4,
                  domNode: domNode,
                });
                viewZoneIdSelection = id;
              });
              editor.addContentWidget({
                allowEditorOverflow: true,
                getDomNode: () => {
                  if (document.getElementById('editor_widget_container_2')) {
                    return document.getElementById('editor_widget_container_2');
                  }
                  const container = document.createElement('form');
                  container.id = 'editor_widget_container_2';
                  container.style.cssText = `
              display:flex;
              border: 1px solid #d5d5d5;
              background-color: white;
              border-radius: 6px;
              width: 320px;
              padding: 4px;
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
                  const button2 = document.createElement('button');
                  button2.innerHTML = 'Generate';
                  button2.type = "submit"
                  button2.style.cssText = `
                margin-top: 4px;
                background-color: #FF694A;
                color: white;
                font-size: 12px;
                line-height: 20px;
                border-radius: 6px;
                padding: 2px 8px;
                transition: background-color 0.3s ease;
              `;
                  const handleSubmit = async (event) => {
                    event.preventDefault();
                    const button = event.target.querySelector('button');
                    button.disabled = true;
                    button.innerHTML = 'Generating...';
                    button.style.backgroundColor = '#cccccc';

                    const promptText = input.value.trim();
                    if (promptText) {
                      const selection = getSelection(editor);
                      const selectionRange = editor.getSelection(); // Get selection range

                      const startLine = selectionRange.startLineNumber; // Start line number
                      const endLine = selectionRange.endLineNumber; // End line number
                      const { prefix, suffix } = getCodeAboveAndBelow(editor, startLine, endLine);
                      const { text } = await getEditAnswer({
                        prefix: prefix,
                        suffix: suffix,
                        selection: selection,
                        promptText: promptText
                      });
                      setGenCode(text);
                      setSuffixAndPrefix({
                        suffix: suffix,
                        prefix: prefix
                      })
                      console.log(text)
                    } else {
                      console.log('Please enter a prompt before generating');
                    }
                  };
                  button2.onmouseover = () => {
                    button2.style.backgroundColor = '#FF4A2C';
                  };
                  button2.onmouseout = () => {
                    button2.style.backgroundColor = '#FF694A';
                  };

                  container.onsubmit = handleSubmit;

                  container.appendChild(input);
                  container.appendChild(button2);

                  return container;
                },
                getId: () => 'editPrompt',
                getPosition: () => ({
                  position: { column: 1, lineNumber: editor.getSelection().startLineNumber }, // Use the current cursor position
                  preference: [1, 2]
                })
              });
            });

            container.appendChild(explainCodeButton);

            return container;
          },
          getId: () => 'selectionwidget',
          getPosition: () => ({
            position: {
              lineNumber: selection.positionLineNumber,
              column: selection.positionColumn
            },
            preference: [1, 2]
          })
        });
      }

    });
  };
  const getSelection = (editor) => {
    const selection = editor.getSelection();
    return editor.getModel().getValueInRange(selection).trim();
  };

  const addWidgets = (editor, position = { endColumn: 1, endLineNumber: 1, positionColumn: 1, positionLineNumber: 1, selectionStartColumn: 1, selectionStartLineNumber: 1, startColumn: 1, startLineNumber: 1 }) => {

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
    <>
      {genCode.length > 1 ?
        <>
          <DiffEditor
            original={code}
            modified={suffixAndPrefix.prefix + '\n' + genCode + '\n' + suffixAndPrefix.suffix}
            options={{ renderSideBySide: false }}
          />
        </> : <MonacoEditor
          width="1264px"
          language="sql"
          value={code}
          options={options}
          onChange={onChange}
          editorDidMount={editorDidMount}
          theme={"vs-light"}
        />}
    </>
  );
};
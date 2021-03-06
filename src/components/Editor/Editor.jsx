/********************************************************************************
 * Copyright (c) 2018 - 2020 Contributors to the Eclipse Foundation
 * 
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 * 
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 * 
 * SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 ********************************************************************************/
import React, { useContext, useState, useRef } from 'react';
import MonacoEditor from 'react-monaco-editor';
import ediTDorContext from '../../context/ediTDorContext';

const mapping = require('../../assets/mapping.json')

const tdSchema = {
  fileMatch: ["*/*"],
  uri: "https://raw.githubusercontent.com/thingweb/thingweb-playground/%40thing-description-playground/web%401.0.0/packages/playground-core/td-schema.json"
};

//List of all Options can be found here: https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.ieditorconstructionoptions.html
const editorOptions = {
  selectOnLineNumbers: true,
  automaticLayout: true,
  lineDecorationsWidth: 20
};

const JSONEditorComponent = (props) => {
  const context = useContext(ediTDorContext);
  const [schemas] = useState([]);
  const [proxy, setProxy] = useState(undefined);
  const editorInstance = useRef(null);


  const editorWillMount = (monaco) => {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      enableSchemaRequest: true,
      schemas: [tdSchema]
    });
    if (!("Proxy" in window)) {
      console.warn("Your browser doesn't support Proxies.");
      return;
    }

    let proxy = new Proxy(schemas, {
      set: function (target, property, value, _) {
        target[property] = value;

        let jsonSchemaObjects = [tdSchema];
        for (let i = 0; i < target.length; i++) {
          jsonSchemaObjects.push(
            {
              fileMatch: ["*/*"],
              uri: target[i]
            }
          );
        }

        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          enableSchemaRequest: true,
          schemas: jsonSchemaObjects
        });

        return true;

      },
    });
    setProxy(proxy);
  }

  const editorDidMount = (editor, monaco) => {
    editor.onDidChangeModelDecorations(() => {
      const model = editor.getModel();
      if (model === null || model.getModeId() !== "json")
        return;
    });
  }

  const addSchema = (val) => {
    if (proxy.includes(val)) {
      return;
    }
    proxy.push(val);
  }

  const removeSchema = (val) => {
    const index = proxy.indexOf(val);
    if (index === -1) {
      return;
    }
    proxy.splice(index, 1);
  }

  const emptySchemas = () => {
    proxy.splice(0, this.state.proxy.length);
  }

  const fetchSchema = async (target) => {
    if (proxy.includes(target)) {
      return;
    }

    try {
      const url = new URL(target);
      const res = await fetch(url);

      const schema = await res.json();
      return schema;

    } catch (e) {
      console.error(e);
    }
  }



  const onChange = async (editorText, _) => {
    try {
      const json = JSON.parse(editorText);
      if (!('@context' in json)) {
        emptySchemas();
        return;
      }

      const atContext = json["@context"];
      
      // handle if @context is a string
      if (typeof atContext === 'string') {
        if (mapping[atContext] !== undefined) {
          const schema = await fetchSchema(atContext);
          if (schema) {
            addSchema(atContext);
          } else {
            emptySchemas();
          }
          return;
        }
      }
      
      // handle if @context is an array
      if (Array.isArray(atContext)) {
        for (let i = 0; i < atContext.length; i++) {
          if (typeof atContext[i] === 'string') {
            if (mapping[atContext] !== undefined) {
              const schema = await fetchSchema(atContext[i]);
              if (schema) {
                addSchema(atContext[i]);
              }
            }
          }
          if (typeof atContext[i] === 'object') {
            Object.keys(atContext[i]).forEach(async contextKey => {
              if (mapping[atContext[i][contextKey]] !== undefined) {
                const schema = await fetchSchema(mapping[atContext[i][contextKey]]);
                if (schema) {
                  addSchema(mapping[atContext[i][contextKey]]);
                }
              }
            })
          }
        }
      }
      // remove deleted schemas
      if (Array.isArray(atContext)) {
        for (let i = 0; i < proxy.length; i++) {
          const x = Object.keys(mapping).find(key => mapping[key] === proxy[i])
          if (!atContext.includes(x)) {
            removeSchema(proxy[i]);
          }
        }
      }
    } catch (e) {
    }finally {
      context.updateOfflineTD(editorText, 'Editor')
    }
  }

  return (
    <div className="w-full h-full">
      <MonacoEditor
        options={editorOptions}
        theme={'vs-' + context.theme}
        language="json"
        ref={editorInstance}
        value={context.offlineTD}
        editorWillMount={editorWillMount}
        editorDidMount={editorDidMount}
        onChange={async (editorText) => { await onChange(editorText) }} />
    </div>
  );
}

export default JSONEditorComponent
// Modern code editor with CodeMirror 6 - Single bundle approach

import { 
    EditorView, 
    EditorState, 
    basicSetup 
} from 'https://esm.sh/codemirror@6.0.1?bundle';

// Default Mermaid code
const defaultCode = `sequenceDiagram
    actor C as Consumer (C)
    participant I as Intermediary (I)
    participant B as Broker (B)
    
    Note over B: $$(sk_B, pk_B)\\leftarrow KeyGen(1^\\lambda)$$
    B ->> I: $$pk_B$$
    C ->> I: Start
    I ->> C: $$ \\{ pk_{B_j} \\}_{j \\in [m]} $$
    Note over C: $$ (sk_U, pk_U) \\leftarrow KeyGen(1^\\lambda) $$
    Note over C: $$ c_i := Enc_{pk_U}(x_i),\\ \\forall i \\in [n] $$
    Note over C: $$ rk_{U\\to B_j} \\leftarrow ReKeyGen(sk_U, pk_{B_j}),\\ \\forall j \\in [m] $$
    C ->> I: $$ \\{ c_i \\}_{i \\in [n]},\\ \\{ rk_{U \\to B_j} \\}_{j \\in [m]} $$
    Note over I: TODO
    I ->> B: DO PLI
    B ->> I: Response $$ \\{ delete/opt\\!-\\!out \\|\\ Enc_{pk_U}(\\text{data}) \\} $$
    I ->> C: Forward broker's response`;

// Global editor instance
let codeEditorView = null;

// Initialize the code editor
function initializeCodeEditor() {
    const editorElement = document.getElementById('codeEditor');
    if (!editorElement) return;

    // Create editor state with minimal setup to avoid conflicts
    const startState = EditorState.create({
        doc: defaultCode,
        extensions: [
            basicSetup,
            EditorView.theme({
                '&': {
                    fontSize: '14px',
                    fontFamily: '"Fira Code", "Monaco", "Menlo", "Ubuntu Mono", monospace',
                    backgroundColor: '#282c34',
                    color: '#abb2bf'
                },
                '.cm-content': {
                    padding: '20px',
                    minHeight: '300px',
                    backgroundColor: '#282c34',
                    color: '#abb2bf'
                },
                '.cm-focused': {
                    outline: 'none'
                },
                '.cm-editor': {
                    borderRadius: '0 0 8px 8px',
                    backgroundColor: '#282c34'
                },
                '.cm-scroller': {
                    fontFamily: '"Fira Code", "Monaco", "Menlo", "Ubuntu Mono", monospace',
                    backgroundColor: '#282c34'
                },
                '.cm-gutters': {
                    backgroundColor: '#21252b',
                    color: '#5c6370',
                    border: 'none',
                    borderRadius: '0 0 0 8px'
                },
                '.cm-lineNumbers': {
                    color: '#5c6370'
                },
                '.cm-activeLineGutter': {
                    backgroundColor: '#2c313c'
                },
                '.cm-activeLine': {
                    backgroundColor: '#2c313c'
                },
                '.cm-cursor': {
                    borderLeftColor: '#528bff'
                },
                '.cm-selectionBackground': {
                    backgroundColor: '#3e4451'
                }
            }),
            EditorView.lineWrapping,
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    // Update status when content changes
                    const status = document.getElementById('status');
                    if (status) {
                        status.textContent = 'Code modified - click Render to see changes';
                        status.className = 'status';
                    }
                }
            })
        ]
    });

    // Create the editor view
    codeEditorView = new EditorView({
        state: startState,
        parent: editorElement
    });

    console.log('CodeMirror editor initialized');
}

// Get current editor content
function getEditorContent() {
    if (codeEditorView) {
        return codeEditorView.state.doc.toString();
    }
    return '';
}

// Set editor content
function setEditorContent(content) {
    if (codeEditorView) {
        const transaction = codeEditorView.state.update({
            changes: {
                from: 0,
                to: codeEditorView.state.doc.length,
                insert: content
            }
        });
        codeEditorView.dispatch(transaction);
    }
}

// Make functions globally available
window.getEditorContent = getEditorContent;
window.setEditorContent = setEditorContent;
window.codeEditorView = () => codeEditorView;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCodeEditor);
} else {
    initializeCodeEditor();
}
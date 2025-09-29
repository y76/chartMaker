// Simple and reliable code editor with CodeMirror 5

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
let codeEditor = null;

// Initialize the code editor
function initializeCodeEditor() {
    const editorElement = document.getElementById('codeEditor');
    if (!editorElement || !window.CodeMirror) {
        console.log('CodeMirror not ready yet, retrying...');
        setTimeout(initializeCodeEditor, 100);
        return;
    }

    // Check if there's shared data in URL - if so, start with empty editor
    const urlParams = new URLSearchParams(window.location.search);
    const hasSharedData = urlParams.get('data');
    const initialCode = hasSharedData ? '' : defaultCode;
    
    console.log('Initializing editor with', hasSharedData ? 'empty content (shared data detected)' : 'default code');

    // Create CodeMirror editor
    codeEditor = CodeMirror(editorElement, {
        value: initialCode,
        mode: 'mermaid',
        theme: 'default',
        lineNumbers: true,
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        styleActiveLine: true,
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        extraKeys: {
            "Ctrl-Space": "autocomplete",
            "Tab": function(cm) {
                if (cm.somethingSelected()) {
                    cm.indentSelection("add");
                } else {
                    cm.replaceSelection("    ");
                }
            }
        }
    });

    // Update status when content changes
    codeEditor.on('change', function() {
        const status = document.getElementById('status');
        if (status) {
            status.textContent = 'Code modified - click Render to see changes';
            status.className = 'status';
        }
    });


    // Set editor height to fill container
    codeEditor.setSize(null, "100%");

    console.log('CodeMirror editor initialized successfully');
}

// Get current editor content
function getEditorContent() {
    if (codeEditor) {
        return codeEditor.getValue();
    }
    return '';
}

// Set editor content
function setEditorContent(content) {
    if (codeEditor) {
        codeEditor.setValue(content);
    }
}

// Make functions globally available
window.getEditorContent = getEditorContent;
window.setEditorContent = setEditorContent;
window.codeEditor = () => codeEditor;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCodeEditor);
} else {
    initializeCodeEditor();
}
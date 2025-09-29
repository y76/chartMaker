// Event handlers and keyboard shortcuts

// Allow Enter+Ctrl to render
document.addEventListener('DOMContentLoaded', function() {
    const codeEditor = document.getElementById('codeEditor');
    
    if (codeEditor) {
        codeEditor.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                renderDiagram();
            }
        });
    }
});
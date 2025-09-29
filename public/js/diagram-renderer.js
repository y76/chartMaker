// Diagram rendering functionality

let diagramCounter = 0;

async function renderDiagram() {
    const diagramContainer = document.getElementById('diagramContainer');
    const status = document.getElementById('status');

    // Get code from CodeMirror editor
    const code = window.getEditorContent ? window.getEditorContent().trim() : '';

    if (!code) {
        status.textContent = 'Please enter some Mermaid code';
        status.className = 'status error';
        return;
    }

    status.textContent = 'Rendering...';
    status.className = 'status';

    try {
        // Clear previous diagram
        diagramContainer.innerHTML = '';

        // Create unique ID for this diagram
        const diagramId = `mermaid-${++diagramCounter}`;

        // Render the diagram
        const { svg } = await window.mermaid.render(diagramId, code);

        // Insert the SVG
        diagramContainer.innerHTML = svg;

        status.textContent = 'Rendered successfully!';
        status.className = 'status success';

    } catch (error) {
        console.error('Mermaid render error:', error);
        diagramContainer.innerHTML = `<div class="error-message">Error rendering diagram:\n${error.message}</div>`;
        status.textContent = 'Render failed - check your syntax';
        status.className = 'status error';
    }
}

async function applyCustomColors() {
    const diagramContainer = document.getElementById('diagramContainer');
    const status = document.getElementById('status');

    // Check if there's a rendered diagram
    const svg = diagramContainer.querySelector('svg');
    if (!svg) {
        status.textContent = 'Please render a diagram first';
        status.className = 'status error';
        return;
    }

    status.textContent = 'Applying custom colors...';
    status.className = 'status';

    try {
        // Apply custom colors
        colorParticipants(diagramContainer);

        status.textContent = 'Custom colors applied successfully!';
        status.className = 'status success';

    } catch (error) {
        console.error('Color application error:', error);
        status.textContent = 'Failed to apply custom colors';
        status.className = 'status error';
    }
}
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
        
        // Fix tilde accents for better rendering
        if (window.fixTildeAccents) {
            fixTildeAccents(diagramContainer);
        }

        status.textContent = 'Custom colors applied successfully!';
        status.className = 'status success';

    } catch (error) {
        console.error('Color application error:', error);
        status.textContent = 'Failed to apply custom colors';
        status.className = 'status error';
    }
}

// Re-render diagram while preserving position modifications
async function rerenderWithPositions() {
    const status = document.getElementById('status');
    
    // Store current position modifications before re-rendering
    const savedPositions = window.getCurrentPositionModifications ? window.getCurrentPositionModifications() : {};
    
    console.log('Re-rendering with position preservation. Saved positions:', savedPositions);
    
    status.textContent = 'Re-rendering diagram...';
    status.className = 'status';
    
    try {
        // First, render the diagram normally
        await renderDiagram();
        
        // Then apply colors if there are participants
        if (window.participants && window.participants.length > 0) {
            status.textContent = 'Reapplying colors...';
            status.className = 'status';
            
            setTimeout(() => {
                if (window.applyCustomColors) {
                    applyCustomColors();
                }
                
                // Apply saved positions after a short delay
                setTimeout(() => {
                    if (Object.keys(savedPositions).length > 0 && window.applyStoredPositions) {
                        status.textContent = 'Restoring positions...';
                        status.className = 'status';
                        
                        window.applyStoredPositions(savedPositions);
                        
                        status.textContent = 'Diagram re-rendered with preserved positions!';
                        status.className = 'status success';
                    } else {
                        status.textContent = 'Diagram re-rendered successfully!';
                        status.className = 'status success';
                    }
                }, 300);
                
            }, 500);
        } else {
            // Apply saved positions even without colors
            setTimeout(() => {
                if (Object.keys(savedPositions).length > 0 && window.applyStoredPositions) {
                    status.textContent = 'Restoring positions...';
                    status.className = 'status';
                    
                    window.applyStoredPositions(savedPositions);
                    
                    status.textContent = 'Diagram re-rendered with preserved positions!';
                    status.className = 'status success';
                } else {
                    status.textContent = 'Diagram re-rendered successfully!';
                    status.className = 'status success';
                }
            }, 300);
        }
        
    } catch (error) {
        console.error('Re-render with positions error:', error);
        status.textContent = 'Failed to re-render diagram';
        status.className = 'status error';
    }
}
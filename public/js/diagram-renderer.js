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
        
        // Number all lines for unique identification
        numberDiagramElements(diagramContainer);
        
        // Automatically bring notes to front
        if (window.bringNotesToFront) {
            bringNotesToFront(diagramContainer);
        }

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
    
    // Store current position, color, and loop modifications before re-rendering
    const savedPositions = window.getCurrentPositionModifications ? window.getCurrentPositionModifications() : {};
    const savedColors = window.getCurrentColorModifications ? window.getCurrentColorModifications() : {};
    const savedLoopFlips = window.getCurrentLoopFlips ? window.getCurrentLoopFlips() : [];
    
    console.log('Re-rendering with modifications preservation. Saved positions:', savedPositions);
    console.log('Saved colors:', savedColors);
    console.log('Saved loop flips:', savedLoopFlips);
    
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
                
                        // Apply saved modifications in the right order: flips first, then positions
                        setTimeout(() => {
                            if (savedLoopFlips.length > 0 && window.applyLoopFlips) {
                                status.textContent = 'Restoring loop flips...';
                                status.className = 'status';
                                
                                window.applyLoopFlips(savedLoopFlips);
                            }
                            
                            if (Object.keys(savedPositions).length > 0 && window.applyStoredPositions) {
                                status.textContent = 'Restoring positions...';
                                status.className = 'status';
                                
                                setTimeout(() => {
                                    window.applyStoredPositions(savedPositions);
                                }, 200);
                            }
                            
                            if (Object.keys(savedColors).length > 0 && window.applyStoredColors) {
                                status.textContent = 'Restoring element colors...';
                                status.className = 'status';
                                
                                setTimeout(() => {
                                    window.applyStoredColors(savedColors);
                                }, 400);
                            }
                            
                            // Automatically bring notes to front after all modifications
                            setTimeout(() => {
                                if (window.bringNotesToFront) {
                                    const diagramContainer = document.getElementById('diagramContainer');
                                    bringNotesToFront(diagramContainer);
                                }
                            }, 600);
                    
                    setTimeout(() => {
                        const hasModifications = Object.keys(savedPositions).length > 0 || Object.keys(savedColors).length > 0 || savedLoopFlips.length > 0;
                        if (hasModifications) {
                            status.textContent = 'Diagram re-rendered with preserved modifications!';
                        } else {
                            status.textContent = 'Diagram re-rendered successfully!';
                        }
                        status.className = 'status success';
                    }, 700);
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

// Number diagram elements for unique identification
function numberDiagramElements(container) {
    const svg = container.querySelector('svg');
    if (!svg) return;
    
    console.log('Numbering diagram elements for unique identification...');
    
    // Number all lines
    const lines = svg.querySelectorAll('line');
    lines.forEach((line, index) => {
        line.classList.add(`numbered-line-${index}`);
        line.setAttribute('data-line-number', index);
    });
    
    // Number all paths  
    const paths = svg.querySelectorAll('path');
    paths.forEach((path, index) => {
        path.classList.add(`numbered-path-${index}`);
        path.setAttribute('data-path-number', index);
    });
    
    // Number all groups
    const groups = svg.querySelectorAll('g');
    groups.forEach((group, index) => {
        group.classList.add(`numbered-group-${index}`);
        group.setAttribute('data-group-number', index);
    });
    
    // Number all foreignObjects
    const foreignObjects = svg.querySelectorAll('foreignObject');
    foreignObjects.forEach((foreignObj, index) => {
        foreignObj.classList.add(`numbered-foreign-${index}`);
        foreignObj.setAttribute('data-foreign-number', index);
    });
    
    console.log(`Numbered ${lines.length} lines, ${paths.length} paths, ${groups.length} groups, ${foreignObjects.length} foreignObjects`);
}
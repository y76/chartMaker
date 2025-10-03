// Interactive diagram editor for fine-tuning element positions

let isInteractiveMode = false;
let currentPopup = null;
let positionModifications = {}; // Store all position changes
let colorModifications = {}; // Store all color changes
let loopFlips = new Set(); // Store flipped loop paths (simple set)

// Toggle interactive mode
function toggleInteractiveMode() {
    isInteractiveMode = !isInteractiveMode;
    const status = document.getElementById('status');
    
    if (isInteractiveMode) {
        enableInteractiveMode();
        status.textContent = 'Interactive mode ON - Click elements to adjust positions';
        status.className = 'status success';
    } else {
        disableInteractiveMode();
        status.textContent = 'Interactive mode OFF';
        status.className = 'status';
    }
}

// Enable interactive mode
function enableInteractiveMode() {
    const diagramContainer = document.getElementById('diagramContainer');
    const svg = diagramContainer.querySelector('svg');
    if (!svg) return;

    // Add click listeners to groups and standalone elements
    const groups = svg.querySelectorAll('g');
    const standaloneElements = svg.querySelectorAll('foreignObject, line[class*="actor-line"], path');
    
    // Handle groups (like note boxes with rect + text)
    groups.forEach(group => {
        const rect = group.querySelector('rect');
        const text = group.querySelector('text');
        
        if (rect && text) {
            // This is a logical group (note, participant box, etc.)
            [rect, text].forEach(element => {
                element.style.cursor = 'pointer';
                element.addEventListener('click', (event) => handleGroupClick(event, group));
                
                // Add hover effect to the whole group
                element.addEventListener('mouseenter', () => {
                    rect.style.opacity = '0.8';
                    rect.style.outline = '2px solid #007acc';
                    text.style.opacity = '0.8';
                });
                
                element.addEventListener('mouseleave', () => {
                    rect.style.opacity = '1';
                    rect.style.outline = 'none';
                    text.style.opacity = '1';
                });
            });
        }
    });
    
    // Handle standalone elements including text, foreignObject, and all lines
    const allStandaloneElements = svg.querySelectorAll('foreignObject, line, path, text:not(g text)');
    
    allStandaloneElements.forEach(element => {
        element.style.cursor = 'pointer';
        element.addEventListener('click', handleElementClick);
        
        // Add hover effect
        element.addEventListener('mouseenter', () => {
            element.style.opacity = '0.8';
            element.style.outline = '2px solid #007acc';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.opacity = '1';
            element.style.outline = 'none';
        });
    });
    
    console.log(`Interactive mode enabled for ${groups.length} groups and ${allStandaloneElements.length} standalone elements`);
}

// Disable interactive mode
function disableInteractiveMode() {
    const diagramContainer = document.getElementById('diagramContainer');
    const svg = diagramContainer.querySelector('svg');
    if (!svg) return;

    // Remove all event listeners and styling
    const elements = svg.querySelectorAll('*');
    elements.forEach(element => {
        element.style.cursor = '';
        element.style.opacity = '';
        element.style.outline = '';
        element.removeEventListener('click', handleElementClick);
    });
    
    // Close any open popup
    closePositionPopup();
    
    console.log('Interactive mode disabled');
}

// Handle element click
function handleElementClick(event) {
    event.stopPropagation();
    
    if (!isInteractiveMode) return;
    
    let element = event.target;
    
    // If we clicked on a math element inside a foreignObject, target the foreignObject instead
    if (element.tagName === 'mtext' || element.tagName === 'mi' || element.tagName === 'mo' || 
        element.tagName === 'mn' || element.tagName === 'msub' || element.tagName === 'math' ||
        element.classList.contains('katex')) {
        
        // Find the parent foreignObject
        const foreignObject = element.closest('foreignObject');
        if (foreignObject) {
            element = foreignObject;
            console.log('Redirected click from math element to foreignObject');
        }
    }
    
    showPositionPopup(element, event);
}

// Handle group click (for rect + text combinations)
function handleGroupClick(event, group) {
    event.stopPropagation();
    
    if (!isInteractiveMode) return;
    
    // Use the group as the target element
    showPositionPopup(group, event);
}

// Show position adjustment popup
function showPositionPopup(element, event) {
    // Close existing popup
    closePositionPopup();
    
    // Get element info
    const elementInfo = getElementInfo(element);
    
    console.log('Showing popup for element:', element.tagName, elementInfo);
    
    // Debug path coordinates specifically
    if (element.tagName === 'path') {
        const pathData = element.getAttribute('d') || '';
        console.log('Path data:', pathData);
        console.log('Popup will show coordinates:', elementInfo.x, elementInfo.y);
    }
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'position-popup';
    popup.innerHTML = `
        <div class="popup-header">
            <h4>Adjust Position</h4>
            <button class="popup-close" onclick="closePositionPopup()">×</button>
        </div>
        <div class="popup-content">
            <div class="element-info">
                <strong>Element:</strong> ${elementInfo.type}<br>
                <strong>Content:</strong> ${elementInfo.content}
            </div>
            <div class="position-controls">
                <div class="control-row">
                    <label>X Position:</label>
                    <input type="number" id="pos-x" value="${elementInfo.x}" step="1">
                    <button onclick="adjustPosition('x', -5)">-5</button>
                    <button onclick="adjustPosition('x', -1)">-1</button>
                    <button onclick="adjustPosition('x', 1)">+1</button>
                    <button onclick="adjustPosition('x', 5)">+5</button>
                </div>
                <div class="control-row">
                    <label>Y Position:</label>
                    <input type="number" id="pos-y" value="${elementInfo.y}" step="1">
                    <button onclick="adjustPosition('y', -5)">-5</button>
                    <button onclick="adjustPosition('y', -1)">-1</button>
                    <button onclick="adjustPosition('y', 1)">+1</button>
                    <button onclick="adjustPosition('y', 5)">+5</button>
                </div>
            </div>
            ${elementInfo.hasColorControls ? `
            <div class="color-controls">
                <h5>Colors</h5>
                <div class="control-row">
                    <label>Fill:</label>
                    <input type="color" id="element-fill" value="${elementInfo.fillColor}" onchange="updateElementColor('fill', this.value)">
                </div>
                <div class="control-row">
                    <label>Border:</label>
                    <input type="color" id="element-stroke" value="${elementInfo.strokeColor}" onchange="updateElementColor('stroke', this.value)">
                </div>
            </div>
            ` : ''}
            <div class="popup-actions">
                <button onclick="applyPosition()">Apply</button>
                <button onclick="resetPosition()">Reset</button>
                ${elementInfo.isLoop ? '<button onclick="flipLoop()">🔄 Flip Loop</button>' : ''}
                <button onclick="closePositionPopup()">Close</button>
            </div>
        </div>
    `;
    
    // Position popup near the click with better screen edge handling
    popup.style.position = 'fixed';
    
    // Calculate position with larger popup dimensions
    const popupWidth = 320;
    const popupHeight = 450;
    
    let left = event.clientX + 10;
    let top = event.clientY + 10;
    
    // Adjust if popup would go off the right edge
    if (left + popupWidth > window.innerWidth) {
        left = event.clientX - popupWidth - 10;
    }
    
    // Adjust if popup would go off the bottom edge
    if (top + popupHeight > window.innerHeight) {
        top = window.innerHeight - popupHeight - 10;
    }
    
    // Ensure popup doesn't go off the left or top edges
    left = Math.max(10, left);
    top = Math.max(10, top);
    
    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
    popup.style.zIndex = '10000';
    
    document.body.appendChild(popup);
    currentPopup = { popup, element, elementInfo, originalX: elementInfo.x, originalY: elementInfo.y };
}

// Get element information
function getElementInfo(element) {
    let x = 0, y = 0, content = '', type = element.tagName.toLowerCase();
    
    // If this is a math element, find the parent foreignObject
    if (element.tagName === 'mtext' || element.tagName === 'mi' || element.tagName === 'mo' || 
        element.tagName === 'mn' || element.tagName === 'msub' || element.tagName === 'math' ||
        element.classList.contains('katex')) {
        
        const foreignObject = element.closest('foreignObject');
        if (foreignObject) {
            element = foreignObject;
            console.log('Using parent foreignObject for math element');
        }
    }
    
    // Handle groups (g elements)
    if (element.tagName === 'g') {
        const rect = element.querySelector('rect');
        const text = element.querySelector('text');
        
        if (rect && text) {
            x = parseFloat(rect.getAttribute('x') || 0);
            y = parseFloat(rect.getAttribute('y') || 0);
            content = text.textContent?.trim() || 'Group';
            type = 'Note/Group';
            
            // Add color information for groups with rects
            const fillColor = rect.getAttribute('fill') || rect.style.fill || '#EDF2AE';
            const strokeColor = rect.getAttribute('stroke') || rect.style.stroke || '#666';
            
            return { 
                x, y, content, type, 
                hasColorControls: true, 
                fillColor: fillColor,
                strokeColor: strokeColor,
                colorTarget: rect
            };
        } else {
            const bbox = element.getBBox();
            x = bbox.x;
            y = bbox.y;
            content = 'Group element';
            type = 'Group';
        }
    }
    // Get position based on element type
    else if (element.tagName === 'foreignObject') {
        x = parseFloat(element.getAttribute('x') || 0);
        y = parseFloat(element.getAttribute('y') || 0);
        content = element.textContent?.trim().substring(0, 30) + '...' || 'Math expression';
        type = 'Math Expression';
    } else if (element.tagName === 'rect') {
        x = parseFloat(element.getAttribute('x') || 0);
        y = parseFloat(element.getAttribute('y') || 0);
        content = element.getAttribute('name') || 'Rectangle';
        type = 'Rectangle';
    } else if (element.tagName === 'text') {
        x = parseFloat(element.getAttribute('x') || 0);
        y = parseFloat(element.getAttribute('y') || 0);
        content = element.textContent?.trim().substring(0, 30) + '...' || 'Text';
        type = 'Text';
    } else if (element.tagName === 'line') {
        x = parseFloat(element.getAttribute('x1') || 0);
        y = parseFloat(element.getAttribute('y1') || 0);
        content = element.getAttribute('name') || element.className.baseVal || 'Line';
        type = 'Line';
    } else if (element.tagName === 'path') {
        // For paths, use the actual start coordinates from the path data
        const pathData = element.getAttribute('d') || '';
        const pathStart = pathData.match(/M\s*([\d.-]+),([\d.-]+)/);
        
        if (pathStart) {
            x = parseFloat(pathStart[1]);
            y = parseFloat(pathStart[2]);
        } else {
            const bbox = element.getBBox();
            x = bbox.x;
            y = bbox.y;
        }
        
        content = 'Path element';
        type = 'Path';
        
        // Check if this is a self-loop
        const isLoop = pathData.includes('C ') && pathData.match(/M\s*([\d.-]+),([\d.-]+).*C.*\1,/);
        
        return { x, y, content, type, hasColorControls: false, isLoop: isLoop };
    }
    
    return { x, y, content, type, hasColorControls: false };
}

// Adjust position by delta
function adjustPosition(axis, delta) {
    const input = document.getElementById(`pos-${axis}`);
    const currentValue = parseFloat(input.value) || 0;
    input.value = currentValue + delta;
    applyPosition();
}

// Update element color
function updateElementColor(colorType, value) {
    if (!currentPopup || !currentPopup.elementInfo || !currentPopup.elementInfo.colorTarget) return;
    
    const element = currentPopup.elementInfo.colorTarget;
    
    if (colorType === 'fill') {
        element.setAttribute('fill', value);
        element.style.fill = value;
    } else if (colorType === 'stroke') {
        element.setAttribute('stroke', value);
        element.style.stroke = value;
    }
    
    // Store the color modification for sharing
    storeColorModification(currentPopup.element, colorType, value);
    
    // Trigger auto-save when color changes
    if (window.autoSaveWork) {
        setTimeout(() => {
            window.autoSaveWork();
        }, 500); // Debounced auto-save
    }
    
    console.log(`Updated ${colorType} color to ${value} for element:`, element);
}

// Flip self-loop direction (simple version)
function flipLoop() {
    if (!currentPopup || !currentPopup.element || currentPopup.element.tagName !== 'path') return;
    
    const pathElement = currentPopup.element;
    const pathData = pathElement.getAttribute('d');
    
    if (!pathData) return;
    
    // Parse the curve and flip it horizontally
    const flippedPath = flipLoopPath(pathData);
    pathElement.setAttribute('d', flippedPath);
    
    // Store in simple set for basic tracking
    const pathId = getSimplePathId(pathElement);
    if (loopFlips.has(pathId)) {
        loopFlips.delete(pathId); // Remove if already flipped (flip back)
    } else {
        loopFlips.add(pathId); // Add if not flipped
    }
    
    console.log('Flipped loop direction, current flips:', Array.from(loopFlips));
    
    // Trigger auto-save when loop flips
    if (window.autoSaveWork) {
        setTimeout(() => {
            window.autoSaveWork();
        }, 500); // Debounced auto-save
    }
}

// Simple path identifier for basic tracking
function getSimplePathId(element) {
    const pathData = element.getAttribute('d') || '';
    const match = pathData.match(/M\s*([\d.-]+),([\d.-]+)/);
    if (match) {
        const x = Math.round(parseFloat(match[1]) / 10) * 10; // Round to nearest 10
        const y = Math.round(parseFloat(match[2]) / 10) * 10;
        return `loop_${x}_${y}`;
    }
    return `loop_${Date.now()}`;
}

// Flip a self-loop path horizontally
function flipLoopPath(pathData) {
    // For a typical self-loop: "M 276,471 C 336,461 336,501 276,491"
    // We want to flip it to: "M 276,471 C 216,461 216,501 276,491"
    
    return pathData.replace(/M\s*([\d.-]+),([\d.-]+)\s*C\s*([\d.-]+),([\d.-]+)\s*([\d.-]+),([\d.-]+)\s*([\d.-]+),([\d.-]+)/, 
        function(match, startX, startY, cp1X, cp1Y, cp2X, cp2Y, endX, endY) {
            const start_X = parseFloat(startX);
            const start_Y = parseFloat(startY);
            const cp1_X = parseFloat(cp1X);
            const cp1_Y = parseFloat(cp1Y);
            const cp2_X = parseFloat(cp2X);
            const cp2_Y = parseFloat(cp2Y);
            const end_X = parseFloat(endX);
            const end_Y = parseFloat(endY);
            
            // Calculate the center point
            const centerX = (start_X + end_X) / 2;
            
            // Flip control points horizontally around the center
            const flipped_cp1_X = centerX - (cp1_X - centerX);
            const flipped_cp2_X = centerX - (cp2_X - centerX);
            
            return `M ${start_X},${start_Y} C ${flipped_cp1_X},${cp1_Y} ${flipped_cp2_X},${cp2_Y} ${end_X},${end_Y}`;
        });
}

// Get current flipped loops for sharing
function getCurrentLoopFlips() {
    return Array.from(loopFlips);
}

// Apply flipped loops from shared data
function applyLoopFlips(flippedLoops) {
    if (!flippedLoops || !Array.isArray(flippedLoops)) return;
    
    console.log('Applying loop flips:', flippedLoops);
    loopFlips = new Set(flippedLoops);
    
    const diagramContainer = document.getElementById('diagramContainer');
    const svg = diagramContainer?.querySelector('svg');
    if (!svg) return;
    
    // Find and flip the specified loops
    const paths = svg.querySelectorAll('path');
    paths.forEach(path => {
        const pathId = getSimplePathId(path);
        if (loopFlips.has(pathId)) {
            const pathData = path.getAttribute('d');
            if (pathData && pathData.match(/M\s*([\d.-]+),([\d.-]+).*C.*\1,/)) {
                const flippedPath = flipLoopPath(pathData);
                path.setAttribute('d', flippedPath);
                console.log(`Applied flip to loop ${pathId}`);
            }
        }
    });
}

// Apply new position
function applyPosition() {
    if (!currentPopup) return;
    
    const newX = parseFloat(document.getElementById('pos-x').value) || 0;
    const newY = parseFloat(document.getElementById('pos-y').value) || 0;
    const element = currentPopup.element;
    
    // Calculate deltas for moving groups
    const deltaX = newX - currentPopup.originalX;
    const deltaY = newY - currentPopup.originalY;
    
    // Apply position based on element type
    if (element.tagName === 'g') {
        // Handle group - move both rect and text together
        const rect = element.querySelector('rect');
        const text = element.querySelector('text');
        
        if (rect && text) {
            // Calculate the offset between rect and text to maintain their relationship
            const rectX = parseFloat(rect.getAttribute('x') || 0);
            const rectY = parseFloat(rect.getAttribute('y') || 0);
            const textX = parseFloat(text.getAttribute('x') || 0);
            const textY = parseFloat(text.getAttribute('y') || 0);
            
            const textOffsetX = textX - rectX;
            const textOffsetY = textY - rectY;
            
            // Move rect to new position
            rect.setAttribute('x', newX);
            rect.setAttribute('y', newY);
            
            // Move text to maintain relative position
            text.setAttribute('x', newX + textOffsetX);
            text.setAttribute('y', newY + textOffsetY);
            
            console.log(`Moved group to (${newX}, ${newY})`);
        }
    }
    else if (element.tagName === 'foreignObject') {
        element.setAttribute('x', newX);
        element.setAttribute('y', newY);
        console.log(`Moved foreignObject to (${newX}, ${newY})`);
    } else if (element.tagName === 'rect' || element.tagName === 'text') {
        element.setAttribute('x', newX);
        element.setAttribute('y', newY);
    } else if (element.tagName === 'line') {
        const x1 = parseFloat(element.getAttribute('x1')) + deltaX;
        const y1 = parseFloat(element.getAttribute('y1')) + deltaY;
        const x2 = parseFloat(element.getAttribute('x2')) + deltaX;
        const y2 = parseFloat(element.getAttribute('y2')) + deltaY;
        
        element.setAttribute('x1', x1);
        element.setAttribute('y1', y1);
        element.setAttribute('x2', x2);
        element.setAttribute('y2', y2);
    } else if (element.tagName === 'path') {
        // Handle path movement by translating all coordinates
        const pathData = element.getAttribute('d');
        if (pathData) {
            console.log(`Moving path from (${currentPopup.originalX}, ${currentPopup.originalY}) to (${newX}, ${newY}), delta: (${deltaX}, ${deltaY})`);
            const translatedPath = translatePath(pathData, deltaX, deltaY);
            element.setAttribute('d', translatedPath);
            console.log(`Moved path by (${deltaX}, ${deltaY})`);
            console.log(`Original path: ${pathData.substring(0, 50)}...`);
            console.log(`New path: ${translatedPath.substring(0, 50)}...`);
        }
    }
    
    // Update the popup's original position reference
    currentPopup.originalX = newX;
    currentPopup.originalY = newY;
    
    // Store the position modification for sharing
    storePositionModification(element, newX, newY);
    
    // Trigger auto-save when position changes
    if (window.autoSaveWork) {
        setTimeout(() => {
            window.autoSaveWork();
        }, 500); // Debounced auto-save
    }
}

// Reset to original position
function resetPosition() {
    if (!currentPopup) return;
    
    document.getElementById('pos-x').value = currentPopup.originalX;
    document.getElementById('pos-y').value = currentPopup.originalY;
    applyPosition();
}

// Close position popup
function closePositionPopup() {
    if (currentPopup) {
        document.body.removeChild(currentPopup.popup);
        currentPopup = null;
    }
}

// Translate path coordinates
function translatePath(pathData, deltaX, deltaY) {
    // Simple path translation - handles M, L, C commands with coordinate pairs
    return pathData.replace(/([ML])\s*([\d.-]+)\s*,\s*([\d.-]+)|([C])\s*([\d.-]+)\s*,\s*([\d.-]+)\s+([\d.-]+)\s*,\s*([\d.-]+)\s+([\d.-]+)\s*,\s*([\d.-]+)/g, 
        function(match, mlCmd, mlX, mlY, cCmd, cX1, cY1, cX2, cY2, cX3, cY3) {
            if (mlCmd) {
                // Handle M (move) and L (line) commands
                const newX = parseFloat(mlX) + deltaX;
                const newY = parseFloat(mlY) + deltaY;
                return `${mlCmd} ${newX},${newY}`;
            } else if (cCmd) {
                // Handle C (curve) commands with 3 coordinate pairs
                const newX1 = parseFloat(cX1) + deltaX;
                const newY1 = parseFloat(cY1) + deltaY;
                const newX2 = parseFloat(cX2) + deltaX;
                const newY2 = parseFloat(cY2) + deltaY;
                const newX3 = parseFloat(cX3) + deltaX;
                const newY3 = parseFloat(cY3) + deltaY;
                return `${cCmd} ${newX1},${newY1} ${newX2},${newY2} ${newX3},${newY3}`;
            }
            return match;
        });
}

// Store position modification for sharing
function storePositionModification(element, x, y) {
    // Create a unique identifier for the element
    const elementId = getElementIdentifier(element);
    
    positionModifications[elementId] = {
        x: x,
        y: y,
        type: element.tagName,
        timestamp: Date.now()
    };
    
    console.log(`Stored position for ${elementId}:`, positionModifications[elementId]);
}

// Store color modification for sharing
function storeColorModification(element, colorType, value) {
    const elementId = getElementIdentifier(element);
    
    if (!colorModifications[elementId]) {
        colorModifications[elementId] = {};
    }
    
    colorModifications[elementId][colorType] = value;
    colorModifications[elementId].timestamp = Date.now();
    
    console.log(`Stored ${colorType} color for ${elementId}:`, value);
}

// Get unique identifier for an element
function getElementIdentifier(element) {
    // Use numbered classes if available (more reliable)
    const lineNumber = element.getAttribute('data-line-number');
    const pathNumber = element.getAttribute('data-path-number');
    const groupNumber = element.getAttribute('data-group-number');
    const foreignNumber = element.getAttribute('data-foreign-number');
    
    if (lineNumber !== null) {
        return `numbered-line-${lineNumber}`;
    } else if (pathNumber !== null) {
        return `numbered-path-${pathNumber}`;
    } else if (groupNumber !== null) {
        return `numbered-group-${groupNumber}`;
    } else if (foreignNumber !== null) {
        return `numbered-foreign-${foreignNumber}`;
    }
    
    // Fallback to old system if numbering isn't available
    if (element.tagName === 'foreignObject') {
        const content = element.textContent?.trim().substring(0, 20) || '';
        return `foreignObject_${content}_${element.getAttribute('width')}_${element.getAttribute('height')}`;
    } else if (element.tagName === 'g') {
        const rect = element.querySelector('rect');
        const text = element.querySelector('text');
        const content = text?.textContent?.trim() || '';
        return `group_${content}_${rect?.getAttribute('width')}_${rect?.getAttribute('height')}`;
    } else if (element.tagName === 'text') {
        const content = element.textContent?.trim().substring(0, 20) || '';
        return `text_${content}`;
    } else if (element.tagName === 'line') {
        const className = element.className.baseVal || '';
        const name = element.getAttribute('name') || '';
        return `line_${className}_${name}`;
    } else if (element.tagName === 'path') {
        const className = element.className.baseVal || '';
        const pathStart = element.getAttribute('d')?.substring(0, 20) || '';
        return `path_${className}_${pathStart}`;
    }
    
    return `${element.tagName}_${Date.now()}`;
}

// Get all current position modifications for sharing
function getCurrentPositionModifications() {
    return { ...positionModifications };
}

// Get all current color modifications for sharing
function getCurrentColorModifications() {
    return { ...colorModifications };
}

// Apply stored position modifications to a diagram
function applyStoredPositions(modifications) {
    if (!modifications) return;
    
    console.log('Applying stored position modifications:', modifications);
    
    // Merge with existing modifications instead of overwriting
    positionModifications = { ...positionModifications, ...modifications };
    
    const diagramContainer = document.getElementById('diagramContainer');
    const svg = diagramContainer?.querySelector('svg');
    if (!svg) return;
    
    // Apply each stored modification
    Object.entries(modifications).forEach(([elementId, modification]) => {
        try {
            // Find the element by recreating its identifier and matching
            const elements = svg.querySelectorAll('*');
            
            for (const element of elements) {
                if (getElementIdentifier(element) === elementId) {
                    console.log(`Restoring position for ${elementId}:`, modification);
                    
                    // Apply the stored position
                    if (element.tagName === 'foreignObject') {
                        element.setAttribute('x', modification.x);
                        element.setAttribute('y', modification.y);
                    } else if (element.tagName === 'g') {
                        // Handle group positioning
                        const rect = element.querySelector('rect');
                        const text = element.querySelector('text');
                        
                        if (rect && text) {
                            const textOffsetX = parseFloat(text.getAttribute('x')) - parseFloat(rect.getAttribute('x'));
                            const textOffsetY = parseFloat(text.getAttribute('y')) - parseFloat(rect.getAttribute('y'));
                            
                            rect.setAttribute('x', modification.x);
                            rect.setAttribute('y', modification.y);
                            text.setAttribute('x', modification.x + textOffsetX);
                            text.setAttribute('y', modification.y + textOffsetY);
                        }
                    } else if (element.tagName === 'text') {
                        element.setAttribute('x', modification.x);
                        element.setAttribute('y', modification.y);
                    } else if (element.tagName === 'line') {
                        // For lines, we stored the original x1,y1 position
                        const deltaX = modification.x - parseFloat(element.getAttribute('x1'));
                        const deltaY = modification.y - parseFloat(element.getAttribute('y1'));
                        
                        element.setAttribute('x1', parseFloat(element.getAttribute('x1')) + deltaX);
                        element.setAttribute('y1', parseFloat(element.getAttribute('y1')) + deltaY);
                        element.setAttribute('x2', parseFloat(element.getAttribute('x2')) + deltaX);
                        element.setAttribute('y2', parseFloat(element.getAttribute('y2')) + deltaY);
                    } else if (element.tagName === 'path') {
                        // For paths, calculate delta from current path start coordinates
                        const pathData = element.getAttribute('d') || '';
                        const pathStart = pathData.match(/M\s*([\d.-]+),([\d.-]+)/);
                        
                        if (pathStart) {
                            const currentX = parseFloat(pathStart[1]);
                            const currentY = parseFloat(pathStart[2]);
                            const deltaX = modification.x - currentX;
                            const deltaY = modification.y - currentY;
                            
                            console.log(`Path restoration: current (${currentX}, ${currentY}) -> target (${modification.x}, ${modification.y}), delta (${deltaX}, ${deltaY})`);
                            
                            if (deltaX !== 0 || deltaY !== 0) {
                                const translatedPath = translatePath(pathData, deltaX, deltaY);
                                element.setAttribute('d', translatedPath);
                                console.log(`Applied path translation: ${pathData.substring(0, 30)}... -> ${translatedPath.substring(0, 30)}...`);
                            }
                        }
                    }
                    
                    break;
                }
            }
        } catch (error) {
            console.warn(`Failed to restore position for ${elementId}:`, error);
        }
    });
}

// Apply stored color modifications to a diagram
function applyStoredColors(modifications) {
    if (!modifications) return;
    
    console.log('Applying stored color modifications:', modifications);
    
    // Merge with existing modifications instead of overwriting
    colorModifications = { ...colorModifications, ...modifications };
    
    const diagramContainer = document.getElementById('diagramContainer');
    const svg = diagramContainer?.querySelector('svg');
    if (!svg) return;
    
    // Apply each stored color modification
    Object.entries(modifications).forEach(([elementId, modification]) => {
        try {
            // Find the element by recreating its identifier and matching
            const elements = svg.querySelectorAll('*');
            
            for (const element of elements) {
                if (getElementIdentifier(element) === elementId) {
                    console.log(`Restoring colors for ${elementId}:`, modification);
                    
                    // Find the colorable element (rect for groups, or the element itself)
                    let colorTarget = element;
                    if (element.tagName === 'g') {
                        const rect = element.querySelector('rect');
                        if (rect) colorTarget = rect;
                    }
                    
                    // Apply stored colors
                    if (modification.fill) {
                        colorTarget.setAttribute('fill', modification.fill);
                        colorTarget.style.fill = modification.fill;
                    }
                    if (modification.stroke) {
                        colorTarget.setAttribute('stroke', modification.stroke);
                        colorTarget.style.stroke = modification.stroke;
                    }
                    
                    break;
                }
            }
        } catch (error) {
            console.warn(`Failed to restore colors for ${elementId}:`, error);
        }
    });
}

// Clear position modifications
function clearPositionModifications() {
    positionModifications = {};
    console.log('Position modifications cleared');
}

// Clear color modifications
function clearColorModifications() {
    colorModifications = {};
    console.log('Color modifications cleared');
}

// Clear ALL formatting and reset to original state
function clearAllFormatting() {
    const status = document.getElementById('status');
    
    if (!confirm('Clear all formatting? This will remove all position and color modifications and re-render the diagram from scratch. This cannot be undone.')) {
        return;
    }
    
    status.textContent = 'Clearing all formatting...';
    status.className = 'status';
    
    try {
        // Clear all stored modifications
        positionModifications = {};
        colorModifications = {};
        loopFlips = new Set();
        
        // Turn off interactive mode if it's on
        if (isInteractiveMode) {
            disableInteractiveMode();
            isInteractiveMode = false;
        }
        
        // Clear from auto-save as well
        if (window.clearSavedWork) {
            clearSavedWork();
        }
        
        console.log('All formatting data cleared');
        
        // Re-render the diagram fresh
        setTimeout(async () => {
            status.textContent = 'Re-rendering clean diagram...';
            status.className = 'status';
            
            if (window.renderDiagram) {
                await renderDiagram();
                
                status.textContent = 'All formatting cleared - diagram reset to original!';
                status.className = 'status success';
            }
        }, 100);
        
    } catch (error) {
        console.error('Clear formatting error:', error);
        status.textContent = 'Failed to clear formatting';
        status.className = 'status error';
    }
}

// Fix tilde accent positioning in KaTeX expressions
function fixTildeAccents(container) {
    const svg = container.querySelector('svg');
    if (!svg) return;

    console.log('Fixing tilde accents...');

    // Find all foreignObject elements containing math
    const foreignObjects = svg.querySelectorAll('foreignObject');
    
    foreignObjects.forEach(foreignObj => {
        // Look for mover elements with accent="true" that contain tildes
        const movers = foreignObj.querySelectorAll('mover[accent="true"]');
        
        movers.forEach(mover => {
            const tildeElement = mover.querySelector('mo');
            if (tildeElement && tildeElement.textContent === '~') {
                console.log('Found tilde with accent="true", changing to accent="false"');
                mover.setAttribute('accent', 'false');
            }
        });
    });

    console.log('Tilde accent fix completed');
}

// Reorder SVG elements so notes appear on top of arrows
function bringNotesToFront(container) {
    const svg = container.querySelector('svg');
    if (!svg) {
        console.log('No SVG found for layer reordering');
        return;
    }

    console.log('Reordering SVG layers - bringing notes to front...');

    // Find all groups that contain note rectangles
    const allGroups = svg.querySelectorAll('g');
    const noteGroupsArray = [];
    
    console.log(`Found ${allGroups.length} total groups`);
    
    allGroups.forEach((group, index) => {
        const rect = group.querySelector('rect');
        if (rect) {
            const rectClass = rect.getAttribute('class') || '';
            console.log(`Group ${index}: rect class = "${rectClass}"`);
            
            // Check if this rect has the note class or note-like appearance
            if (rectClass.includes('note') || rect.getAttribute('fill') === '#EDF2AE') {
                noteGroupsArray.push(group);
                console.log(`Found note group ${index}`);
            }
        }
    });

    console.log(`Found ${noteGroupsArray.length} note groups to move`);

    // Move all note groups to the end of the SVG (so they appear on top)
    noteGroupsArray.forEach((noteGroup, index) => {
        console.log(`Moving note group ${index} to front`);
        // Remove from current position
        noteGroup.parentNode.removeChild(noteGroup);
        // Add to the end (appears on top)
        svg.appendChild(noteGroup);
    });

    console.log(`Successfully moved ${noteGroupsArray.length} note groups to front`);
}

// Make functions globally available
window.toggleInteractiveMode = toggleInteractiveMode;
window.adjustPosition = adjustPosition;
window.applyPosition = applyPosition;
window.resetPosition = resetPosition;
window.closePositionPopup = closePositionPopup;
window.updateElementColor = updateElementColor;
window.flipLoop = flipLoop;
window.getCurrentPositionModifications = getCurrentPositionModifications;
window.getCurrentColorModifications = getCurrentColorModifications;
window.getCurrentLoopFlips = getCurrentLoopFlips;
window.applyStoredPositions = applyStoredPositions;
window.applyStoredColors = applyStoredColors;
window.applyLoopFlips = applyLoopFlips;
window.clearPositionModifications = clearPositionModifications;
window.clearColorModifications = clearColorModifications;
window.clearAllFormatting = clearAllFormatting;
window.fixTildeAccents = fixTildeAccents;
window.bringNotesToFront = bringNotesToFront;
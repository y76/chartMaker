// Dynamic color management system

// Participant storage - each entry has: name, key, type, bg, border
// Make it globally accessible for sharing functionality
window.participants = [
    { name: 'Consumer (C)', key: 'C', type: 'actor', bg: '#87CEEB', border: '#4682B4' },
    { name: 'Intermediary (I)', key: 'I', type: 'participant', bg: '#FFB6C1', border: '#DC143C' },
    { name: 'Broker (B)', key: 'B', type: 'participant', bg: '#FFFFE0', border: '#FFD700' }
];

// Also create a local reference for convenience
let participants = window.participants;

// Initialize the UI on page load
document.addEventListener('DOMContentLoaded', function() {
    renderParticipantsList();
});

function colorParticipants(container) {
    const svg = container.querySelector('svg');
    if (!svg) return;

    console.log('Applying custom colors...');

    // Find all text elements
    const allTexts = svg.querySelectorAll('text');
    const allRects = svg.querySelectorAll('rect');
    const allActorGroups = svg.querySelectorAll('g.actor-man');
    const allActorLines = svg.querySelectorAll('line.actor-line');

    allTexts.forEach((textElement) => {
        const participantName = textElement.textContent?.trim();
        
        // Find matching participant in our dynamic list using flexible matching
        const participant = participants.find(p => {
            // Exact match first
            if (p.name === participantName) return true;
            
            // Check if the text matches any part of the participant name
            if (participantName && (
                p.name.toLowerCase().includes(participantName.toLowerCase()) ||
                participantName.toLowerCase().includes(p.name.toLowerCase())
            )) return true;
            
            return false;
        });
        
        if (participant) {
            console.log(`Coloring ${participantName} (${participant.type})`);

            // Check if this is an actor-man (stick figure)
            const parentGroup = textElement.closest('g.actor-man');
            if (parentGroup) {
                console.log(`Found actor-man for ${participantName}`);
                
                // Color the circle (head) of the stick figure
                const circle = parentGroup.querySelector('circle');
                if (circle) {
                    circle.style.fill = participant.bg;
                    circle.style.stroke = participant.border;
                    circle.style.strokeWidth = '2px';
                }
                
                // Color all lines (body parts) of the stick figure
                const lines = parentGroup.querySelectorAll('line');
                lines.forEach(line => {
                    line.style.stroke = participant.border;
                    line.style.strokeWidth = '2px';
                });
                
            } else {
                // Regular participant box - find the closest rectangle
                let rect = null;
                const textBBox = textElement.getBBox();
                let closestDistance = Infinity;

                allRects.forEach(r => {
                    const rectBBox = r.getBBox();
                    const distance = Math.abs(rectBBox.x - textBBox.x) + Math.abs(rectBBox.y - textBBox.y);
                    if (distance < closestDistance && distance < 100) {
                        closestDistance = distance;
                        rect = r;
                    }
                });

                if (rect) {
                    // Color the rectangle
                    rect.style.fill = participant.bg;
                    rect.style.stroke = participant.border;
                    rect.style.strokeWidth = '2px';
                }
            }
        }
    });

    // Color the vertical lifelines (actor lines)
    allActorLines.forEach((actorLine) => {
        const participantKey = actorLine.getAttribute('name');
        
        // Simple and explicit matching using lifeline key
        const participant = participants.find(p => {
            console.log(`Trying to match lifeline key "${participantKey}" with participant "${p.name}" (key: "${p.key || 'none'}")`);
            
            // Strategy 1: Use explicit lifeline key if provided
            if (p.key && p.key === participantKey) {
                console.log('✅ Explicit lifeline key match found');
                return true;
            }
            
            // Strategy 2: Exact name match
            if (p.name === participantKey) {
                console.log('✅ Exact name match found');
                return true;
            }
            
            // Strategy 3: Parentheses pattern (backward compatibility)
            if (p.name.includes(`(${participantKey})`)) {
                console.log('✅ Parentheses pattern match found');
                return true;
            }
            
            console.log('❌ No match found');
            return false;
        });
        
        if (participant) {
            console.log(`Coloring lifeline for ${participant.name} using key ${participantKey}`);
            actorLine.style.stroke = participant.border;
            actorLine.style.strokeWidth = '2px';
        } else {
            console.log(`No participant found for lifeline key: ${participantKey}`);
            console.log('Available participants:', participants.map(p => p.name));
        }
    });

    console.log('Custom coloring completed!');
}

// Render the participants list in the UI
function renderParticipantsList() {
    const listContainer = document.getElementById('participants-list');
    listContainer.innerHTML = '';
    
    participants.forEach((participant, index) => {
        const participantDiv = document.createElement('div');
        participantDiv.className = 'participant-entry';
        participantDiv.innerHTML = `
            <div class="participant-header">
                <div>
                    <div class="participant-name">${participant.name}</div>
                    <div class="participant-key">Lifeline: ${participant.key || 'auto'}</div>
                    <span class="participant-type">${participant.type}</span>
                </div>
                <div class="participant-controls">
                    <button class="edit-btn" onclick="editParticipant(${index})" title="Edit">✏️</button>
                    <button class="delete-btn" onclick="deleteParticipant(${index})" title="Delete">🗑️</button>
                </div>
            </div>
            <div class="participant-colors">
                <label>Background: 
                    <input type="color" value="${participant.bg}" onchange="updateParticipantColor(${index}, 'bg', this.value)">
                </label>
                <label>Border: 
                    <input type="color" value="${participant.border}" onchange="updateParticipantColor(${index}, 'border', this.value)">
                </label>
            </div>
        `;
        listContainer.appendChild(participantDiv);
    });
}

// Add new participant
function addNewParticipant() {
    const name = document.getElementById('new-participant-name').value.trim();
    const key = document.getElementById('new-participant-key').value.trim();
    const type = document.getElementById('new-participant-type').value;
    const bg = document.getElementById('new-participant-bg').value;
    const border = document.getElementById('new-participant-border').value;
    
    if (!name) {
        alert('Please enter a participant display name');
        return;
    }
    
    if (!key) {
        alert('Please enter a lifeline key');
        return;
    }
    
    // Check if participant already exists (by name or key)
    if (participants.find(p => p.name === name || p.key === key)) {
        alert('Participant with this name or lifeline key already exists');
        return;
    }
    
    participants.push({ name, key, type, bg, border });
    renderParticipantsList();
    
    // Clear form
    document.getElementById('new-participant-name').value = '';
    document.getElementById('new-participant-key').value = '';
    document.getElementById('new-participant-type').value = 'actor';
    document.getElementById('new-participant-bg').value = '#87CEEB';
    document.getElementById('new-participant-border').value = '#4682B4';
    
    updateStatus('Participant added successfully!', 'success');
}

// Update participant color
function updateParticipantColor(index, colorType, value) {
    participants[index][colorType] = value;
    updateStatus(`${participants[index].name} ${colorType} color updated`, 'success');
}

// Edit participant
function editParticipant(index) {
    const participant = participants[index];
    
    // Edit display name
    const newName = prompt('Edit display name:', participant.name);
    if (newName && newName.trim() && newName !== participant.name) {
        // Check if new name already exists
        if (participants.find((p, i) => i !== index && p.name === newName.trim())) {
            alert('Participant with this name already exists');
            return;
        }
        participants[index].name = newName.trim();
    }
    
    // Edit lifeline key
    const currentKey = participant.key || '';
    const newKey = prompt('Edit lifeline key (matches Mermaid codename):', currentKey);
    if (newKey !== null && newKey.trim() !== currentKey) {
        // Check if new key already exists
        if (participants.find((p, i) => i !== index && p.key === newKey.trim())) {
            alert('Participant with this lifeline key already exists');
            return;
        }
        participants[index].key = newKey.trim();
    }
    
    renderParticipantsList();
    updateStatus('Participant updated', 'success');
}

// Delete participant
function deleteParticipant(index) {
    const participant = participants[index];
    if (confirm(`Delete ${participant.name}?`)) {
        participants.splice(index, 1);
        renderParticipantsList();
        updateStatus('Participant deleted', 'success');
    }
}

// Apply all colors to current diagram
function applyAllColors() {
    const diagramContainer = document.getElementById('diagramContainer');
    
    if (diagramContainer.querySelector('svg')) {
        colorParticipants(diagramContainer);
        updateStatus('All colors applied!', 'success');
    } else {
        updateStatus('Please render a diagram first', 'error');
    }
}

// Reset to default participants
function resetToDefaultColors() {
    participants = [
        { name: 'Consumer (C)', key: 'C', type: 'actor', bg: '#87CEEB', border: '#4682B4' },
        { name: 'Intermediary (I)', key: 'I', type: 'participant', bg: '#FFB6C1', border: '#DC143C' },
        { name: 'Broker (B)', key: 'B', type: 'participant', bg: '#FFFFE0', border: '#FFD700' }
    ];
    window.participants = participants;
    renderParticipantsList();
    
    const diagramContainer = document.getElementById('diagramContainer');
    if (diagramContainer.querySelector('svg')) {
        colorParticipants(diagramContainer);
        updateStatus('Reset to default participants and colors!', 'success');
    } else {
        updateStatus('Reset to default participants', 'success');
    }
}

// Clear all participants
function clearAllParticipants() {
    if (confirm('Clear all participants? This cannot be undone.')) {
        participants = [];
        renderParticipantsList();
        updateStatus('All participants cleared', 'success');
    }
}

// Helper function to update status
function updateStatus(message, type = 'success') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
}
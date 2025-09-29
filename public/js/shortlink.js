// Short link system for sharing diagrams

// Generate a short ID (8 characters)
function generateShortId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Save diagram data and return short ID
function createShortLink(shareData) {
    const shortId = generateShortId();
    
    // Store in localStorage with timestamp
    const storageData = {
        ...shareData,
        created: Date.now(),
        accessed: 0
    };
    
    localStorage.setItem(`diagram_${shortId}`, JSON.stringify(storageData));
    
    // Also store in a list for management
    const linksList = JSON.parse(localStorage.getItem('diagram_links') || '[]');
    linksList.push({
        id: shortId,
        created: Date.now(),
        title: shareData.code.split('\n')[0] || 'Untitled Diagram'
    });
    localStorage.setItem('diagram_links', JSON.stringify(linksList));
    
    return shortId;
}

// Load diagram data from short ID
function loadFromShortId(shortId) {
    const data = localStorage.getItem(`diagram_${shortId}`);
    if (!data) return null;
    
    try {
        const shareData = JSON.parse(data);
        
        // Update access count
        shareData.accessed = (shareData.accessed || 0) + 1;
        localStorage.setItem(`diagram_${shortId}`, JSON.stringify(shareData));
        
        return shareData;
    } catch (error) {
        console.error('Error loading short link data:', error);
        return null;
    }
}

// Clean up old links (optional - remove links older than 30 days)
function cleanupOldLinks() {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const linksList = JSON.parse(localStorage.getItem('diagram_links') || '[]');
    
    const validLinks = linksList.filter(link => {
        if (link.created < thirtyDaysAgo) {
            // Remove old diagram data
            localStorage.removeItem(`diagram_${link.id}`);
            return false;
        }
        return true;
    });
    
    localStorage.setItem('diagram_links', JSON.stringify(validLinks));
}

// Get all saved diagrams
function getSavedDiagrams() {
    const linksList = JSON.parse(localStorage.getItem('diagram_links') || '[]');
    return linksList.sort((a, b) => b.created - a.created); // Newest first
}

// Delete a specific diagram
function deleteSavedDiagram(shortId) {
    // Remove diagram data
    localStorage.removeItem(`diagram_${shortId}`);
    
    // Remove from links list
    const linksList = JSON.parse(localStorage.getItem('diagram_links') || '[]');
    const updatedLinks = linksList.filter(link => link.id !== shortId);
    localStorage.setItem('diagram_links', JSON.stringify(updatedLinks));
}

// Auto-save current work
function autoSaveWork() {
    try {
        const code = window.getEditorContent ? window.getEditorContent() : '';
        const participants = window.participants || [];
        
        if (code.trim()) { // Only save if there's actual content
            const workData = {
                code: code,
                participants: participants,
                lastSaved: Date.now()
            };
            
            localStorage.setItem('current_work', JSON.stringify(workData));
            console.log('Work auto-saved');
        }
    } catch (error) {
        console.warn('Auto-save failed:', error);
    }
}

// Restore work on page load
function restoreWork() {
    try {
        const workData = localStorage.getItem('current_work');
        if (!workData) return false;
        
        const parsed = JSON.parse(workData);
        console.log('Restoring previous work:', parsed);
        
        // Wait for editor to be ready
        function waitForRestore() {
            if (window.setEditorContent && window.codeEditor && window.codeEditor()) {
                // Restore code
                window.setEditorContent(parsed.code);
                
                // Restore participants
                if (parsed.participants && Array.isArray(parsed.participants) && window.participants) {
                    window.participants.length = 0;
                    parsed.participants.forEach(p => window.participants.push(p));
                    
                    if (window.renderParticipantsList) {
                        window.renderParticipantsList();
                    }
                }
                
                const status = document.getElementById('status');
                if (status) {
                    status.textContent = 'Previous work restored';
                    status.className = 'status success';
                }
                
                console.log('Work restored successfully');
                return true;
            } else {
                setTimeout(waitForRestore, 100);
            }
        }
        
        waitForRestore();
        return true;
        
    } catch (error) {
        console.warn('Work restoration failed:', error);
        return false;
    }
}

// Clear saved work
function clearSavedWork() {
    localStorage.removeItem('current_work');
    console.log('Saved work cleared');
}

// Set up auto-save on editor changes
function setupAutoSave() {
    // Auto-save on editor changes (debounced)
    let saveTimeout;
    function debouncedSave() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(autoSaveWork, 1000); // Save 1 second after last change
    }
    
    // Hook into editor changes
    if (window.codeEditor && window.codeEditor()) {
        window.codeEditor().on('change', debouncedSave);
    } else {
        // Wait for editor to be ready
        setTimeout(setupAutoSave, 200);
    }
}

// Initialize on page load
function initializeAutoSave() {
    cleanupOldLinks();
    
    // Check if we're loading from a shared link
    const urlParams = new URLSearchParams(window.location.search);
    const hasSharedData = urlParams.get('data') || urlParams.get('id');
    
    if (!hasSharedData) {
        // Only restore work if we're not loading a shared diagram
        restoreWork();
    }
    
    // Set up auto-save after a delay to ensure editor is ready
    setTimeout(setupAutoSave, 1000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAutoSave);
} else {
    initializeAutoSave();
}
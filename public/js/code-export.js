// Code export functionality

// Save Mermaid code as text file
function saveMermaidCode() {
    const status = document.getElementById('status');
    
    // Get code from CodeMirror editor
    const code = window.getEditorContent ? window.getEditorContent() : '';
    
    if (!code.trim()) {
        status.textContent = 'No code to save';
        status.className = 'status error';
        return;
    }
    
    status.textContent = 'Saving code...';
    status.className = 'status';
    
    try {
        // Create blob with the code content
        const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename with timestamp
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
        a.download = `mermaid-diagram-${timestamp}.txt`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        status.textContent = `Code saved as ${a.download}`;
        status.className = 'status success';
        
    } catch (error) {
        console.error('Code save error:', error);
        status.textContent = 'Failed to save code';
        status.className = 'status error';
    }
}

// Load Mermaid code from file
function loadMermaidCode() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.mmd,.mermaid';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const status = document.getElementById('status');
        status.textContent = 'Loading code...';
        status.className = 'status';
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                
                // Set the content in the editor
                if (window.setEditorContent) {
                    window.setEditorContent(content);
                    status.textContent = `Code loaded from ${file.name}`;
                    status.className = 'status success';
                } else {
                    status.textContent = 'Editor not ready';
                    status.className = 'status error';
                }
            } catch (error) {
                console.error('Code load error:', error);
                status.textContent = 'Failed to load code';
                status.className = 'status error';
            }
        };
        
        reader.onerror = function() {
            status.textContent = 'Failed to read file';
            status.className = 'status error';
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Export as .mmd file (Mermaid format)
function saveMermaidAsMmd() {
    const status = document.getElementById('status');
    
    // Get code from CodeMirror editor
    const code = window.getEditorContent ? window.getEditorContent() : '';
    
    if (!code.trim()) {
        status.textContent = 'No code to save';
        status.className = 'status error';
        return;
    }
    
    status.textContent = 'Saving .mmd file...';
    status.className = 'status';
    
    try {
        // Create blob with the code content
        const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename with timestamp
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
        a.download = `mermaid-diagram-${timestamp}.mmd`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        status.textContent = `Mermaid file saved as ${a.download}`;
        status.className = 'status success';
        
    } catch (error) {
        console.error('Mermaid save error:', error);
        status.textContent = 'Failed to save .mmd file';
        status.className = 'status error';
    }
}

// Copy shareable link with code and custom colors
function copyShareableLink() {
    const status = document.getElementById('status');
    
    try {
        // Get current code from editor
        const code = window.getEditorContent ? window.getEditorContent() : '';
        
        if (!code.trim()) {
            status.textContent = 'No code to share';
            status.className = 'status error';
            return;
        }
        
        status.textContent = 'Generating shareable link...';
        status.className = 'status';
        
        // Get current participants data
        const participantsData = window.participants || [];
        
        console.log('Current participants being shared:', participantsData);
        
        // Create data object to encode
        const shareData = {
            code: code,
            participants: participantsData,
            version: '1.0'
        };
        
        // Create short link instead of massive URL
        const shortId = createShortLink(shareData);
        
        // Create the shareable URL
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}?id=${shortId}`;
        
        console.log('Share data saved with short ID:', shortId);
        console.log('Generated short URL:', shareUrl);
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            status.textContent = 'Shareable link copied to clipboard!';
            status.className = 'status success';
        }).catch(() => {
            // Fallback for browsers that don't support clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            status.textContent = 'Shareable link copied to clipboard!';
            status.className = 'status success';
        });
        
    } catch (error) {
        console.error('Link generation error:', error);
        status.textContent = 'Failed to generate shareable link';
        status.className = 'status error';
    }
}

// Load shared data from URL on page load
function loadFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');
    const shortId = urlParams.get('id');
    
    console.log('Loading from URL, data parameter:', encodedData ? 'Found' : 'Not found');
    console.log('Loading from URL, short ID:', shortId ? shortId : 'Not found');
    
    // Try short link first, then fall back to old long URLs
    if (shortId) {
        loadFromShortLink(shortId);
        return;
    }
    
    if (!encodedData) return;
    
    try {
        // Decode the URL-safe base64 data
        const base64Data = encodedData.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        const paddedBase64 = base64Data + '==='.slice((base64Data.length + 3) % 4);
        const jsonString = decodeURIComponent(atob(paddedBase64));
        const shareData = JSON.parse(jsonString);
        
        console.log('Decoded share data:', shareData);
        
        // Validate data structure
        if (!shareData.code) {
            console.log('No code in share data');
            return;
        }
        
        const status = document.getElementById('status');
        const diagramContainer = document.getElementById('diagramContainer');
        
        if (status) {
            status.textContent = 'Loading shared diagram...';
            status.className = 'status';
        }
        
        // Hide diagram container and show loading state
        if (diagramContainer) {
            diagramContainer.style.display = 'none';
            diagramContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #6c757d;">
                    <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
                    <h3 style="margin: 0 0 10px 0; color: #495057;">Loading Shared Diagram</h3>
                    <p style="margin: 0; text-align: center;">Restoring code and custom colors...</p>
                </div>
            `;
            diagramContainer.style.display = 'flex';
        }
        
        // Wait for editor to be ready before setting content
        function waitForEditor() {
            if (window.setEditorContent && window.codeEditor && window.codeEditor()) {
                console.log('Setting editor content:', shareData.code.substring(0, 50) + '...');
                window.setEditorContent(shareData.code);
                
                // Restore participants if available
                if (shareData.participants && Array.isArray(shareData.participants) && shareData.participants.length > 0) {
                    console.log('Restoring participants:', shareData.participants);
                    
                    // Wait for participants to be available
                    function waitForParticipants() {
                        if (window.participants !== undefined) {
                            window.participants.length = 0; // Clear existing
                            shareData.participants.forEach(p => window.participants.push(p));
                            
                            // Re-render participants list if function exists
                            if (window.renderParticipantsList) {
                                window.renderParticipantsList();
                            }
                            
                            console.log('Participants restored:', window.participants);
                        } else {
                            console.log('Waiting for participants array to be available...');
                            setTimeout(waitForParticipants, 100);
                        }
                    }
                    waitForParticipants();
                }
                
                // Clean up URL (remove the data parameter)
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
                
                // Auto-render the diagram after a short delay
                setTimeout(() => {
                    if (window.renderDiagram) {
                        console.log('Auto-rendering diagram (hidden)');
                        
                        // Update loading message
                        if (status) {
                            status.textContent = 'Rendering diagram...';
                            status.className = 'status';
                        }
                        
                        // Create a hidden container to render the diagram
                        const hiddenContainer = document.createElement('div');
                        hiddenContainer.style.position = 'absolute';
                        hiddenContainer.style.left = '-9999px';
                        hiddenContainer.style.visibility = 'hidden';
                        hiddenContainer.id = 'hiddenDiagramContainer';
                        document.body.appendChild(hiddenContainer);
                        
                        // Temporarily redirect the render function to the hidden container
                        const originalContainer = document.getElementById('diagramContainer');
                        const tempId = originalContainer.id;
                        originalContainer.id = 'tempContainer';
                        hiddenContainer.id = 'diagramContainer';
                        
                        renderDiagram();
                        
                        // Apply custom colors after rendering (still hidden)
                        setTimeout(() => {
                            if (window.applyCustomColors) {
                                console.log('Auto-applying custom colors (hidden)');
                                
                                // Update loading message
                                if (status) {
                                    status.textContent = 'Applying custom colors...';
                                    status.className = 'status';
                                }
                                
                                applyCustomColors();
                                
                                // After colors are applied, move the content to visible container
                                setTimeout(() => {
                                    console.log('Moving colored diagram to visible container');
                                    
                                    // Restore original container IDs
                                    hiddenContainer.id = 'hiddenDiagramContainer';
                                    originalContainer.id = tempId;
                                    
                                    // Move the rendered and colored content to the visible container
                                    originalContainer.innerHTML = hiddenContainer.innerHTML;
                                    
                                    // Remove hidden container
                                    document.body.removeChild(hiddenContainer);
                                    
                                    // Show the container
                                    originalContainer.style.display = 'flex';
                                    
                                    // Final success message
                                    if (status) {
                                        status.textContent = 'Shared diagram loaded successfully!';
                                        status.className = 'status success';
                                    }
                                }, 500);
                            } else {
                                // No custom colors to apply, just move content and show
                                console.log('Moving diagram to visible container (no colors)');
                                
                                // Restore original container IDs
                                hiddenContainer.id = 'hiddenDiagramContainer';
                                originalContainer.id = tempId;
                                
                                // Move content and show
                                originalContainer.innerHTML = hiddenContainer.innerHTML;
                                document.body.removeChild(hiddenContainer);
                                originalContainer.style.display = 'flex';
                                
                                if (status) {
                                    status.textContent = 'Shared diagram loaded successfully!';
                                    status.className = 'status success';
                                }
                            }
                        }, 1000);
                    }
                }, 1500);
                
            } else {
                console.log('Waiting for editor to be ready...');
                setTimeout(waitForEditor, 200);
            }
        }
        
        waitForEditor();
        
    } catch (error) {
        console.error('URL load error:', error);
        // Clean up URL anyway
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
}

// Initialize URL loading when page loads - with delay to ensure all scripts are loaded
function initializeUrlLoading() {
    // Wait a bit longer to ensure all scripts are loaded
    setTimeout(() => {
        console.log('Initializing URL loading...');
        loadFromUrl();
    }, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUrlLoading);
} else {
    initializeUrlLoading();
}

// Load from short link ID
function loadFromShortLink(shortId) {
    console.log('Loading from short link ID:', shortId);
    
    const shareData = loadFromShortId(shortId);
    if (!shareData) {
        console.log('Short link not found or expired');
        const status = document.getElementById('status');
        if (status) {
            status.textContent = 'Shared link not found or expired';
            status.className = 'status error';
        }
        
        // Clean up URL
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        return;
    }
    
    console.log('Short link data loaded:', shareData);
    
    // Use the same loading logic as the long URLs
    const status = document.getElementById('status');
    const diagramContainer = document.getElementById('diagramContainer');
    
    if (status) {
        status.textContent = 'Loading shared diagram...';
        status.className = 'status';
    }
    
    // Show loading state
    if (diagramContainer) {
        diagramContainer.style.display = 'none';
        diagramContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #6c757d;">
                <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
                <h3 style="margin: 0 0 10px 0; color: #495057;">Loading Shared Diagram</h3>
                <p style="margin: 0; text-align: center;">Restoring code and custom colors...</p>
            </div>
        `;
        diagramContainer.style.display = 'flex';
    }
    
    // Wait for editor to be ready before setting content
    function waitForEditor() {
        if (window.setEditorContent && window.codeEditor && window.codeEditor()) {
            console.log('Setting editor content from short link');
            window.setEditorContent(shareData.code);
            
            // Restore participants if available
            if (shareData.participants && Array.isArray(shareData.participants) && shareData.participants.length > 0) {
                console.log('Restoring participants from short link:', shareData.participants);
                
                // Wait for participants to be available
                function waitForParticipants() {
                    if (window.participants !== undefined) {
                        window.participants.length = 0; // Clear existing
                        shareData.participants.forEach(p => window.participants.push(p));
                        
                        // Re-render participants list if function exists
                        if (window.renderParticipantsList) {
                            window.renderParticipantsList();
                        }
                        
                        console.log('Participants restored from short link');
                    } else {
                        console.log('Waiting for participants array...');
                        setTimeout(waitForParticipants, 100);
                    }
                }
                waitForParticipants();
            }
            
            // Clean up URL
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            
            // Auto-render with the same hidden process as before
            setTimeout(() => {
                if (window.renderDiagram) {
                    console.log('Auto-rendering from short link');
                    
                    if (status) {
                        status.textContent = 'Rendering diagram...';
                        status.className = 'status';
                    }
                    
                    // Use the same hidden rendering process
                    const hiddenContainer = document.createElement('div');
                    hiddenContainer.style.position = 'absolute';
                    hiddenContainer.style.left = '-9999px';
                    hiddenContainer.style.visibility = 'hidden';
                    hiddenContainer.id = 'hiddenDiagramContainer';
                    document.body.appendChild(hiddenContainer);
                    
                    const originalContainer = document.getElementById('diagramContainer');
                    const tempId = originalContainer.id;
                    originalContainer.id = 'tempContainer';
                    hiddenContainer.id = 'diagramContainer';
                    
                    renderDiagram();
                    
                    setTimeout(() => {
                        if (window.applyCustomColors) {
                            console.log('Auto-applying colors from short link');
                            
                            if (status) {
                                status.textContent = 'Applying custom colors...';
                                status.className = 'status';
                            }
                            
                            applyCustomColors();
                            
                            setTimeout(() => {
                                console.log('Moving diagram to visible container');
                                
                                hiddenContainer.id = 'hiddenDiagramContainer';
                                originalContainer.id = tempId;
                                originalContainer.innerHTML = hiddenContainer.innerHTML;
                                document.body.removeChild(hiddenContainer);
                                originalContainer.style.display = 'flex';
                                
                                if (status) {
                                    status.textContent = 'Shared diagram loaded successfully!';
                                    status.className = 'status success';
                                }
                            }, 500);
                        }
                    }, 1000);
                }
            }, 1500);
            
        } else {
            console.log('Waiting for editor to be ready...');
            setTimeout(waitForEditor, 200);
        }
    }
    
    waitForEditor();
}
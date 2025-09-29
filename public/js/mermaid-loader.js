// Mermaid initialization and loading utilities

function waitForMermaid() {
    return new Promise((resolve) => {
        function check() {
            if (window.mermaid && window.mermaidReady) {
                resolve();
            } else {
                setTimeout(check, 100);
            }
        }
        check();
    });
}

async function initializeMermaid() {
    await waitForMermaid();

    window.mermaid.initialize({
        startOnLoad: false, // We'll render manually
        theme: 'base',
        themeVariables: {
            fontFamily: 'Figtree, sans-serif'
        },
        sequence: {
            mirrorActors: true,
            actorFontFamily: 'Figtree, sans-serif',
            noteFontFamily: 'Figtree, sans-serif',
            messageFontFamily: 'Figtree, sans-serif'
        }
    });
}

// Initialize when page loads
window.addEventListener('load', initializeMermaid);
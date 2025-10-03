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

    // Register FontAwesome icons
    try {
        await window.mermaid.registerIconPacks([
            {
                name: 'fa',
                loader: () =>
                    fetch('https://unpkg.com/@iconify-json/fa6-solid@1/icons.json')
                        .then((res) => res.json())
            }
        ]);
        console.log('FontAwesome icons registered successfully');
    } catch (error) {
        console.error('Failed to register FontAwesome icons:', error);
    }

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
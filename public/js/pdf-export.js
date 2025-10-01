// PDF Export functionality

async function saveDiagramAsPDF() {
    const diagramContainer = document.getElementById('diagramContainer');
    const status = document.getElementById('status');

    // Check if there's a rendered diagram
    const svg = diagramContainer.querySelector('svg');
    if (!svg) {
        status.textContent = 'Please render a diagram first';
        status.className = 'status error';
        return;
    }

    status.textContent = 'Generating PDF...';
    status.className = 'status';

    try {
        // Clone the SVG to avoid modifying the original
        const svgClone = svg.cloneNode(true);
        
        // Get SVG dimensions
        const svgRect = svg.getBoundingClientRect();
        const svgWidth = svg.viewBox?.baseVal?.width || svgRect.width || 800;
        const svgHeight = svg.viewBox?.baseVal?.height || svgRect.height || 600;

        // Ensure SVG has proper dimensions
        svgClone.setAttribute('width', svgWidth);
        svgClone.setAttribute('height', svgHeight);
        
        // Add XML namespace if missing
        if (!svgClone.getAttribute('xmlns')) {
            svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
        
        // Fix math expressions for PDF export
        fixMathForExport(svgClone);

        // Serialize SVG to string
        const svgData = new XMLSerializer().serializeToString(svgClone);
        
        // Create data URL directly from SVG
        const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));

        // Convert pixels to mm for PDF (using 96 DPI standard: 1 inch = 25.4mm, 1 inch = 96px)
        const pxToMm = 25.4 / 96;
        const pdfWidth = svgWidth * pxToMm;
        const pdfHeight = svgHeight * pxToMm;
        
        // Add small margin for better appearance
        const margin = 5; // 5mm margin
        const finalPdfWidth = pdfWidth + (margin * 2);
        const finalPdfHeight = pdfHeight + (margin * 2);

        // Create PDF with custom dimensions that exactly fit the diagram
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [finalPdfWidth, finalPdfHeight]
        });

        // Always use high-quality PNG conversion for best results
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Use high DPI scaling for better quality (300 DPI equivalent)
        const scale = 300 / 96; // Scale factor for 300 DPI
        canvas.width = svgWidth * scale;
        canvas.height = svgHeight * scale;
        ctx.scale(scale, scale);
        
        // Set transparent background (or white if you prefer)
        ctx.clearRect(0, 0, svgWidth, svgHeight);
        
        // Create image and draw to canvas
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = () => {
                ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
                resolve();
            };
            img.onerror = reject;
            img.src = svgDataUrl;
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Add image to PDF at exact size with margin
        pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, pdfHeight);

        // Generate filename with timestamp
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
        const filename = `mermaid-diagram-${timestamp}.pdf`;

        // Save the PDF
        pdf.save(filename);

        status.textContent = `PDF saved as ${filename}`;
        status.className = 'status success';

    } catch (error) {
        console.error('PDF export error:', error);
        status.textContent = 'Failed to export PDF - ' + error.message;
        status.className = 'status error';
    }
}

// Alternative function to save as PNG with transparency
async function saveDiagramAsPNG() {
    const diagramContainer = document.getElementById('diagramContainer');
    const status = document.getElementById('status');

    const svg = diagramContainer.querySelector('svg');
    if (!svg) {
        status.textContent = 'Please render a diagram first';
        status.className = 'status error';
        return;
    }

    status.textContent = 'Generating PNG...';
    status.className = 'status';

    try {
        // Clone the SVG to avoid modifying the original
        const svgClone = svg.cloneNode(true);
        
        // Get SVG dimensions
        const svgRect = svg.getBoundingClientRect();
        const svgWidth = svg.viewBox?.baseVal?.width || svgRect.width || 800;
        const svgHeight = svg.viewBox?.baseVal?.height || svgRect.height || 600;

        // Ensure SVG has proper dimensions and namespace
        svgClone.setAttribute('width', svgWidth);
        svgClone.setAttribute('height', svgHeight);
        if (!svgClone.getAttribute('xmlns')) {
            svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
        
        // Fix math expressions for PNG export
        fixMathForExport(svgClone);

        // Serialize SVG to string
        const svgData = new XMLSerializer().serializeToString(svgClone);
        
        // Create data URL directly from SVG
        const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));

        // Create canvas for PNG conversion
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size with higher resolution for better quality (300 DPI equivalent)
        const scale = 300 / 96; // Scale factor for 300 DPI
        canvas.width = svgWidth * scale;
        canvas.height = svgHeight * scale;
        ctx.scale(scale, scale);

        const img = new Image();
        
        await new Promise((resolve, reject) => {
            img.onload = () => {
                // Clear canvas (transparent background)
                ctx.clearRect(0, 0, svgWidth, svgHeight);
                
                // Draw the SVG image
                ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
                
                // Create download link
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Failed to create PNG blob'));
                        return;
                    }
                    
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `mermaid-diagram-${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    status.textContent = 'PNG saved successfully!';
                    status.className = 'status success';
                    resolve();
                }, 'image/png', 1.0);
            };
            img.onerror = (error) => {
                console.error('Image load error:', error);
                reject(new Error('Failed to load SVG image'));
            };
            
            // Use the data URL to avoid CORS issues
            img.src = svgDataUrl;
        });

    } catch (error) {
        console.error('PNG export error:', error);
        status.textContent = 'Failed to export PNG - ' + error.message;
        status.className = 'status error';
    }
}

// Save diagram as compressed PDF (smaller file size)
async function saveDiagramAsPDFCompressed() {
    const diagramContainer = document.getElementById('diagramContainer');
    const status = document.getElementById('status');

    // Check if there's a rendered diagram
    const svg = diagramContainer.querySelector('svg');
    if (!svg) {
        status.textContent = 'Please render a diagram first';
        status.className = 'status error';
        return;
    }

    status.textContent = 'Generating compressed PDF...';
    status.className = 'status';

    try {
        // Clone the SVG to avoid modifying the original
        const svgClone = svg.cloneNode(true);
        
        // Get SVG dimensions
        const svgRect = svg.getBoundingClientRect();
        const svgWidth = svg.viewBox?.baseVal?.width || svgRect.width || 800;
        const svgHeight = svg.viewBox?.baseVal?.height || svgRect.height || 600;

        // Ensure SVG has proper dimensions
        svgClone.setAttribute('width', svgWidth);
        svgClone.setAttribute('height', svgHeight);
        
        // Add XML namespace if missing
        if (!svgClone.getAttribute('xmlns')) {
            svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
        
        // Fix math expressions for PDF export
        fixMathForExport(svgClone);

        // Serialize SVG to string
        const svgData = new XMLSerializer().serializeToString(svgClone);
        
        // Create data URL directly from SVG
        const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));

        // Convert pixels to mm for PDF (using 96 DPI standard: 1 inch = 25.4mm, 1 inch = 96px)
        const pxToMm = 25.4 / 96;
        const pdfWidth = svgWidth * pxToMm;
        const pdfHeight = svgHeight * pxToMm;
        
        // Add small margin for better appearance
        const margin = 5; // 5mm margin
        const finalPdfWidth = pdfWidth + (margin * 2);
        const finalPdfHeight = pdfHeight + (margin * 2);

        // Create PDF with custom dimensions that exactly fit the diagram
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [finalPdfWidth, finalPdfHeight]
        });

        // Use lower resolution for smaller file size (120 DPI)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const scale = 120 / 96; // Scale factor for 120 DPI (much smaller files)
        canvas.width = svgWidth * scale;
        canvas.height = svgHeight * scale;
        ctx.scale(scale, scale);
        
        // Set transparent background
        ctx.clearRect(0, 0, svgWidth, svgHeight);
        
        // Create image and draw to canvas
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = () => {
                ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
                resolve();
            };
            img.onerror = reject;
            img.src = svgDataUrl;
        });
        
        // Use PNG with moderate quality for smaller file size while keeping transparency
        const imgData = canvas.toDataURL('image/png', 0.8);
        
        // Add image to PDF at exact size with margin
        pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, pdfHeight);

        // Generate filename with timestamp
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
        const filename = `mermaid-diagram-compressed-${timestamp}.pdf`;

        // Save the PDF
        pdf.save(filename);

        status.textContent = `Compressed PDF saved as ${filename}`;
        status.className = 'status success';

    } catch (error) {
        console.error('Compressed PDF export error:', error);
        status.textContent = 'Failed to export compressed PDF - ' + error.message;
        status.className = 'status error';
    }
}

// Fix math expressions for proper export
function fixMathForExport(svgElement) {
    console.log('Fixing math expressions for export...');
    
    // Find all foreignObject elements containing math
    const foreignObjects = svgElement.querySelectorAll('foreignObject');
    
    foreignObjects.forEach(foreignObj => {
        try {
            // Get the HTML content inside the foreignObject
            const htmlContent = foreignObj.innerHTML;
            
            // Check if it contains math (KaTeX elements)
            if (htmlContent.includes('katex') || htmlContent.includes('math')) {
                console.log('Found math expression, ensuring proper embedding');
                
                // Ensure all CSS is inlined for proper export
                const mathElements = foreignObj.querySelectorAll('*');
                mathElements.forEach(element => {
                    // Force specific styles that might be missing
                    if (element.classList.contains('katex')) {
                        element.style.fontSize = element.style.fontSize || '1em';
                        element.style.fontFamily = element.style.fontFamily || 'KaTeX_Main, Times New Roman, serif';
                    }
                    
                    // Ensure text elements have proper styling
                    if (element.tagName === 'mi' || element.tagName === 'mn' || element.tagName === 'mo') {
                        element.style.fontFamily = element.style.fontFamily || 'KaTeX_Main, Times New Roman, serif';
                    }
                });
                
                // Set explicit dimensions if missing
                if (!foreignObj.getAttribute('width') || !foreignObj.getAttribute('height')) {
                    const bbox = foreignObj.getBBox();
                    if (bbox.width && bbox.height) {
                        foreignObj.setAttribute('width', Math.ceil(bbox.width));
                        foreignObj.setAttribute('height', Math.ceil(bbox.height));
                    }
                }
            }
        } catch (error) {
            console.warn('Error fixing math expression:', error);
        }
    });
    
    console.log('Math expressions fixed for export');
}
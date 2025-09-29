# 🧜‍♀️ LocalMermaid - Interactive Mermaid Diagram Editor

A local web-based Mermaid diagram editor with high-quality PDF and PNG export capabilities.

## 🚀 Quick Start

### First Time Setup
```bash
npm install
```

### Running the Server
```bash
./start.sh
```

The server will start on **http://localhost:3001**

## 🎯 Features

- 🎨 **Interactive Mermaid Editor** - Real-time diagram rendering
- 🌈 **Custom Color Support** - Apply custom styling to diagrams  
- 📄 **High-Quality PDF Export** - Custom-sized PDFs at 300 DPI
- 🖼️ **PNG Export** - Transparent background PNG files at 300 DPI
- 🔧 **Live Preview** - See changes as you type

## 🛠️ Usage

1. Open **http://localhost:3001** in your browser
2. Edit the Mermaid code in the left panel
3. Click **🎨 Render Diagram** to preview
4. Use **📄 Save as PDF** or **🖼️ Save as PNG** to export

## 🏃‍♂️ Commands

| Command | Description |
|---------|-------------|
| `./start.sh` | Start the server on port 3001 |
| `npm start` | Alternative: Start on port 8080 |
| `npm run dev` | Development mode with auto-restart |

## 📁 Project Structure

```
LocalMermaid/
├── public/           # Frontend files
│   ├── css/         # Stylesheets
│   ├── js/          # JavaScript modules
│   └── index.html   # Main page
├── server.js        # Express server
├── start.sh         # Startup script
└── package.json     # Dependencies
```

## 🔧 Technical Notes

- Built with Express.js and vanilla JavaScript
- Uses Mermaid library for diagram rendering
- Exports at 300 DPI for professional quality
- PDF pages are custom-sized to fit diagrams exactly
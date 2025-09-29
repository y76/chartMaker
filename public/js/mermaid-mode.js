// Custom Mermaid syntax highlighting mode for CodeMirror

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("mermaid", function() {
  // Mermaid keywords
  var mermaidKeywords = {
    // Diagram types
    "sequenceDiagram": "keyword",
    "graph": "keyword", 
    "flowchart": "keyword",
    "classDiagram": "keyword",
    "stateDiagram": "keyword",
    "erDiagram": "keyword",
    "gantt": "keyword",
    "pie": "keyword",
    "gitgraph": "keyword",
    
    // Sequence diagram keywords
    "participant": "keyword",
    "actor": "keyword",
    "Note": "keyword",
    "over": "keyword",
    "activate": "keyword",
    "deactivate": "keyword",
    "loop": "keyword",
    "end": "keyword",
    "alt": "keyword",
    "else": "keyword",
    "opt": "keyword",
    "par": "keyword",
    "and": "keyword",
    "rect": "keyword",
    "autonumber": "keyword",
    
    // Graph/Flowchart keywords  
    "TD": "keyword",
    "TB": "keyword",
    "BT": "keyword",
    "RL": "keyword",
    "LR": "keyword",
    "subgraph": "keyword",
    
    // Common words that should be highlighted
    "title": "keyword",
    "direction": "keyword",
    "class": "keyword",
    "click": "keyword",
    "callback": "keyword",
    "link": "keyword",
    "style": "keyword",
    "fill": "keyword",
    "stroke": "keyword",
    "color": "keyword",
    
    // Control flow
    "if": "keyword",
    "then": "keyword",
    "else": "keyword",
    "endif": "keyword",
    
    // Special actions
    "delete": "keyword",
    "opt-out": "keyword",
    "TODO": "keyword"
  };

  // Arrow patterns for sequence diagrams (ordered by length - longest first to avoid partial matches)
  var arrowPatterns = [
    "<<-->>", "<<->>",  // Bidirectional arrows (longest first)
    "-->>", "->>", "-->", "->",  // Regular arrows
    "--x", "-x",  // Cross arrows
    "--)", "-)",  // Async arrows
    "<<--", "<<-",  // Left arrows
    "x--", "x-",  // Cross left
    ")--", ")-"   // Async left
  ];

  return {
    startState: function() {
      return {
        inMath: false,
        mathDelim: null
      };
    },

    token: function(stream, state) {
      // Handle LaTeX math expressions
      if (stream.match(/\$\$/)) {
        if (state.inMath && state.mathDelim === "$$") {
          state.inMath = false;
          state.mathDelim = null;
          return "string math";
        } else if (!state.inMath) {
          state.inMath = true;
          state.mathDelim = "$$";
          return "string math";
        }
      }
      
      if (stream.match(/\$/)) {
        if (state.inMath && state.mathDelim === "$") {
          state.inMath = false;
          state.mathDelim = null;
          return "string math";
        } else if (!state.inMath) {
          state.inMath = true;
          state.mathDelim = "$";
          return "string math";
        }
      }

      if (state.inMath) {
        stream.next();
        return "string math";
      }

      // Skip whitespace
      if (stream.eatSpace()) return null;

      // Comments (lines starting with %%)
      if (stream.match(/^%%.*$/)) {
        return "comment";
      }

      // Arrows
      for (var i = 0; i < arrowPatterns.length; i++) {
        if (stream.match(arrowPatterns[i])) {
          return "operator arrow";
        }
      }

      // Numbers
      if (stream.match(/\d+/)) {
        return "number";
      }

      // Quoted strings
      if (stream.match(/^"([^"\\]|\\.)*"/)) {
        return "string";
      }
      if (stream.match(/^'([^'\\]|\\.)*'/)) {
        return "string";
      }

      // Parentheses and identifiers in parentheses like (C), (I), (B)
      if (stream.match(/\([A-Z]+\)/)) {
        return "variable-2 identifier";
      }

      // Keywords and identifiers
      if (stream.match(/\w+/)) {
        var word = stream.current();
        
        // Check if it's a Mermaid keyword
        if (mermaidKeywords.hasOwnProperty(word)) {
          return mermaidKeywords[word];
        }
        
        // Participant names (words followed by 'as')
        var nextPos = stream.pos;
        stream.eatSpace();
        if (stream.match(/^as\b/)) {
          stream.pos = nextPos; // Reset position
          return "def participant-name";
        }
        stream.pos = nextPos; // Reset position
        
        // Check if it's after 'as' keyword (participant aliases)
        return "variable";
      }

      // Colons and other punctuation
      if (stream.match(/[:;,(){}[\]]/)) {
        return "punctuation";
      }

      // Default: consume one character
      stream.next();
      return null;
    }
  };
});

CodeMirror.defineMIME("text/mermaid", "mermaid");

});
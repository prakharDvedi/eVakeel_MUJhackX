// frontend/src/utils/markdown.js
// Simple markdown to HTML converter (no library needed)

export const parseMarkdown = (text) => {
  if (!text) return '';
  
  let html = text;
  
  // Process code blocks first (before other formatting)
  html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre class="bg-gray-800 text-gray-100 p-3 rounded my-3 overflow-x-auto border border-gray-700"><code class="text-sm">${code.trim()}</code></pre>`;
  });
  
  // Process line by line for better control
  const lines = html.split('\n');
  const processedLines = [];
  let inList = false;
  let listItems = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Headers (must be at start of line) - check from most specific to least
    // Support both with and without space after hashes (#### Header or ####Header)
    if (line.match(/^####\s+/)) {
      if (inList) {
        processedLines.push(`<ul class="list-disc ml-6 my-2 space-y-1">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
      processedLines.push(`<h4 class="text-base font-bold mt-3 mb-2 text-text">${line.replace(/^####\s+/, '').trim()}</h4>`);
      continue;
    }
    if (line.match(/^####(?!\#)/)) {
      // 4 hashes without space
      if (inList) {
        processedLines.push(`<ul class="list-disc ml-6 my-2 space-y-1">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
      processedLines.push(`<h4 class="text-base font-bold mt-3 mb-2 text-text">${line.replace(/^####/, '').trim()}</h4>`);
      continue;
    }
    if (line.match(/^###\s+/)) {
      if (inList) {
        processedLines.push(`<ul class="list-disc ml-6 my-2 space-y-1">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
      processedLines.push(`<h3 class="text-lg font-bold mt-4 mb-2 text-text">${line.replace(/^###\s+/, '').trim()}</h3>`);
      continue;
    }
    if (line.match(/^###(?!\#)/)) {
      // 3 hashes without space
      if (inList) {
        processedLines.push(`<ul class="list-disc ml-6 my-2 space-y-1">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
      processedLines.push(`<h3 class="text-lg font-bold mt-4 mb-2 text-text">${line.replace(/^###/, '').trim()}</h3>`);
      continue;
    }
    if (line.match(/^##\s+/)) {
      if (inList) {
        processedLines.push(`<ul class="list-disc ml-6 my-2 space-y-1">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
      processedLines.push(`<h2 class="text-xl font-bold mt-5 mb-3 text-text">${line.replace(/^##\s+/, '').trim()}</h2>`);
      continue;
    }
    if (line.match(/^##(?!\#)/)) {
      // 2 hashes without space
      if (inList) {
        processedLines.push(`<ul class="list-disc ml-6 my-2 space-y-1">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
      processedLines.push(`<h2 class="text-xl font-bold mt-5 mb-3 text-text">${line.replace(/^##/, '').trim()}</h2>`);
      continue;
    }
    if (line.match(/^#\s+/)) {
      if (inList) {
        processedLines.push(`<ul class="list-disc ml-6 my-2 space-y-1">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
      processedLines.push(`<h1 class="text-2xl font-bold mt-6 mb-4 text-text">${line.replace(/^#\s+/, '').trim()}</h1>`);
      continue;
    }
    if (line.match(/^#(?!\#)/)) {
      // 1 hash without space (but not part of multiple hashes)
      if (inList) {
        processedLines.push(`<ul class="list-disc ml-6 my-2 space-y-1">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
      processedLines.push(`<h1 class="text-2xl font-bold mt-6 mb-4 text-text">${line.replace(/^#/, '').trim()}</h1>`);
      continue;
    }
    
    // Lists
    if (line.match(/^[\*\-\+]\s/) || line.match(/^\d+\.\s/)) {
      if (!inList) inList = true;
      const content = line.replace(/^[\*\-\+]\s/, '').replace(/^\d+\.\s/, '');
      listItems.push(`<li class="ml-4 mb-1">${content}</li>`);
      continue;
    }
    
    // End of list
    if (inList && line.trim() === '') {
      processedLines.push(`<ul class="list-disc ml-6 my-2 space-y-1">${listItems.join('')}</ul>`);
      listItems = [];
      inList = false;
      processedLines.push('<br />');
      continue;
    }
    
    if (inList) {
      processedLines.push(`<ul class="list-disc ml-6 my-2 space-y-1">${listItems.join('')}</ul>`);
      listItems = [];
      inList = false;
    }
    
    // Regular paragraph
    if (line.trim()) {
      processedLines.push(`<p class="mb-2 text-text">${line}</p>`);
    } else {
      processedLines.push('<br />');
    }
  }
  
  // Close any remaining list
  if (inList) {
    processedLines.push(`<ul class="list-disc ml-6 my-2 space-y-1">${listItems.join('')}</ul>`);
  }
  
  html = processedLines.join('');
  
  // Convert bold **text** first (before italic)
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong class="font-semibold text-text">$1</strong>');
  
  // Convert italic *text* (single asterisk, not at start of line, not double)
  html = html.replace(/([^*])\*([^*]+?)\*([^*])/g, '$1<em class="italic">$2</em>$3');
  
  // Convert inline code `code`
  html = html.replace(/`([^`\n]+)`/g, '<code class="bg-gray-800 text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
  
  // Convert links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline hover:opacity-80">$1</a>');
  
  return html;
};

/**
 * Strip markdown formatting from text, converting it to plain text
 * @param {string} text - Text with markdown formatting
 * @returns {string} - Plain text without markdown
 */
export const stripMarkdown = (text) => {
  if (!text) return '';
  
  let plain = text;
  
  // Remove code blocks
  plain = plain.replace(/```[\s\S]*?```/g, '');
  
  // Remove inline code
  plain = plain.replace(/`([^`]+)`/g, '$1');
  
  // Remove bold **text** first (before processing single asterisks)
  plain = plain.replace(/\*\*([^*]+?)\*\*/g, '$1');
  plain = plain.replace(/__([^_]+?)__/g, '$1');
  
  // Remove italic *text* or _text_ (single asterisks/underscores)
  // This regex matches single asterisks that are not part of bold
  plain = plain.replace(/(^|[^*])\*([^*]+?)\*([^*]|$)/g, '$1$2$3');
  plain = plain.replace(/(^|[^_])_([^_]+?)_([^_]|$)/g, '$1$2$3');
  
  // Remove headers (keep the text)
  plain = plain.replace(/^#{1,6}\s+(.+)$/gm, '$1');
  
  // Remove links but keep the text [text](url) -> text
  plain = plain.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove list markers but keep the content
  plain = plain.replace(/^[\*\-\+]\s+/gm, '');
  plain = plain.replace(/^\d+\.\s+/gm, '');
  
  // Clean up any remaining formatting artifacts
  plain = plain.replace(/\*\*/g, '');
  plain = plain.replace(/__/g, '');
  
  return plain.trim();
};


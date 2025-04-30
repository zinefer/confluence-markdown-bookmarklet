javascript:(function() {
  function convertToMarkdown() {
    // Find the main content container
    const contentContainer = document.querySelector('.ak-renderer-document') || 
                            document.querySelector('.wiki-content');
    
    if (!contentContainer) {
      alert('Could not find Confluence content on this page.');
      return;
    }
    
    // Get the page title
    const titleElement = document.querySelector('#content-title-id') || 
                         document.querySelector('#title-text') ||
                         document.querySelector('h1');
    
    let markdown = '';
    
    // Add the title as H1 if found
    if (titleElement) {
      // Get just the text content without any button or icon elements
      const titleText = Array.from(titleElement.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE || 
                (node.nodeType === Node.ELEMENT_NODE && 
                 !node.getAttribute('aria-label') && 
                 !node.classList.contains('cc-1fwh6g8')))
        .map(node => node.textContent)
        .join('').trim();
      
      if (titleText) {
        markdown += `# ${titleText}\n\n`;
      }
    }
    
    // Process all child nodes recursively
    function processNode(node) {
      if (!node) return '';
      
      // Text node - just return the text
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      
      // Element node - process based on tag
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        
        // Handle different elements
        switch (tagName) {
          case 'h1': return `# ${processChildNodes(node)}\n\n`;
          case 'h2': return `## ${processChildNodes(node)}\n\n`;
          case 'h3': return `### ${processChildNodes(node)}\n\n`;
          case 'h4': return `#### ${processChildNodes(node)}\n\n`;
          case 'h5': return `##### ${processChildNodes(node)}\n\n`;
          case 'h6': return `###### ${processChildNodes(node)}\n\n`;
          
          case 'p': return `${processChildNodes(node)}\n\n`;
          
          case 'strong':
          case 'b': return `**${processChildNodes(node)}**`;
          
          case 'em':
          case 'i': return `*${processChildNodes(node)}*`;
          
          case 'code': return `\`${processChildNodes(node)}\``;
          
          case 'blockquote': return `> ${processChildNodes(node).replace(/\n/g, '\n> ')}\n\n`;
          
          case 'div':
            // Handle code blocks
            if (node.classList.contains('code-block')) {
              const codeElement = node.querySelector('pre, code');
              if (codeElement) {
                // Try to find language
                const langMatch = Array.from(codeElement.classList).find(cls => cls.startsWith('language-'));
                const lang = langMatch ? langMatch.replace('language-', '') : '';
                return `\`\`\`${lang}\n${codeElement.textContent.trim()}\n\`\`\`\n\n`;
              }
            }
            
            // Handle Confluence tables - special case for the outer container
            if (node.classList.contains('pm-table-container')) {
              // Check if this is a full table container
              const allTables = node.querySelectorAll('table');
              if (allTables.length > 0) {
                return processConfluenceTableContainer(node);
              }
            }
            
            // Regular table handling
            if (node.querySelector('table')) {
              const table = node.querySelector('table');
              if (table) {
                return processTable(table);
              }
            }
            
            return processChildNodes(node);
          
          case 'pre':
            return `\`\`\`\n${node.textContent.trim()}\n\`\`\`\n\n`;
          
          case 'ul':
            return processChildNodes(node) + '\n';
          
          case 'ol':
            return processChildNodes(node) + '\n';
          
          case 'li':
            const parent = node.parentNode;
            const prefix = parent.tagName.toLowerCase() === 'ol' ? 
              `${Array.from(parent.children).indexOf(node) + 1}. ` : '- ';
            
            // Handle nested lists
            const indent = getIndentLevel(node);
            const indentStr = '  '.repeat(indent);
            
            return `${indentStr}${prefix}${processChildNodes(node)}\n`;
          
          case 'a':
            return `[${processChildNodes(node)}](${node.getAttribute('href')})`;
          
          case 'img':
            const alt = node.getAttribute('alt') || '';
            return `![${alt}](${node.getAttribute('src')})`;
          
          case 'br':
            return '\n';
          
          // Skip interactive elements and hidden elements
          case 'button':
          case 'span':
            if (node.getAttribute('role') === 'presentation' || 
                node.style.display === 'none' || 
                node.classList.contains('heading-anchor-wrapper')) {
              return '';
            }
            return processChildNodes(node);
          
          default:
            return processChildNodes(node);
        }
      }
      
      return '';
    }
    
    // Helper function to determine list indent level
    function getIndentLevel(node) {
      let level = 0;
      let current = node;
      
      while (current && current.parentNode) {
        if (current.parentNode.tagName === 'UL' || current.parentNode.tagName === 'OL') {
          current = current.parentNode;
          
          // Check if this list is nested inside another list item
          if (current.parentNode && current.parentNode.tagName === 'LI') {
            level++;
          }
        } else {
          current = current.parentNode;
        }
      }
      
      return level;
    }
    
    // Helper function to handle Confluence's special table container structure
    function processConfluenceTableContainer(container) {
      // Confluence often splits tables into multiple parts in the DOM:
      // 1. A fixed header table 
      // 2. A main content table

      let markdown = '\n';
      const tables = container.querySelectorAll('table');
      
      if (tables.length === 0) return '';
      
      // If there's just one table, process it normally
      if (tables.length === 1) {
        return processTable(tables[0]);
      }
      
      // Process the first table for headers (usually the fixed header)
      const headerTable = tables[0];
      const headerRows = headerTable.querySelectorAll('tr');
      const headerCells = headerRows.length > 0 ? headerRows[0].querySelectorAll('th') : [];
      
      if (headerCells.length > 0) {
        // Add header cells
        markdown += '| ' + Array.from(headerCells).map(cell => {
          const cellContent = processChildNodes(cell).trim().replace(/\n/g, ' ');
          return cellContent || ' ';
        }).join(' | ') + ' |\n';
        
        // Add separator row
        markdown += '| ' + Array.from(headerCells).map(_ => '---').join(' | ') + ' |\n';
      }
      
      // Look for the content table (usually the second table)
      for (let i = 1; i < tables.length; i++) {
        const contentTable = tables[i];
        const contentRows = contentTable.querySelectorAll('tr');
        
        // Process content rows
        for (let j = 0; j < contentRows.length; j++) {
          const row = contentRows[j];
          const cells = row.querySelectorAll('td');
          
          if (cells.length > 0) {
            markdown += '| ' + Array.from(cells).map(cell => {
              const cellContent = processChildNodes(cell).trim().replace(/\n/g, ' ');
              return cellContent || ' ';
            }).join(' | ') + ' |\n';
          }
        }
      }
      
      return markdown + '\n';
    }
    
    // Helper function to process tables
    function processTable(table) {
      if (!table) return '';
      
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length === 0) return '';
      
      let markdown = '\n';
      
      // Process header row
      const headerRow = rows[0];
      const headerCells = Array.from(headerRow.querySelectorAll('th'));
      
      if (headerCells.length > 0) {
        // Add header cells
        markdown += '| ' + headerCells.map(cell => {
          const cellContent = processChildNodes(cell).trim().replace(/\n/g, ' ');
          return cellContent || ' ';
        }).join(' | ') + ' |\n';
        
        // Add separator row
        markdown += '| ' + headerCells.map(_ => '---').join(' | ') + ' |\n';
      }
      
      // Process data rows - include all rows if no header cells or start from second row
      const startRow = headerCells.length > 0 ? 1 : 0;
      for (let i = startRow; i < rows.length; i++) {
        const row = rows[i];
        const cells = Array.from(row.querySelectorAll('td, th'));
        
        if (cells.length > 0) {
          markdown += '| ' + cells.map(cell => {
            const cellContent = processChildNodes(cell).trim().replace(/\n/g, ' ');
            return cellContent || ' ';
          }).join(' | ') + ' |\n';
        }
      }
      
      return markdown + '\n';
    }
    
    // Process all child nodes of an element
    function processChildNodes(node) {
      let result = '';
      for (const child of node.childNodes) {
        // Skip buttons and presentation elements
        if (child.nodeType === Node.ELEMENT_NODE) {
          const role = child.getAttribute('role');
          if (role === 'presentation' || child.tagName.toLowerCase() === 'button' ||
              child.classList.contains('heading-anchor-wrapper')) {
            continue;
          }
        }
        
        result += processNode(child);
      }
      return result;
    }
    
    // Process the content container
    const contentMarkdown = processChildNodes(contentContainer);
    
    // Combine title and content
    markdown += contentMarkdown;
    
    // Clean up extra newlines
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
    
    return markdown;
  }
  
  // Main function
  function main() {
    try {
      const markdown = convertToMarkdown();
      
      // Create a modal to display the markdown
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '10%';
      modal.style.left = '10%';
      modal.style.width = '80%';
      modal.style.height = '80%';
      modal.style.backgroundColor = 'white';
      modal.style.border = '1px solid #ccc';
      modal.style.borderRadius = '5px';
      modal.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
      modal.style.zIndex = '10000';
      modal.style.display = 'flex';
      modal.style.flexDirection = 'column';
      modal.style.padding = '20px';
      
      // Title and close button
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '10px';
      
      const title = document.createElement('h2');
      title.textContent = 'Confluence to Markdown';
      title.style.margin = '0';
      
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.style.padding = '5px 10px';
      closeButton.style.cursor = 'pointer';
      closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      header.appendChild(title);
      header.appendChild(closeButton);
      
      // Textarea for the content
      const textarea = document.createElement('textarea');
      textarea.value = markdown;
      textarea.style.width = '100%';
      textarea.style.height = 'calc(100% - 80px)';
      textarea.style.padding = '10px';
      textarea.style.border = '1px solid #ccc';
      textarea.style.borderRadius = '3px';
      textarea.style.resize = 'none';
      textarea.style.fontFamily = 'monospace';
      textarea.style.fontSize = '14px';
      
      // Copy button
      const copyButton = document.createElement('button');
      copyButton.textContent = 'Copy to Clipboard';
      copyButton.style.padding = '8px 15px';
      copyButton.style.marginTop = '10px';
      copyButton.style.cursor = 'pointer';
      copyButton.addEventListener('click', () => {
        textarea.select();
        document.execCommand('copy');
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = 'Copy to Clipboard';
        }, 2000);
      });
      
      // Add all elements to modal
      modal.appendChild(header);
      modal.appendChild(textarea);
      modal.appendChild(copyButton);
      
      // Add modal to document
      document.body.appendChild(modal);
      
      // Focus and select the text for easy copying
      textarea.focus();
      textarea.select();
    } catch (error) {
      console.error('Error converting to Markdown:', error);
      alert('Error converting page to Markdown: ' + error.message);
    }
  }
  
  main();
})();
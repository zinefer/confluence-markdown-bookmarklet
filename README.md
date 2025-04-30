# Confluence to Markdown Bookmarklet

A simple bookmarklet that converts Confluence pages to Markdown format with a single click.

## What is a Bookmarklet?

A bookmarklet is a bookmark stored in a web browser that contains JavaScript commands to extend the browser's functionality. When clicked, it performs an action on the current page rather than navigating to a new page.

## Installation

To install the Confluence to Markdown bookmarklet:

1. Create a new bookmark in your browser
2. Name it "Confluence to Markdown" (or any name you prefer)
3. Copy the entire content of the [dist/bookmarklet.js](dist/bookmarklet.js) file
4. Paste it as the URL/location of the bookmark
5. Save the bookmark

## Usage

1. Navigate to any Confluence page
2. Click the "Confluence to Markdown" bookmark in your browser
3. A modal will appear with the Markdown version of the page
4. Click "Copy to Clipboard" to copy the Markdown
5. Use the Markdown in your preferred editor or tool

## Features

- Converts Confluence formatting to Markdown
- Handles headings, lists, links, images, and code blocks
- Preserves document structure
- One-click copy to clipboard

## Development

### Prerequisites

- Node.js (v14 or later recommended)
- npm or yarn

### Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```

### Build

To build the bookmarklet:

```
npm run build
```

This will create the minified bookmarklet in the `dist` directory.

For development with auto-rebuild:

```
npm run dev
```


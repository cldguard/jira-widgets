# ChatGPT → JIRA Markup Formatter

A minimal, client‑side utility to convert ChatGPT/Markdown output into Atlassian JIRA legacy wiki markup and copy it to your clipboard.

This tool lives in a single HTML file: `chatgpt_to_jira.html`. Open it in your browser, paste Markdown on the left, click Convert, then copy and paste the JIRA-formatted text into your JIRA comment or description. It is designed to be embedded on a Confluence page via the HTML macro.

## Why this exists

JIRA (classic/legacy wiki renderer) uses a markup format different from Markdown. Manually converting headings, code fences, lists, and emphasis can be tedious. This utility automates the most common transformations for quick paste into JIRA.

## Quick Start

1) Open the tool:
   - Double-click `chatgpt_to_jira.html` or drag it into a modern browser (Chrome/Edge/Firefox).
   - No build, install, or internet connection required.

2) Paste Markdown:
   - Paste ChatGPT’s response (Markdown) into the left textarea.

3) Convert:
   - Click “Convert → Jira”. The converted JIRA markup appears in the right textarea.

4) Copy:
   - Click “Copy Jira Markup” to copy the entire right-hand textarea to your clipboard.
   - Paste it directly into JIRA.

## Confluence deployment (designed usage)

- On a Confluence page, insert the HTML macro and paste the entire contents of `chatgpt_to_jira/chatgpt_to_jira.html`, then publish.
- Notes:
  - The HTML macro must be enabled by a Confluence admin.
  - Everything runs client-side in the browser; no backend services are required.

## What gets converted

The current implementation handles these transformations:

- Headings
  - Markdown: `# H1`, `## H2`, … `###### H6`
  - JIRA: `h1. H1`, `h2. H2`, … `h6. H6`

- Blockquotes
  - Markdown: `> quoted text`
  - JIRA: `bq. quoted text`

- Horizontal Rules
  - Markdown: `---` (3+ hyphens)
  - JIRA: `----`

- Unordered Lists
  - Markdown: `- item` or `* item`
  - JIRA: `* item`

- Ordered Lists
  - Markdown: `1. item`
  - JIRA: `# item`

- Fenced Code Blocks
  - Markdown: 
    ```
    ```lang optional-title
    code lines...
    ```
    ```
  - JIRA:
    - With language and title: `{code:language=lang|title=optional-title}` … `{code}`
    - With language only: `{code:language=lang}` … `{code}`
    - With no language: `{code}` … `{code}`
  - Note: Content inside code blocks is not transformed.

- Inline Bold
  - Markdown: `**bold**`
  - JIRA: `*bold*`

- Inline “Code” (current behavior)
  - Markdown: `` `text` ``
  - JIRA: `_text_` (italic)
  - Note: This utility currently maps inline backticks to italics. If you prefer JIRA’s inline code `{{text}}`, the script can be adjusted.

- Links
  - Markdown: `[text](https://example.com)`
  - JIRA: `[text|https://example.com]`

## Usage Tips

- Convert before copying:
  - Always click “Convert → Jira” first to populate the right-hand textarea with the latest conversion.

- Clipboard permissions:
  - The “Copy Jira Markup” button uses `navigator.clipboard.writeText`. Some browsers require a user gesture (click) or specific permissions. If copying fails, a message will suggest manually selecting the right textarea and copying.

- Privacy:
  - Everything runs locally in your browser. No data leaves your machine.

## Known Limitations

- Inline backticks are converted to italics `_text_` instead of JIRA inline code `{{text}}`. If you need `{{...}}`, update the script’s inline conversion accordingly.
- Nested lists and complex list indentation are not normalized; lines are rewritten one-by-one (`*` or `#`), which may not replicate exact nesting depth.
- Only alphanumeric languages (matched by `\w+`) on code fences are recognized for `{code:language=...}`. Languages with symbols (e.g., `c++`) will be treated as no-language.
- This targets JIRA’s legacy wiki renderer syntax, not the newer Markdown-like renderer.

## Example

Input (Markdown):
```
# Feature Plan

> Draft only

- Alpha
- Beta

```js Plan.js
function run() {
  console.log("ok");
}
```

**Important:** use `run()`.

See [docs](https://example.com).
```

Output (JIRA):
```
h1. Feature Plan

bq. Draft only

* Alpha
* Beta

{code:language=js|title=Plan.js}
function run() {
  console.log("ok");
}
{code}

*Important:* use _run()_.

[docs|https://example.com]
```

## Development Notes

- File: `chatgpt_to_jira/chatgpt_to_jira.html`
- Core function: `convertMarkdownToJira(markdown)`
- Copy button reads from the right textarea’s `.value` and uses `navigator.clipboard.writeText`.

To adjust behavior (e.g., change inline code from `_text_` to `{{text}}`), edit the inline conversion line:
```js
// Current behavior:
jira = jira.replace(/`([^`]+)`/g, "_$1_");

// Alternative JIRA inline code:
jira = jira.replace(/`([^`]+)`/g, "{{$1}}");
```

## Support

If you encounter issues or have suggestions, report them via your team’s normal process or open an issue in the repository (if available).

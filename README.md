# Jira Widgets

A collection of small, client‑side widgets designed to improve productivity when working with Atlassian Jira. Each widget is self-contained (HTML/JS) and can be used locally in a browser or embedded in Jira (e.g., via a Text Gadget) where applicable.

## Available Widgets

### 1) ChatGPT → JIRA Markup Formatter
Convert ChatGPT/Markdown output into Jira’s legacy wiki markup so you can paste it directly into Jira comments or descriptions.

- What it does:
  - Transforms headings, lists, blockquotes, horizontal rules
  - Converts fenced code blocks to `{code}` with optional language/title
  - Converts links to `[text|url]`
  - Maps inline styles (bold/italics) as described in its README
- How to use (local):
  - Open `chatgpt_to_jira/chatgpt_to_jira.html` in your browser
  - Paste Markdown on the left
  - Click “Convert → Jira”
  - Click “Copy Jira Markup” and paste into Jira
- Confluence deployment (designed usage):
  - On a Confluence page, insert the HTML macro and paste the entire contents of `chatgpt_to_jira/chatgpt_to_jira.html`, then publish.
  - Notes:
    - The HTML macro must be enabled by a Confluence admin.
    - Everything runs client-side in the browser; no backend services are required.
- Documentation:
  - See chatgpt_to_jira/ChatGPT_to_JIRA_README.md

### 2) JIRA Worklog Report
An interactive, embeddable worklog report for Jira dashboards that uses the Jira REST API to fetch issues/worklogs and render a filterable, exportable table.

- What it does:
  - Pulls issues from a Jira filter and loads worklogs
  - Supports date/user filters, category parsing from comments, total summaries
  - Exports CSV and copies rich HTML
  - Auto-resizes inside the Jira Text Gadget
- How to deploy:
  - Upload `worklog_report/worklog_report.js` as a Jira issue attachment and reference it from `worklog_report/worklog_report.html`
  - Paste the HTML into a Jira Text Gadget and set the correct `attachment ID` and `data-filter-id`
- Documentation:
  - See worklog_report/JIRA_WORKLOG_REPORT_README.md

## Repository Structure

- chatgpt_to_jira/
  - chatgpt_to_jira.html — client-side formatter UI
  - ChatGPT_to_JIRA_README.md — detailed usage and behavior
- worklog_report/
  - worklog_report.html — UI container for the gadget content
  - worklog_report.js — logic to load/format worklogs via Jira REST
  - JIRA_WORKLOG_REPORT_README.md — full deployment and usage guide

## Getting Started

- Local usage (no build required):
  - Open the `.html` files directly in a modern browser (Chrome/Edge/Firefox)
- Jira Text Gadget (where applicable):
  - For the Worklog Report, follow the steps in the corresponding README to upload the JS to Jira attachments and reference it in the HTML gadget
- Confluence HTML macro (chatgpt_to_jira):
  - In Confluence, add the HTML macro to a page and paste the entire contents of `chatgpt_to_jira/chatgpt_to_jira.html`, then publish. The HTML macro must be enabled by a Confluence admin.

## Documentation Links

- ChatGPT → JIRA Markup Formatter: ./chatgpt_to_jira/ChatGPT_to_JIRA_README.md
- JIRA Worklog Report: ./worklog_report/JIRA_WORKLOG_REPORT_README.md

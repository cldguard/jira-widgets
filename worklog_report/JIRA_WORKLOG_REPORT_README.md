Below is a clean, professional **JIRA_WORKLOG_REPORT.md** document you can drop into your repository or attach to the Jira gadget documentation.

---

# **JIRA Worklog Report – Documentation**

## **Overview**

This document describes the design, purpose, installation, and usage of the **Jira Worklog Report** system implemented using **worklog_report.html** and **worklog_report.js**.
These two files together provide an advanced, interactive worklog reporting tool that can be embedded directly inside a **Jira Text Gadget** on any Jira Dashboard.

The report dynamically loads issues and worklogs using the Jira REST API (v2), supports filtering, formatting, categorization, exporting, and automatic resizing within the Jira dashboard.

---

# **1. Purpose of the Files**

## **worklog_report.html**

The `worklog_report.html` file is the **UI container** for the report. It includes:

* A clean, stylesheet-based layout
* The table structure used to display Jira worklogs
* Filter controls (date filters, user filter, recalc button)
* Operational controls (copy to clipboard, export CSV)
* A container `<table>` where all data rows will be inserted dynamically
* The `<script>` reference that loads `worklog_report.js`

This HTML file is designed so that it can be placed **directly inside a Jira text gadget**, where it serves as the host UI for all rendered worklog data.

---

## **worklog_report.js**

The `worklog_report.js` file contains all the **logic** for the Worklog Report:

### **Core Responsibilities**

### ✔ Fetch Jira Data

* Retrieves the **filter JQL** using:
  `/rest/api/2/filter/{filterId}`
* Executes a Jira search query using:
  `/rest/api/2/search?jql=...`
* Fetches worklogs for each issue using:
  `/rest/api/2/issue/{key}/worklog`
* Fetches **current logged-in user** using:
  `/rest/api/2/myself`

### ✔ Parse & Render Worklog Rows

* Date
* Time spent (h/m)
* Category (using hashtags in the comment)
* Username (from worklog author)
* Worklog entry text

### ✔ Summary Rows

At the end of each issue’s block:

* Total time spent
* Hyperlinked issue key
* When “Current User” is selected:
  the summary row includes the user’s name.

### ✔ Filtering Logic

Supports:

* **This Week**
* **Last Week**
* **This Month**
* **Last Month**
* **All Time**
* **All Users**
* **Current User Only**

### ✔ Gadget Auto-Sizing

Automatically resizes the Jira gadget `<li id="rep-XXXX">` when:

* Maximized (`class="gadget ... maximized"`)
* Restored to normal size

### ✔ User Controls

* Copy table as **Rich HTML**
* Export to **CSV**
* Save date filter to cookie
* Re-calc the table after filter changes

---

# **2. How to Add the Worklog Report to a Jira Text Gadget**

## **Step 1 — Upload the JS File into Jira Attachments**

Because Jira does not allow external script URLs (for security), the `worklog_report.js` must be uploaded to an **issue attachment** so it can be referenced like:

```
/secure/attachment/{ATTACHMENT_ID}/worklog_report.js
```

You already have this, for example:

```
/secure/attachment/12216/worklog_report.js
```

## **Step 2 — Create a Text Gadget**

1. Go to **Jira Dashboard** → *Add Gadget*
2. Search for **Text**
3. Click **Add**
4. Click the **Edit (pencil)** icon
5. Make sure the gadget setting “Interpret HTML” is enabled (if available)

## **Step 3 — Paste the contents of worklog_report.html**

Open your `worklog_report.html` and:

* Copy **everything**
* Paste it into the **Text Gadget content box**

Be sure to update the `script` tag to reference the correct attachment ID for your environment:

```html
<script
  src="/secure/attachment/12216/worklog_report.js"
  data-filter-id="13304"
  data-max-results="20">
</script>
```

## **Step 4 — Configure the Filter ID**

`data-filter-id` is the ID of a Jira filter that defines which issues the report will analyze.

Example:

```html
data-filter-id="13304"
```

This filter should return the list of issues whose worklogs you want to report on.

---

# **3. How to Operate the Controls**

Once the Worklog Report loads inside the Jira dashboard, you will see:

---

## **A. Top Control Icons**

### **⧉ Copy Button**

Copies the **entire worklog table’s HTML (rich text)** to the clipboard.
You can paste it into:

* Outlook
* Confluence
* Word
* Teams
* Slack (partially supported)

### **⬇ Export Button**

Downloads the displayed table as a **worklog.csv** file.

CSV includes:

* Headers
* All rendered rows
* Category
* Username
* Summary rows

---

## **B. Filters Section**

### **Date Filters**

| Option     | Meaning                         |
| ---------- | ------------------------------- |
| This Week  | Monday → Sunday of current week |
| Last Week  | Monday → Sunday of prior week   |
| This Month | Current month only              |
| Last Month | Prior month                     |
| All        | No date filtering               |

Changing date filters requires pressing **Re-calc**.

---

### **User Filters**

| Option           | Behavior                                          |
| ---------------- | ------------------------------------------------- |
| **All Users**    | Show worklogs from everyone                       |
| **Current User** | Show only worklogs authored by the logged-in user |

When “Current User” is selected:

* Each issue’s summary row shows that user’s name.

---

### **Re-calc Button**

After changing filters:

* Click **Re-calc**
* The table rebuilds using:

  * Date filter
  * User filter
  * Category parsing
  * Total time calculations

The gadget automatically resizes during recalculation.

---

## **C. Worklog Table Columns**

| Column             | Description                               |
| ------------------ | ----------------------------------------- |
| **Jira Key**       | Hyperlinked to the issue                  |
| **Jira Summary**   | The issue summary                         |
| **Work Date**      | Worklog timestamp                         |
| **Work Time**      | Hours/minutes                             |
| **User**           | The worklog’s author                      |
| **Category**       | Extracted from `#Tag` at start of comment |
| **Work Log Entry** | Description text, supports line breaks    |

### **Category Extraction Rules**

A worklog starting with a hashtag word:

```
#Mtg Discussed issue with Bob
```

Produces:

| Category | Entry                    |
| -------- | ------------------------ |
| Mtg      | Discussed issue with Bob |

---

## **D. Summary Rows**

Below each issue’s worklogs:

* Shows total time for the issue
* Always hyperlinked to the Jira issue
* Background color: `#eeeeff`
* Displays current user name if filtered to “Current User”

---

# **4. Maintenance Notes**

* If the JS file is updated, re-upload the new version and update the attachment ID in the HTML.
* You may store multiple versions using different attachment IDs.
* Jira caches Text gadget output aggressively; a browser refresh is sometimes required.

---

# **5. Summary**

The Worklog Report is a fully interactive, embedded Jira dashboard tool that:

* Retrieves worklogs dynamically from Jira
* Supports rich filtering
* Extracts categories from descriptions
* Displays summary totals
* Allows user filtering
* Automatically resizes within a gadget
* Supports exporting and copying

It is self-contained, requires no backend server, and uses only Jira’s REST API and browser-side JavaScript.

---

If you’d like, I can also generate:

🔥 **A PDF version of this file**
🔥 **A Confluence page version**
🔥 **A short version for internal documentation**

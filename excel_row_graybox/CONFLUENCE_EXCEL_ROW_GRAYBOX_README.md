Below is a polished, production-quality **`CONFLUENCE_EXCEL_ROW_GRAYBOX_README.md`** file describing the full functionality, architecture, installation, and extensibility, including optional JSON crosswalk integration.

---

# **CONFLUENCE_EXCEL_ROW_GRAYBOX_README.md**

### *Interactive Excel-to-Graybox Row Inspector for Confluence*

---

## **1. Overview**

This component provides an interactive way to explore data stored in an Excel file that is attached to a Confluence page and rendered through the **Excel macro**. The system enhances a standard Excel-rendered table by enabling:

* **Click-to-Inspect**: Clicking any data cell reveals all row details in a popup **graybox**.
* **Automatic Header Mapping**: Headers from the first row become field names in the popup.
* **Pivoted Row Display**: The displayed graybox shows a two-column “key | value” table.
* **Clicked Cell Highlighting**: The field corresponding to the clicked cell appears highlighted.
* **Hover & Pointer UX**: Data rows show a pointer cursor and highlight on hover.
* **Dynamic Table Targeting**: Confluence auto-renames Excel tables (`offconn-1`, `offconn-2`, etc.), and this script automatically detects the correct table.
* **Graybox Hide/Show**: Graybox is hidden by default and appears only when needed.

This is a **generic framework** that can be extended to integrate with **external or attached JSON files** for data enrichment or cross-references.

---

## **2. Functional Goals**

### **2.1 User Interaction Goals**

1. Display an Excel spreadsheet on a Confluence page.
2. Allow the user to click **any data cell** (except header).
3. Show a graybox popup containing:

   * All column names (from header row)
   * All values from the selected row
   * Highlighting of the clicked field
4. Provide a clean way to close the popup.

### **2.2 Technical Goals**

1. Work seamlessly with Confluence's auto-generated table class names (`offconn-*`).
2. Run entirely within an **HTML macro** on the page — no plugins required.
3. Support any number of rows and any number of columns.
4. Provide a reusable, extensible base framework for later enhancements such as:

   * JSON lookup
   * Data merging
   * Multi-file crosswalks
   * API enhancement

---

## **3. Components**

This feature consists of the following:

### **3.1 HTML/CSS/JS in an HTML Macro**

The macro contains:

* CSS rules for pointer cursor, row hover highlighting, and graybox styling
* A graybox container (initially hidden)
* JavaScript logic to:

  * Detect the Excel-rendered table
  * Extract header and row data
  * Display row details in the graybox
  * Close/hide the graybox

### **3.2 Excel Macro**

Confluence's built-in Excel macro is used to display the spreadsheet.
No modifications to the Excel macro are required.

### **3.3 Attached Excel File**

A single Excel file is attached to the page.
The Excel macro renders it into a `<table class="offconn-N">`.

The script dynamically locates this table automatically.

---

## **4. Installation Instructions**

### **Step 1: Attach your Excel file**

1. Edit the Confluence page.
2. Attach your `.xlsx` file (drag & drop or via "Attachments").
3. Insert the **Excel macro**.
4. Choose the attached file as the source.

### **Step 2: Add an HTML Macro**

1. Insert → **Other Macros** → **HTML**
2. Paste the full script (CSS + HTML + JavaScript) into the macro
3. Update the page

### **Step 3: Test**

* Hover over any table row → row highlights
* Cursor changes to a pointer
* Click a data cell → graybox appears
* Click the `(×)` in top-right → graybox closes

---

## **5. Data Flow Description**

### **5.1 Table Detection**

Confluence Excel macro names tables with classes like:

```
offconn-1
offconn-2
offconn-3
```

The script dynamically selects the table using:

```js
document.querySelector("table[class^='offconn-']");
```

### **5.2 Header Extraction**

The first row of the table is assumed to contain headers:

```js
const headerRow = table.rows[0];
const headers = Array.from(headerRow.cells)
                     .map(cell => cell.textContent.trim());
```

### **5.3 Row Object Construction**

When a user clicks a row:

```js
rowObj[headers[i]] = row.cells[i].textContent.trim();
```

This produces:

```json
{
  "VP": "Bob Villa",
  "App": "Home1"
}
```

### **5.4 Graybox Pivot Table Rendering**

Each `header : value` pair is displayed as:

```
VP   | Bob Villa
App  | Home1
```

### **5.5 Clicked Field Highlighting**

The cell/field that was clicked is shown with a different background color.

---

## **6. Extensibility: JSON Crosswalk Framework**

This interactive system provides a foundation for more advanced functionality.
A common extension is **JSON lookup**, where the graybox pivots not only Excel data,
but also **additional information from a JSON file** attached to the same page.

### **6.1 Potential Use Cases**

* Lookup enriched metadata for the clicked row
* Crosswalk between keys in Excel and fields in JSON
* Add hyperlinks, descriptions, or extended detail in the graybox popup
* Perform multi-file joining operations (Excel ↔ JSON ↔ API)

### **6.2 JSON Attachment Loader (Optional Future Extension)**

The framework can easily support:

```js
fetch('/download/attachments/.../mydata.json')
  .then(resp => resp.json())
  .then(data => {
      // Match Excel row fields to JSON records
      // Merge fields into the graybox output
  });
```

### **6.3 Join Strategies**

You may join Excel and JSON via:

* Matching IDs
* Matching names
* Composite keys
* Lookup tables
* Range matches

### **6.4 UI Extension Examples**

Once JSON is merged, your graybox could display:

```
VP            Bob Villa
App           Home1
Department    Residential Services
Level         Senior Manager
Permissions   View, Edit
Notes         Has active projects...
```

---

## **7. Limitations**

### **7.1 Supported**

✔ Single Excel macro per page
✔ Any number of rows
✔ Any number of columns
✔ Single header row
✔ Single-click graybox display
✔ JSON extensions possible

### **7.2 Not Supported (out-of-the-box)**

✘ Multiple Excel tables on the same page (but can be enabled)
✘ Automatic JSON merging (requires extension)
✘ Tables without headers
✘ Columns with merged cells

---

## **8. Maintenance Considerations**

* Confluence cloud/on-prem may sanitize unsupported HTML/JS depending on space configuration; ensure your space allows HTML macros.
* Confluence’s Excel macro rewriting of table classes (`offconn-*`) is handled automatically by the dynamic selector.
* If multiple tables are needed, the script can be upgraded to handle all `offconn-*` tables instead of just the first match.

---

## **9. Conclusion**

This framework provides a robust, extensible method for converting Excel data shown in Confluence into an interactive, user-friendly row inspection experience.

Out of the box, users can:

* Hover to highlight rows
* Click to open a graybox with pivoted row details
* View clean, readable key/value pairs
* Close the popup easily

With minor extensions, this can evolve into a powerful **Excel + JSON data viewer**, a lightweight **metadata inspector**, or a **cross-system data exploration tool** integrated directly within Confluence.

If you're building dashboards, operational pages, data dictionaries, or lookup tools, this component can serve as a foundational module.

---
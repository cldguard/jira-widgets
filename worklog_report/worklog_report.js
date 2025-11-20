// ===== CONFIG VIA <script> TAG DATA-ATTRIBUTES =====
(function () {
  const currentScript = document.currentScript;
  const dataset = (currentScript && currentScript.dataset) || {};

  window.JIRA_WORKLOG_CONFIG = {
    filterId: dataset.filterId || "12345",             // default filterId
    maxResults: parseInt(dataset.maxResults || "200", 10)
  };
})();

// Global storage for original data so we can re-filter
let ISSUES_WITH_WORKLOGS_RAW = [];
const COOKIE_NAME = "jiraWorklogDateFilter";
const COOKIE_DAYS = 30;

// Current user info (from /rest/api/2/myself)
let CURRENT_USER = null;

// --------------------------------------------------------
//  Resize Jira Text Gadget depending on maximize/restore
// --------------------------------------------------------

let ORIGINAL_GADGET_HEIGHT = null;

// Get current gadget ID from URL hash (#Text/12345)
function getCurrentGadgetIdFromHash() {
  try {
    const hash = window.top.location.hash || "";
    const match = hash.match(/#Text\/(\d+)/);
    return match ? match[1] : null;
  } catch (e) {
    return null; // Cross-origin or other constraints
  }
}

// Find the gadget <li> element by id="rep-<id>"
function getGadgetLI() {
  const id = getCurrentGadgetIdFromHash();
  if (!id) return null;
  return document.getElementById("rep-" + id);
}

// Detect if the gadget is currently maximized
function isGadgetMaximized(li) {
  if (!li) return false;
  return li.classList.contains("maximized");
}

// Resize gadget when maximized
function expandGadgetToTable() {
  const li = getGadgetLI();
  if (!li) return;

  const table = document.getElementById("worklog-table");
  if (!table) return;

  // Save original height (only once)
  if (ORIGINAL_GADGET_HEIGHT === null) {
    ORIGINAL_GADGET_HEIGHT = li.style.height || "";
  }

  const rect = table.getBoundingClientRect();
  const tableHeight = rect.height || table.offsetHeight || 0;

  const padding = 40;
  const desiredHeight = Math.min(1000, tableHeight + padding);

  li.style.height = desiredHeight + "px";
}

// Restore gadget back to original height
function restoreGadgetSize() {
  const li = getGadgetLI();
  if (!li) return;

  if (ORIGINAL_GADGET_HEIGHT !== null) {
    li.style.height = ORIGINAL_GADGET_HEIGHT;
  }
}

// Check and apply the correct size (call this after render)
function updateGadgetSizeBasedOnState() {
  const li = getGadgetLI();
  if (!li) return;

  if (isGadgetMaximized(li)) {
    expandGadgetToTable();
  } else {
    restoreGadgetSize();
  }
}

// ===== COOKIE HELPERS =====
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
}

function getCookie(name) {
  const decoded = decodeURIComponent(document.cookie || "");
  const ca = decoded.split(";");
  const prefix = name + "=";
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(prefix) === 0) {
      return c.substring(prefix.length, c.length);
    }
  }
  return null;
}

function restoreFilterFromCookie() {
  const value = getCookie(COOKIE_NAME);
  if (!value) return;
  const radio = document.querySelector('input[name="dateFilter"][value="' + value + '"]');
  if (radio) {
    radio.checked = true;
  }
}

function saveFilterToCookie() {
  const filterType = getSelectedDateFilterType();
  if (filterType) {
    setCookie(COOKIE_NAME, filterType, COOKIE_DAYS);
  } else {
    // Clear cookie by setting past expiry
    setCookie(COOKIE_NAME, "", -1);
  }
}

// ===== BASIC HELPERS =====
function setStatus(msg, isError) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? "red" : "#555";
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatWorkDate(started) {
  if (!started) return "";
  const d = new Date(started);
  if (isNaN(d.getTime())) {
    return escapeHtml(started);
  }
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}

function formatDurationSeconds(seconds) {
  if (typeof seconds !== "number" || !isFinite(seconds) || seconds <= 0) {
    return "";
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  const parts = [];
  if (hours) parts.push(hours + "h");
  if (minutes) parts.push(minutes + "m");
  return parts.join(" ") || "0m";
}

function formatWorkTime(worklog) {
  if (worklog.timeSpent) {
    return escapeHtml(worklog.timeSpent);
  }
  if (typeof worklog.timeSpentSeconds === "number") {
    return formatDurationSeconds(worklog.timeSpentSeconds);
  }
  return "";
}

// Parse category and remaining text from comment
// Example: "#Mtg Discussed issue with Bob"
//   => { category: "Mtg", text: "Discussed issue with Bob" }
function parseCategoryAndText(comment) {
  const raw = comment || "";
  const trimmed = raw.trim();

  const m = trimmed.match(/^#(\S+)\s*(.*)$/);
  if (m) {
    const category = m[1];
    const text = m[2] || "";
    return { category, text };
  }
  return { category: "", text: raw };
}

function getWorklogDisplayParts(worklog) {
  const rawComment = worklog.comment || "";
  const parsed = parseCategoryAndText(rawComment);
  return {
    category: parsed.category,
    // escape and keep line breaks
    htmlText: escapeHtml(parsed.text).replace(/\n/g, "<br>")
  };
}

// Get username for "User" column
function getWorklogUser(wl) {
  const author = wl.author || wl.updateAuthor || {};
  return author.name || author.displayName || author.key || author.accountId || "";
}

// ===== DATE & USER FILTERING =====
function getSelectedDateFilterType() {
  const checked = document.querySelector('input[name="dateFilter"]:checked');
  return checked ? checked.value : null;
}

function getSelectedUserFilterType() {
  const checked = document.querySelector('input[name="userFilter"]:checked');
  return checked ? checked.value : "all_users";
}

function getDateRangeForFilter(filterType) {
  if (!filterType || filterType === "all_time") return null;

  const now = new Date();

  function atMidnight(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  const today = atMidnight(now);

  if (filterType === "this_week" || filterType === "last_week") {
    const day = today.getDay(); // 0=Sun...6=Sat
    const offsetToMonday = (day + 6) % 7;
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - offsetToMonday);
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 7);

    if (filterType === "this_week") {
      return { start: thisWeekStart, end: thisWeekEnd };
    } else {
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(thisWeekStart.getDate() - 7);
      return { start: lastWeekStart, end: thisWeekStart };
    }
  }

  if (filterType === "this_month" || filterType === "last_month") {
    const year = today.getFullYear();
    const month = today.getMonth();

    if (filterType === "this_month") {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 1);
      return { start, end };
    } else {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      return { start, end };
    }
  }

  return null;
}

function isDateInRange(dateValue, range) {
  if (!range) return true;
  if (!dateValue) return false;
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return false;
  return d >= range.start && d < range.end;
}

function worklogMatchesUserFilter(wl, userFilterType) {
  if (!userFilterType || userFilterType === "all_users") return true;
  if (!CURRENT_USER) return false;

  const author = wl.author || wl.updateAuthor || {};
  const authorCandidates = [
    author.name,
    author.key,
    author.accountId,
    author.displayName
  ];
  const meCandidates = [
    CURRENT_USER.name,
    CURRENT_USER.key,
    CURRENT_USER.accountId,
    CURRENT_USER.displayName
  ];

  return authorCandidates.some(a => a && meCandidates.includes(a));
}

// ===== COPY & EXPORT CONTROLS =====
function copyTableHtmlToClipboard() {
  const table = document.getElementById("worklog-table");
  if (!table) return;

  const selection = window.getSelection();
  selection.removeAllRanges();

  const range = document.createRange();
  range.selectNode(table);
  selection.addRange(range);

  try {
    const success = document.execCommand("copy");
    setStatus(success ? "Table HTML copied to clipboard." : "Copy to clipboard failed.", !success);
  } catch (e) {
    setStatus("Copy to clipboard is not supported in this browser.", true);
  }

  selection.removeAllRanges();
}

function exportTableToCsv() {
  const table = document.getElementById("worklog-table");
  if (!table) return;

  const rows = table.querySelectorAll("tr");
  const csvLines = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll("th, td");
    if (!cells.length) return;

    const rowData = [];
    cells.forEach(cell => {
      const text = (cell.textContent || "").replace(/\r?\n|\r/g, " ").trim();
      let escaped = text.replace(/"/g, '""');
      if (/[",]/.test(escaped)) {
        escaped = '"' + escaped + '"';
      }
      rowData.push(escaped);
    });
    csvLines.push(rowData.join(","));
  });

  const csvString = csvLines.join("\r\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "worklog.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  setStatus("CSV exported as worklog.csv.", false);
}

// ===== TABLE RENDERING =====
function applyFilterAndRender() {
  const tbody = document.querySelector("#worklog-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!ISSUES_WITH_WORKLOGS_RAW || ISSUES_WITH_WORKLOGS_RAW.length === 0) {
    setStatus("No worklogs loaded.", false);
    return;
  }

  const dateFilterType = getSelectedDateFilterType();
  const userFilterType = getSelectedUserFilterType();
  const range = getDateRangeForFilter(dateFilterType);

  let totalRows = 0;

  ISSUES_WITH_WORKLOGS_RAW.forEach(issue => {
    const filteredWorklogs = (issue.worklogs || []).filter(wl =>
      isDateInRange(wl.started, range) &&
      worklogMatchesUserFilter(wl, userFilterType)
    );

    if (filteredWorklogs.length === 0 && range) {
      return;
    }

    let totalSeconds = 0;
    filteredWorklogs.forEach(wl => {
      if (typeof wl.timeSpentSeconds === "number") {
        totalSeconds += wl.timeSpentSeconds;
      }
    });

    // Per-worklog rows
    filteredWorklogs.forEach(wl => {
      const tr = document.createElement("tr");

      const tdKey = document.createElement("td");
      tdKey.className = "nowrap";
      const link = document.createElement("a");
      link.href = "/browse/" + encodeURIComponent(issue.issueKey);
      link.textContent = issue.issueKey;
      link.target = "_blank";
      tdKey.appendChild(link);
      tr.appendChild(tdKey);

      const tdSummary = document.createElement("td");
      tdSummary.textContent = issue.summary || "";
      tr.appendChild(tdSummary);

      const tdDate = document.createElement("td");
      tdDate.className = "nowrap";
      tdDate.textContent = formatWorkDate(wl.started);
      tr.appendChild(tdDate);

      const tdTime = document.createElement("td");
      tdTime.className = "nowrap";
      tdTime.textContent = formatWorkTime(wl);
      tr.appendChild(tdTime);

      // User column
      const tdUser = document.createElement("td");
      tdUser.textContent = getWorklogUser(wl);
      tr.appendChild(tdUser);

      // Category column
      const displayParts = getWorklogDisplayParts(wl);
      const tdCategory = document.createElement("td");
      tdCategory.textContent = displayParts.category || "";
      tr.appendChild(tdCategory);

      // Work Log Entry
      const tdEntry = document.createElement("td");
      tdEntry.innerHTML = displayParts.htmlText;
      tr.appendChild(tdEntry);

      tbody.appendChild(tr);
      totalRows++;
    });

    // Summary row for this issue
    if (filteredWorklogs.length > 0) {
      const trSummary = document.createElement("tr");
      trSummary.className = "summary-row";

      // Jira Key (still a link)
      const tdKey = document.createElement("td");
      tdKey.className = "nowrap";
      const summaryLink = document.createElement("a");
      summaryLink.href = "/browse/" + encodeURIComponent(issue.issueKey);
      summaryLink.textContent = issue.issueKey;
      summaryLink.target = "_blank";
      tdKey.appendChild(summaryLink);
      trSummary.appendChild(tdKey);

      const tdSummary = document.createElement("td");
      tdSummary.textContent = (issue.summary || "") + " (Total)";
      trSummary.appendChild(tdSummary);

      const tdDate = document.createElement("td");
      tdDate.textContent = "";
      trSummary.appendChild(tdDate);

      const tdTime = document.createElement("td");
      tdTime.className = "nowrap";
      tdTime.textContent = formatDurationSeconds(totalSeconds);
      trSummary.appendChild(tdTime);

      // User column in summary row
      const tdUser = document.createElement("td");
      if (userFilterType === "current_user" && CURRENT_USER) {
        // Prefer something human-readable, fall back as needed
        tdUser.textContent =
          CURRENT_USER.displayName ||
          CURRENT_USER.name ||
          CURRENT_USER.key ||
          CURRENT_USER.accountId ||
          "";
      } else {
        tdUser.textContent = "";
      }
      trSummary.appendChild(tdUser);

      // Category column blank in summary
      const tdCategory = document.createElement("td");
      tdCategory.textContent = "";
      trSummary.appendChild(tdCategory);

      const tdEntry = document.createElement("td");
      tdEntry.innerHTML = "<strong>Total time for issue</strong>";
      trSummary.appendChild(tdEntry);

      tbody.appendChild(trSummary);
      totalRows++;
    }
  });

  if (totalRows === 0) {
    setStatus("No worklogs found for the selected date range / user filter.", false);
  } else {
    let suffix = "";
    if (dateFilterType && dateFilterType !== "all_time") {
      suffix += " date filter: " + dateFilterType.replace("_", " ");
    } else {
      suffix += " date filter: all time";
    }
    suffix += ", user filter: " + (getSelectedUserFilterType() === "current_user" ? "current user" : "all users");

    setStatus(
      "Rendered " + totalRows + " row" + (totalRows === 1 ? "" : "s") + " (" + suffix + ").",
      false
    );
  }

  updateGadgetSizeBasedOnState();
}

// ===== CURRENT USER FETCH =====
async function fetchCurrentUser() {
  try {
    const resp = await fetch("/rest/api/2/myself");
    if (!resp.ok) {
      console.warn("Failed to fetch current user: HTTP " + resp.status);
      return;
    }
    const data = await resp.json();
    CURRENT_USER = {
      name: data.name || null,
      key: data.key || null,
      accountId: data.accountId || null,
      displayName: data.displayName || null
    };
  } catch (e) {
    console.warn("Error fetching current user:", e);
  }
}

// ===== MAIN LOAD (Jira v2) =====
async function loadWorklogsForFilter(filterId, maxResults) {
  try {
    setStatus("Loading filter " + filterId + "...", false);

    const filterResp = await fetch("/rest/api/2/filter/" + encodeURIComponent(filterId));
    if (!filterResp.ok) {
      throw new Error("Failed to load filter: HTTP " + filterResp.status);
    }
    const filterData = await filterResp.json();
    const jql = filterData.jql;
    if (!jql) {
      throw new Error("Filter has no JQL.");
    }

    setStatus("Filter loaded. Searching issues...", false);

    const searchUrl =
      "/rest/api/2/search?" +
      "jql=" + encodeURIComponent(jql) +
      "&fields=summary" +
      "&maxResults=" + encodeURIComponent(maxResults);

    const searchResp = await fetch(searchUrl);
    if (!searchResp.ok) {
      throw new Error("Failed to search issues: HTTP " + searchResp.status);
    }
    const searchData = await searchResp.json();
    const issues = searchData.issues || [];

    if (issues.length === 0) {
      setStatus("No issues found for this filter.", false);
      ISSUES_WITH_WORKLOGS_RAW = [];
      applyFilterAndRender();
      return;
    }

    setStatus("Found " + issues.length + " issues. Loading worklogs...", false);

    const issuePromises = issues.map(async issue => {
      const issueKey = issue.key;
      const summary = (issue.fields && issue.fields.summary) || "";

      const worklogResp = await fetch(
        "/rest/api/2/issue/" + encodeURIComponent(issueKey) + "/worklog"
      );
      if (!worklogResp.ok) {
        return { issueKey, summary, worklogs: [] };
      }

      const worklogData = await worklogResp.json();
      const worklogs = worklogData.worklogs || [];

      return { issueKey, summary, worklogs };
    });

    ISSUES_WITH_WORKLOGS_RAW = await Promise.all(issuePromises);

    // After data is loaded, restore filter from cookie, then render
    restoreFilterFromCookie();
    applyFilterAndRender();

  } catch (err) {
    console.error(err);
    setStatus("Error: " + err.message, true);
  }

  updateGadgetSizeBasedOnState();
}

document.addEventListener("DOMContentLoaded", function () {
  const cfg = window.JIRA_WORKLOG_CONFIG || { filterId: "12345", maxResults: 200 };

  // Re-calc button: save date filter to cookie, then re-render
  const recalcBtn = document.getElementById("recalc-btn");
  if (recalcBtn) {
    recalcBtn.addEventListener("click", function () {
      saveFilterToCookie();
      applyFilterAndRender();
    });
  }

  // Copy / Export buttons
  const copyBtn = document.getElementById("copy-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", copyTableHtmlToClipboard);
  }
  const exportBtn = document.getElementById("export-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportTableToCsv);
  }

  // Fetch current user first (for user filter), then load data
  fetchCurrentUser().finally(function () {
    loadWorklogsForFilter(cfg.filterId, cfg.maxResults);
  });
});

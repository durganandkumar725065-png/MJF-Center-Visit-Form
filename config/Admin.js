
const API = "http://localhost:5000/api/admin";
const loginPanel = document.getElementById("loginPanel");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const recordMessage = document.getElementById("recordMessage");
const visitorRows = document.getElementById("visitorRows");

let token = "";
let currentRecords = [];

function cell(value) {
    const td = document.createElement("td");
    td.textContent = value == null ? "" : String(value);
    return td;
}

async function apiFetch(path) {
    const response = await fetch(API + path, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 401) {
        logout();
        throw new Error("Session expired. Please log in again.");
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Request failed.");
    }

    return data;
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginMessage.textContent = "Signing in...";

    try {
        const response = await fetch(`${API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: document.getElementById("username").value,
                password: document.getElementById("password").value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed.");
        }

        token = data.token;
        document.getElementById("password").value = "";
        loginPanel.hidden = true;
        dashboard.hidden = false;

        await loadStats();
        await loadVisitors();
    } catch (error) {
        loginMessage.textContent = error.message;
    }
});

async function loadStats() {
    const stats = await apiFetch("/stats");

    document.getElementById("totalVisitors").textContent =
        stats.totalVisitors ?? 0;

    document.getElementById("todayVisitors").textContent =
        stats.todayVisitors ?? 0;
}

async function loadVisitors() {
    recordMessage.textContent = "Loading records...";
    visitorRows.replaceChildren();

    try {
        const search = document.getElementById("searchInput").value.trim();
        currentRecords = await apiFetch(
            "/visitors?search=" + encodeURIComponent(search)
        );

        for (const visitor of currentRecords) {
            const tr = document.createElement("tr");

            [
                visitor.id,
                visitor.name,
                visitor.email,
                visitor.phone,
                visitor.age,
                visitor.qualification,
                visitor.district,
                visitor.purpose,
                visitor.course,
                visitor.feedback,
                visitor.visit_date
                    ? new Date(visitor.visit_date).toLocaleString()
                    : ""
            ].forEach(value => tr.appendChild(cell(value)));

            visitorRows.appendChild(tr);
        }

        recordMessage.textContent =
            `${currentRecords.length} record(s) found.`;
    } catch (error) {
        recordMessage.textContent = error.message;
    }
}

document.getElementById("searchButton").addEventListener(
    "click", loadVisitors
);

document.getElementById("searchInput").addEventListener("keydown", event => {
    if (event.key === "Enter") loadVisitors();
});

function csvValue(value) {
    let text = value == null ? "" : String(value);

    // Protect spreadsheet users from formula injection.
    if (/^[\s]*[=+\-@]/.test(text)) {
        text = "'" + text;
    }

    return '"' + text.replace(/"/g, '""') + '"';
}

function downloadCSV() {
  const table = document.getElementById("visitorsTable");

  if (!table || table.rows.length <= 1) {
    alert("No visitor data available to download.");
    return;
  }

  const csv = Array.from(table.rows)
    .map(row =>
      Array.from(row.cells)
        .map(cell => {
          let value = cell.innerText.trim();

          // Prevent spreadsheet formula injection
          if (/^[=+\-@\t\r]/.test(value)) {
            value = "'" + value;
          }

          return '"' + value.replace(/"/g, '""') + '"';
        })
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "MJF_Visitors.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}




document.getElementById("exportButton").addEventListener("click", () => {
    if (!currentRecords.length) {
        recordMessage.textContent = "No records available to export.";
        return;
    }

    const columns = [
        "id", "name", "email", "phone", "age", "qualification",
        "district", "purpose", "course", "feedback", "visit_date"
    ];

    const lines = [
        columns.join(","),
        ...currentRecords.map(record =>
            columns.map(key => csvValue(record[key])).join(",")
        )
    ];

    const blob = new Blob(
        ["\uFEFF" + lines.join("\r\n")],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "MJF_Visitor_Records.csv";
    link.click();
    URL.revokeObjectURL(url);
});

function logout() {
    token = "";
    currentRecords = [];
    dashboard.hidden = true;
    loginPanel.hidden = false;
    visitorRows.replaceChildren();
    recordMessage.textContent = "";
}

document.getElementById("logoutButton").addEventListener("click", logout);

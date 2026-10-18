// ==========================================================
// 1. CONFIGURATION & DOM REFERENCES
// ==========================================================
const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadBtn = document.querySelector("#load-btn");
const statusMsg = document.querySelector("#status");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitBtn = document.querySelector("#submit-btn");
const notesList = document.querySelector("#notes-list");

// Local array tracking notes displayed in the UI
let notes = [];

// ==========================================================
// 2. REUSABLE ASYNC REQUEST HELPER
// ==========================================================
async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${response.statusText} ${errorBody}`);
  }

  // Handle 204 No Content responses safely
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// ==========================================================
// 3. UI STATE HELPERS
// ==========================================================
function setStatus(text, type = "loading") {
  statusMsg.className = `status-box show status-${type}`;
  statusMsg.textContent = text;
}

function clearStatus() {
  statusMsg.className = "status-box";
  statusMsg.textContent = "";
}

function setBusy(isBusy) {
  loadBtn.disabled = isBusy;
  submitBtn.disabled = isBusy;
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.disabled = isBusy;
  });
}

// ==========================================================
// 4. RENDER FUNCTION (Strict textContent - XSS Safe)
// ==========================================================
function renderNotes() {
  notesList.textContent = "";

  if (notes.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.className = "empty-state";
    emptyLi.textContent = "No notes available. Click 'Load Notes' or create one above.";
    notesList.appendChild(emptyLi);
    return;
  }

  notes.forEach((note) => {
    const li = document.createElement("li");
    li.className = "note-item";

    const topDiv = document.createElement("div");
    topDiv.className = "note-top";

    const titleH3 = document.createElement("h3");
    titleH3.className = "note-title";
    titleH3.textContent = note.title;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => handleDeleteNote(note.id));

    topDiv.appendChild(titleH3);
    topDiv.appendChild(deleteBtn);

    const bodyP = document.createElement("p");
    bodyP.className = "note-body";
    bodyP.textContent = note.body || "(No description provided)";

    li.appendChild(topDiv);
    li.appendChild(bodyP);

    notesList.appendChild(li);
  });
}

// ==========================================================
// 5. GET (LOAD 10 NOTES)
// ==========================================================
async function handleLoadNotes() {
  setBusy(true);
  setStatus("Loading notes...", "loading");

  try {
    const data = await request(`${API_URL}?_limit=10`, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    notes = data;
    renderNotes();

    if (notes.length > 0) {
      setStatus(`Loaded ${notes.length} notes from the server.`, "success");
    } else {
      setStatus("Zero notes found on the server.", "success");
    }
  } catch (err) {
    setStatus(`Failed to load notes: ${err.message}`, "error");
  } finally {
    setBusy(false);
  }
}

// ==========================================================
// 6. POST (CREATE NOTE)
// ==========================================================
async function handleCreateNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  // Client-side validation: title required and capped at 100 characters
  if (!title) {
    setStatus("Validation error: Note title is required.", "error");
    titleInput.focus();
    return;
  }

  if (title.length > 100) {
    setStatus("Validation error: Title cannot exceed 100 characters.", "error");
    titleInput.focus();
    return;
  }

  setBusy(true);
  setStatus("Creating note on server...", "loading");

  try {
    const payload = {
      title: title,
      body: body,
      userId: 1
    };

    const newNote = await request(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8"
      },
      body: JSON.stringify(payload)
    });

    // Prepend newly created note to the top of the UI list
    notes.unshift(newNote);
    renderNotes();

    setStatus(`Note created (status 201, id ${newNote.id}).`, "success");
    noteForm.reset();
  } catch (err) {
    setStatus(`Failed to create note: ${err.message}`, "error");
  } finally {
    setBusy(false);
  }
}

// ==========================================================
// 7. DELETE (REMOVE NOTE)
// ==========================================================
async function handleDeleteNote(id) {
  setBusy(true);
  setStatus(`Deleting note ${id}...`, "loading");

  try {
    /*
      JSONPlaceholder DELETE Behavior Explanation:
      JSONPlaceholder is a mock REST API. It simulates successful deletion
      for genuine remote IDs (1 to 100), returning HTTP 200/204.
      However, newly created posts return synthetic IDs (such as 101) which
      do not physically exist on JSONPlaceholder's remote database.
      Attempting DELETE on simulated IDs can trigger HTTP 404 or empty returns.
      To handle this gracefully: we issue the DELETE request to the API, and
      whether the ID was mock-stored or pre-existing, we remove it from the
      local array and update the UI accordingly upon a successful status.
    */
    await request(`${API_URL}/${id}`, {
      method: "DELETE"
    });

    notes = notes.filter((n) => n.id !== id);
    renderNotes();
    setStatus(`Note ${id} deleted successfully.`, "success");
  } catch (err) {
    // If a synthetic client-generated ID returns an error on mock deletion,
    // handle it safely while informing the user.
    setStatus(`Could not delete note ${id}: ${err.message}`, "error");
  } finally {
    setBusy(false);
  }
}

// ==========================================================
// 8. EVENT LISTENERS
// ==========================================================
loadBtn.addEventListener("click", handleLoadNotes);
noteForm.addEventListener("submit", handleCreateNote);

// Initial empty state rendering
renderNotes();
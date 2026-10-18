# QuickNotes REST API Design Specification

This document defines the production REST API specification for the QuickNotes multi-tenant notes platform.

Base URL: `https://api.quicknotes.com/v1`

---

## 1. Resource Endpoints

| Method | Path | Description | Success Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/notes` | Retrieve a paginated list of notes for the authenticated user | `200 OK` |
| `GET` | `/notes/:id` | Retrieve single note record by its unique ID | `200 OK` |
| `POST` | `/notes` | Create and persist a new note with optional tags | `201 Created` |
| `PUT` | `/notes/:id` | Fully update an existing note's title, body, and tags | `200 OK` |
| `DELETE` | `/notes/:id` | Permanently remove a note by ID | `204 No Content` |
| `GET` | `/notes/search?q={query}` | Search notes by title or content matching a query string | `200 OK` |

---

## 2. Request and Response Examples

### A. Create a Note (`POST /notes`)

#### Request
* **Headers:**
  * `Authorization: Bearer <jwt_access_token>`
  * `Content-Type: application/json`
* **Body:**
```json
{
  "title": "System Design Presentation Prep",
  "body": "Finalize slide deck covering Redis cache invalidation and database replicas.",
  "category": "work",
  "tags": ["architecture", "capstone"]
}
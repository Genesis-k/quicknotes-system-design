# QuickNotes Relational Data Model

This document outlines the relational database schema, integrity rules, entity relationships, and indexing strategies for the QuickNotes backend.

---

## 1. Entities & Attributes

* **`users`**: Represents registered platform accounts.
  * `user_id` (INTEGER, Primary Key, Auto Increment)
  * `email` (VARCHAR(255), Unique, Not Null)
  * `password_hash` (VARCHAR(255), Not Null)
  * `created_at` (TIMESTAMP, Default CURRENT_TIMESTAMP)
* **`notes`**: Represents individual text memos created by users.
  * `note_id` (INTEGER, Primary Key, Auto Increment)
  * `user_id` (INTEGER, Foreign Key referencing `users(user_id)`, Not Null)
  * `title` (VARCHAR(100), Not Null)
  * `body` (TEXT, Nullable)
  * `created_at` (TIMESTAMP, Default CURRENT_TIMESTAMP)
  * `updated_at` (TIMESTAMP, Default CURRENT_TIMESTAMP)
* **`tags`**: Represents organization taxonomy terms.
  * `tag_id` (INTEGER, Primary Key, Auto Increment)
  * `name` (VARCHAR(50), Unique, Not Null)
* **`note_tags`**: Junction table resolving the many-to-many relationship between notes and tags.
  * `note_id` (INTEGER, Foreign Key referencing `notes(note_id)`, Not Null)
  * `tag_id` (INTEGER, Foreign Key referencing `tags(tag_id)`, Not Null)
  * Primary Key: Composite `(note_id, tag_id)`

---

## 2. Relationships & Cardinality

* **One-to-Many (`1:N`) between `users` and `notes`**: A user creates zero, one, or many notes. Every note belongs to strictly one user. Enforced through `notes.user_id` referencing `users.user_id` with `ON DELETE CASCADE`.
* **Many-to-Many (`M:N`) between `notes` and `tags`**: A note can have multiple tags assigned, and an individual tag applies to thousands of different notes. Because flat relational columns cannot store multivalued lists without violating First Normal Form (1NF), the `note_tags` junction table normalizes this relationship.

---

## 3. DDL Statements (CREATE TABLE)

```sql
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    note_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE tags (
    tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(note_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
);
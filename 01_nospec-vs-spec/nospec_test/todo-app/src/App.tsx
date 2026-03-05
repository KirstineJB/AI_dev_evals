import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { FilterType, Todo } from "./types";
import "./App.css";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .getAll()
      .then(setTodos)
      .catch(() => setError("Could not connect to the API. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (editingId !== null) editInputRef.current?.focus();
  }, [editingId]);

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.isCompleted;
    if (filter === "completed") return t.isCompleted;
    return true;
  });

  const activeCount = todos.filter((t) => !t.isCompleted).length;
  const completedCount = todos.filter((t) => t.isCompleted).length;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = input.trim();
    if (!title) return;
    try {
      const todo = await api.create(title);
      setTodos((prev) => [...prev, todo]);
      setInput("");
    } catch {
      setError("Failed to add todo.");
    }
  }

  async function handleToggle(todo: Todo) {
    try {
      const updated = await api.update(todo.id, { isCompleted: !todo.isCompleted });
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      setError("Failed to update todo.");
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.remove(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Failed to delete todo.");
    }
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditText(todo.title);
  }

  async function commitEdit(id: number) {
    const title = editText.trim();
    if (!title) {
      await handleDelete(id);
    } else {
      try {
        const updated = await api.update(id, { title });
        setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } catch {
        setError("Failed to rename todo.");
      }
    }
    setEditingId(null);
  }

  async function handleClearCompleted() {
    try {
      await api.clearCompleted();
      setTodos((prev) => prev.filter((t) => !t.isCompleted));
    } catch {
      setError("Failed to clear completed todos.");
    }
  }

  async function handleToggleAll() {
    const allDone = todos.every((t) => t.isCompleted);
    try {
      const updated = await Promise.all(
        todos.map((t) => api.update(t.id, { isCompleted: !allDone }))
      );
      setTodos(updated);
    } catch {
      setError("Failed to toggle all todos.");
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>todos</h1>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss error">✕</button>
        </div>
      )}

      <main className="todo-card">
        <form className="todo-input-row" onSubmit={handleAdd}>
          {todos.length > 0 && (
            <button
              type="button"
              className={`toggle-all-btn${todos.every((t) => t.isCompleted) ? " active" : ""}`}
              onClick={handleToggleAll}
              aria-label="Toggle all todos"
            >
              ❯
            </button>
          )}
          <input
            className="todo-input"
            type="text"
            placeholder="What needs to be done?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
        </form>

        {loading ? (
          <div className="state-msg">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="state-msg">
            {filter === "all" ? "No todos yet — add one above!" : `No ${filter} todos.`}
          </div>
        ) : (
          <ul className="todo-list" role="list">
            {filtered.map((todo) => (
              <li
                key={todo.id}
                className={`todo-item${todo.isCompleted ? " completed" : ""}`}
              >
                <input
                  type="checkbox"
                  className="todo-checkbox"
                  checked={todo.isCompleted}
                  onChange={() => handleToggle(todo)}
                  aria-label={`Mark "${todo.title}" as ${todo.isCompleted ? "active" : "completed"}`}
                />

                {editingId === todo.id ? (
                  <input
                    ref={editInputRef}
                    className="todo-edit-input"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => commitEdit(todo.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit(todo.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                ) : (
                  <span
                    className="todo-label"
                    onDoubleClick={() => startEdit(todo)}
                    title="Double-click to edit"
                  >
                    {todo.title}
                  </span>
                )}

                <button
                  className="todo-delete-btn"
                  onClick={() => handleDelete(todo.id)}
                  aria-label={`Delete "${todo.title}"`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {todos.length > 0 && (
          <footer className="todo-footer">
            <span className="item-count">
              {activeCount} {activeCount === 1 ? "item" : "items"} left
            </span>

            <nav className="filter-nav" aria-label="Filter todos">
              {(["all", "active", "completed"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  className={`filter-btn${filter === f ? " active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </nav>

            {completedCount > 0 && (
              <button className="clear-btn" onClick={handleClearCompleted}>
                Clear completed
              </button>
            )}
          </footer>
        )}
      </main>

      <p className="hint">Double-click a todo to edit it</p>
    </div>
  );
}

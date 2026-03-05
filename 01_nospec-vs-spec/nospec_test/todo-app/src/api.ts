import type { Todo } from "./types";

const BASE_URL = "/api/todos";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  getAll: (): Promise<Todo[]> =>
    fetch(BASE_URL).then((r) => handleResponse<Todo[]>(r)),

  create: (title: string): Promise<Todo> =>
    fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }).then((r) => handleResponse<Todo>(r)),

  update: (id: number, patch: { title?: string; isCompleted?: boolean }): Promise<Todo> =>
    fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then((r) => handleResponse<Todo>(r)),

  remove: (id: number): Promise<void> =>
    fetch(`${BASE_URL}/${id}`, { method: "DELETE" }).then((r) =>
      handleResponse<void>(r)
    ),

  clearCompleted: (): Promise<void> =>
    fetch(`${BASE_URL}/completed`, { method: "DELETE" }).then((r) =>
      handleResponse<void>(r)
    ),
};

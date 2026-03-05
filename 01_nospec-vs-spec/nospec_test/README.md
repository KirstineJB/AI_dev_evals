# Todo App

A full-stack Todo application with a React + TypeScript frontend and a .NET 8 Web API backend.

## Running the app

You need **two terminals** — one for the API, one for the frontend.

### 1. Start the API (Terminal 1)

```bash
cd TodoApi
dotnet run
```

The API will be available at `http://localhost:5000`.

### 2. Start the frontend (Terminal 2)

```bash
cd todo-app
npm install   # first time only
npm run dev
```

Open `http://localhost:5173` in your browser.

## Features

- Add, edit (double-click), delete todos
- Mark individual todos as complete / incomplete
- Toggle all todos at once
- Filter by All / Active / Completed
- Clear all completed todos at once
- Item count footer
- In-memory persistence (resets on API restart)

## Project structure

```
nospec_test/
├── TodoApi/          # .NET 8 Web API
│   ├── Program.cs    # Minimal API endpoints + in-memory repository
│   └── ...
└── todo-app/         # React + TypeScript (Vite)
    ├── src/
    │   ├── api.ts    # Typed fetch wrappers
    │   ├── types.ts  # Shared types
    │   ├── App.tsx   # Main component
    │   └── App.css   # Styles
    └── ...
```

using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddSingleton<TodoRepository>();

var app = builder.Build();

app.UseCors("AllowReactApp");

// GET all todos
app.MapGet("/api/todos", ([FromServices] TodoRepository repo) =>
    Results.Ok(repo.GetAll()));

// GET single todo
app.MapGet("/api/todos/{id:int}", ([FromServices] TodoRepository repo, int id) =>
{
    var todo = repo.GetById(id);
    return todo is null ? Results.NotFound() : Results.Ok(todo);
});

// POST create todo
app.MapPost("/api/todos", ([FromServices] TodoRepository repo, [FromBody] CreateTodoRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Title))
        return Results.BadRequest("Title is required.");

    var todo = repo.Create(request.Title.Trim());
    return Results.Created($"/api/todos/{todo.Id}", todo);
});

// PUT update todo (title + completed)
app.MapPut("/api/todos/{id:int}", ([FromServices] TodoRepository repo, int id, [FromBody] UpdateTodoRequest request) =>
{
    var todo = repo.Update(id, request.Title?.Trim(), request.IsCompleted);
    return todo is null ? Results.NotFound() : Results.Ok(todo);
});

// DELETE todo
app.MapDelete("/api/todos/{id:int}", ([FromServices] TodoRepository repo, int id) =>
{
    var deleted = repo.Delete(id);
    return deleted ? Results.NoContent() : Results.NotFound();
});

// DELETE completed todos
app.MapDelete("/api/todos/completed", ([FromServices] TodoRepository repo) =>
{
    repo.DeleteCompleted();
    return Results.NoContent();
});

app.Run();

// ── Models ────────────────────────────────────────────────────────────────────

record Todo(int Id, string Title, bool IsCompleted, DateTime CreatedAt);
record CreateTodoRequest(string Title);
record UpdateTodoRequest(string? Title, bool? IsCompleted);

// ── In-memory Repository ──────────────────────────────────────────────────────

class TodoRepository
{
    private readonly List<TodoItem> _todos = [];
    private int _nextId = 1;
    private readonly object _lock = new();

    public List<TodoItem> GetAll()
    {
        lock (_lock) return [.. _todos.OrderBy(t => t.CreatedAt)];
    }

    public TodoItem? GetById(int id)
    {
        lock (_lock) return _todos.FirstOrDefault(t => t.Id == id);
    }

    public TodoItem Create(string title)
    {
        lock (_lock)
        {
            var todo = new TodoItem { Id = _nextId++, Title = title };
            _todos.Add(todo);
            return todo;
        }
    }

    public TodoItem? Update(int id, string? title, bool? isCompleted)
    {
        lock (_lock)
        {
            var todo = _todos.FirstOrDefault(t => t.Id == id);
            if (todo is null) return null;

            if (title is not null) todo.Title = title;
            if (isCompleted.HasValue) todo.IsCompleted = isCompleted.Value;
            return todo;
        }
    }

    public bool Delete(int id)
    {
        lock (_lock)
        {
            var todo = _todos.FirstOrDefault(t => t.Id == id);
            if (todo is null) return false;
            _todos.Remove(todo);
            return true;
        }
    }

    public void DeleteCompleted()
    {
        lock (_lock) _todos.RemoveAll(t => t.IsCompleted);
    }
}

class TodoItem
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

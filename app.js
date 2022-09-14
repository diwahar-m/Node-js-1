const express = require("express");
const { open } = require("sqlite");
const {format}=require("date-fns")
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log(`Server Running at http://localhost:3000/`)
    );
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeDbAndServer();

const  date=format(new Date(2021, 1, 21), 'yyyy-MM-dd')

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos", async (request, response) => {
  let data = null;
  let query = "";
  const { status, search_q = "", priority, category } = request.query;
  switch (true) {
    case hasStatusProperty(request.query):
        query = `
            SELECT * 
            FROM todo 
            WHERE status=${status}`;
        break;
    case hasPriorityProperty(request.query):
        query = `
            SELECT *
            FROM todo 
            WHERE priority=${priority}`;
        break;
    case hasPriorityAndStatusProperty(request.query):
        query = `
            SELECT *
            FROM todo 
            WHERE priority=${priority} AND status=${status}`;
        break;

    case hasCategoryAndStatusProperty(request.query):
        query = `
            SELECT *
            FROM todo 
            WHERE category=${category} AND status=${status}`;
        break;
    case hasCategoryProperty(request.query):
        query = `
            SELECT * 
            FROM todo 
            WHERE category=${category}`;
        break;
    case hasCategoryAndPriorityProperty(request.query):
        query = `
            SELECT *
            FROM todo 
            WHERE category=${category} AND priority=${priority}`;
        break;
    default:
        query = `
            SELECT * 
            FROM todo 
            WHERE todo LIKE '%${search_q}%';`;
  }
  data = await db.all(query);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `
     SELECT * 
     FROM todo 
     WHERE id=${todoId}`;
  const got = await db.get(query);
  response.send(got);
});

app.get("/agenda/", async (request, response) => {
  
  const {date}=request.query
  const query = `
     SELECT * 
     FROM todo 
     WHERE due_date=${date}`;
  const got = await db.all(query);
  response.send(got);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const query = `
     INSERT INTO todo(id,todo,priority,status,category,due_date)
     VALUES (${id},${todo},${priority},${status},${category},${dueDate},)`;
  await db.run(query);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
    case requestBody.category !== undefined:
      updateColumn = "Category";
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
  }
  const previousQuery = `
     SELECT * FROM todo 
     WHERE id=${todoId} `;
  const previousTodo = await db.get(previousQuery);

  const {
    status = previousTodo.status,
    priority = previousTodo.priority,
    todo = previousTodo.todo,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const query = `
     UPDATE todo 
     SET status=${status},priority=${priority},todo=${todo},category=${category},
            due_date=${dueDate},
     WHERE id=${todoId}`;

  await db.run(query);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `
     DELETE FROM todo 
     WHERE id=${todoId}`;
  const got = await db.run(query);
  response.send("Todo Deleted");
});

module.exports = app;

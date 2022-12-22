//route             -- see api request and process
const express = require(`express`);
const Todo = require('../controllers/postgresQueries');
const router = express.Router();

// Get all todos.
router.get(`/api/`, async (req, res) => {
    let todos = await new Todo().getTodos();
});

// Create a todo.
router.post(`/api/todo`, async (req, res) => {
    let {title} = req.body;
    await new Todo().createTodo({title},res);
});

// Update a todo.
router.put(`/api/todos/:todoId`, async (req, res) => {
    let {todoId} = req.params;
    await new Todo().updateTodo(todoId,res);
    let todos = await new Todo().getTodos();
});

// Delete a todo.
router.delete(`/api/todos/:todoId`, async (req, res) => {
    let {todoId} = req.params;
    await new Todo().deleteTodo(todoId);
    let todos = await new Todo().getTodos();
});

module.exports = router;




// route             -- see api request and process
const express = require(`express`);
const router = express.Router();
const pgController = require(`../controllers/postgresController`);
const bodyParser = require(`body-parser`).json()

// middleware that is specific to this router
router.use((req, res, next) => {
    console.log(`Time: `, new Date());
    console.log(`-insert middleware here-`);
    next();
});


router.get(`/`, pgController.getAllActivities);
router.get(`/activities`, pgController.getAllActivities);
router.get(`/jags`, pgController.getAllJags);
router.post(`/activities`, bodyParser, pgController.createActivity);

router.get(`/create`, pgController.createTables);
router.get(`/drop`, pgController.dropTables);

// // Get all todos.
// router.get(`/api/`, async (req, res) => {
//     let todos = await new Todo().getTodos();
// });
//
// // Create a todo.
// router.post(`/api/todo`, async (req, res) => {
//     let {title} = req.body;
//     await new Todo().createTodo({title},res);
// });
//
// // Update a todo.
// router.put(`/api/todos/:todoId`, async (req, res) => {
//     let {todoId} = req.params;
//     await new Todo().updateTodo(todoId,res);
//     let todos = await new Todo().getTodos();
// });
//
// // Delete a todo.
// router.delete(`/api/todos/:todoId`, async (req, res) => {
//     let {todoId} = req.params;
//     await new Todo().deleteTodo(todoId);
//     let todos = await new Todo().getTodos();
// });

module.exports = router;



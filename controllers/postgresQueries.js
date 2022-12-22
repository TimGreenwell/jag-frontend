// controller       --  called by controller to make the query
const pool = require(`../config/db`);
const fs = require(`fs`);
// const {Pool, Client} = require(`pg`);     // added
//
// There are two style of calling the database here.  I think we really only need the Controller part.  The router part is already made?


const getItems = (request, response) => {
    pool.query(`SELECT * FROM users1 ORDER BY id ASC`, (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
};

// get all todos.
// async function getItems() {
//     const results = await pool.query(`SELECT *
//                                       FROM todos`).catch(console.log);
//     return results.rows;
// }

const getItemById = (request, response) => {
    const id = parseInt(request.params.id);

    pool.query(`SELECT * FROM users1 WHERE id = $1`, [id], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
};

const createItem = (request, response) => {
    const {name, email} = request.body;

    pool.query(`INSERT INTO users (name, email) VALUES ($1, $2)`, [name, email], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(201).send(`User added with ID: ${results.insertId}`);
    });
};

// create a todo.
// async createItem(todo) {
//     await pool.query(`INSERT INTO todos (title, checked)
//                       VALUES ($1, $2)`, [todo.title, false]).catch(console.log);
// }

const updateItem = (request, response) => {
    const id = parseInt(request.params.id);
    const {name, email} = request.body;

    pool.query(
        `UPDATE users SET name = $1, email = $2 WHERE id = $3`,
        [name, email, id],
        (error, results) => {
            if (error) {
                throw error;
            }
            response.status(200).send(`User modified with ID: ${id}`);
        }
    );
};

// update a todo.
// async updateItem(todoId) {
//     // get the previous todo.
//     const original_todo = await pool.query(`SELECT *
//                                             FROM todos
//                                             WHERE id = $1`, [parseInt(todoId)]).catch(console.log);
//     const new_checked_value = !original_todo.rows[0].checked;
//
//     // update the checked todo
//     await pool.query(`UPDATE todos
//                       SET checked=$1
//                       WHERE id = $2`, [new_checked_value, parseInt(todoId)]).catch(console.log);
// }

const deleteItem = (request, response) => {
    const id = parseInt(request.params.id);

    pool.query(`DELETE FROM users WHERE id = $1`, [id], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).send(`User deleted with ID: ${id}`);
    });
};

// delete a todo.
// async deleteItem(todoId) {
//     await pool.query(`DELETE
//                       FROM todos
//                       WHERE id = $1`, [parseInt(todoId)]).catch(console.log);
// }

const createTables = async (request, response) => {
    const activityCreateTable = fs.readFileSync(`sql/postgres/create-table/activity.sql`).toString();
    const agentCreateTable = fs.readFileSync(`sql/postgres/create-table/agent.sql`).toString();
    const agent_assessmentCreateTable = fs.readFileSync(`sql/postgres/create-table/agent_assessment.sql`).toString();
    const analysisCreateTable = fs.readFileSync(`sql/postgres/create-table/analysis.sql`).toString();
    const assessmentCreateTable = fs.readFileSync(`sql/postgres/create-table/assessment.sql`).toString();
    const bindingCreateTable = fs.readFileSync(`sql/postgres/create-table/binding.sql`).toString();
    const endpointCreateTable = fs.readFileSync(`sql/postgres/create-table/endpoint.sql`).toString();
    const nodeCreateTable = fs.readFileSync(`sql/postgres/create-table/node.sql`).toString();
    const performerCreateTable = fs.readFileSync(`sql/postgres/create-table/performer.sql`).toString();
    const subactivityCreateTable = fs.readFileSync(`sql/postgres/create-table/subactivity.sql`).toString();
    const subscriptionCreateTable = fs.readFileSync(`sql/postgres/create-table/subscription.sql`).toString();
    const teamCreateTable = fs.readFileSync(`sql/postgres/create-table/team.sql`).toString();
    const dbCreateTables = [];
    dbCreateTables.push(activityCreateTable);
    dbCreateTables.push(analysisCreateTable);
    dbCreateTables.push(teamCreateTable);
    dbCreateTables.push(endpointCreateTable);          // ref: activity
    dbCreateTables.push(subactivityCreateTable);       // ref: activity
    dbCreateTables.push(bindingCreateTable);           // ref: endpoint and activity
    dbCreateTables.push(nodeCreateTable);              // ref: itself
    dbCreateTables.push(subscriptionCreateTable);      // ref: node
    dbCreateTables.push(performerCreateTable);         // ref: team
    dbCreateTables.push(agentCreateTable);             // ref: team
    dbCreateTables.push(agent_assessmentCreateTable); // ref: agent
    dbCreateTables.push(assessmentCreateTable);        // ref: agent

    for (const dbCreateTable of dbCreateTables) {
        console.log(`Going to create: ${dbCreateTable} `);
        // await pool.query(dbCreateTable, (error, results) => {
        //     if (error) {
        //         throw error;
        //     }
        //     response.status(200).send(`Created: ${JSON.stringify(results, null, 2)}`);
        // });
        await pool.query(dbCreateTable).then((result) => {
            if (result) {
                console.log(`-- Table created --`);
            }
        });
    }
    response.json({message: `Created`});
};


const dropTables = async (request, response) => {
    const activityDrop = fs.readFileSync(`sql/postgres/drop/activity.sql`).toString();
    const agentDrop = fs.readFileSync(`sql/postgres/drop/agent.sql`).toString();
    const agent_assessmentDrop = fs.readFileSync(`sql/postgres/drop/agent_assessment.sql`).toString();
    const analysisDrop = fs.readFileSync(`sql/postgres/drop/analysis.sql`).toString();
    const assessmentDrop = fs.readFileSync(`sql/postgres/drop/assessment.sql`).toString();
    const bindingDrop = fs.readFileSync(`sql/postgres/drop/binding.sql`).toString();
    const endpointDrop = fs.readFileSync(`sql/postgres/drop/endpoint.sql`).toString();
    const nodeDrop = fs.readFileSync(`sql/postgres/drop/node.sql`).toString();
    const performerDrop = fs.readFileSync(`sql/postgres/drop/performer.sql`).toString();
    const subactivityDrop = fs.readFileSync(`sql/postgres/drop/subactivity.sql`).toString();
    const subscriptionDrop = fs.readFileSync(`sql/postgres/drop/subscription.sql`).toString();
    const teamDrop = fs.readFileSync(`sql/postgres/drop/team.sql`).toString();
    const dbDropTables = [];

    dbDropTables.push(assessmentDrop);        // ref: agent
    dbDropTables.push(agent_assessmentDrop); // ref: agent
    dbDropTables.push(agentDrop);             // ref: team
    dbDropTables.push(performerDrop);         // ref: team
    dbDropTables.push(subscriptionDrop);      // ref: node
    dbDropTables.push(nodeDrop);              // ref: itself
    dbDropTables.push(bindingDrop);           // ref: endpoint and activity
    dbDropTables.push(subactivityDrop);       // ref: activity
    dbDropTables.push(endpointDrop);          // ref: activity
    dbDropTables.push(teamDrop);
    dbDropTables.push(analysisDrop);
    dbDropTables.push(activityDrop);

    for (const dbDropTable of dbDropTables) {
        console.log(`Going to drop: ${dbDropTable} `);
        // await pool.query(dbCreateTable, (error, results) => {
        //     if (error) {
        //         throw error;
        //     }
        //     response.status(200).send(`Created: ${JSON.stringify(results, null, 2)}`);
        // });
        await pool.query(dbDropTable).then((result) => {
            if (result) {
                console.log(`-- Table dropped --`);
            }
        });
    }
    response.json({message: `Dropped`});
};


module.exports = {
    getItems,
    getItemById,
    createItem,
    updateItem,
    deleteItem,
    createTables,
    dropTables
};

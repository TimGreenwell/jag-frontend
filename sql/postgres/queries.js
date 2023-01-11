const pool = require(`../../config/db`);
const fs = require(`fs`);
// const bodyParser = require(`body-parser`);


const assembleTables = () => {
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
    return dbCreateTables;
};


function nestQuerySingle(query) {
    return `
    (SELECT row_to_json(x) FROM (${query}) x)
  `;
}


const getAllActivities = async () => {
    console.log(`in queries -- Getting All activities`);
    const activityResult = await pool.query(`
          SELECT 
           a.activity_urn AS urn, 
           a.activity_author AS author,
           a.activity_collapsed AS collapsed,
           a.connector_exec AS execution,
           a.connector_oper AS operator,
           a.connector_rtns AS returns,
           a.activity_created_date AS "createdDate",
           a.activity_description AS description,
           a.activity_expected_duration AS "expectedDuration",
           a.activity_is_locked AS "isLocked",
           a.activity_locked_by AS "lockedBy",
           a.activity_modified_date AS "modifiedDate",
           a.activity_name AS name
         FROM activity a 
         ORDER BY a.activity_urn`).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return activityResult;
};

const getActivityById = async (id) => {
    console.log(`in queries -- Getting activity by id: ${id}`);
    const activityResult = await pool.query(`
          SELECT 
           a.activity_urn AS urn, 
           a.activity_author AS author,
           a.activity_collapsed AS collapsed,
           a.connector_exec AS execution,
           a.connector_oper AS operator,
           a.connector_rtns AS returns,
           a.activity_created_date AS "createdDate",
           a.activity_description AS description,
           a.activity_expected_duration AS "expectedDuration",
           a.activity_is_locked AS "isLocked",
           a.activity_locked_by AS "lockedBy",
           a.activity_modified_date AS "modifiedDate",
           a.activity_name AS name
         FROM activity a 
         WHERE a.activity_urn = $1
         ORDER BY a.activity_urn`, [id]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return activityResult;
};

const getAllEndpoints = async () => {
    console.log(`in queries -- Getting All endpoints`);
    const endpointResult = await pool.query(`
          SELECT 
           e.endpoint_id AS id, 
           e.endpoint_direction AS direction,
           e.endpoint_exchange_name AS "exchangeName",
           e.endpoint_urn AS urn,
           e.endpoint_exchange_type AS "exchangeType",
          e.endpoint_activity_fk AS fk
         FROM endpoint e 
         ORDER BY e.endpoint_id`).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return endpointResult;
};

const getEndpointsFor = async (urn) => {
    console.log(`in queries -- Getting endpoints for urn ${urn}`);
    const endpointResult = await pool.query(`
          SELECT 
           e.endpoint_id AS id, 
           e.endpoint_direction AS direction,
           e.endpoint_exchange_name AS "exchangeName",
           e.endpoint_urn AS urn,
           e.endpoint_exchange_type AS "exchangeType",
          e.endpoint_activity_fk AS fk
         FROM endpoint e 
         WHERE e.endpoint_urn = $1
         ORDER BY e.endpoint_id`, [urn]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return endpointResult;
};

const getEndpointById = async (id) => {
    console.log(`in queries -- Getting endpoints for id ${id}`);
    const endpointResult = await pool.query(`
          SELECT 
           e.endpoint_id AS id, 
           e.endpoint_direction AS direction,
           e.endpoint_exchange_name AS "exchangeName",
           e.endpoint_urn AS urn,
           e.endpoint_exchange_type AS "exchangeType",
          e.endpoint_activity_fk AS fk
         FROM endpoint e 
         WHERE e.endpoint_id = $1
         ORDER BY e.endpoint_id`, [id]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return endpointResult;
};

const getAllBindings = async () => {
    console.log(`in queries -- Getting All bindings`);
    const bindingResult = await pool.query(`
          SELECT 
           b.binding_id AS id, 
           b.binding_to AS to,
           b.binding_from AS from,
           b.binding_activity_fk AS fk
         FROM binding b 
         ORDER BY b.binding_activity_fk`).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return bindingResult;
};

const getBindingsFor = async (urn) => {
    console.log(`in queries -- Getting All bindings`);
    const bindingResult = await pool.query(`
          SELECT 
           b.binding_id AS id, 
           b.binding_to AS to,
           b.binding_from AS from,
           b.binding_activity_fk AS fk
         FROM binding b 
         WHERE b.binding_activity_fk = $1
         ORDER BY b.binding_activity_fk`, [urn]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return bindingResult;
};

const getAllSubActivities = async () => {
    console.log(`in queries -- Getting All subactivities`);
    const subactivityResult = await pool.query(`
          SELECT 
           s.subactivity_id AS id, 
           s.subactivity_urn AS urn,
           s.subactivity_parent_fk AS fk
         FROM subactivity s 
         ORDER BY s.subactivity_urn`).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return subactivityResult;
};

const getSubActivitiesFor = async (urn) => {
    console.log(`in queries -- Getting subactivities for urn ${urn}`);
    const subactivityResult = await pool.query(`
          SELECT 
           s.subactivity_id AS id, 
           s.subactivity_urn AS urn,
           s.subactivity_parent_fk AS fk
         FROM subactivity s 
         WHERE s.subactivity_parent_fk = $1
         ORDER BY s.subactivity_urn`, [urn]).
        then((result) => {
            return result;
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });
    return subactivityResult;
};

const getAllJags = async () => {
    let queryResult;
    await pool.query(`SELECT 
      n.node_id AS id,
      n.node_urn AS urn,
      n.node_child_id AS "childId",
      n.node_parent_id AS "parentId",
      n.node_project_id AS "projectId",
      n.node_is_expanded As "isExpanded",
      n.node_is_locked AS "isLocked",
      n.node_con_name AS "contextualName",
      n.node_con_desc AS "contextualDescription",
      n.node_x AS "x",
      n.node_y AS "y",
      n.node_return_value AS "returnValue",
      n.node_return_state AS "returnState",
      n.node_test_return_value AS "testReturnValue",
      n.node_test_return_state AS "testReturnState",
      n.node_contextual_expected_duration AS "contextualExpectedDuration",
      n.node_child_parent_fk AS "fk" 
      FROM node n
      ORDER BY node_id ASC`).then((result) => {
        queryResult = result;
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
    return queryResult;
};

const getJagById = async (id) => {
    console.log(`in queries -- Getting jag for id ${id}`);
    const queryResult = await pool.query(`SELECT 
      n.node_id AS "id",
      n.node_urn AS "urn",
      n.node_child_id AS "childId",
      n.node_parent_id AS "parentId",
      n.node_project_id AS "projectId",
      n.node_is_expanded As "isExpanded",
      n.node_is_locked AS "isLocked",
      n.node_con_name AS "contextualName",
      n.node_con_desc AS "contextualDescription",
      n.node_x AS "x",
      n.node_y AS "y",
      n.node_return_value AS "returnValue",
      n.node_return_state AS "returnState",
      n.node_test_return_value AS "testReturnValue",
      n.node_test_return_state AS "testReturnState",
      n.node_contextual_expected_duration AS "contextualExpectedDuration",
      n.node_child_parent_fk AS "fk" 
      FROM node n
      WHERE n.node_id = $1
      `, [id]).then((result) => {
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
    return queryResult;
};

const deleteActivityById = async (id) => {
    const deleteResult = await pool.query(`DELETE 
      FROM activity a
      WHERE a.activity_urn = $1`, [id]).then((result) => {
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
    return deleteResult;
};


const deleteJagByProjectId = async (id) => {
    console.log(`in queries -- Deleting jag for project ${id}`);
    const queryResult = await pool.query(`
      DELETE 
      FROM node n
      WHERE n.node_project_id = $1
      `, [id]).then((result) => {
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
    return queryResult;
};


const getJagByProjectId = async (id) => {
    console.log(`in queries -- Getting jag for id ${id}`);
    const queryResult = await pool.query(`SELECT 
      n.node_id AS id,
      n.node_urn AS urn,
      n.node_child_id AS childId,
      n.node_parent_id AS parentId,
      n.node_project_id AS projectId,
      n.node_is_expanded As isExpanded,
      n.node_is_locked AS isLocked,
      n.node_con_name AS contextualName,
      n.node_con_desc AS contextualDescription,
      n.node_x AS x,
      n.node_y AS y,
      n.node_return_value AS returnValue,
      n.node_return_state AS returnState,
      n.node_test_return_value AS testReturnValue,
      n.node_test_return_state AS testReturnState,
      n.node_contextual_expected_duration AS contextualExpectedDuration,
      n.node_child_parent_fk AS fk 
      FROM node n
      WHERE n.node_project_id = $1
      `, [id]).then((result) => {
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
    return queryResult;
};

const createActivity = async (activity) => {
    const values = [
        activity.urn,
        activity.author,
        activity.collapsed,
        activity.connector.execution,
        activity.connector.operator,
        activity.connector.returns,
        activity.createdDate,
        activity.description,
        activity.expectedDuration,
        activity.isLocked,
        activity.lockedBy,
        activity.modifiedDate,
        activity.name
    ];
    let queryResult;
    await pool.query(`INSERT INTO activity (
                      activity_urn, 
                      activity_author,
                      activity_collapsed,
                      connector_exec,
                      connector_oper,
                      connector_rtns,
                      activity_created_date,
                      activity_description,
                      activity_expected_duration,
                      activity_is_locked,
                      activity_locked_by,
                      activity_modified_date,
                      activity_name)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
              ON CONFLICT (activity_urn) DO UPDATE SET
                  activity_author = excluded.activity_author,
                  activity_collapsed = excluded.activity_collapsed,
                  connector_exec = excluded.connector_exec,
                  connector_oper = excluded.connector_oper,
                  connector_rtns = excluded.connector_rtns,
                  activity_created_date = excluded.activity_created_date,
                  activity_description = excluded.activity_description,
                  activity_expected_duration = excluded.activity_expected_duration,
                  activity_is_locked = excluded.activity_is_locked,
                  activity_locked_by = excluded.activity_locked_by,
                  activity_modified_date = excluded.activity_modified_date,
                  activity_name = excluded.activity_name
                  `, values).then((result) => {
        queryResult = result;
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
    return queryResult;
};


const createEndpoint = async (endpoint, owner_id) => {
    console.log(endpoint);
    const values = [
        endpoint.id,
        endpoint.direction,
        endpoint.exchangeName,
        endpoint.urn,
        endpoint.exchangeType,
        owner_id
    ];
    let queryResult;
    await pool.query(`INSERT INTO endpoint (
                    endpoint_id, 
                    endpoint_direction,
                    endpoint_exchange_name,
                    endpoint_urn,
                    endpoint_exchange_type,
                    endpoint_activity_fk)
              VALUES ($1, $2, $3, $4, $5, $6)`, values).then((result) => {
        queryResult = result;
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
    return queryResult;
};

const createSubactivity = async (subactivity, owner_id) => {
    console.log(subactivity);
    const values = [
        subactivity.id,
        subactivity.urn,
        owner_id
    ];
    let queryResult;
    await pool.query(`INSERT INTO subactivity (
                     subactivity_id,
                     subactivity_urn,
                     subactivity_parent_fk)
              VALUES ($1, $2, $3)`, values).then((result) => {
        queryResult = result;
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
    return queryResult;
};

const createBinding = async (binding, owner_id) => {
    console.log(binding);
    const values = [
        binding.id,
        binding.to,
        binding.from,
        owner_id
    ];
    let queryResult;
    await pool.query(`INSERT INTO binding (
                     binding_id,
                     binding_to,
                     binding_from,
                     binding_activity_fk)
              VALUES ($1, $2, $3)`, values).then((result) => {
        queryResult = result;
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
    return queryResult;
};


const createJag = async (node, ownerId) => {
    const values = [
        node.id,
        node.childId,
        node.contextualDescription,
        node.contextualName,
        node.contextualExpectedDuration,
        node.isExpanded,
        node.isLocked,
        node.parentId,
        node.projectId,
        node.returnState,
        node.returnValue,
        node.testReturnState,
        node.testReturnValue,
        node.urn,
        node.x,
        node.y,
        ownerId
    ];
    let queryResult;
    await pool.query(`INSERT INTO node (
                      node_id,
                      node_child_id,
                      node_con_desc,
                      node_con_name,
                      node_contextual_expected_duration,
                      node_is_expanded,
                      node_is_locked,
                      node_parent_id,
                      node_project_id,
                      node_return_state,
                      node_return_value,
                      node_test_return_state,
                      node_test_return_value,
                      node_urn,
                      node_x,
                      node_y,
                      node_child_parent_fk)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
              ON CONFLICT (node_id) DO UPDATE SET
                      node_child_id = excluded.node_child_id,
                      node_con_desc = excluded.node_con_desc,
                      node_con_name = excluded.node_con_name,
                      node_contextual_expected_duration = excluded.node_contextual_expected_duration,
                      node_is_expanded = excluded.node_is_expanded,
                      node_is_locked = excluded.node_is_locked,
                      node_parent_id = excluded.node_parent_id,
                      node_project_id = excluded.node_project_id,
                      node_return_state = excluded.node_return_state,
                      node_return_value = excluded.node_return_value,
                      node_test_return_state = excluded.node_test_return_state,
                      node_test_return_value = excluded.node_test_return_value,
                      node_urn = excluded.node_urn,
                      node_x = excluded.node_x,
                      node_y = excluded.node_y,
                      node_child_parent_fk = excluded.node_child_parent_fk                               
                      `, values).then((result) => {
        queryResult = result;
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
    return queryResult;
};


const createTable = async (tableDefinition) => {
    await pool.query(tableDefinition).then((result) => {
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
};

const createTables = async () => {
    const dbCreateTables = assembleTables();
    for (const dbCreateTable of dbCreateTables) {
        await createTable(dbCreateTable);
    }
};

const dropTables = async () => {
    let queryResult;
    const tableDrop = fs.readFileSync(`sql/postgres/drop/orderedTableDrops.sql`).toString();
    await pool.query(tableDrop).then((result) => {
        queryResult = result;
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
    return queryResult;
};


(async () => {
    await createTables();
    console.log(`Created Tables( if necessary)`);
})();


module.exports = {
    getAllJags,
    getJagById,
    getJagByProjectId,
    getAllActivities,
    getActivityById,
    getAllEndpoints,
    getEndpointsFor,
    getEndpointById,
    getAllBindings,
    getBindingsFor,
    getAllSubActivities,
    getSubActivitiesFor,
    createActivity,
    createEndpoint,
    createSubactivity,
    createBinding,
    createJag,
    deleteActivityById,
    deleteJagByProjectId,
    // getItemById,
    // createItem,
    // updateItem,
    // deleteItem,
    createTables,
    dropTables
};

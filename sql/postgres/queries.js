const pool = require(`../../config/db`);
const fs = require(`fs`);
const bodyParser = require('body-parser')

const getAllActivities = async () => {
    let queryResult;
    await pool.query(`SELECT * FROM activity ORDER BY activity_urn ASC`).then((result) => {
        queryResult = result;
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
    return queryResult;
};

const getAllJags = async () => {
    let queryResult;
    await pool.query(`SELECT * FROM node ORDER BY node_id ASC`).then((result) => {
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
    await pool.query(`INSERT INTO activity (
                    endpoint_id, 
                    endpoint_direction,
                    endpoint_exchange_name,
                    endpoint_urn,
                    endpoint_exchange_type,
                    endpoint_activity_fx)
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
    await pool.query(`INSERT INTO activity (
                     subactivity_id,
                     subactivity_urn,
                     subactivity_parent_fx)
              VALUES ($1, $2, $3)`, values).then((result) => {
        queryResult = result;
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
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, values).then((result) => {
        queryResult = result;
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
    return queryResult;
};




const createNode = async (node, ownerId) => {
    const values = [
        activity.id,
        activity.childId,
        activity.contextualDescription,
        activity.contextualName,
        activity.isExpanded,
        activity.isLocked,
        activity.parentId,
        activity.returnState,
        activity.returnValue,
        activity.testReturnState,
        activity.testReturnValue,
        activity.urn,
        activity.x,
        activity.y,
        ownerId
    ];
    let queryResult;
    await pool.query(`INSERT INTO activity (
                      node_id,
                      node_child_id,
                      node_con_desc,
                      node_contextual_expected_duration,
                      node_con_name,
                      node_is_expected,
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
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`, values).then((result) => {
        queryResult = result;
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
    return queryResult;
};






const createTable = async (tableDefinition) => {
    let queryResult;
    await pool.query(tableDefinition).then((result) => {
        queryResult = result;
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
    return queryResult;
};


const dropTable = async (tableDefinition) => {
    let queryResult;
    await pool.query(tableDefinition).then((result) => {
        queryResult = result;
        return result;
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });
    return queryResult;
};


module.exports = {
    getAllJags,
    getAllActivities,
    createActivity,
    createEndpoint,
    createSubactivity,
    // getItemById,
    // createItem,
    // updateItem,
    // deleteItem,
    createTable,
    dropTable
};

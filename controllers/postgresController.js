const queries = require(`../sql/postgres/queries`);

const createActivity = async (request, response) => {
    const activity = request.body;
    await queries.createActivity(activity).then((result) => {
        if (result) {
            console.log(`-- ${result.rowCount} Activity created --`);
            console.log(activity);
        }
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });

    console.log(`AM I GOING TO BE SAVING ENDPOINT TO DB?`)
    const endpoints = activity.endpoints;
    for (const endpoint of endpoints) {
        console.log(`SAVING ENDPOINT TO DB`)
        await queries.createEndpoint(endpoint, activity.urn).then((result) => {
            if (result) {
                console.log(`-- Endpoint created --`);
                // response.status(200).json(result.rows);
            }
        });
    }

    const children = activity.children;
    for (const child of children) {
        // children.forEach((child) => {
        await queries.createSubactivity(child, activity.urn).then((result) => {
            if (result) {
                console.log(`-- Subactivity created --`);
                // response.status(200).json(result.rows);
            }
        });
    }

    const bindings = activity.bindings;
    for (const binding of bindings) {
    // bindings.forEach((binding) => {
        await queries.createBinding(binding, activity.urn).then((result) => {
            if (result) {
                console.log(`-- Binding created --`);
                // response.status(200).json(result.rows);
            }
        });
    }
    response.status(204).send(`{}`);
};

const createJag = async (request, response) => {
    const jag = request.body;
    const workStack = [];
    workStack.push(jag);

    while (workStack.length > 0) {
        const currentNode = workStack.pop();
        console.log(`popped.......`);
        console.log(currentNode);

        await queries.createJag(currentNode).then((result) => {
            if (result) {
                console.log(`-- Controller says => ${result.rowCount} Node created --`);
                console.log(currentNode);
            }
        }).catch((e) => {
            console.log(`bad: ${e}`);
        });

        currentNode.children.forEach((child) => {
            workStack.push(child);
            console.log(`Pushing child`);
            console.log(child);
        });
    }

    response.status(204).send(`{}`);
};

const getAllActivities = async (request, response) => {
    const activitiesReply = await queries.getAllActivities();
    const activities = activitiesReply.rows;

    const endpointsReply = await queries.getAllEndpoints();
    const endpoints = endpointsReply.rows;

    const bindingsReply = await queries.getAllBindings();
    const bindings = bindingsReply.rows;

    const subactivitiesReply = await queries.getAllSubActivities();
    const subactivities = subactivitiesReply.rows;

    const endpointMap = new Map();
    endpoints.forEach((endpoint) => {
        endpointMap.set(endpoint.id, endpoint);
    });

    activities.forEach((activity) => {
        activity.endpoints = [];
        endpoints.forEach((endpoint) => {
            if (endpoint.fk === activity.urn) {
                activity.endpoints.push(endpoint);
            }
        });
        activity.bindings = [];
        bindings.forEach((binding) => {
            if (binding.fk === activity.urn) {
                binding.from = endpointMap.get(binding.from);
                binding.to = endpointMap.get(binding.to);
                activity.bindings.push(binding);
            }
        });
        activity.children = [];
        subactivities.forEach((subactivity) => {
            if (subactivity.fk === activity.urn) {
                activity.children.push(subactivity);
            }
        });
    });

    response.status(200).json(activities);
};

const getActivityById = async (request, response) => {
    console.log(`Special Activity lookup for......`);
    console.log(request.params);
    const activitiesReply = await queries.getActivityById(request.params.activityId);
    const activity = activitiesReply.rows;

    const endpointsForReply = await queries.getEndpointsFor(request.params.activityId);
    const endpointsFor = endpointsForReply.rows;
    activity.endpoints.push(endpointsFor);

    const bindingsForReply = await queries.getBindingsFor(request.params.activityId);
    const bindingsFor = bindingsForReply.rows;

    for (const bindingFor of bindingsFor) {
        const fromEndpointById = await queries.getEndpointById(bindingFor.from);
        bindingFor.from = fromEndpointById;
        const toEndpointById = await queries.getEndpointById(bindingFor.to);
        bindingFor.to = toEndpointById;
    }

    activity.bindings.push(endpointsFor);

    const subactivitiesForReply = await queries.getSubActivitiesFor(request.params.activityId);
    const subactivitiesFor = subactivitiesForReply.rows;
    activity.children.push(subactivitiesFor);
    response.status(200).json(activity);
};

const getAllJags = async (request, response) => {
    const jagList = [];
    const jagsReply = await queries.getAllJags();
    const jags = jagsReply.rows;
    jags.forEach((jag) => {
        if (jag.projectId === jag.id) {
            jagList.push(jag);
        }
    });
    jagList.forEach((jag) => {
        const workStack = [];
        workStack.push(jag);
        while (workStack.length > 0) {
            const workJag = workStack.pop();
            workJag.children = [];
            jags.forEach((jag) => {
                if (jag.parentId === workJag.id) {
                    workJag.children.push(jag);
                    workStack.push(jag);
                }
            });
        }
    });
    response.status(200).json(jagList);
};

const getJagByProjectId = async (request, response) => {
    let projectHead;
    const jagsReply = await queries.getJagByProjectId(request.params.projectId);
    const jags = jagsReply.rows;
    jags.forEach((jag) => {
        if (jag.projectId === jag.id) {
            projectHead = jag;
        }
    });

    const workStack = [];
    workStack.push(projectHead);
    while (workStack.length > 0) {
        const workJag = workStack.pop();
        workJag.children = [];
        jags.forEach((jag) => {
            if (jag.parentId === workJag.id) {
                workJag.children.push(jag);
                workStack.push(jag);
            }
        });
    }

    response.status(200).json(projectHead);
};

const deleteJagByProjectId = async (request, response) => {
    console.log(`DELETING with ${request.params.projectId}`);
    const jagsReply = await queries.deleteJagByProjectId(request.params.projectId);
    console.log(`DELETED`);
    console.log(jagsReply);
    response.status(204).send(`{}`);
};

const deleteActivityById = async (request, response) => {
    await queries.deleteActivityById(request.params.activityId);
    response.status(204).send(`{}`);
};


const createTables = async (request, response) => {
    await queries.createTables();
    response.json({message: `Created all tables`});
};


const dropTables = async (request, response) => {
    await queries.dropTables();
    response.json({message: `Dropped all tables`});
};


module.exports = {
    createActivity,
    createJag,
    getAllActivities,
    getActivityById,
    getAllJags,
    getJagByProjectId,
    deleteActivityById,
    deleteJagByProjectId,
    // getItemById,
    // createItem,
    // updateItem,
    // deleteItem,
    createTables,
    dropTables
};

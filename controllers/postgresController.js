const queries = require(`../sql/postgres/queries`);

const createActivity = async (request, response) => {
    const activity = request.body;
    await queries.createActivity(activity).then((result) => {
        if (result) {
            console.log(`-- Activity created --`);
            response.status(200).json(result.rows);
        }
    }).catch((e) => {
        console.log(`bad: ${e}`);
    });;


    const endpoints = activity.endpoints;
    for (const endpoint of endpoints) {
        await queries.createEndpoint(endpoint, activity.urn).then((result) => {
            if (result) {
                console.log(`-- Endpoint created --`);
                // response.status(200).json(result.rows);
            }
        });
    };

    const children = activity.children;
    console.log("...........1...........")
    for (const child of children) {
        console.log("......................")
        console.log(child)
    // children.forEach((child) => {
        await queries.createSubactivity(child, activity.urn).then((result) => {
            if (result) {
                console.log(`-- Subactivity created --`);
                // response.status(200).json(result.rows);
            }
        });
    };

    const bindings = activity.bindings;
    for (const binding of bindings) {
    // bindings.forEach((binding) => {
        await queries.createBinding(binding, activity.urn).then((result) => {
            if (result) {
                console.log(`-- Binding created --`);
                // response.status(200).json(result.rows);
            }
        });
    };
};

const createJag = async (request, response) => {
    const jag = request.body;
    const workStack = [];
    workStack.push(jag);

    while (workStack.length > 0) {
        const currentNode = workStack.pop();

        await queries.createJag(jag).then((result) => {
            if (result) {
                console.log(`-- Activity created --`);
                response.status(200).json(result.rows);
            }
        });

        currentNode.children.forEach((child) => {
            workStack.push(child);
        });
    }
};

const getAllActivities = async (request, response) => {
    const activitiesReply = await queries.getAllActivities();
    const activities = activitiesReply.rows;
    console.log(`Get all Activities.........................................`);

    const endpointsReply = await queries.getAllEndpoints();
    const endpoints = endpointsReply.rows;
    console.log(`Get all Endpoints.........................................`);
    console.log(endpoints);


    const bindingsReply = await queries.getAllBindings();
    const bindings = bindingsReply.rows;
    console.log(`Get all Bindpoints.........................................`);
    console.log(bindings);


    const subactivitiesReply = await queries.getAllSubActivities();
    const subactivities = subactivitiesReply.rows;
    console.log(`Get all Subactivities......................................`);
    console.log(subactivities);

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
    console.log(`Activity.by id........................................`);
    console.log(activity);

    const endpointsForReply = await queries.getEndpointsFor(request.params.activityId);
    const endpointsFor = endpointsForReply.rows;
    console.log(`Endpoints..for.......................................`);
    console.log(endpointsFor);
    activity.endpoints.push(endpointsFor);

    const bindingsForReply = await queries.getBindingsFor(request.params.activityId);
    const bindingsFor = bindingsForReply.rows;
    console.log(`bindingsFor.........................................`);
    console.log(bindingsFor);

    for (const bindingFor of bindingsFor) {
        const fromEndpointById = await queries.getEndpointById(bindingFor.from);
        bindingFor.from = fromEndpointById;
        const toEndpointById = await queries.getEndpointById(bindingFor.to);
        bindingFor.to = toEndpointById;
    }

    activity.bindings.push(endpointsFor);

    const subactivitiesForReply = await queries.getSubActivitiesFor(request.params.activityId);
    const subactivitiesFor = subactivitiesForReply.rows;
    console.log(`Subactivities.for......................................`);
    console.log(subactivitiesFor);
    activity.children.push(subactivitiesFor);
    console.log(`finally...`);
    console.log(JSON.stringify(activity, null, 2));
    response.status(200).json(activity);
};

const getAllJags = async (request, response) => {
    console.log(`Getting all jags........................`);
    const jagMap = new Map();
    const jagList = [];
    const jagsReply = await queries.getAllJags();
    const jags = jagsReply.rows;
    console.log(`My query replay is`);
    jags.forEach((jag) => {
        if (jag.projectId === jag.id) {
            console.log(`see ${jag.projectId} as head`);
            jag.children = [];
            jagList.push(jag);
        }
        jagMap.set(jag.id, jag);
    });
    jags.forEach((jag) => {
        if (jag.fk) {  // has a parent
            const parent = jagMap.get(jag.fk);
            parent.children.add(jag);
        }
    });
    // console.log(`My complete head list is`)
    // console.log(jagList)
    // jagList.forEach((jag) => {
    //     const workStack = [];
    //     workStack.push(jag);
    //     console.log(`pushing`);
    //     console.log(jag);
    //     while (workStack.length > 0) {
    //         const workJag = workStack.pop();
    //         workJag.children.forEach((child) => {
    //             child = jagMap.get(child);
    //             workStack.push(child);
    //         });
    //     }
    // });
    console.log(`Jag List ===`);
    console.log(jagList);
    response.status(200).json(jagList);
};

const getJagByProjectId = async (request, response) => {
    const jagMap = new Map();
    const jagList = [];
    const jagsReply = await queries.getJagByProjectId(request.params.projectId);
    const jags = jagsReply.rows;
    jags.forEach((jag) => {
        if (jag.projectId === jag.id) {
            jagList.push(jag);
        }
        jagMap.set(jag.id, jag);
    });
    jagList.forEach((jag) => {
        const workStack = [];
        workStack.push(jag);
        console.log(`pushing`);
        console.log(jag);
        while (workStack.length > 0) {
            const workJag = workStack.pop();
            workJag.children.forEach((child) => {
                child = jagMap.get(child);
                workStack.push(child);
            });
        }
    });
    console.log(`Jag List ===`);
    console.log(jagList);
    response.status(200).json(jagList);
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

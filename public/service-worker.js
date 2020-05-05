class IndexedDBUtils {
    static createStore(db, { name, indexes, options }) {
        if(db.objectStoreNames.contains(name)) {
            console.log(`Deleting existing object store : ${name}`);
            db.deleteObjectStore(name);
        }

        const store = db.createObjectStore(name, options);

        indexes.forEach(({ name: index_name, property: index_property, options: index_options }) => {
            store.createIndex(index_name, index_property, index_options);
        });
    }

    static initStorage(id, version, stores) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(id, version);

            request.addEventListener('error', event => {
                const error = event.target.error;
                reject(new Error(`Error while connecting to the database ${error}`));
            });

            request.addEventListener('success', event => {
                resolve(event.target.result);
            });

            request.addEventListener('upgradeneeded', event => {
                console.log('updgrade', performance.now());
                const db = event.target.result;
                // After extensive testing, it seems that success waits for all store creation to be completed
                stores.forEach(store => createStore(db, store));
            });
        });
    }

    static store(db, store, value, key) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(store, 'readwrite');
            const object_store = transaction.objectStore(store);
            let request;
            if(key)
                request = object_store.put(value, key);
            else
                request = object_store.add(value);

            request.addEventListener('success', event => {
                resolve(event.target.result);
            });

            request.addEventListener('error', event => {
                reject(new Error(`Error while storing key value pair in store ${store}\nKey: ${key}\nValue: ${value}\nError: ${event.target.error}`));
            });
        });
    }

    static get(db, store, key) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(store, 'readonly');
            const object_store = transaction.objectStore(store);
            const request = object_store.get(key);

            request.addEventListener('success', event => {
                resolve(event.target.result);
            });

            request.addEventListener('error', event => {
                reject(new Error(`Error while retreiving value from store ${store}\nKey: ${key}\nError: ${event.target.error}`));
            });
        });
    }

    static getKeys(db, store) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(store, 'readonly');
            const object_store = transaction.objectStore(store);
            const request = object_store.getAllKeys();

            request.addEventListener('success', event => {
                resolve(event.target.result);
            });

            request.addEventListener('error', event => {
                reject(new Error(`Error while retreiving keys for store ${store} : ${event.target.error}`));
            });
        });

    }
}

const JAG_STORE = {
	name: 'jag',
	indexes: [
		{
			name: 'urn-index',
			property: 'urn',
			options: {
				unique: true
			}
		}
	]
};

let DB_INSTANCE;

const BROADCAST = new BroadcastChannel('jag_broadcast');

const APPS = new Set();

function store(model, fromApp) {
    IndexedDBUtils.store(
        DB_INSTANCE,
        JAG_STORE.name,
        model,
        model.urn
    ).then(() => {
        // Update all apps listening to broadcast that a model has been stored.
        BROADCAST.postMessage({ type: 'MODEL', data: { urn: model.urn, model: model }});
    }).catch((error) => {
        // Inform calling app directly that model failed to store.
        fromApp.port.postMessage({ type: 'ERROR', data: { message: `Failed to save model to IndexedDB: ${error}` } });
    });
}

function check(urn, fromApp) {
    // TODO: change to only query for existence
    IndexedDBUtils.get(
        DB_INSTANCE,
        JAG_STORE.name,
        urn
    ).then((json) => {
        const exists = (json !== undefined);
    
        fromApp.port.postMessage({ type: 'CHECK', data: { urn: urn, exists: exists }});
    }).catch((error) => {
        // Inform calling app directly of failure to check for model.
        fromApp.port.postMessage({ type: 'ERROR', data: { message: `Failed to check for model in IndexedDB: ${error}`} });
    });
}

function get(urn, fromApp) {
    IndexedDBUtils.get(
        DB_INSTANCE,
        JAG_STORE.name,
        urn
    ).then((model) => {
        fromApp.port.postMessage({ type: 'MODEL', data: { urn: urn, model: model }});
    }).catch((error) => {
        // Inform calling app directly of failure to retrieve model.
        fromApp.port.postMessage({ type: 'ERROR', data: { message: `Failed to retrieve model from IndexedDB: ${error}`} });
    });
}

function getKeys(fromApp) {
    IndexedDBUtils.getKeys(
        DB_INSTANCE,
        JAG_STORE.name
    ).then((cursor) => {
		let keys = new Set();

		for (let key of cursor) {
			keys.add(key);
        }
        
        fromApp.port.postMessage({ type: 'KEYS', data: { keys: keys } });
    }).catch((error) => {
        fromApp.port.postMessage({ type: 'ERROR', data: { message: `Failed to retrieve keys from IndexedDB: ${error}`} });
    });
}

function handleMessage(e, fromApp) {
    const message = e.data;

    if (message.type == 'STORE') {
        store(message.data.model, fromApp);
    } else if (message.type == 'MODEL') {
        get(message.data.urn, fromApp);
    } else if (message.type == 'CHECK') {
        check(message.data.urn, fromApp);
    } else if (message.type == 'KEYS') {
        getKeys(fromApp);
    }
}

IndexedDBUtils.initStorage(
    "jags",
    1,
    [JAG_STORE]
).then((db) => {
    DB_INSTANCE = db;
}).catch((error) => {
    throw new Error(`Failed to initialize IndexedDB: ${error}`);
});

onmessage = (e) => {
    const message = e.data;

    if (message.type == 'CONNECT') {
        // Handle new connection.

        // If app is already registered, must be stale; close port and remove old app.
        for (const app of APPS) {
            if (app.name == message.data.name) {
                APPS.delete(app);
                app.port.close();
            }
        }

        // Save app name and port to the app list.
        const app = { name: message.data.name, port: e.ports[0] };
        APPS.add(app);

        // Handle messages from the port the app provided.
        app.port.onmessage = (e) => handleMessage(e, app);
    } else if (message.type == 'DISCONNECT') {
        // Handle explicitly closed connection.

        // Find app in the app list, close its port, and remove it.
        for (const app of apps) {
            if (app.name == message.data.name) {
                APPS.delete(app);
                app.port.close();
            }
        }
    }
}
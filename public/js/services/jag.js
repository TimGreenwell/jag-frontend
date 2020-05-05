/**
 * @fileOverview JAG service.
 *
 * @author mvignati
 * @version 2.50
 */

'use strict';

import JAG from '../models/jag.js';
import UndefinedJAG from '../models/undefined.js';

export default class JAGService extends EventTarget {

	static async initialize(appName) {
        const bc = new BroadcastChannel('jag_broadcast');
        bc.addEventListener("message", JAGService._messageHandler);
		JAGService.BROADCAST = bc;

        if ('serviceWorker' in navigator) {
            await navigator.serviceWorker.register('../service-worker.js').then(async function () {
                // Use a MessageChannel for two-way communication with ServiceWorker.
                const link = new MessageChannel();

                // Listen for messages FROM ServiceWorker TO this app to update this app on Port 1.
				link.port1.onmessage = JAGService._messageHandler;

				JAGService.LINK = link.port1;

				await navigator.serviceWorker.ready.then(() => {
					// Send a message FROM this app TO ServiceWorker to connect this app with Port 2.
					navigator.serviceWorker.controller.postMessage({ type: 'CONNECT', data: { name: appName } }, [link.port2]);
				});
            }).catch((error) => {
                alert(`Failed to launch ServiceWorker critical for synchronization: ${error}`);
            });
        } else {
            alert(`Failed to launch Serviceworker critical for synchronization: ServiceWorker not supported.`);
        }
	}

	static get storageDefinition() {
		return JAGService.JAG_STORE;
	}

	static _localStore(model) {
		if (!JAGService.CACHE.has(model.urn)) {
			model.addEventListener('update', JAGService._updateHandler);
			JAGService.CACHE.set(model.urn, model);
		}

		JAGService.resolve(model, () => model.dispatchEvent(new CustomEvent('refresh')));
	}

	static store(model) {
		JAGService._localStore(model);

        // If a ServiceWorker link is available, request to store this model.
        if (JAGService.LINK) {
            JAGService.LINK.postMessage({ type: 'STORE', data: { model: model.toJSON() } });
        } else {
			console.log("Cannot store model upstream: ServiceWorker not available.");
		}
	}

	static async getAllAvailable(callback) {
		JAGService.await('keys', ':global', new Set(), (keys) => {
			for (let key of JAGService.STATIC.keys()) {
				keys.add(key);
			}

			for (let key of JAGService.UNDEFINED.keys()) {
				keys.add(key);
			}

			callback(keys);
		});
	}

	static async has(urn, callback) {
		if (JAGService.CACHE.has(urn)) {
			callback(true);
			return;
		}

		JAGService.await('check', urn, false, (exists) => {
			if (exists) callback(true);
			else callback(JAGService.STATIC.has(urn));
		});
	}

	static async get(urn, callback) {
		// If the cache contains a model for this URN,
		if (JAGService.CACHE.has(urn)) {
			// Fire the callback with the cached model.
			callback(JAGService.CACHE.get(urn));
		} else {
			const handler = (model) => {
				// If a definition does not exist,
				if (model === undefined) {
					// If the static library does not contain a definition,
					if (!JAGService.STATIC.has(urn)) {
						// If the undefined list does not contain a definition,
						if (!JAGService.UNDEFINED.has(urn)) {
							// Point this URN in the undefined list to a new undefined node.
							JAGService.UNDEFINED.set(urn, new UndefinedJAG(urn));
						}

						// Fire the callback with the UndefinedJAG model and stop.
						callback(JAGService.UNDEFINED.get(urn));
						return;
					}

					// Else, retrieve the definition from the static library.
					model = JAGService.STATIC.get(urn);
				}

				// Resolve the tree of children for this model.
				JAGService.resolve(model, () => {
					// Attach an update listener to this model.
					model.addEventListener('update', JAGService._updateHandler);

					// Store the model in the cache.
					JAGService.CACHE.set(urn, model);

					// Fire the callback with the model.
					callback(model);
				});
			};

			// Await an upstream model for this URN with the above handler.
			JAGService.await('model', urn, undefined, handler);
		}
	}

	static async resolve(model, callback) {
		// For each child of this model,
		for (let child of model.children) {
			// If child does not have model set,
			if (child.model === undefined) {
				const handler = (check) => {
					// If definition for child URN exists,
					if (check) {
						// Set the child model.
						JAGService.get(child.urn, (childModel) => {
							child.model = childModel;
						});
					// Else,
					} else {
						// If other models are also seeking this child URN,
						if (JAGService.MISSING.has(child.urn)) {
							// Add this model to the list.
							let missing_list = JAGService.MISSING.get(child.urn);
							missing_list.push(model);
						// Else,
						} else {
							// Create a new list of models seeking this child URN.
							JAGService.MISSING.set(child.urn, [model]);

							// Set the URN to an undefined JAG.
							JAGService.UNDEFINED.set(child.urn, new UndefinedJAG(child.urn));
						}
					}
				};

				// Check for existence of model.
				JAGService.has(child.urn, handler);
			}
		}

		// If other models have been seeking this model URN,
		if (JAGService.MISSING.has(model.urn)) {
			// Retrieve the list of models seeking this model URN.
			let missing_list = JAGService.MISSING.get(model.urn);

			// Remove this URN from the missing list.
			JAGService.MISSING.delete(model.urn);

			// For each model in the list,
			for (let seeking_model of missing_list) {
				// For each child of the model,
				for (let child of seeking_model.children) {
					// If the child URN matches this model,
					if (child.urn == model.urn) {
						// Set the child's model to this model.
						child.model = model;
					}
				}
			}

			// Retrieve the UndefinedJAG in place of the previously missing model.
			let undefinedJAG = JAGService.UNDEFINED.get(model.urn);

			// Remove this URN from the undefined list.
			JAGService.UNDEFINED.delete(model.urn);

			// Notify listeners that the model has been defined.
			undefinedJAG.defined(model);
		}

		// If this was called with a callback, fire the callback.
		if (callback) callback();
	}

	static async _updateHandler(e) {
		await JAGService.store(JAGService.CACHE.get(e.detail.urn));
    }

    static async _messageHandler(e) {
		const message = e.data;

		// If the message is a check for existence,
        if (message.type == 'CHECK') {
			const urn = message.data.urn;

			// If any callbacks are awaiting this URN,
			if (JAGService.PENDING.get(urn)) {
				const pending = JAGService.PENDING.get(urn);

				// Fire each 'check' callback with whether or not a model existed upstream.
				while (pending.has('check')) {
					const checks = pending.get('check');

					for (const callback of checks) {
						checks.delete(callback);

						// Fire callback (this may add a new request for check, hence the loop.)
						callback(message.data.exists);
					}

					if (checks.size == 0) {
						pending.delete('check');
					}
				}

				if (pending.size == 0) {
					JAGService.PENDING.delete(urn);
				}
			}
		// Else, if the message is a model,
		} else if (message.type == 'MODEL') {
			let model;

			const urn = message.data.urn;
			const json = message.data.model;

			// If no model was found upstream,
			if (json === undefined) {
				// Instantiate an UndefinedJAG for this URN if one does not already exist.
				if (!JAGService.UNDEFINED.get(urn)) {
					JAGService.UNDEFINED.set(urn, new UndefinedJAG(urn));
				}

				// Set the model to the UndefinedJAG.
				model = JAGService.UNDEFINED.get(urn);
			// Else,
			} else {
				if (JAGService.CACHE.has(urn)) {
					model = JAGService.CACHE.get(urn);

					model.name = json.name;
					model.description = json.description;
					model.operator = json.connector.operator;
					model.execution = json.connector.execution;

					// TODO: figure out how to update these properly
					// model.inputs = json.inputs;
					// model.outputs = json.outputs;
					// model.children = json.children;
					// model.bindings = json.bindings;
				} else {
					// Set the model to a newly instantiated JAG using the retrieved JSON.
					model = new JAG(json);

					// Locally store (and thus resolve) the model.
					JAGService._localStore(model);
				}
			}

			// While any callbacks are awaiting this URN,
			while (JAGService.PENDING.get(urn)) {
				const pending = JAGService.PENDING.get(urn);

				while (pending.has('check') || pending.has('model')) {
					// Fire each 'check' callback with whether or not a model existed upstream.
					while (pending.has('check')) {
						const checks = pending.get('check');

						for (const callback of checks) {
							checks.delete(callback);

							// Fire callback (this may add a new request for check or model, hence the loop.)
							callback(json !== undefined);
						}

						if (checks.size == 0) {
							pending.delete('check');
						}
					}

					// Fire each 'model' callback with the selected model.
					while (pending.has('model')) {
						const models = pending.get('model');

						for (const callback of models) {
							models.delete(callback);

							// Fire callback (this may add a new request for check or model, hence the loop.)
							callback(model);
						}

						if (models.size == 0) {
							pending.delete('model');
						}
					}
				}

				if (pending.size == 0) {
					JAGService.PENDING.delete(urn);
				}
			}

			if (JAGService.PENDING.get(':global')) {
				// Fire each global 'model' callback with the retrieved model.
				if (JAGService.PENDING.get(':global').get('model')) {
					for (const callback of JAGService.PENDING.get(':global').get('model')) {
						// Fire callback.
						// NOTE: do not remove callback; persistent
						callback(model);
					}
				}
			}
		// Else, if the message is available keys,
		} else if (message.type == 'KEYS') {
			if (JAGService.PENDING.get(':global')) {
				// Fire each 'keys' callback with the retrieved keys.
				if (JAGService.PENDING.get(':global').get('keys')) {
					for (const callback of JAGService.PENDING.get(':global').get('keys')) {
						// Fire callback.
						// NOTE: do not remove callback; persistent
						callback(message.data.keys);
					}
				}
			}
		}
	}

	static await(type, urn, fallback, callback) {
		if (JAGService.LINK) {
			if (urn == ':global') {
				if (!JAGService.PENDING.has(':global')) {
					JAGService.PENDING.set(':global', new Map());
				}

				const global = JAGService.PENDING.get(':global');

				if (type == 'keys') {
					if (global.has('keys')) {
						global.get('keys').add(callback);
					} else {
						global.set('keys', new Set([callback]));
						JAGService.LINK.postMessage({ type: 'KEYS' });
					}
				} else if (type == 'model') {
					if (global.has('model')) {
						global.get('model').add(callback);
					} else {
						global.set('model', new Set([callback]));
					}
				}
			} else {
				if (!JAGService.PENDING.has(urn)) {
					JAGService.PENDING.set(urn, new Map());
				}

				const pending = JAGService.PENDING.get(urn);

				if (pending.has(type)) {
					pending.get(type).add(callback);
				} else {
					pending.set(type, new Set([callback]));

					if (type == 'check') {
						if (!pending.has('model')) {
							JAGService.LINK.postMessage({ type: 'CHECK', data: { urn: urn } });
						}
					} else if (type == 'model') {
						JAGService.LINK.postMessage({ type: 'MODEL', data: { urn: urn } });
					}
				}
			}
		} else {
			callback(fallback);
		}
	}
	
	static async loadFromFile(path) {
		const response = await fetch(path);

		if (!response.ok) {
			window.alert("Failed to load static file '" + path + "'.");
			return;
		}

		const static_library = await response.json();

		for (let item of static_library)
		{
			JAGService.STATIC.set(item.urn, item);
		}
	}
}

JAGService.CACHE = new Map();

JAGService.STATIC = new Map();

JAGService.MISSING = new Map();

JAGService.UNDEFINED = new Map();

JAGService.PENDING = new Map();
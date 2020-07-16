/**
 * @fileOverview REST storage utilities.
 *
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.21
 */

export default class RESTUtils {

    static list(endpoint, uri) {
        // TODO: safely join URL paths (perhaps Node package?)
        return fetch(endpoint + uri, {
            'method': 'GET'
        }).then((response) => function (resolve, reject) {
            if (response.status == 200 || response.status == 204) {
                response.text().then((result) => resolve(result));
            } else {
                reject(new Error('Unknown error listing JAGs.'));
            }
        });
    }

    static check(endpoint, uri, urn) {
        // TODO: safely join URL paths (perhaps Node package?)
        return fetch(endpoint + uri.replace('{urn}', urn), {
            'method': 'HEAD'
        }).then((response) => function (resolve, reject) {
            // TODO: should we use resolve with true/false and reject on error, or reject if model does not exist?
            if (response.status == 200) {
                resolve(true);
            } else if (response.status == 404) {
                resolve(false);
            } else {
                reject(new Error('Unknown error checking JAG.'));
            }
        });
    }

	static create(endpoint, uri, urn, model) {
        const model_json_string = JSON.stringify(model);

        // TODO: safely join URL paths (perhaps Node package?)
        return fetch(endpoint + uri.replace('{urn}', urn), {
            'method': 'POST',
            'body': model_json_string,
            'headers': {
                'Content-Type': 'application/json'
            }
        }).then((response) => function (resolve, reject) {
            if (response.status == 200 || response.status == 204) {
                // TODO: require 204 (No Content) response?
                // TODO: parse or return 200 (OK) response?
                resolve();
            } else if (response.status == 409) {
                reject(new Error(`Error creating JAG: model already exists at URN ${urn}.`));
            } else {
                reject(new Error('Unknown error creating JAG.'));
            }
        });

    }

    static get(endpoint, uri, urn) {
        // TODO: safely join URL paths (perhaps Node package?)
        return fetch(endpoint + uri.replace('{urn}', urn), {
            'method': 'GET'
        }).then((response) => function (resolve, reject) {
            if (response.status == 200) {
                response.text().then((result) => {
                    try {
                        resolve(JSON.parse(result));
                    } catch {
                        reject(new Error(`Error retrieving JAG: failed to parse returned model.`));
                    }
                });
            } else if (response.status == 404) {
                reject(new Error(`Error retrieving JAG: model does not exist at URN ${urn}.`));
            } else {
                reject(new Error('Unknown error retrieving JAG.'));
            }
        });
    }

    static update(endpoint, uri, urn, model) {
        // TODO: ensure URN in model matches URN in request
        // TODO: implement PATCH for changing URN?
        const model_json_string = JSON.stringify(model);

        // TODO: safely join URL paths (perhaps Node package?)
        return fetch(endpoint + uri.replace('{urn}', urn), {
            'method': 'PUT',
            'body': model_json_string,
            'headers': {
                'Content-Type': 'application/json'
            }
        }).then((response) => function (resolve, reject) {
            if (response.status == 200 || response.status == 204) {
                // TODO: require 204 (No Content) response?
                // TODO: parse or return 200 (OK) response?
                resolve();
            } else if (response.status == 404) {
                reject(new Error(`Error updating JAG: model does not exist at URN ${urn}.`));
            } else {
                reject(new Error('Unknown error updating JAG.'));
            }
        });
    }

    static delete(endpoint, uri, urn) {
        // TODO: safely join URL paths (perhaps Node package?)
        return fetch(endpoint + uri.replace('{urn}', urn), {
            'method': 'DELETE'
        }).then((response) => function (resolve, reject) {
            if (response.status == 200 || response.status == 204) {
                // TODO: require 204 (No Content) response?
                // TODO: parse or return 200 (OK) response?
                resolve();
            } else if (response.status == 404) {
                reject(new Error(`Error deleting JAG: model does not exist at URN ${urn}.`));
            } else {
                reject(new Error('Unknown error deleting JAG.'));
            }
        });
    }

}
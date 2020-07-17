/**
 * @fileOverview REST storage utilities.
 *
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.55
 */

export default class RESTUtils {

    static async request(url, details, error_prefix = 'Error', ok_fallback = undefined, bad_fallback = undefined) {
        const response = await fetch(url, details).catch((error_message) => {
            throw new Error(`${error_prefix}: ${error_message}`);
        });

        if (response.status == 200) {
            if (ok_fallback) return ok_fallback;

            try {
                return await response.json();
            } catch {
                throw new Error(`${error_prefix}: Response was not a valid JSON object.`);
            }
        }

        if (response.status == 204)
            return ok_fallback;

        if (response.status == 404) {
            if (bad_fallback) return bad_fallback;
            throw new Error(`${error_prefix}: Resource does not exist at URN.`);
        }

        if (response.status == 409) {
            if (bad_fallback) return bad_fallback;
            throw new Error(`${error_prefix}: Resource already exists at URN.`);
        }

        throw new Error(`${error_prefix}: Unexpected response.`);
    }

    static async list(endpoint, uri) {
        // TODO: safely join URL paths (perhaps Node package?)
        const url = endpoint + uri;

        const details = {};

        return await RESTUtils.request(url, details, 'Error listing JAGs');
    }

    static async check(endpoint, uri, urn) {
        // TODO: safely join URL paths (perhaps Node package?)
        const url = endpoint + uri.replace('{urn}', urn);

        const details = {
            'method': 'HEAD'
        };

        return await RESTUtils.request(url, details, 'Error finding JAG', true, false);
    }

	static async create(endpoint, uri, urn, model) {
        // TODO: safely join URL paths (perhaps Node package?)
        const url = endpoint + uri.replace('{urn}', urn);

        const model_json_string = JSON.stringify(model);

        const details = {
            'method': 'POST',
            'body': model_json_string,
            'headers': {
                'Content-Type': 'application/json'
            }
        };

        return await RESTUtils.request(url, details, 'Error creating JAG');
    }

    static async get(endpoint, uri, urn) {
        // TODO: safely join URL paths (perhaps Node package?)
        const url = endpoint + uri.replace('{urn}', urn);

        const details = {};

        return await RESTUtils.request(url, details, 'Error retrieving JAG');
    }

    static async update(endpoint, uri, urn, model) {
        // TODO: safely join URL paths (perhaps Node package?)
        const url = endpoint + uri.replace('{urn}', urn);

        // TODO: ensure URN in model matches URN in request
        // TODO: implement PATCH for changing URN?
        const model_json_string = JSON.stringify(model);

        const details = {
            'method': 'PUT',
            'body': model_json_string,
            'headers': {
                'Content-Type': 'application/json'
            }
        };

        return await RESTUtils.request(url, details, 'Error updating JAG');
    }

    static async delete(endpoint, uri, urn) {
        // TODO: safely join URL paths (perhaps Node package?)
        const url = endpoint + uri.replace('{urn}', urn);

        const details = {
            'method': 'DELETE'
        };

        return await RESTUtils.request(url, details, 'Error deleting JAG');
    }

}
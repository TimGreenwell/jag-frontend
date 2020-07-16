/**
 * @fileOverview REST storage utilities.
 *
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.38
 */

export default class RESTUtils {

    static async handleResponse(response, error_prefix = 'Error', ok_fallback = undefined, bad_fallback = undefined) {
        if (response.status == 200) {
            if (ok_fallback) return ok_fallback;
            const result = await response.text();

            try {
                return JSON.parse(result);
            } catch {
                throw new Error(`${error_prefix}: Response was not a valid JSON object.`);
            }
        } else if (response.status == 204) {
            return ok_fallback;
        } else if (response.status == 404) {
            if (bad_fallback) return bad_fallback;
            throw new Error(`${error_prefix}: Resource does not exist at URN.`);
        } else if (response.status == 409) {
            if (bad_fallback) return bad_fallback;
            throw new Error(`${error_prefix}: Resource already exists at URN.`);
        }

        throw new Error(`${error_prefix}: Unexpected response.`);
    }

    static async list(endpoint, uri) {
        // TODO: safely join URL paths (perhaps Node package?)
        const response = await fetch(endpoint + uri, {
            'method': 'GET'
        });
        
        return await RESTUtils.handleResponse(response, 'Error listing JAGs')
    }

    static async check(endpoint, uri, urn) {
        // TODO: safely join URL paths (perhaps Node package?)
        const response = await fetch(endpoint + uri.replace('{urn}', urn), {
            'method': 'HEAD'
        });
        
        return await RESTUtils.handleResponse(response, 'Error finding JAG', true, false);
    }

	static async create(endpoint, uri, urn, model) {
        const model_json_string = JSON.stringify(model);

        // TODO: safely join URL paths (perhaps Node package?)
        const response = await fetch(endpoint + uri.replace('{urn}', urn), {
            'method': 'POST',
            'body': model_json_string,
            'headers': {
                'Content-Type': 'application/json'
            }
        });

        return await RESTUtils.handleResponse(response, 'Error creating JAG');
    }

    static async get(endpoint, uri, urn) {
        // TODO: safely join URL paths (perhaps Node package?)
        const response = await fetch(endpoint + uri.replace('{urn}', urn), {
            'method': 'GET'
        });

        return RESTUtils.handleResponse(response, 'Error retrieving JAG');
    }

    static async update(endpoint, uri, urn, model) {
        // TODO: ensure URN in model matches URN in request
        // TODO: implement PATCH for changing URN?
        const model_json_string = JSON.stringify(model);

        // TODO: safely join URL paths (perhaps Node package?)
        const response = await fetch(endpoint + uri.replace('{urn}', urn), {
            'method': 'PUT',
            'body': model_json_string,
            'headers': {
                'Content-Type': 'application/json'
            }
        });

        return await RESTUtils.handleResponse(response, 'Error updating JAG');
    }

    static async delete(endpoint, uri, urn) {
        // TODO: safely join URL paths (perhaps Node package?)
        const response = await fetch(endpoint + uri.replace('{urn}', urn), {
            'method': 'DELETE'
        });

        return await RESTUtils.handleResponse(response, 'Error deleting JAG');
    }

}
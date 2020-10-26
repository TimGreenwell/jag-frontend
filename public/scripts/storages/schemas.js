/**
 * @file Wrapper for IndexedDB storage schemas.
 *
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.04
 */

export default class Schemas {

    static all() {
        return Object.values(Schemas.SCHEMA_SET);
    }

    static get(schema) {
        if (schema in Schemas.SCHEMA_SET) {
            return Schemas.SCHEMA_SET[schema];
        }

        throw new Error("Schema '" + schema + "' does not exist.");
    }
}

const JAG_STORE = {
	name: 'joint-activity-graph',
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

const NODE_STORE = {
	name: 'node',
	indexes: [
		{
			name: 'id-index',
			property: 'id',
			options: {
				unique: true
			}
		}
	]
};

const ANALYSIS_STORE = {
	name: 'analysis',
	indexes: [
		{
			name: 'id-index',
			property: 'id',
			options: {
				unique: true
			}
		}
	]
};


Schemas.SCHEMA_SET = {
	'jag': JAG_STORE,
	'node': NODE_STORE,
	'analysis': ANALYSIS_STORE
};
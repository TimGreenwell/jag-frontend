/**
 * @file Wrapper for IndexedDB storage schemas.
 *
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.06
 */

export default class Schemas {

	static
	{
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

		const AGENT_STORE = {
			name: 'agent',
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

		const TEAM_STORE = {
			name: 'team',
			indexes: [
				{
					name: 'id-index',
					property: 'id',
					options: {
						unique: true
					}
				}
			]
		}

		Schemas.SCHEMA_SET = {
			'jag': JAG_STORE,
			'node': NODE_STORE,
			'analysis': ANALYSIS_STORE,
			'agent': AGENT_STORE,
			'team': TEAM_STORE
		};
	}

    static all() {
        return Object.values(Schemas.SCHEMA_SET);
    }

    static get(schema) {
        if (schema in Schemas.SCHEMA_SET) {
            return Schemas.SCHEMA_SET[schema];
        }

        throw new Error("Schema '" + schema + "' does not exist.");
    }

	static getKeyValue(schema,obj) {
		console.log("-> " + schema);
		let key = Schemas.get(schema).indexes[0].property;
		return(obj[key]);

	}
}




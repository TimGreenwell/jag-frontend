/**
 * @file Wrapper for IndexedDB storage schemas.
 *
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.06
 */

import JAG from  '../models/jag.js';
import Node from  '../models/node.js';
import Analysis from  '../models/analysis.js';
import Agent from  '../models/agent.js';
import Team from  '../models/team.js';

export default class Schemas {

	static
	{
		const JAG_STORE = {
			name: 'joint-activity-graph',
			deserialize: JAG.fromJSON,
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
			deserialize: Node.fromJSON,
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
			deserialize: Analysis.fromJSON,
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
			deserialize: Agent.fromJSON,
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
			deserialize: Team.fromJSON,
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
		let key = Schemas.get(schema).indexes[0].property;
		return(obj[key]);
	}

	static async deserialize(schema,description) {;
		const newObj =  await Schemas.get(schema).deserialize(description)
		return newObj;
	}
}




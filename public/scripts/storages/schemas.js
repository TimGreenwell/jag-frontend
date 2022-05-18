/**
 * @file Wrapper for IndexedDB storage schemas.
 *
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.07
 *
 * Schema provides the necessary information describing a record
 * being processed.  This includes the storename, keyfield and
 * the deserialization function required.
 * @TODO Not sure what unique is for.
 * @TODO Should we incorporate a yml/xml config file?  Probably no benefit.
 */



import JAG from  '../models/jag.js';
import Node from  '../models/node.js';
import AnalysisModel from '../models/analysis-model.js';
import Agent from  '../models/agent.js';
import Team from  '../models/team.js';

export default class Schemas {

	static
	{
		const JAG_STORE = {
			name: 'jag',
			rest: 'jagActivities',
			deserialize: JAG.fromJSON,
			index: 'urn'
		};

		const NODE_STORE = {
			name: 'node',
			rest: 'nodes',
			deserialize: Node.fromJSON,
			index: 'id'
		};

		const ANALYSIS_STORE = {
			name: 'analysis',
			rest: 'analyses',
			deserialize: AnalysisModel.fromJSON,
			index: 'id'
		};

		const AGENT_STORE = {
			name: 'agent',
			rest: 'agents',
			deserialize: Agent.fromJSON,
			index: 'id'
		};

		const TEAM_STORE = {
			name: 'team',
			rest: 'teams',
			deserialize: Team.fromJSON,
			index: 'id'
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

	static getRest(schema) {
		return Schemas.get(schema).rest;
	}

	static getKeyValue(schema,obj) {
		let key = Schemas.get(schema).index;
		return(obj[key]);
	}

	static getKey(schema) {
		return Schemas.get(schema).index;
	}

	static async deserialize(schema,description) {;
		const newObj =  await Schemas.get(schema).deserialize(description)
		return newObj;
	}
}




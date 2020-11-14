/**
 * @fileOverview Team model.
 *
 * @author mvignati
 * @version 0.38
 */

'use strict';

import AgentService from '../services/agent.js';
import TeamService from '../services/team.js';
import { UUIDv4 }  from '../utils/uuid.js'
import AgentModel from './agent.js';

export default class TeamModel extends EventTarget {

	constructor({ id = UUIDv4(), name = TeamModel.DEFAULT_NAME, agents = [] } = {}) {
		super();
		this._id = id;
		this._name = name;
		this._agents = agents;
	}

	static async fromJSON(json) {
		const agents = [];
		for (const agent_id of json.agents) {
			let agent = await AgentService.instance('idb-service').get(agent_id);

			if (agent == undefined) {
				agent = new AgentModel({name: "(Unknown Agent)"});
				await AgentService.instance('idb-service').create(agent);
			}

			agents.push(agent);
		}
		json.agents = agents;

		return new TeamModel(json);
	}

	get id() {
		return this._id;
	}

	get name() {
		return this._name;
	}

	set name(name) {
		this._name = name;
		this.save();
	}

	get agents() {
		return this._agents;
	}

	addAgent(agent) {
		this._agents.push(agent);
		this.dispatchEvent(new CustomEvent('agent', { detail: { agent: agent } }));
	}

	save() {
		//TeamService.store(this);
	}

	toJSON() {
		const json = {
			id: this._id,
			name: this._name,
			agents: this._agents.map(agent => agent.id)
		};

		return json;
	}

}

TeamModel.DEFAULT_NAME = 'Team name';


/**
 * @fileOverview Team model.
 *
 * @author mvignati
 * @version 0.47
 */

'use strict';

import AgentService from '../services/agent.js';
import TeamService from '../services/team.js';
import { UUIDv4 }  from '../utils/uuid.js'
import AgentModel from './agent.js';

export default class TeamModel extends EventTarget {

	constructor({ id = UUIDv4(), name = TeamModel.DEFAULT_NAME, agents = [], primary = new Set() } = {}) {
		super();
		this._id = id;
		this._name = name;
		this._agents = agents;
		this._primary = primary;
	}

	static async fromJSON(json) {
		const agents = [];
		for (const agent_id of json.agents) {
			let agent = await AgentService.instance('idb-service').get(agent_id);

			if (agent == undefined) {
				agent = new AgentModel();
				await AgentService.instance('idb-service').create(agent);
			}

			agents.push(agent);
		}
		json.agents = agents;

		json.primary = new Set(json.primary);

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
		this.dispatchEvent(new CustomEvent('update', { detail: { id: this._id, "property": "name", "extra": { "name": this._name }}}));
	}

	get agents() {
		return this._agents;
	}

	addAgent(agent) {
		this._agents.push(agent);
		this.dispatchEvent(new CustomEvent('update', { detail: { id: this._id, "property": "agents", "extra": { "agents": this._agents }}}));
	}

	removeAgent(agent) {
		this._agents.splice(this._agents.indexOf(agent), 1);
		this.dispatchEvent(new CustomEvent('update', { detail: { id: this._id, "property": "agents", "extra": { "agents": this._agents }}}));
	}

	setPrimary(id, primary) {
		if (this._primary.has(id) && !primary) {
			this._primary.delete(id);
		} else if (!this._primary.has(id) && primary) {
			this._primary.add(id);
		} else {
			return;
		}

		this.dispatchEvent(new CustomEvent('update', { detail: { id: this._id, "property": "primary", "extra": { "primary": this._primary }}}));
	}

	primary(id) {
		const ids = this._agents.map(agent => agent.id);

		if (ids.indexOf(id) >= 0)
			return this._primary.has(id);

		return undefined;
	}

	save() {
		//TeamService.store(this);
	}

	toJSON() {
		const json = {
			id: this._id,
			name: this._name,
			agents: this._agents.map(agent => agent.id),
			primary: Array.from(this._primary)
		};

		return json;
	}

}

TeamModel.DEFAULT_NAME = 'Team name';


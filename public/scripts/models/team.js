/**
 * @fileOverview Team model.
 *
 * @author mvignati
 * @version 0.48
 */

'use strict';

import { UUIDv4 }  from '../utils/uuid.js'

export default class TeamModel extends EventTarget {

	constructor({ id = UUIDv4(), name = TeamModel.DEFAULT_NAME, agentIds = [], performers = new Set() } = {}) {
		super();
		this._id = id;
		this._name = name;
		this._agentIds = agentIds;
		this._performers = performers;
		// enhanced
		this._agents = [];
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

	get agentIds() {
		return this._agentIds;
	}

	set agentIds(value) {
		this._agentIds = value;
	}

	get agents() {
		return this._agents;
	}


	set agents(value) {
		this._agents = value;
	}

	addAgent(agent) {
		this._agents.push(agent);
		this.dispatchEvent(new CustomEvent('update', { detail: { id: this._id, "property": "agents", "extra": { "agents": this._agents }}}));
	}

	removeAgent(agent) {
		this._agents.splice(this._agents.indexOf(agent), 1);
		this.dispatchEvent(new CustomEvent('update', { detail: { id: this._id, "property": "agents", "extra": { "agents": this._agents }}}));
	}

	setPerformer(id, performer) {
		if (this._performers.has(id) && !performer) {
			this._performers.delete(id);
		} else if (!this._performers.has(id) && performer) {
			this._performers.add(id);
		} else {
			return;
		}

		this.dispatchEvent(new CustomEvent('update', { detail: { id: this._id, "property": "performers", "extra": { "performers": this._performers }}}));
	}

	performer(id) {
		const ids = this._agents.map(agent => agent.id);

		if (ids.indexOf(id) >= 0)
			return this._performers.has(id);

		return undefined;
	}

	save() {
		//TeamService.store(this);
	}

	toJSON() {
		const json = {
			id: this._id,
			name: this._name,
			agentIds: this._agentIds,
			performers: Array.from(this._performers)
		};
		return json;
	}

	static async fromJSON(json) {
		// const agents = [];
		// for (const agent_id of json.agents) {
		// 	let agent = await StorageService.get(agent_id,'agent');
		//
		// 	// if (agent == undefined) {
		// 	// 	agent = new AgentModel();
		// 	// 	await StorageService.create(agent,'agent');
		// 	//}
		//
		// 	agents.push(agent);
		// }
		// json.agents = agents;

		json.performers = new Set(json.performers);
		let returnValue = new TeamModel(json);
		return returnValue;
	}

}

TeamModel.DEFAULT_NAME = 'Team name';


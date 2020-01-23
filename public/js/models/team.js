/**
 * @fileOverview Team model.
 *
 * @author mvignati
 * @version 0.15
 */

'use strict';

import { UUIDv4 }  from '../goblin/crypto/uuid.js'

export default class TeamModel {

	constructor({ id = UUIDv4(), name = TeamModel.DEFAULT_NAME } = {}) {
		this._id = id;
		this._name = name;
		this._agents = [];
	}

	static async fromJSON(json) {
		const node_id = json.root;
		const root = await NodeService.get(node_id);
		const team = new TeamModel(json);

		for(let agent of json.agents) {
			// this.addAgent(agent);
		}

		return team;
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


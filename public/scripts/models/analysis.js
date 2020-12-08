/**
 * @fileOverview Analysis model.
 *
 * @author mvignati
 * @version 0.55
 */

'use strict';

import { UUIDv4 } from '../utils/uuid.js';

import AgentModel from './agent.js';
import Node from './node.js';
import TeamModel from './team.js';
import NodeService from '../services/node.js';
import AgentService from '../services/agent.js';
import TeamService from '../services/team.js';

export default class Analysis extends EventTarget {

	constructor({ id = UUIDv4(), name = Analysis.DEFAULT_NAME, description = Analysis.DEFAULT_DESCRIPTION, root = new Node({is_root: true}), teams = [] } = {}) {
		super();
		this._id = id;
		this._name = name;
		this._description = description;
		this._root = root;
		this._teams = teams;

		// TODO: remove default team/agent configuration and add ability to create teams and agents.
		if (this._teams.length == 0) {
			const elves = new TeamModel({name: "Elves"});
			elves.addAgent(new AgentModel({name: "Alfie"}));
			elves.addAgent(new AgentModel({name: "Basil"}));
			elves.addAgent(new AgentModel({name: "Cal"}));
			elves.addAgent(new AgentModel({name: "Didi"}));
			elves.addAgent(new AgentModel({name: "Elle"}));
			elves.agents.forEach(agent => AgentService.instance('idb-service').create(agent));
			TeamService.instance('idb-service').create(elves);

			const dwarves = new TeamModel({name: "Dwarves"});
			dwarves.addAgent(new AgentModel({name: "Angus"}));
			dwarves.addAgent(new AgentModel({name: "Backus"}));
			dwarves.addAgent(new AgentModel({name: "Coffin"}));
			dwarves.addAgent(new AgentModel({name: "Daedrick"}));
			dwarves.addAgent(new AgentModel({name: "Eukip"}));
			dwarves.agents.forEach(agent => AgentService.instance('idb-service').create(agent));
			TeamService.instance('idb-service').create(dwarves);

			this._teams = [elves, dwarves];
		}
	}

	static async fromJSON(json) {
		const node_id = json.root;
		const root = await NodeService.instance('idb-service').get(node_id);

		// Replace id by the actual model.
		json.root = root;

		const teams = [];

		for (const team_id of json.teams) {
			let team = await TeamService.instance('idb-service').get(team_id);

			if (team == undefined) {
				team = new TeamModel({name: "(Unknown Team)"});
				await TeamService.instance('idb-service').create(team);
			}

			teams.push(team);
		}

		json.teams = teams;

		return new Analysis(json);
	}

	get id() {
		return this._id;
	}

	get name() {
		return this._name;
	}

	set name(name) {
		this._name = name;
		this.dispatchEvent(new CustomEvent('update', { 'detail': { 'id': this._id, 'property': 'name', 'extra': { 'name': this._name }}}));
	}

	get description() {
		return this._description;
	}

	set description(description) {
		this._description = description;
		this.dispatchEvent(new CustomEvent('update', { 'detail': { 'id': this._id, 'property': 'description', 'extra': { 'description': this._description }}}));
	}

	get root() {
		return this._root;
	}

	get teams() {
		return this._teams;
	}

	save() {
		this.dispatchEvent(new CustomEvent('update', { 'detail': { 'id': this._id } }));
	}

	toJSON() {
		const json = {
			id: this._id,
			name: this._name,
			description: this._description,
			root: this.root.id,
			teams: this._teams.map(team => team.id)
		};

		return json;
	}

}

Analysis.DEFAULT_NAME = '';
Analysis.DEFAULT_DESCRIPTION = '';
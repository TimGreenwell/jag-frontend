/**
 * @fileOverview Analysis model.
 *
 * @author mvignati
 * @version 0.39
 */

'use strict';

import { UUIDv4 } from '../utils/uuid.js';

import AgentModel from './agent.js';
import Node from './node.js';
import TeamModel from './team.js';
import NodeService from '../services/node.js';

export default class Analysis extends EventTarget {

	constructor({ id = UUIDv4(), name = Analysis.DEFAULT_NAME, root = new Node({is_root: true}) } = {}) {
		super();
		this._id = id;
		this._name = name;
		this._root = root;


		// Temporary static testing
		const b_team = new TeamModel({name: 'B Team'});
		b_team.addAgent(new AgentModel({name: 'Bab'}));
		b_team.addAgent(new AgentModel({name: 'Beb'}));
		b_team.addAgent(new AgentModel({name: 'Bib'}));
		b_team.addAgent(new AgentModel({name: 'Bob'}));
		b_team.addAgent(new AgentModel({name: 'Bub'}));

		const dwarves = new TeamModel({name: 'Dwarves'});
		dwarves.addAgent(new AgentModel({name: 'Oriferlug'}));
		dwarves.addAgent(new AgentModel({name: 'Groroum'}));
		dwarves.addAgent(new AgentModel({name: 'Anen'}));
		dwarves.addAgent(new AgentModel({name: 'Glorithon'}));
		dwarves.addAgent(new AgentModel({name: 'Karduk'}));
		dwarves.addAgent(new AgentModel({name: 'Krudrouk'}));
		dwarves.addAgent(new AgentModel({name: 'Daredgrek'}));

		this._teams = [
			b_team,
			dwarves
		];
	}

	static async fromJSON(json) {
		const node_id = json.root;
		const root = await NodeService.instance('idb-service').get(node_id);

		// Replace id by the actual model.
		json.root = root;

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
		this.save();
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
			root: this.root.id
		};

		return json;
	}

}

Analysis.DEFAULT_NAME = '';

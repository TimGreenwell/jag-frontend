/**
 * @fileOverview Analysis model.
 *
 * @author mvignati
 * @version 0.61
 */

'use strict';

import { UUIDv4 } from '../utils/uuid.js';

import Node from './node.js';
import TeamModel from './team.js';
import NodeService from '../services/node.js';
import TeamService from '../services/team.js';

export default class Analysis extends EventTarget {

	constructor({ id = UUIDv4(), name = Analysis.DEFAULT_NAME, description = Analysis.DEFAULT_DESCRIPTION, root = new Node({is_root: true}), team } = {}) {
		super();
		this._id = id;
		this._name = name;
		this._description = description;
		this._root = root;
		this._team = team;
		
		if (team == undefined) {
			this._team = new TeamModel();
			TeamService.instance('idb-service').create(this._team);
		}
	}

	static async fromJSON(json) {
		const node_id = json.root;
		const root = await NodeService.instance('idb-service').get(node_id);

		// Replace id by the actual model.
		json.root = root;

		const team_id = json.team;
		let team = await TeamService.instance('idb-service').get(team_id);

		if (team == undefined) {
			team = new TeamModel();
			await TeamService.instance('idb-service').create(team);
		}

		json.team = team;

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

	get team() {
		return this._team;
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
			team: this._team.id
		};

		return json;
	}

}

Analysis.DEFAULT_NAME = '';
Analysis.DEFAULT_DESCRIPTION = '';
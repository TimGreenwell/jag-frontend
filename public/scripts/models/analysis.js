/**
 * @fileOverview Analysis model.
 *
 * @author mvignati
 * @version 0.63
 */

'use strict';

import { UUIDv4 } from '../utils/uuid.js';

import Node from './node.js';
import TeamModel from './team.js';
//import NodeService from '../services/node.js';
//import TeamService from '../services/team.js';
import AgentModel from './agent.js';
//import AgentService from '../services/agent.js';
import StorageService from '../services/storage-service.js';

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
			this._team.addAgent(new AgentModel({name: 'Agent 1'}));
			this._team.addAgent(new AgentModel({name: 'Agent 2'}));
			//this._team.agents.forEach(agent => AgentService.instance('idb-service').create(agent));
			this._team.agents.forEach(agent => StorageService.create(agent,'agent'));
			//TeamService.instance('idb-service').create(this._team);
			StorageService.create(this._team,'team');
		}
	}

	static async fromJSON(json) {
		const node_id = json.root;

		//   ex  		const foundJAGModel = StorageService.get(targetURN, 'jag');
		//const root = await NodeService.instance('idb-service').get(node_id);
		const root = await StorageService.get(node_id, 'node');

		// Replace id by the actual model.
		json.root = root;

		const team_id = json.team;
		//let team = await TeamService.instance('idb-service').get(team_id);
		let team = await StorageService.get(team_id, 'team');

		if (team == undefined) {
			team = new TeamModel();
			//await TeamService.instance('idb-service').create(team);
			await StorageService.create(team, 'team');
		}

		json.team = team;
		const newAnalysis = new Analysis(json);
		console.log("()()()");
		console.log(newAnalysis);

		return newAnalysis;
	}

	get id() {
		return this._id;
	}

	get name() {
		return this._name;
	}


// @TODO Looking for something more direct than multiple identical customevents (creating race conditions)
	// StorageService.setSchema('analysis'); is a temp fix
	set name(name) {
		this._name = name;
	//	this.dispatchEvent(new CustomEvent('update', { 'detail': { 'id': this._id, 'property': 'name','extra': { 'name': this._name }}}));
	}

	get description() {
		return this._description;
	}


// @TODO Looking for something more direct than multiple identical customevents (creating race conditions)
	// StorageService.setSchema('analysis'); is a temp fix
	set description(description) {
		this._description = description;
	//	this.dispatchEvent(new CustomEvent('update', { 'detail': { 'id': this._id, 'property': 'description','extra': { 'description': this._description }}}));
	}

	get root() {
		return this._root;
	}

	get team() {
		return this._team;
	}


	// StorageService.setSchema('analysis'); is a temp fix
	save() {
		StorageService.setSchema('analysis');

		// THIS BEING USED ANYWHERE?

	//	this.dispatchEvent(new CustomEvent('update', { 'detail': { 'id': this._id } }));
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
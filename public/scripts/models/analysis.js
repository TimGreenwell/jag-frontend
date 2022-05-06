/**
 * @fileOverview Analysis model.
 *
 * @author mvignati
 * @version 0.63
 */

'use strict';

import { UUIDv4 } from '../utils/uuid.js';

import NodeModel from './node.js';
import TeamModel from './team.js';
import AgentModel from './agent.js';
import StorageService from '../services/storage-service.js';

export default class Analysis extends EventTarget {

	// constructor : why pass in root into a new NodeModel? results in same.  hrm
	constructor({
					id = UUIDv4(),
					name = Analysis.DEFAULT_NAME,
					description = Analysis.DEFAULT_DESCRIPTION,
					root = new NodeModel({is_root: true}),
					team
				} = {}) {
		super();
		this._id = id;
		this._name = name;
		this._description = description;
		this._rootNodeModel = root;
		this._team = team;
		this._nodeSet = new Set();
	//	StorageService.subscribe("jag-storage-updated", this.updateJagNode.bind(this));
	//	StorageService.subscribe("jag-storage-created", this._addJagNodeTree.bind(this));

	};

	async buildDefaultTeam() {
		if (this._team == undefined) {
			this._team = new TeamModel();
			this._team.addAgent(new AgentModel({name: 'Agent 1'}));
			this._team.addAgent(new AgentModel({name: 'Agent 2'}));
			await Promise.all(this._team.agents.map(async agent => await StorageService.create(agent, 'agent')));
			await StorageService.create(this._team, 'team');
		}
	}






// same thing but no recursion

	async buildAnalysisJagNodes2(newRootNodeModel) {
		const nodeStack = [];
		const myNodeSet = new Set();
		myNodeSet.clear();
		console.log("..new nodeset === ....");
		console.log(JSON.stringify(myNodeSet));
		nodeStack.push(rootNodeModel);
		while (nodeStack.length != 0) {
			let currentNode = nodeStack.pop();
			console.log("CURRENTNODE");
			console.log(currentNode);
			for (const child of currentNode.jag.children) {
				console.log("my baby::>");
				console.log(child);
				const childJagModel = await StorageService.get(child.urn, 'jag');
				console.log("my baby jag::>");
				console.log(childJagModel);
				const childNodeModel = new NodeModel({jag: childJagModel, is_root: false});
				console.log("my baby nodie::>");
				console.log(childNodeModel);
				currentNode.addChild(childNodeModel, true);
				console.log("................");
				console.log(currentNode);
				console.log("added");
				console.log(childNodeModel);
				console.log("................");
				nodeStack.push(childNodeModel);
				console.log("..new nodestack === ....");
				console.log(nodeStack);
				console.log("::finsihed with current node  urn ::::" + currentNode.urn + ":::::::::::>>");
			}
			myNodeSet.add(currentNode);
			console.log("..new nodeset === ....");
			console.log(myNodeSet);
		}
		console.log("hhhhhhhhhhFirst answer hhhhhhhhh");
	}

	// This was an attempt to build the Nodes for the IA-TABLE based off the JAG Models.
	// The current setup -- loses full children info at depth 1.
	async buildAnalysisJagNodes(newRootNodeModel) {
		let currentNode = newRootNodeModel;
		let children = newRootNodeModel.jag.children;

		await Promise.all(
		children.map(async ({urn, id}) => {
			const childJagModel = await StorageService.get(urn, 'jag');
			const childNodeModel = new NodeModel({jag: childJagModel});
			currentNode.addChild(childNodeModel, true);
			await this.buildAnalysisJagNodes(childNodeModel);
		}))
		this._nodeSet.add(currentNode);
		await StorageService.create(currentNode,'node');
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
		return this._rootNodeModel;
	}

	get team() {
		return this._team;
	}


	// @TODO StorageService.setSchema('analysis'); is a temp fix  -- update - fixed.  Test removal
	save() {
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
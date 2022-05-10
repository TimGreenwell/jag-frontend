/**
 * @fileOverview AnalysisModel model.
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

export default class AnalysisModel extends EventTarget {

	// constructor : why pass in root into a new NodeModel? results in same.  hrm
	constructor({
					id = UUIDv4(),
					name = AnalysisModel.DEFAULT_NAME,
					description = AnalysisModel.DEFAULT_DESCRIPTION,
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

	}
// same thing but no recursion
	async buildAnalysisJagNodes2(newRootNodeModel) {
		const nodeStack = [];
		const myNodeSet = new Set();
		myNodeSet.clear();
		nodeStack.push(newRootNodeModel);
		while (nodeStack.length != 0) {
			let currentNode = nodeStack.pop();
			for (const child of currentNode.jag.children) {
				const childJagModel = await StorageService.get(child.urn, 'jag');
				const childNodeModel = new NodeModel({jag: childJagModel, is_root: false});
				currentNode.addChild(childNodeModel, true);
				nodeStack.push(childNodeModel);
							}
			myNodeSet.add(currentNode);
		}
	}

	async buildAnalysisJagNodes(currentNode) { // this was newRootNodeModel

	//	let currentNode = newRootNodeModel;     // this was uncommented
		let children = currentNode.jag.children;// this was newRootNodeModel

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
		const rootNode = await StorageService.get(node_id, 'node');
		// Replace id by the actual model.
		json.root = rootNode;
		const team_id = json.team;
		let teamNode = await StorageService.get(team_id, 'team');
		if (teamNode == undefined) {
			teamNode = new TeamModel();
			await StorageService.create(teamNode, 'team');
		}
		json.team = teamNode;
		const newAnalysis = new AnalysisModel(json);
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
		this.dispatchEvent(new CustomEvent('update', { 'detail': { 'id': this._id, 'property': 'name','extra': { 'name': this._name }}}));
	}

	get description() {
		return this._description;
	}


// @TODO Looking for something more direct than multiple identical customevents (creating race conditions)
	// StorageService.setSchema('analysis'); is a temp fix
	set description(description) {
		this._description = description;
		this.dispatchEvent(new CustomEvent('update', { 'detail': { 'id': this._id, 'property': 'description','extra': { 'description': this._description }}}));
	}

	get root() {
		return this._rootNodeModel;
	}

set root(newRootNodeModel) {
		this._rootNodeModel = newRootNodeModel
}

get nodeSet() {
		return this._nodeSet;
}

	get team() {
		return this._team;
	}

	set team(newTeam){
		this._team = newTeam;
	}

	save() {
		// THIS BEING USED ANYWHERE?
console.log("(((DISPLATCHING UPDATE)) - doesnt seem to be problem but dont know what it does")
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

AnalysisModel.DEFAULT_NAME = '';
AnalysisModel.DEFAULT_DESCRIPTION = '';
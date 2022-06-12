/**
 * @fileOverview AnalysisModel model.
 *
 * @author mvignati
 * @version 0.63
 */

'use strict';

import { UUIDv4 } from '../utils/uuid.js';
import TeamModel from './team.js';
import StorageService from '../services/storage-service.js';

export default class AnalysisModel extends EventTarget {

	// constructor : why pass in root into a new NodeModel? results in same.  hrm
	constructor({
					id = UUIDv4(),
					name = AnalysisModel.DEFAULT_NAME,
					description = AnalysisModel.DEFAULT_DESCRIPTION,
		            rootUrn,
					team,
				} = {}) {
		super();
		this._id = id;
		this._name = name;
		this._description = description;
		this._rootUrn = rootUrn;
		this._team = team;

		this._rootNodeModel = undefined;  //  created when analysis built by user. ControllerIA.buildAnalysisJagNodes(rootUrn);
		                                  //  or when click in analysis library

	};


	// @TODO - Model is pumping out Dispatches in the setters.  Not bad idea - but convention..
	get id() {
		return this._id;
	}

	get name() {
		return this._name;
	}
	set name(name) {
		this._name = name;
		this.dispatchEvent(new CustomEvent('update', { 'detail': { 'id': this._id, 'property': 'name','extra': { 'name': this._name }}}));
	}

	get description() {
		return this._description;
	}
	set description(description) {
		this._description = description;
		this.dispatchEvent(new CustomEvent('update', { 'detail': { 'id': this._id, 'property': 'description','extra': { 'description': this._description }}}));
	}

	get rootUrn() {
		return this._rootUrn;
	}
	set rootUrn(value) {
		this._rootUrn = value;
	}
	get team() {
		return this._team;
	}
	set team(newTeam){
		this._team = newTeam;
	}
	get rootNodeModel() {
		return this._rootNodeModel;
	}
	set rootNodeModel(value) {
		this._rootNodeModel = value;
	}


	findNode(id){
		const searchStack = []
		searchStack.push(this._rootNodeModel)
		while (searchStack.length != 0) {
			let currentNode = searchStack.pop();
			if (currentNode.id == id) {
				return currentNode;
			}
			currentNode.children.forEach(child => searchStack.push(child))
		}
	}


	static async fromJSON(json) {
		const team_id = json.team;
		let teamNode = await StorageService.get(team_id, 'team');
		// if (teamNode == undefined) {
		// 	teamNode = new TeamModel();
		// 	await StorageService.create(teamNode, 'team');
		// }
		json.team = teamNode;
		const newAnalysis = new AnalysisModel(json);
		return newAnalysis;
	}

	toJSON() {

		const json = {
			id: this._id,
			name: this._name,
			description: this._description,
			rootUrn: this._rootUrn,
			team: this._team.id
		};
		return json;
	}

}

AnalysisModel.DEFAULT_NAME = '';
AnalysisModel.DEFAULT_DESCRIPTION = '';
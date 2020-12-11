/**
 * @fileOverview Agent model.
 *
 * @author mvignati
 * @version 0.42
 */

'use strict';

import {UUIDv4} from '../utils/uuid.js';

export default class AgentModel extends EventTarget {

	constructor({ id = UUIDv4(), name = AgentModel.DEFAULT_NAME, assessments = new Map() } = {}) {
		super();
		this._id = id;
		this._name = name;
		this._assessments = assessments;
	}

	static fromJSON(json) {
		const assessments = new Map();
		for (const urn in json.assessments) {
			const value = json.assessments[urn];
			let assessment = undefined;

			if (value == 1) {
				assessment = AgentModel.CAN_DO_PERFECTLY;
			} else if (value == 2) {
				assessment = AgentModel.CAN_DO;
			} else if (value == 3) {
				assessment = AgentModel.CAN_HELP;
			} else if (value == 4) {
				assessment = AgentModel.CANNOT_DO;
			}

			assessments.set(urn, assessment);
		}
		json.assessments = assessments;

		return new AgentModel(json);
	}

	get id() {
		return this._id;
	}

	get name() {
		return this._name;
	}

	set name(name) {
		this._name = name;
		this.dispatchEvent(new CustomEvent('update', { detail: { "id": this._id, "property": "name", "extra": { "name": name }}}));
	}

	setAssessment(urn, assessment) {
		this._assessments.set(urn, assessment);
		this.dispatchEvent(new CustomEvent('update', { detail: { "id": this._id, "property": "assessment", "extra": { "urn": urn, "assessment": assessment }}}));
	}

	assessment(node) {
		if (node.urn === '')
			return undefined;

		return this._assessments.get(node.urn);
	}

	toJSON() {
		let json = {
			id: this._id,
			name: this._name,
			assessments: {}
		};

		for (let assessment of this._assessments.keys()) {
			const symbol = this._assessments.get(assessment);
			let value = 0;

			if (symbol == AgentModel.CAN_DO_PERFECTLY) {
				value = 1;
			} else if (symbol == AgentModel.CAN_DO) {
				value = 2;
			} else if (symbol == AgentModel.CAN_HELP) {
				value = 3;
			} else if (symbol == AgentModel.CANNOT_DO) {
				value = 4;
			}

			json.assessments[assessment] = value;
		}

		return json;
	}
}

AgentModel.CAN_DO_PERFECTLY = Symbol();
AgentModel.CAN_DO = Symbol();
AgentModel.CAN_HELP = Symbol();
AgentModel.CANNOT_DO = Symbol();

AgentModel.DEFAULT_NAME = 'Agent';

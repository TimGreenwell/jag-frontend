/**
 * @fileOverview Agent model.
 *
 * @author mvignati
 * @version 0.14
 */

'use strict';

import {UUIDv4} from '../utils/uuid.js';
import Observable from '../utils/observable.js';

export default class AgentModel extends Observable {

	constructor({ id = UUIDv4(), name = AgentModel.DEFAULT_NAME } = {}) {
		super();
		this._id = id;
		this._name = name;

		this._assessments = new Map();
	}

	get id() {
		return this._id;
	}

	get name() {
		return this._name;
	}

	setAssessment(urn, assessment) {
		this._assessments.set(urn, assessment);
		this.notify('assessment', urn);
	}

	assessment(node) {
		if(node.urn === '')
			return undefined;

		return this._assessments.get(node.urn);
	}

}

AgentModel.CAN_DO_PERFECTLY = Symbol();
AgentModel.CAN_DO = Symbol();
AgentModel.CAN_HELP = Symbol();
AgentModel.CANNOT_DO = Symbol();

AgentModel.DEFAULT_NAME = 'Agent';

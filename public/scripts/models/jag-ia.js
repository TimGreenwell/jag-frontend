/**
 * @fileOverview JAG model.
 *
 * @author mvignati
 * @version 0.14
 */

'use strict';

import JAGService from '../services/jag.js'

export default class JAGModel {

	constructor({ urn, name, description, type, connector, inputs = [], outputs = [], children = [] } = {}) {
		this._urn = urn;
		this._name = name;
		this._description = description;
		this._type = type;
		this._connector = connector;
		this._inputs = inputs;
		this._outputs = outputs;
		this._children = children;
	}

	static fromJSON(json) {
		return new JAGModel(json);
	}

	static async fromURN(urn) {
		const json = await JAGService.get(urn, 'node');
		return JAGModel.fromJSON(json);
	}

	static isValidURN(urn) {
		return urn !== undefined && urn !== '';
	}

	get name() {
		return this._name || '';
	}

	set name(name) {
		this._name = name;
		this.save();
	}

	get urn() {
		return this._urn;
	}

	set urn(urn) {
		this._urn = urn;
		if(this.hasValidURN)
			this.save();
	}

	get hasValidURN() {
		return JAGModel.isValidURN(this._urn);
	}

	get children() {
		return this._children;
	}

	addChild(urn, index = undefined) {
		if(index === undefined)
			this._children.push(urn);
		else
			this._children.splice(index, 0, urn);

		this.save();
	}

	replaceChild(index, old_urn) {
		this._replaceChild(index, old_urn);
	}

	deleteChild(index) {
		this._replaceChild(index);
	}

	save() {
		if(!this.hasValidURN)
			return;

		return JAGService.store(this);
	}

	toJSON() {
		return {
			urn: this._urn,
			name: this._name,
			description: this._description,
			type: this._type,
			connector: this._connector,
			inputs: this._inputs,
			outputs: this._outputs,
			children: this._children
		};
	}

	_replaceChild(index, urn) {
		if(urn === undefined)
			this._children.splice(index, 1);
		else
			this._children.splice(index, 1, urn);

		this.save();
	}

}


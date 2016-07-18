'use strict';

import {UUIDv4} from '../../../node_modules/goblin/src/crypto/uuid.js';

export default class Node {
	constructor({urn, name, desc = ''} = {}) {
		this._id = UUIDv4();
		this._urn = urn;
		this._name = name;
		this._desc = desc;
		this._inputs = new Set();
		this._outputs = new Set();
		this._children = new Map();
		this._bindings = new Set();

		this._parent = undefined;
	}

	set id(id) {
		this._id = id;
	}

	get id() {
		return this._id;
	}

	set urn(urn) {
		this._urn = urn;
	}

	get urn() {
		return this._urn;
	}

	set name(name) {
		this._name = name;
	}

	get name() {
		return this._name;
	}

	set description(description) {
		this._desc = description;
	}

	get description() {
		return this._desc;
	}

	get inputs() {
		return this._inputs;
	}

	get outputs() {
		return this._outputs;
	}

	get children() {
		return this._children;
	}

	get bindings() {
		return this._bindings;
	}

	get parent() {
		return this._parent;
	}

	set parent(node) {
		this._parent = node;
	}

	addInput(input_name) {
		this._inputs.add(input_name);
	}

	addOutput(output_name) {
		this._outputs.add(output_name);
	}

	addChild(child) {
		this._children.set(child.id, child);
		child.parent = this;
	}

	addBinding(binding) {
		console.log(binding);
		this._bindings.add(binding);
	}

	static fromJSON(json_node) {
		const node = new Node({
			urn: json_node.urn,
			name: json_node.name,
			desc: json_node.description
		});

		json_node.inputs.forEach(node.addInput.bind(node));
		json_node.outputs.forEach(node.addOutput.bind(node));

		if(json_node.type === 'goal') {
			json_node.children.forEach(node.addChild.bind(node));
			json_node.bindings.forEach(node.addBinding.bind(node));
		}

		return node;
	}

	toJSON() {
		const json = {
			urn: this._urn,
			name: this._name,
			description: this._desc,
			type: 'goal',
			connector: {
				type: 'and',
				execution: 'sequential'
			},
			inputs: [],
			outputs: [],
			children: [],
			bindings: []
		};

		this._children.forEach(child => {
			json.children.push({
				urn: child.urn,
				id: child.id,
				order: 0
			});
		});

		this._inputs.forEach(input => {
			json.inputs.push(input);
		});

		this._outputs.forEach(output => {
			json.outputs.push(output);
		});

		this._bindings.forEach(binding => {
			json.bindings.push(binding);
		});

		return json;
	}
}
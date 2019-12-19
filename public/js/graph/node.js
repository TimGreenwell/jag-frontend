'use strict';

import {UUIDv4} from '../lib/uuid.js';

export default class GraphNode {
	constructor({urn, name, execution = GraphNode.EXECUTION.NONE, operator = GraphNode.OPERATOR.NONE, desc = ''} = {}) {
		this._id = UUIDv4();
		this._urn = urn;
		this._name = name;
		this._desc = desc;
		this._execution = execution;
		this._operator = operator;
		this._inputs = new Set();
		this._outputs = new Set();
		this._children = new Map();
		this._bindings = new Set();
		this.ordered = undefined;

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

	set execution(type) {
		this._execution = type;
		this._updateOrder();
	}

	get execution() {
		return this._execution;
	}

	set operator(type) {
		this._operator = type;
	}

	get operator() {
		return this._operator;
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

	_updateOrder() {
		// If the execution is sequential, order is taken to be the insertion order in the map.
		this._ordered = this._execution == GraphNode.EXECUTION.PARALLEL ? undefined : Array.from(this._children.keys());
	}

	addInput(input) {
		this._inputs.add(input);
	}

	addOutput(output) {
		this._outputs.add(output);
	}

	addChild(child) {
		this._children.set(child.id, child);
		child.parent = this;
		this._updateOrder();
	}

	removeChild(child) {
		this._children.delete(child.id);
		child.parent = undefined;
		this._updateOrder();
	}

	addBinding(binding) {
		const existing_binding = this.getBinding(binding.consumer.id, binding.consumer.property);

		if(existing_binding !== undefined)
			this._bindings.delete(existing_binding);

		this._bindings.add(binding);

		// Sets the type of the provider's input to the type of the consumer's it's bound to.
		const consumer_node = this.getNodeForId(binding.consumer.id);
		const provider_node = this.getNodeForId(binding.provider.id);

		const consumer_property = consumer_node.getPropertyForName(binding.consumer.property);
		const provider_property = provider_node.getPropertyForName(binding.provider.property);

		provider_property.type = consumer_property.type;
	}

	/**
	 * Check if a binding with the same consumer:property combination already exists
	 */
	hasBinding(consumer_id, consumer_property) {
		const binding = this.getBinding(consumer_id, consumer_property);
		return binding !== undefined;
	}

	/**
	 * Gets a binding for the specified consumer id and property
	 */
	getBinding(consumer_id, consumer_property) {
		for(let binding of this._bindings) {
			if(consumer_id === binding.consumer.id &&
				consumer_property === binding.consumer.property)
				return binding;
		}
		return undefined;
	}

	getNodeForId(id) {
		if(id === 'this')
			return this;

		return this._children.get(id);
	}

	getPropertyForName(property) {
		for(let input of this._inputs) {
			if(input.name == property)
				return input;
		}

		for(let output of this._outputs) {
			if(output.name == property)
				return output;
		}

		return undefined;
	}

	getOrderForId(id) {
		return this._ordered ? this._ordered.indexOf(id) + 1 : 0;
	}

	static fromJSON(json_node) {
		const node = new GraphNode({
			urn: json_node.urn,
			name: json_node.name,
			execution: json_node.execution,
			operator: json_node.operator,
			desc: json_node.description
		});

		json_node.inputs.forEach(node.addInput.bind(node));
		json_node.outputs.forEach(node.addOutput.bind(node));

		if(json_node.type === 'goal') {
			// json_node.children.forEach(node.addChild.bind(node));
			// json_node.bindings.forEach(node.addBinding.bind(node));
		}

		return node;
	}

	toJSON() {
		const json = {
			urn: this._urn,
			name: this._name,
			description: this._desc,
			type: 'node.type.plan',
			connector: {
				execution: this._execution,
				operator: this._operator
			},
			inputs: [],
			outputs: [],
			children: [],
			bindings: []
		};

		this._children.forEach((child, id) => {
			json.children.push({
				urn: child.urn,
				id: child.id,
				order: this.getOrderForId(id)
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

GraphNode.EXECUTION = {
	NONE: 'node.execution.none',
	SEQUENTIAL: 'node.execution.sequential',
	PARALLEL: 'node.execution.parallel'
}

GraphNode.OPERATOR = {
	NONE: 'node.operator.none',
	AND: 'node.operator.and',
	OR: 'node.operator.or'
}


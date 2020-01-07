'use strict';

import {UUIDv4} from '../lib/uuid.js';

export default class GraphNode extends EventTarget {
	constructor({urn, name, execution = GraphNode.EXECUTION.NONE, operator = GraphNode.OPERATOR.NONE, desc = ''} = {}) {
		super();
		this._id = UUIDv4();
		this._urn = urn;
		this._name = name;
		this._desc = desc;
		this._execution = execution;
		this._operator = operator;
		this._inputs = new Set();
		this._outputs = new Set();
		this._children = new Array();
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

	set execution(type) {
		this._execution = type;
		this.dispatchEvent(new Event('update-execution'));
	}

	get execution() {
		return this._execution;
	}

	set operator(type) {
		this._operator = type;
		this.dispatchEvent(new Event('update-operator'));
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
		this.dispatchEvent(new Event('update-parent'));
	}

	addInput(input) {
		this._inputs.add(input);
		this.dispatchEvent(new Event('update-input'));
	}

	addOutput(output) {
		this._outputs.add(output);
		this.dispatchEvent(new Event('update-output'));
	}

	addChild(child) {
		this._children.push(child);
		child.parent = this;
		this.dispatchEvent(new Event('update-children'));
	}

	removeChild(child) {
		this._children = this._children.filter((c) => {
			let ret = c.id !== child.id;
			if (!ret) c.parent = undefined;
			return ret;
		});
		this.dispatchEvent(new Event('update-children'));
	}

	inputsTo(id) {
		let availableInputs = Array.from(this._inputs).map((input) => {
			let suffix = this._execution == GraphNode.EXECUTION.SEQUENTIAL ? '(P)' : '';

			return {
				name: this._name + suffix,
				id: this._id,
				property: input.name
			};
		});

		if (this._execution == GraphNode.EXECUTION.SEQUENTIAL)
		{
			for (let i = 0; i < this._children.length; ++i) {
				if (this._children[i].id == id)
					break;

				this._children[i].outputsFrom().forEach(output => availableInputs.push(output));
			}
		}

		return availableInputs;
	}

	outputsFrom() {
		let suffix = '';
		if (this._parent)
			if (this._parent.execution == GraphNode.EXECUTION.SEQUENTIAL)
				suffix = '(' + this._parent.getOrderForId(this._id) + ')';

		return Array.from(this._outputs).map((output) => {
			return {
				name: this._name + suffix,
				id: this._id,
				property: output.name
			}
		});
	}

	addBinding(binding) {
		if (binding.consumer.id == this.id)
			binding.consumer.id = "this";

		if (binding.provider.id == this.id)
			binding.provider.id = "this";

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

		this.dispatchEvent(new Event('update-bindings'));
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

	bindingsFor(id) {
		return Array.from(this._bindings).map(binding => {
			console.log(binding);
			if (binding.consumer.id == "this")
				binding.consumer.id = this._id;

			if (binding.provider.id == "this")
				binding.provider.id = this._id;

			return binding;
		}).filter(binding => id === binding.consumer.id || id === binding.provider.id);
	}

	getNodeForId(id) {
		if(id === 'this')
			return this;

		for(let child of this._children)
			if (child.id == id)
				return child;
		
		return undefined;
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
		if (this._execution == GraphNode.EXECUTION.PARALLEL) return 0;

		for (let i = 0; i < this._children.length; ++i) {
			if (this._children[i].id === id) {
				return i + 1;
			}
		}
		
		return 0;
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
				id: child.id
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


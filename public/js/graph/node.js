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
		this._inputs = new Array();
		this._outputs = new Array();
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
		this.dispatchEvent(new Event('update-name'));
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
		this._inputs.push(input);
		this.dispatchEvent(new Event('update-input'));
	}

	addOutput(output) {
		this._outputs.push(output);
		this.dispatchEvent(new Event('update-output'));
	}

	addChild(child) {
		this._children.push(child);
		child.parent = this;
		this.dispatchEvent(new Event('update-children'));
	}

	removeChild(child) {
		for (let index in this._children) {
			if (this._children[index].id == child.id) {
				this._children.splice(index, 1);
				break;
			}
		}

		for (let binding of this._bindings)
			if (binding.provider.id == child.id || binding.consumer.node.id == child.id)
				this._bindings.delete(binding);

		this.dispatchEvent(new Event('update-children'));
	}

	inputsTo(id) {
		let availableInputs = this._inputs.map((input) => {
			return {
				node: this,
				property: input.name
			};
		});

		if (this._execution == GraphNode.EXECUTION.SEQUENTIAL)
		{
			for (let i = 0; i < this._children.length; ++i) {
				if (this._children[i].id == id)
					break;

				let child_outputs = this._children[i].outputsFrom();

				for (let child_output of child_outputs)
					availableInputs.push(child_output);
			}
		}

		return availableInputs;
	}

	outputsFrom() {
		return this._outputs.map((output) => {
			return {
				node: this,
				property: output.name
			};
		})
	}

	getAvailableInputs() {
		return this._parent.inputsTo(this._id);
	}

	getAvailableOutputs() {
		let availableOutputs = [];

		for (let child of this._children) {
			let child_outputs = child.outputsFrom();

			for (let child_output of child_outputs) {
				availableOutputs.push(child_output);
			}
		}

		return availableOutputs;
	}

	addInputBinding(input_name, provider_node, provider_input_name) {
		this._parent.addBinding({
			consumer: {
				node: this,
				property: input_name
			},
			provider: {
				node: provider_node,
				property: provider_input_name
			}
		});
	}

	addOutputBinding(output_name, provider_node, provider_output_name) {
		this.addBinding({
			consumer: {
				node: this,
				property: output_name
			},
			provider: {
				node: provider_node,
				property: provider_output_name
			}
		});
	}

	addBinding(binding) {
		const existing_binding = this.getBinding(binding.consumer.node.id, binding.consumer.property);

		if(existing_binding !== undefined)
			this._bindings.delete(existing_binding);

		this._bindings.add(binding);

		// Sets the type of the provider's input to the type of the consumer's it's bound to.
		const consumer_node = this.getNodeForId(binding.consumer.node.id);
		const provider_node = this.getNodeForId(binding.provider.node.id);

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
			if(consumer_id === binding.consumer.node.id &&
				consumer_property === binding.consumer.property)
				return binding;
		}
		return undefined;
	}

	getBindings() {
		let this_bindings = this.bindingsFor(this._id);

		if (this._parent)
			return this_bindings.concat(this._parent.bindingsFor(this._id));
		
		return this_bindings;
	}

	bindingsFor(id) {
		let bindings_for = [];

		for (let binding of this._bindings) {
			if (id == binding.consumer.node.id || id == binding.provider.node.id) {
				bindings_for.push(binding);
			}
		}

		return binding;
	}

	getNodeForId(id) {
		if(id === 'this' || id == this._id)
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


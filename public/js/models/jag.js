/**
 * @file JAG model.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.2
 */

import {UUIDv4} from '../utils/uuid.js';

export default class JAG extends EventTarget {

	constructor({ urn, name, execution = JAG.EXECUTION.NONE, operator = JAG.OPERATOR.NONE, description = '', id = undefined, inputs = undefined, outputs = undefined, children = undefined, bindings = undefined }) {
		super();

		// Generate a UUID if one is not provided, i.e. we are creating a new instance of a JAG.
		// TODO: Remove UUID as inherent property of model
		this._id = id ? id : UUIDv4();

		// All string properties can be copied.
		this._urn = urn;
		this._name = name;
		this._description = description;
		this._execution = execution;
		this._operator = operator;

		// Copy each array (inputs, outputs and children) for the instance if provided, else create a new array.
		this._inputs = inputs ? [...inputs] : new Array();
		this._outputs = outputs ? [...outputs] : new Array();
		this._children = children ? [...children] : new Array();

		// Copy bindings for the instance if provided, else create a new set.
		this._bindings = new Set(bindings);

		// Leave the parent undefined; if generating as a child of an existing JAG, the parent will be set during construction of the whole graph.
		this._parent = undefined;
	}

	// TODO: Remove ID setter
	set id(id) {
		this._id = id;
	}

	// TODO: Remove ID getter
	get id() {
		return this._id;
	}

	set urn(urn) {
		this._urn = urn;
		this.dispatchEvent(new Event('update-urn'));
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
		this._descripition = description;
		this.dispatchEvent(new Event('update-description'));
	}

	get description() {
		return this._description;
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
		// TODO: push as object with {id: UUIDv4(), model: child}
		this._children.push(child);
		child.parent = this;
		this.dispatchEvent(new Event('update-children'));
	}

	// TODO: require UUID string and child pair to remove properly
	removeChild(child) {
		for (let index in this._children) {
			if (this._children[index].id == child.id) {
				this._children.splice(index, 1);
				break;
			}
		}

		for (let binding of this._bindings)
			if (binding.provider.node.id == child.id || binding.consumer.node.id == child.id)
				this.removeBinding(binding);
		
		child.parent = undefined;

		this.dispatchEvent(new Event('update-children'));
	}

	inputsTo(id) {
		let availableInputs = this._inputs.map((input) => {
			return {
				node: this,
				property: input.name
			};
		});

		if (this._execution == JAG.EXECUTION.SEQUENTIAL)
		{
			for (let i = 0; i < this._children.length; ++i) {
				if (this._children[i].id == id)
					break;

				let child_outputs = this._children[i].outputsFrom();

				// TODO: add child id to child_output for bindings
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

	// TODO: combine #addInputBinding and #addOutputBinding into one function to call
	
	addInputBinding(input_name, provider_node, provider_input_name) {
		// TODO: add node id to consumer/provider
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
		// TODO: add node id to consumer/provider
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

		return bindings_for;
	}

	removeBinding(binding) {
		return this._bindings.delete(binding);
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
		if (this._execution == JAG.EXECUTION.PARALLEL) return 0;

		for (let i = 0; i < this._children.length; ++i) {
			if (this._children[i].id === id) {
				return i + 1;
			}
		}

		return 0;
	}

	static fromJSON(jag_description) {
		return new JAG(jag_description);
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

		this._children.forEach((child) => {
			json.children.push({
				urn: child.model.urn,
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

JAG.EXECUTION = {
	NONE: 'node.execution.none',
	SEQUENTIAL: 'node.execution.sequential',
	PARALLEL: 'node.execution.parallel'
}

JAG.OPERATOR = {
	NONE: 'node.operator.none',
	AND: 'node.operator.and',
	OR: 'node.operator.or'
}


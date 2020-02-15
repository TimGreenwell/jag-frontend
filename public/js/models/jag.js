/**
 * @file JAG model.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.2
 */

import {UUIDv4} from '../utils/uuid.js';

export default class JAG extends EventTarget {

	constructor({ urn, name, connector = { execution: JAG.EXECUTION.NONE, operator: JAG.OPERATOR.NONE }, description = '', inputs = undefined, outputs = undefined, children = undefined, bindings = undefined }) {
		super();

		// All string properties can be copied.
		this._urn = urn;
		this._name = name;
		this._description = description;
		this._execution = connector.execution;
		this._operator = connector.operator;

		// Copy each array (inputs, outputs and children) for the instance if provided, else create a new array.
		this._inputs = inputs ? [...inputs] : new Array();
		this._outputs = outputs ? [...outputs] : new Array();
		this._children = children ? [...children] : new Array();

		// Copy bindings for the instance if provided, else create a new set.
		this._bindings = new Set(bindings);

		// Leave the parent undefined; if generating as a child of an existing JAG, the parent will be set during construction of the whole graph.
		this._parent = undefined;
	}

	get urn() {
		return this._urn;
	}

	set name(name) {
		this._name = name;
		this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "name" } }));
	}

	get name() {
		return this._name;
	}

	set execution(type) {
		this._execution = type;
		this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "execution" } }));
	}

	get execution() {
		return this._execution;
	}

	set operator(type) {
		this._operator = type;
		this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "operator" } }));
	}

	get operator() {
		return this._operator;
	}

	set description(description) {
		this._description = description;
		this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "description" } }));
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
		this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "parent" } }));
	}

	addInput(input) {
		this._inputs.push(input);
		this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "input" } }));
	}

	addOutput(output) {
		this._outputs.push(output);
		this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "output" } }));
	}

	addChild(child, id = undefined) {
		child.parent = this;

		if (id == undefined) {
			this._children.push({
				id: id = UUIDv4(),
				urn: child.urn,
				model: child
			});

			this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "children" } }));
		}

		return id;
	}

	removeChild(child) {
		for (let index in this._children) {
			if (this._children[index].id == child.id) {
				this._children.splice(index, 1);
				break;
			}
		}

		for (let binding of this._bindings)
			if (binding.provider.id == child.id || binding.consumer.id == child.id)
				this.removeBinding(binding);
		
		child.parent = undefined;

		this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "children" } }));
	}

	inputsTo(model) {
		let availableInputs = this._inputs.map((input) => {
			return {
				id: 'this',
				model: this,
				property: input.name
			};
		});

		if (this._execution == JAG.EXECUTION.SEQUENTIAL)
		{
			for (let i = 0; i < this._children.length; ++i) {
				if (this._children[i].model == model)
					break;

				let child_outputs = this._children[i].model.outputsFrom();

				for (let child_output of child_outputs) {
					child_output.id = this._children[i].id;
					availableInputs.push(child_output);
				}
			}
		}

		return availableInputs;
	}

	outputsFrom() {
		return this._outputs.map((output) => {
			return {
				model: this,
				property: output.name
			};
		})
	}

	getAvailableInputs() {
		return this._parent.inputsTo(this);
	}

	getAvailableOutputs() {
		let availableOutputs = [];

		for (let child of this._children) {
			if (child.model) {
				let child_outputs = child.model.outputsFrom();

				for (let child_output of child_outputs) {
					child_output.id = child.id;
					availableOutputs.push(child_output);
				}
			}
		}

		return availableOutputs;
	}

	createBinding(property_name, provider_node, provider_property_name) {
		this._parent.addBinding({
			consumer: {
				model: this,
				property: property_name
			},
			provider: {
				model: provider_node,
				property: provider_property_name
			}
		});
	}

	addBinding(binding) {
		if (binding.provider.model == this) {
			binding.provider.id = 'this';
		} else {
			for (let child of this._children) {
				if (binding.provider.model == child.model) {
					binding.provider.id = child.id;
				}
			}
		}

		if (binding.consumer.model == this) {
			binding.consumer.id = 'this';
		} else {
			for (let child of this._children) {
				if (binding.consumer.model == child.model) {
					binding.consumer.id = child.id;
				}
			}
		}

		const existing_binding = this.getBinding(binding.consumer.id, binding.consumer.property);

		if(existing_binding !== undefined)
			this._bindings.delete(existing_binding);

		this._bindings.add(binding);

		this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "bindings" } }));
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

	getBindings() {
		let this_bindings = this.bindingsFor(this);

		if (this._parent)
			return this_bindings.concat(this._parent.bindingsFor(this));
		
		return this_bindings;
	}

	bindingsFor(model) {
		let bindings_for = [];

		for (let binding of this._bindings) {
			if (model == binding.consumer.model || model == binding.provider.model) {
				bindings_for.push(binding);
			}
		}

		return bindings_for;
	}

	removeBinding(binding) {
		return this._bindings.delete(binding);
	}

	getNodeForId(id) {
		if(id === 'this')// || id == this._id)
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
			description: this._description,
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

	copied(urn) {
		this.dispatchEvent(new CustomEvent('copy', {"detail": { "urn": urn }}));
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


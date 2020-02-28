/**
 * @file JAG model.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.2
 */

import {UUIDv4} from '../utils/uuid.js';

export default class JAG extends EventTarget {

	constructor({ urn, name, connector = { execution: JAG.EXECUTION.NONE, operator: JAG.OPERATOR.NONE }, description = '', inputs = undefined, outputs = undefined, children = undefined, bindings = undefined, editable = true }) {
		super();

		// All string properties can be copied.
		this._urn = urn;
		this._name = name;
		this._description = description;
		this._execution = connector.execution;
		this._operator = connector.operator;
		this._editable = editable;

		// Copy each array (inputs, outputs and children) for the instance if provided, else create a new array.
		this._inputs = inputs ? [...inputs] : new Array();
		this._outputs = outputs ? [...outputs] : new Array();
		this._children = children ? [...children] : new Array();

		// Copy bindings for the instance if provided, else create a new set.
		this._bindings = new Set(bindings);
	}

	get urn() {
		return this._urn;
	}

	set name(name) {
		if (this._name != name) {
			if (this._editable) {
				this._name = name;
				this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "name" } }));
			} else {
				throw new Error("Cannot edit name of an uneditable node!");
			}
		}
	}

	get name() {
		return this._name;
	}

	set execution(type) {
		if (this._execution != type) {
			if (this._editable) {
				this._execution = type;
				this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "execution" } }));
			} else {
				throw new Error("Cannot edit operator of an uneditable node!");
			}
		}
	}

	get execution() {
		return this._execution;
	}

	set operator(type) {
		if (this._operator != type) {
			if (this._editable) {
				this._operator = type;
				this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "operator" } }));
			} else {
				throw new Error("Cannot edit operator of an uneditable node!");
			}
		}
	}

	get operator() {
		return this._operator;
	}

	set description(description) {
		if (this._description != description) {
			if (this._editable) {
				this._description = description;
				this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "description" } }));
			} else {
				throw new Error("Cannot edit description of an uneditable node!");
			}
		}
	}

	get description() {
		return this._description;
	}

	get inputs() {
		return [...this._inputs];
	}

	get outputs() {
		return [...this._outputs];
	}

	get children() {
		return [...this._children];
	}

	get bindings() {
		return [...this._bindings];
	}

	set editable(editable) {
		if (window.confirm("Warning: enabling editing on this node will allow any modifications to its properties. If this node is missing a definition, this will create collisions when an existing definition is found. Are you sure you want to enable editing?")) {
			this._editable = editable;
		}
	}

	get editable() {
		return this._editable;
	}

	addInput(input) {
		if (this._editable) {
			this._inputs.push(input);
			this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "input" } }));
		} else {
			throw new Error("Cannot edit inputs of an uneditable node!");
		}
	}

	addOutput(output) {
		if (this._editable) {
			this._outputs.push(output);
			this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "output" } }));
		} else {
			throw new Error("Cannot edit outputs of an uneditable node!");
		}
	}

	addChild(child, id = undefined) {
		if (this._editable) {
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
		} else {
			throw new Error("Cannot edit children of an uneditable node!");
		}
	}

	removeChild(child) {
		if (this._editable) {
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
		} else {
			throw new Error("Cannot edit children of an uneditable node!");
		}
	}

	inputsTo(id) {
		let availableInputs = this._inputs.map((input) => {
			return {
				id: 'this',
				model: this,
				property: input.name,
				type: input.type
			};
		});

		if (this._execution == JAG.EXECUTION.SEQUENTIAL)
		{
			for (let child of this._children) {
				if (child.id == id)
					break;

				let child_outputs = child.model.outputs;

				for (let child_output of child_outputs) {
					availableInputs.push({
						id: child.id,
						model: child.model,
						property: child_output.name,
						type: child_output.type
					});
				}
			}
		}

		return availableInputs;
	}

	getAvailableInputs() {
		let availableInputs = [];

		for (let child of this._children) {
			if (child.model) {
				let child_inputs = child.model.inputs;

				for (let child_input of child_inputs) {
					availableInputs.push({
						id: child.id,
						model: child.model,
						property: child_input.name,
						type: child_input.type
					});
				}
			}
		}

		return availableInputs;
	}

	getAvailableOutputs() {
		let availableOutputs = [];

		for (let child of this._children) {
			if (child.model) {
				let child_outputs = child.model.outputs;

				for (let child_output of child_outputs) {
					availableOutputs.push({
						id: child.id,
						model: child.model,
						property: child_output.name,
						type: child_output.type
					});
				}
			}
		}

		return availableOutputs;
	}

	addBinding(binding) {
		if (this._editable) {
			if (binding.provider.id == undefined) {
				if (binding.provider.model == this) {
					binding.provider.id = 'this';
				} else {
					for (let child of this._children) {
						if (binding.provider.model == child.model) {
							binding.provider.id = child.id;
							break;
						}
					}
				}
			}
	
			if (binding.consumer.id == undefined) {
				if (binding.consumer.model == this) {
					binding.consumer.id = 'this';
				} else {
					for (let child of this._children) {
						if (binding.consumer.model == child.model) {
							binding.consumer.id = child.id;
							break;
						}
					}
				}
			}
	
			const existing_binding = this.getBinding(binding.consumer.id, binding.consumer.property);
	
			if(existing_binding !== undefined)
				this._bindings.delete(existing_binding);
	
			this._bindings.add(binding);
	
			this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "bindings" } }));
		} else {
			throw new Error("Cannot edit bindings of an uneditable node!");
		}
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

	removeBinding(binding) {
		if (this._editable) {
			return this._bindings.delete(binding);
		} else {
			throw new Error("Cannot edit bindings of an uneditable node!");
		}
	}

	getNodeForId(id) {
		if (id === 'this')// || id == this._id)
			return this;

		for (let child of this._children)
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
			json.bindings.push({
				consumer: {
					id: binding.consumer.id,
					property: binding.consumer.property
				},
				provider: {
					id: binding.provider.id,
					property: binding.provider.property
				}
			});
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

JAG.UNDEFINED = (urn) => new JAG({
	urn: urn,
	name: "Undefined",
	description: "Node definition not found.",
	editable: false
});
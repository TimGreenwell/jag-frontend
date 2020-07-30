/**
 * @file JAG model.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.83
 */

import {UUIDv4} from '../utils/uuid.js';

/**
 * Joint Activity Graph (JAG) model.
 *
 * @class
 * @constructor
 * @public
 */
export default class JAG extends EventTarget {

	constructor({ urn, name, connector = { execution: JAG.EXECUTION.NONE, operator: JAG.OPERATOR.NONE }, description = '', inputs = undefined, outputs = undefined, children = undefined, bindings = undefined }) {
		super();

		// All string properties can be copied.
		/**
		 * @name JAG#urn
		 * @type {String}
		 * @default undefined
		 */
		this._urn = urn;

		/**
		 * @name JAG#name
		 * @type {String}
		 * @default undefined
		 */
		this._name = name;

		/**
		 * @name JAG#description
		 * @type {String}
		 * @default ''
		 */
		this._description = description;

		/**
		 * @name JAG#execution
		 * @type {String}
		 * @default JAG.EXECUTION.NONE
		 */
		this._execution = connector.execution;

		/**
		 * @name JAG#operator
		 * @type {String}
		 * @default JAG.OPERATOR.NONE
		 */
		this._operator = connector.operator;

		// Copy each array (inputs, outputs and children) for the instance if provided, else create a new array.
		this._inputs = inputs ? [...inputs] : new Array();
		this._outputs = outputs ? [...outputs] : new Array();
		this._children = children ? [...children] : new Array();

		for (let child of this._children) {
			if (child.annotations) {
				const annotations = new Map();

				for (let annotation in child.annotations) {
					annotations.set(annotation, child.annotations[annotation]);
				}

				child.annotations = annotations;
			}
		}

		// Copy bindings for the instance if provided, else create a new set.
		this._bindings = new Set(bindings);
	}

	static fromJSON(json) {
		const {
			'urn': urn,
			'name': name,
			'connector': connector,
			'description': description,
			'inputs': inputs,
			'outputs': outputs,
			'children': children,
			'bindings': bindings,
		} = json;

		try {
			if (!urn)
				throw new Error(`Must have a URN string of valid format.`);

			if (typeof urn !== "string")
				throw new Error(`URN must be a string of valid format.`);

			if (urn.match(/^[a-z0-9:-]+$/) == null)
				throw new Error('URN must be a valid format.');

			if (!name)
				throw new Error(`Must have a name string.`);

			if (typeof name !== "string")
				throw new Error(`Name must be a string.`);

			if (name.length == 0)
				throw new Error(`Name must be at least 1 character.`);

			if (description !== undefined)
				if (typeof description !== "string")
					throw new Error(`Description must be a string.`);

			if (connector == undefined)
				throw new Error(`Must have a connector object with execution and operator types.`);

			if (connector.execution == undefined)
				throw new Error(`Connector must have execution and operator types.`);

			if (typeof connector.execution !== "string")
				throw new Error(`Connector must have an execution type which is a string.`);

			if (connector.execution.length == 0)
				throw new Error(`Connector execution type must be at least 1 character.`);

			if (connector.operator == undefined)
				throw new Error(`Connector must have operator type.`);

			if (typeof connector.operator !== "string")
				throw new Error(`Connector must have an operator type which is a string.`);

			if (connector.operator.length == 0)
				throw new Error(`Connector execution type must be at least 1 character.`);

			if (Object.keys(connector).length !== 2)
				throw new Error(`Connector contains unknown properties: only accepts execution and operator types.`);

			if (inputs !== undefined) {

				if (!(inputs instanceof Array))
					throw new Error(`Expected inputs to be an array of objects.`);

				for (let i = 0; i < inputs.length; ++i) {
					const input = inputs[i];

					if (input == undefined)
						throw new Error(`Input ${i} must be an object with name and type strings.`);

					if (input.name == undefined)
						throw new Error(`Input ${i} does not have a name.`);

					if (typeof input.name !== "string")
						throw new Error(`Input ${i} must have a name which is a string.`);

					if (input.name.length == 0)
						throw new Error(`Input ${i} must have a name at least 1 character long.`);

					if (input.type == undefined)
						throw new Error(`Input ${i} (${input.name}) does not have a type.`);

					if (typeof input.type !== "string")
						throw new Error(`Input ${i} (${input.name}) must have a type which is a string.`);

					if (input.type.length == 0)
						throw new Error(`Input ${i} (${input.name}) must have a type at least 1 character long.`);

					if (Object.keys(input).length !== 2)
						throw new Error(`Input ${i} (${input.name}) contains unknown properties: only accepts name and type strings.`);
				}

			}

			if (outputs !== undefined) {

				if (!(outputs instanceof Array))
					throw new Error(`Expected outputs to be an array of objects.`);

				for (let i = 0; i < outputs.length; ++i) {
					const output = outputs[i];

					if (output == undefined)
						throw new Error(`Output ${i} must be an object with name and type strings.`);

					if (output.name == undefined)
						throw new Error(`Output ${i} does not have a name.`);

					if (typeof output.name !== "string")
						throw new Error(`Output ${i} must have a name which is a string.`);

					if (output.name.length == 0)
						throw new Error(`Output ${i} must have a name at least 1 character long.`);

					if (output.type == undefined)
						throw new Error(`Output ${i} (${output.name}) does not have a type.`);

					if (typeof output.type !== "string")
						throw new Error(`Output ${i} (${output.name}) must have a type which is a string.`);

					if (output.type.length == 0)
						throw new Error(`Output ${i} (${output.name}) must have a type at least 1 character long.`);

					if (Object.keys(output).length !== 2)
						throw new Error(`Output ${i} (${output.name}) contains unknown properties: only accepts name and type strings.`);
				}

			}

			if (children !== undefined) {

				if (!(children instanceof Array))
					throw new Error(`Expected children to be an array of objects.`);

				for (let i = 0; i < children.length; ++i) {
					const child = children[i];

					if (child == undefined)
						throw new Error(`Child ${i} must be an object with URN, UUID, and optional contextual name and description strings.`);

					if (child.urn == undefined)
						throw new Error(`Child ${i} must have a URN string.`);

					if (typeof child.urn !== "string")
						throw new Error(`Child ${i} must have a URN which is a string.`);

					if (child.urn.length == 0)
						throw new Error(`Child ${i} must have a URN string with at least 1 character.`);

					if (child.id == undefined)
						throw new Error(`Child ${i} does not have a UUID specified.`);

					if (typeof child.id !== "string")
						throw new Error(`Child ${i} must have a UUID which is a string.`);

					if (!child.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/))
						throw new Error(`Child ${i} must have an id which is a v4 UUID conforming string.`);

					let opt_params = 0;

					if (child.annotations) {
						if (child.annotations.constructor != Object)
							throw new Error(`Child ${i} may only have an annotations which is an object.`);

						opt_params++;
					}

					if (child.name) {
						if (typeof child.name !== "string")
							throw new Error(`Child ${i} may only have a name which is a string.`);

						if (child.name.length == 0)
							throw new Error(`Child ${i} may only have a name string with at least 1 character.`);

						opt_params++;
					}

					if (child.description) {
						if (typeof child.description !== "string")
							throw new Error(`Child ${i} may only have a description which is a string.`);

						if (child.description.length == 0)
							throw new Error(`Child ${i} may only have a description string with at least 1 character.`);

						opt_params++;
					}

					if (Object.keys(child).length !== 2 + opt_params)
						throw new Error(`Child ${i} contains unknown properties: only accepts URN, UUID, optional annotations, and optional contextual name and description strings.`);
				}

			}

			if (bindings !== undefined) {

				if (!(bindings instanceof Array))
					throw new Error(`Expected bindings to be an array of objects.`);

				for (let i = 0; i < bindings.length; ++i) {
					const binding = bindings[i];

					if (binding == undefined)
						throw new Error(`Binding ${i} must be an object with provider and consumer ID and property strings.`);

					if (binding.consumer == undefined)
						throw new Error(`Binding ${i} must have a consumer with ID and property strings.`);

					if (binding.consumer.id == undefined)
						throw new Error(`Binding ${i} must have a ID string for its consumer.`);

					if (typeof binding.consumer.id !== "string")
						throw new Error(`Binding ${i} must have a ID for its consumer which is a string.`);

					if (!binding.consumer.id.match(/^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|any|this)$/))
						throw new Error(`Binding ${i} must have an id for its consumer which is a v4 UUID conforming string, "any" or "this".`);

					if (binding.consumer.property == undefined)
						throw new Error(`Binding ${i} must have a property string for its consumer.`);

					if (typeof binding.consumer.property !== "string")
						throw new Error(`Binding ${i} must have a property for its consumer which is a string.`);

					if (binding.consumer.property.length == 0)
						throw new Error(`Binding ${i} must have a property string for its consumer which is at least 1 character.`);

					if (Object.keys(binding.consumer).length !== 2)
						throw new Error(`Binding ${i} has a consumer with unknown properties: only accepts ID and property strings.`);

					if (binding.provider == undefined)
						throw new Error(`Binding ${i} must have a provider with ID and property strings.`);

					if (binding.provider.id == undefined)
						throw new Error(`Binding ${i} must have a ID string for its provider.`);

					if (typeof binding.provider.id !== "string")
						throw new Error(`Binding ${i} must have a ID for its provider which is a string.`);

					if (!binding.provider.id.match(/^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|any|this)$/))
						throw new Error(`Binding ${i} must have an id for its provider which is a v4 UUID conforming string, "any" or "this".`);

					if (binding.provider.property == undefined)
						throw new Error(`Binding ${i} must have a property string for its provider.`);

					if (typeof binding.provider.property !== "string")
						throw new Error(`Binding ${i} must have a property for its provider which is a string.`);

					if (binding.provider.property.length == 0)
						throw new Error(`Binding ${i} must have a property string for its provider which is at least 1 character.`);

					if (Object.keys(binding.provider).length !== 2)
						throw new Error(`Binding ${i} has a provider with unknown properties: only accepts ID and property strings.`);

					if (Object.keys(binding).length !== 2)
						throw new Error(`Binding ${i} has unknown properties: only accepts provider and consumer with ID and property strings.`);
				}
			}
		} catch (e) {
			throw new Error(`Error parsing ${urn}: ${e.message}`);
		}

		return new JAG(json);
		// @TODO: explode the json definition to use the constructor below
		//return new JAG(urn, name, connector, inputs, outputs, children, bindings);
	}

	get urn() {
		return this._urn;
	}

	set name(name) {
		if (this._name != name) {
			this._name = name;
			this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "name", "extra": { "name": this._name } } }));
		}
	}

	get name() {
		return this._name;
	}

	set execution(type) {
		if (this._execution != type) {
			this._execution = type;
			this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "execution", "extra": { "execution": this._execution, "children": this._children } } }));
		}
	}

	get execution() {
		return this._execution;
	}

	set operator(type) {
		if (this._operator != type) {
			this._operator = type;
			this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "operator", "extra": { "operator": this._operator } } }));
		}
	}

	get operator() {
		return this._operator;
	}

	set description(description) {
		if (this._description != description) {
			this._description = description;
			this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "description", "extra": { "description": this._description } } }));
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

	/**
	 * Adds the given input to the inputs of this JAG.
	 * Dispatches an update.
	 *
	 * @param {{name:String,type:String}} input Input to add.
	 */
	addInput(input) {
		this._inputs.push(input);
		this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "inputs", "extra": { "inputs": this._inputs } } }));
	}

	/**
	 * Adds the given output to the outputs of this JAG.
	 * Dispatches an update.
	 *
	 * @param {{name:String,type:String}} output Output to add.
	 */
	addOutput(output) {
		this._outputs.push(output);
		this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "outputs", "extra": { "outputs": this._outputs } } }));
	}

	/**
	 * Adds the given JAG as a child to this JAG.
	 * If an ID already exists, the child already exists, and this was likely called
	 * during creation of a graphical edge for the child of an existing JAG; the call
	 * will be ignored and the given ID will be returned.
	 * Dispatches an update if ID is undefined.
	 *
	 * @param {JAG} child Model to add.
	 * @param {String} id ID for child, if it exists.
	 * @returns {String} UUIDv4 string of the child.
	 */
	addChild(child, id = undefined) {
		if (id == undefined) {
			this._children.push({
				id: id = UUIDv4(),
				urn: child.urn,
				model: child
			});

			this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "children", "extra": { "children": this._children, "operator": this._operator, "execution": this._execution } } }));
		}

		return id;
	}

	/**
	 * Removes the given child from this JAG.
	 * Dispatches an update.
	 *
	 * @param {{id:String,model:JAG}} child Child to remove.
	 */
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

		this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "children", "extra": { "children": this._children, "operator": this._operator, "execution": this._execution } } }));
	}

	/**
	 * Sets the name of the child with the given ID to the given name.
	 *
	 * @param {String} id ID of the child whose name will be set.
	 * @param {String} name Name to set to.
	 */
	setChildName(id, name) {
		for (const child of this._children) {
			if (child.id == id) {
				if (child.name != name) {
					child.name = name;
					this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "children-meta", "extra": { "children": this._children } }}));
				}

				break;
			}
		}
	}

	/**
	 * Sets the description of the child with the given ID to the given description.
	 *
	 * @param {String} id ID of the child whose description will be set.
	 * @param {String} description Description to set to.
	 */
	setChildDescription(id, description) {
		for (const child of this._children) {
			if (child.id == id) {
				if (child.description != description) {
					child.description = description;
					this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "children-meta", "extra": { "children": this._children } }}));
				}

				break;
			}
		}
	}

	/**
	 * Gets the ID, JAG, property name and type of all possible inputs to the child with the given ID.
	 * Includes inputs to this JAG and outputs from sequential children preceding the child with the given ID.
	 *
	 * @param {String} id ID of the child for which to seek inputs.
	 * @returns {Array<{id:String,model:JAG,property:String,type:String}>} Inputs available to the child with the given ID.
	 */
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

				if (child.model) {
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
		}

		return availableInputs;
	}

	/**
	 * Gets the ID, JAG, property name and type of all inputs of children of this JAG.
	 *
	 * @returns {Array<{id:String,model:JAG,property:String,type:String}>} Inputs of children of this JAG.
	 */
	getAvailableInputs() {
		let availableInputs = [];

		for (let child of this._children) {
			if (child.model) {
				if (child.model.inputs.length > 0) {
					availableInputs.push({
						id: child.id,
						model: child.model,
						inputs: child.model.inputs
					});
				}
			}
		}

		return availableInputs;
	}

	/**
	 * Gets the ID, JAG, property name and type of all outputs of children of this JAG.
	 *
	 * @returns {Array<{id:String,model:JAG,property:String,type:String}>} Outputs of children of this JAG.
	 */
	getAvailableOutputs() {
		let availableOutputs = [];

		for (let child of this._children) {
			if (child.model) {
				if (child.model.outputs.length > 0) {
					availableOutputs.push({
						id: child.id,
						model: child.model,
						outputs: child.model.outputs
					});
				}
			}
		}

		return availableOutputs;
	}

	/**
	 * Gets the child of this JAG with the given ID.
	 *
	 * @param {String} id
	 * @returns {{id:String,model:JAG}} Child of this JAG with the given ID.
	 */
	getCanonicalNode(id) {
		if (id === 'this')
			return { id: 'this', model: this };

		for (let child of this._children)
			if (child.id == id)
				return child;

		return undefined;
	}

	/**
	 * Adds the given binding to the bindings of this JAG.
	 * Will remove an existing binding with the same consumer.
	 * Dispatches an update.
	 *
	 * @param {{provider:{id:String,property:String},consumer:{id:String,property:String}}} binding Binding to add.
	 */
	addBinding(binding) {
		const existing_binding = this.getBinding(binding.consumer.id, binding.consumer.property);

		if (existing_binding !== undefined)
			this._bindings.delete(existing_binding);

		this._bindings.add(binding);

		this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "bindings", "extra": { "bindings": this._bindings } } }));
	}

	/**
	 * Check if a binding exists for the given consumer ID and property.
	 *
	 * @param {String} consumer_id The ID to seek.
	 * @param {String} consumer_property The property to seek.
	 * @returns {boolean} Whether or not a binding exists for the given consumer ID and property.
	 */
	hasBinding(consumer_id, consumer_property) {
		const binding = this.getBinding(consumer_id, consumer_property);
		return binding !== undefined;
	}

	/**
	 * Gets a binding for the given consumer ID and property.
	 *
	 * @param {String} consumer_id ID of the consumer for the binding to be returned.
	 * @param {String} consumer_property Name of the consumer property for the binding to be returned.
	 * @returns {{provider:{id:String,property:String},consumer:{id:String,property:String}}|undefined} Binding for the given consumer ID and property, or undefined if none exists.
	 */
	getBinding(consumer_id, consumer_property) {
		for(let binding of this._bindings) {
			if(consumer_id === binding.consumer.id &&
				consumer_property === binding.consumer.property)
				return binding;
		}
		return undefined;
	}

	/**
	 * Removes the provided binding from this node.
	 *
	 * @param {{provider:{id:String,property:String},consumer:{id:String,property:String}}} binding The binding to remove.
	 */
	removeBinding(binding) {
		if (this._bindings.delete(binding)) {
			this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "bindings", "extra": { "bindings": this._bindings } } }));
		}
	}

	/**
	 * Adds the given annotation with name and value to the given child JAG.
	 * Dispatches an update.
	 *
	 * @param {String} id UUID of the child to which to add the annotation.
	 * @param {String} name Key name for the new annotation.
	 * @param {String} value Value for the new annotation.
	 */
	addAnnotation(id, name, value) {
		const child = this.getCanonicalNode(id);

		if (!(child == undefined || child.model == this)) {
			if (!child.annotations || !child.annotations.has(name) || child.annotations.get(name) != value) {
				if (!child.annotations) child.annotations = new Map();
				child.annotations.set(name, value);
				this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "annotations", "extra": { "id": id, "annotations": child.annotations, "iterable": child.iterable } }}));
			}
		}
	}

	/**
	 * Removes the annotation with the given name from the child JAG of the given ID.
	 * Dispatches an update.
	 *
	 * @param {String} id UUID of the child from which to remove the annotation.
	 * @param {String} name Key name for the annotation to delete.
	 */
	removeAnnotation(id, name) {
		const child = this.getCanonicalNode(id);

		if (!(child == undefined || child.model == this)) {
			if (!child.annotations) return;

			if (child.annotations.has(name)) {
				child.annotations.delete(name);
				this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "annotations", "extra": { "id": id, "annotations": child.annotations, "iterable": child.iterable } }}));
			}
		}
	}

	/**
	 * Marks the child with the given ID as iterable with the given value.
	 *
	 * @param {String} id UUID of the child to mark.
	 * @param {boolean} value True or false whether or not the child is iterable.
	 */
	setIterable(id, value) {
		for (const child of this._children) {
			if (child.id == id) {
				if (child.iterable == value) return;
				child.iterable = value;
				this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "annotations", "extra": { "id": id, "annotations": child.annotations, "iterable": child.iterable } } }));
				return;
			}
		}
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
			let descriptor = {
				urn: child.urn,
				id: child.id
			};

			if (child.name) descriptor.name = child.name;
			if (child.description) descriptor.description = child.description;

			if (child.annotations && child.annotations.size > 0) {
				descriptor.annotations = {};

				for (let annotation of child.annotations) {
					descriptor.annotations[annotation[0]] = annotation[1];
				}
			}

			if (child.iterable) {
				descriptor.iterable = true;
			}

			json.children.push(descriptor);
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

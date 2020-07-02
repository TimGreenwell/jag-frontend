/**
 * @file Node properties panel.
 *
 * @author cwilber
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 1.02
 */

import JAG from '../models/jag.js';
import JAGService from '../services/jag.js';
import UndefinedJAG from '../models/undefined.js';

customElements.define('jag-properties', class extends HTMLElement {

	constructor() {
		super();
		this._model = undefined;
		this._input_elements = new Map();
		this._output_elements = new Map();
		this._initUI();
		this._initHandlers();

		this._boundUpdate = function (e) {
			const property = e.detail.property;

			if (property == "bindings" || property == "children" || property == "inputs" || property == "outputs") {
				this._updateIO();
			}

			if (property == "annotations" || property == "children") {
				this._updateAnnotations();
			}
		}.bind(this);

		this._boundDefine = function (e) {
			const model = e.detail.model;

			this._model = model;

			this._updateProperties();
		}.bind(this);
	}

	handleSelectionUpdate(selection) {
		if (this._model)
		{
			if (this._model instanceof UndefinedJAG) {
				this._model.removeEventListener('define', this._boundDefine);
			} else {
				this._model.removeEventListener('update', this._boundUpdate);
			}

			this._node = undefined;
			this._model = undefined;
		}

		this._clearProperties();

		if (selection.size == 1) {
			const firstValue = selection.values().next().value;

			if (firstValue._model) {
				this._node = firstValue;
				this._model = this._node.model;

				this._updateProperties();

				if (this._model instanceof UndefinedJAG) {
					this._model.addEventListener('define', this._boundDefine);
				} else {
					this._model.addEventListener('update', this._boundUpdate);
				}
			}
		} else {
			this._enableProperties(false);
		}
	}

	_updateProperties() {
		this._urn.value = this._model.urn;
		this._name.value = this._model.name;
		this._name_ctx.value = this._node.getContextualName();
		this._execution.value =  this._model.execution || 'none';
		this._operator.value =  this._model.operator || 'none';
		this._desc.value = this._model.description;
		this._desc_ctx.value = this._node.getContextualDescription();

		if (this._model instanceof UndefinedJAG) {
			this._enableProperties(false);
		} else {
			this._enableProperties(true);
			this._updateIO();
			this._updateAnnotations();
		}

		for (const input of this.querySelectorAll("input")) {
			input.title = input.value;
			input.onchange = () => input.title = input.value;
		}
	}

	_addInput(e) {
		if (this._model && !(this._model instanceof UndefinedJAG)) {
			const name = window.prompt('Input name');
			if(name === null)
				return;

			const type = window.prompt('Input type');
			if (type === null)
				return;

			const input = {
				name: name,
				type: type
			};

			this._model.addInput(input);
		}
	}

	_addOutput(e) {
		if (this._model && !(this._model instanceof UndefinedJAG)) {
			const name = window.prompt('Output name');
			if(name === null)
				return;

			const type = window.prompt('Output type');
			if (type === null)
				return;

			const output = {
				name: name,
				type: type
			};

			this._model.addOutput(output);
		}
	}

	_addAnnotation(id) {
		const name = window.prompt('Annotation name');
		if (name === null)
			return;

		let value = window.prompt('Annotation value');
		if (value === null)
			return;

		let parsed = false;

		if (value == "true" || value == "false") {
			const boolean_type = window.confirm('Treat this value as a boolean?');
			if (boolean_type) value = (value == "true");
			parsed = boolean_type;
		} else if (value.match(/^(\+|\-)?[0-9]+(\.[0-9]+)?$/)) {

			if (value.match(/^(\+|\-)?[0-9]+$/)) {
				const integer_type = window.confirm('Treat this value as an integer?');
				if (integer_type) value = parseInt(value);
				parsed = integer_type;
			}

			if (!parsed) {
				const float_type = window.confirm('Treat this value as a floating-point number?');
				if (float_type) value = parseFloat(value);
				parsed = float_type;
			}
		}

		if (!parsed) {
			const json_type = window.confirm('Treat this value as an abstract JSON structure?');

			if (json_type) {
				try {
					value = JSON.parse(value);
				} catch {
					window.alert('Failed to parse value: please try again with a valid JSON string.');
					return;
				}
			}
		}

		this._model.addAnnotation(id, name, value);
	}

	_addInputElement(id, input) {
		const input_el = createPropertyElement(id, input);

		this._inputs.appendChild(input_el);
	}

	_addOutputElement(id, output) {
		const output_el = createPropertyElement(id, output);

		this._outputs.appendChild(output_el);
	}

	_createBindingInputs(options) {
		const select_el = createSelect('binding-inputs', options.map(node => {
			let label = node.id;
			if (node.id != 'this') {
				label = node.model.name;
				const order = this._model.getOrderForId(node.id);
				if (order != 0) {
					label += ` (${order})`;
				}
			}

			return [{
				label: label,
				options: node.inputs.map((input) => {
					return {
						text: input.name,
						value: `${node.id}:${input.name}`
					}
				})
			}];
		}).reduce((c, n) => c.concat(n)));

		select_el.onfocus = function (e) {
			this._previous_value = this.value;
		}.bind(select_el);

		return select_el;
	}

	_createBindingOutputs(options) {
		const select_el = createSelect('binding-outputs', options.map(node => {

			let label = node.id;
			if (node.id != 'this' && node.id != 'any') {
				label = node.model.name;
				const order = this._model.getOrderForId(node.id);
				if (order != 0) {
					label += ` (${order})`;
				}
			}

			return [{
				label: label,
				options: node.outputs.map((output) => {
					return {
						text: output.name,
						value: `${node.id}:${output.name}`
					}
				})
			}];
		}).reduce((c, n) => c.concat(n)));

		select_el.onfocus = function (e) {
			this._previous_value = this.value;
		}.bind(select_el);

		return select_el;
	}

	_findInputOptions() {
		// We can "input" a value into any of this node's children's inputs.
		const options = this._model.getAvailableInputs();

		// We can also "input" a value to this node's outputs.
		if (this._model.outputs.length > 0) {
			options.push({
				id: 'this',
				model: this._model,
				inputs: this._model.outputs
			});
		}

		return options;
	}

	_findOutputOptions() {
		const options = [];

		// We can "output" a value from this node's inputs.
		if (this._model.inputs.length > 0) {
			options.push({
				id: 'this',
				model: this._model,
				outputs: this._model.inputs
			});
		}

		// We can also "output" a value from this node's children's outputs.
		this._model.getAvailableOutputs().forEach(node => options.push(node));

		// We can also opt to accept any output with a matching name based on all available outputs.
		if (this._model.inputs.length > 0 && this._model.children.length > 0) {
			const output_properties = new Set();
			const any_outputs = new Set();

			for (const input of this._model.inputs) {
				output_properties.add(input.name);
			}

			for (const child of this._model.children) {
				if (child.model) {
					child.model.outputs.forEach((child_output) => {
						if (output_properties.has(child_output.name)) {
							any_outputs.add(child_output);
						} else {
							output_properties.add(child_output.name);
						}
					});
				}
			}

			if (any_outputs.size > 0) {
				options.push({
					id: 'any',
					outputs: Array.from(any_outputs)
				});
			}
		}

		return options;
	}

	_updateIO() {
		this._clearIO();

		// Create node input panel
		for (let input of this._model.inputs) {
			const input_id = `${input.name}-inputs-property`;
			this._addInputElement(input_id, input.name);
		}

		// Create node output panel
		for (let output of this._model.outputs) {
			const output_id = `${output.name}-outputs-property`;
			this._addOutputElement(output_id, output.name);
		}

		// Create binding panel
		let output_options = this._findOutputOptions();
		let input_options = this._findInputOptions();

		if (output_options.length > 0 && input_options.length > 0)
		{
			// Create input and output select elements
			let output_select_el = this._createBindingOutputs(output_options);
			let input_select_el = this._createBindingInputs(input_options);

			// Create new binding panel
			let newBindingPanel = document.createElement("div");

			let arrow_el = document.createElement("span");
			arrow_el.innerHTML = "&#x2192;";
			arrow_el.className = "binding arrow";

			newBindingPanel.appendChild(output_select_el);
			newBindingPanel.appendChild(arrow_el);
			newBindingPanel.appendChild(input_select_el);

			let newButton = document.createElement("button");
			newButton.id = "new-binding";
			newButton.innerHTML = "Bind";
			newButton.addEventListener('click', function (e) {
				const output_option = output_select_el.selectedOptions[0];
				const input_option = input_select_el.selectedOptions[0];

				if (output_option && input_option) {
					const provider = output_option.value.split(":");
					const consumer = input_option.value.split(":");

					this._model.addBinding({
						consumer: {
							id: consumer[0],
							property: consumer[1]
						},
						provider: {
							id: provider[0],
							property: provider[1]
						}
					});

					output_select_el.value = undefined;
					input_select_el.value = undefined;
				}
			}.bind(this));

			newBindingPanel.appendChild(newButton);

			this._bindings.appendChild(newBindingPanel);

			// Add handler for change in output select element
			output_select_el.addEventListener('change', function (e) {
				const output_option = e.target.selectedOptions[0];

				let valid_input_values_for_output = new Set();

				if (output_option) {
					const provider = output_option.value.split(':');

					const this_inputs_names = new Set();
					this._model.inputs.forEach(input => this_inputs_names.add(input.name));

					// TODO: Check if type matches selected output type (probably need to get output type first)
					if (provider[0] == 'this') {
						for (let option of input_select_el.options) {
							valid_input_values_for_output.add(option.value);
						}
					} else {
						// TODO: Check if type matches selected output type (probably need to get output type first)
						this._model.outputs.forEach((output) => valid_input_values_for_output.add(`this:${output.name}`));

						if (this._model.execution == JAG.EXECUTION.SEQUENTIAL) {
							if (provider[0] == 'any') {
								const all_cumulative_outputs = new Set();

								this._model.inputs.forEach(input => all_cumulative_outputs.add(input.name));

								const valid_any_outputs_from_children = new Set();

								for (const child of this._model.children) {
									if (valid_any_outputs_from_children.has(provider[1])) {
										child.model.inputs.forEach(input => valid_input_values_for_output.add(`${child.id}:${input.name}`));
									}

									child.model.outputs.forEach(output => {
										if (all_cumulative_outputs.has(output.name)) {
											valid_any_outputs_from_children.add(output.name)
										} else {
											all_cumulative_outputs.add(output.name);
										}
									});
								}
							} else {
								const order = this._model.getOrderForId(provider[0]);

								for (const child of this._model.children) {
									if (child.model) {
										if (this._model.getOrderForId(child.id) > order) {
											for (const input of child.model.inputs) {
												// TODO: Check if type matches selected output type (probably need to get output type first)
												valid_input_values_for_output.add(`${child.id}:${input.name}`);
											}
										}
									}
								}
							}
						}
					}

					toggleSelectValues(input_select_el, valid_input_values_for_output);
				}

				this._previous_value = output_option.value;

			}.bind(this));

			input_select_el.addEventListener('change', function (e) {
				const input_option = e.target.selectedOptions[0];

				if (input_option) {
					const consumer = input_option.value.split(':');

					// TODO: Check if types match selected output type (probably as a .filter before .map)
					let valid_for_input = new Set(this._model.inputsTo(consumer[0]).map((output) => `${output.id}:${output.property}`));
					toggleSelectValues(output_select_el, valid_for_input);
				}
			}.bind(this));
		}

		for (let binding of this._model.bindings) {
			let binding_box = createEmptyInputContainer(`binding-${binding.consumer.id}-${binding.consumer.property}`);

			let output_label = document.createElement("input");
			output_label.disabled = true;

			if (binding.provider.id == 'this' || binding.provider.id == 'any') {
				output_label.value = `${binding.provider.id}:${binding.provider.property}`
			} else {
				const provider_node = this._model.getCanonicalNode(binding.provider.id);

				let provider_name = binding.provider.id;

				if (provider_node.name) {
					provider_name = provider_node.name;
				} else if (provider_node.model) {
					provider_name = provider_node.model.name;
				}

				output_label.value = `${provider_name}:${binding.provider.property}`;
			}

			output_label.className = "binding output";

			binding_box.appendChild(output_label);

			let arrow = document.createElement("span");
			arrow.innerHTML = "&#x2192;";
			arrow.className = "binding arrow";
			binding_box.appendChild(arrow);

			let input_label = document.createElement("input");
			input_label.disabled = true;

			if (binding.consumer.id == 'this' || binding.consumer.id == 'any') {
				input_label.value = `${binding.consumer.id}:${binding.consumer.property}`;
			} else {
				const consumer_node = this._model.getCanonicalNode(binding.consumer.id);

				let consumer_name = binding.consumer.id;

				if (consumer_node.name) {
					consumer_name = consumer_node.name;
				} else if (consumer_node.model) {
					consumer_name = consumer_node.model.name;
				}

				input_label.value = `${consumer_name}:${binding.consumer.property}`;
			}

			input_label.className = "binding input";

			binding_box.appendChild(input_label);

			const remove = document.createElement('span');
			remove.innerHTML = '-';
			remove.className = 'binding remove';

			remove.addEventListener('click', function (e) {
				this._model.removeBinding(binding);
			}.bind(this));

			binding_box.appendChild(remove);

			this._bindings.appendChild(binding_box);
		}
	}

	_updateAnnotations() {
		this._clearAnnotations();

		if (this._model.children.length > 0) {
			for (const child of this._model.children) {
				let child_name = child.id;
				if (child.model) child_name = child.model.name;

				let child_annotations = createPropertyElement(`annotations-${child.id}`, child_name);
				child_annotations.className = "annotation node";

				const annotation_add = document.createElement('span');
				annotation_add.innerHTML = '+';
				annotation_add.className = 'io-add';

				annotation_add.addEventListener('click', function (e) {
					this._addAnnotation(child.id);
				}.bind(this));

				child_annotations.appendChild(annotation_add);

				const iterable_box = document.createElement("div");

				const iterable_checkbox = document.createElement("input");
				iterable_checkbox.setAttribute('id', `${child.id}-iterable`);
				iterable_checkbox.type = "checkbox";

				iterable_checkbox.addEventListener('change', function (e) {
					this._model.setIterable(child.id, iterable_checkbox.checked);
				}.bind(this));

				iterable_box.appendChild(iterable_checkbox);

				const iterable_label = document.createElement("label");
				iterable_label.for = `${child.id}-iterable`;
				iterable_label.textContent = 'Iterable';
				iterable_box.appendChild(iterable_label);

				if (child.iterable) {
					iterable_checkbox.checked = true;
				}

				child_annotations.appendChild(iterable_box);

				if (child.annotations) {
					for (let annotation of child.annotations) {
						let annotation_box = createEmptyInputContainer(`annotation-${child.id}-${annotation[0]}`);
						annotation_box.className = "annotation descriptor";

						let annotation_name = document.createElement("input");
						annotation_name.disabled = true;
						annotation_name.value = annotation[0];

						annotation_name.className = "annotation name";

						annotation_box.appendChild(annotation_name);

						let equals = document.createElement("span");
						equals.innerHTML = "=";
						equals.className = "annotation equals";
						annotation_box.appendChild(equals);

						let annotation_value = document.createElement("input");
						annotation_value.disabled = true;

						const value = annotation[1];
						let value_text = value !== Object(value) ? value.toString() : JSON.stringify(value);
						annotation_value.value = value_text;

						annotation_value.className = "annotation value";

						annotation_box.appendChild(annotation_value);

						const remove = document.createElement('span');
						remove.innerHTML = "-";
						remove.className = "annotation remove";

						remove.addEventListener('click', function (e) {
							this._model.removeAnnotation(child.id, annotation[0]);
						}.bind(this));

						annotation_box.appendChild(remove);

						child_annotations.appendChild(annotation_box);
					}
				}

				this._annotations.appendChild(child_annotations);
			}
		}
	}

	_initUI() {
		const childOf_el = document.createElement('div');
		childOf_el.className = 'special-wrapper child-of-notice';
		this._childOf = document.createElement('p');
		this._childOf.className = 'special child-of-notice';
		this._childOf.id = 'child-of';
		childOf_el.appendChild(this._childOf);

		const undefinedJAG_el = document.createElement('div');
		undefinedJAG_el.className = 'special-wrapper undefined-jag-notice';
		this._undefinedJAG = document.createElement('p');
		this._undefinedJAG.innerHTML = 'Model is undefined: its direct properties cannot be modified.';
		this._undefinedJAG.className = 'special undefined-jag-notice';
		this._undefinedJAG.id = 'undefined-jag';
		undefinedJAG_el.appendChild(this._undefinedJAG);

		const leafNode_el = document.createElement('div');
		leafNode_el.className = 'special-wrapper leaf-node-notice';
		this._leafNode = document.createElement('p');
		this._leafNode.innerHTML = 'Possible leaf node: it is a child without a model.';
		this._leafNode.className = 'special leaf-node-notice';
		this._leafNode.id = 'leaf-node';
		leafNode_el.appendChild(this._leafNode);

		const urn_el = createPropertyElement('urn-property', 'URN');
		this._urn = createTextInput('urn-property');
		this._urn.className = 'direct-property';
		urn_el.appendChild(this._urn);

		const name_el = createPropertyElement('name-property', 'Name');
		this._name = createTextInput('name-property');
		this._name.className = "direct-property contextual";
		name_el.appendChild(this._name);

		const desc_el = createPropertyElement('desc-property', 'Description');
		this._desc = createTextInput('desc-property');
		this._desc.className = "direct-property contextual";
		desc_el.appendChild(this._desc);

		const name_ctx_el = createPropertyElement('name-ctx-property', 'Contextual Name');
		this._name_ctx = createTextInput('name-ctx-property');
		this._name_ctx.className = "contextual";
		name_ctx_el.appendChild(this._name_ctx);

		const desc_ctx_el = createPropertyElement('desc-ctx-property', 'Contextual Description');
		this._desc_ctx = createTextInput('desc-ctx-property');
		this._desc_ctx.className = "contextual";
		desc_ctx_el.appendChild(this._desc_ctx);

		const execution_el = createPropertyElement('execution-property', 'Execution');
		this._execution = createSelect('execution-property', [{
			value: JAG.EXECUTION.NONE,
			text: 'None'
		},{
			value: JAG.EXECUTION.SEQUENTIAL,
			text: 'Sequential'
		},{
			value: JAG.EXECUTION.PARALLEL,
			text: 'Parallel'
		}]);
		this._execution.className = 'direct-property';
		execution_el.appendChild(this._execution);

		const operator_el = createPropertyElement('operator-property', 'Operator');
		this._operator  = createSelect('operator-property', [{
			value: JAG.OPERATOR.NONE,
			text: 'None'
		},{
			value: JAG.OPERATOR.AND,
			text: 'And'
		},{
			value: JAG.OPERATOR.OR,
			text: 'Or'
		}]);
		this._operator.className = 'direct-property';
		operator_el.appendChild(this._operator);

		// Create inputs area
		const inputs_el = createPropertyElement('inputs-property', 'Inputs');

		const input_add = document.createElement('span');
		input_add.innerHTML = '+';
		input_add.className = 'io-add';
		input_add.addEventListener('click', this._addInput.bind(this));
		inputs_el.appendChild(input_add);

		this._inputs = createEmptyInputContainer('inputs-property');
		this._inputs.className = 'direct-property';
		inputs_el.appendChild(this._inputs);

		// Create outputs area
		const outputs_el = createPropertyElement('outputs-property', 'Outputs');

		const output_add = document.createElement('span');
		output_add.innerHTML = '+';
		output_add.className = 'io-add';
		output_add.addEventListener('click', this._addOutput.bind(this));
		outputs_el.appendChild(output_add);

		this._outputs = createEmptyInputContainer('outputs-property');
		this._outputs.className = 'direct-property';
		outputs_el.appendChild(this._outputs);

		// Create bindings area
		const bindings_el = createPropertyElement('bindings-property', 'Bindings');

		this._bindings = createEmptyInputContainer('bindings-property');
		this._bindings.className = 'direct-property';
		bindings_el.appendChild(this._bindings);

		// Create annotation area
		const annotations_el = createPropertyElement('annotations-property', 'Annotations');

		this._annotations = createEmptyInputContainer('annotations-property');
		this._annotations.className = 'direct-property';
		annotations_el.appendChild(this._annotations);

		// Create export area
		const export_el = createEmptyInputContainer('export');
		this._export = document.createElement('button');
		this._export.innerHTML = 'export';
		export_el.appendChild(this._export);

		this._enableProperties(false);

		this.appendChild(childOf_el);
		this.appendChild(undefinedJAG_el);
		this.appendChild(leafNode_el);
		this.appendChild(urn_el);
		this.appendChild(name_el);
		this.appendChild(desc_el);
		this.appendChild(name_ctx_el);
		this.appendChild(desc_ctx_el);
		this.appendChild(execution_el);
		this.appendChild(operator_el);
		this.appendChild(inputs_el);
		this.appendChild(outputs_el);
		this.appendChild(bindings_el);
		this.appendChild(annotations_el);
		this.appendChild(export_el);
	}

	async _updateURN(urn) {
		const idb_service = JAGService.instance('idb-service');

		if(this._urn.value == this._model.urn)
			return;

		if(!window.confirm("The URN has changed. Would you like to save this model to the new URN (" + this._urn.value + ")? (URN cannot be modified except to create a new model.)"))
			return;

		// Checks if new urn has a model associated to it and asks for permission to overwrite.
		if(await idb_service.has(this._urn.value)) {
			// Ask for confirmation
			const overwrite = window.confirm("The new URN (" + this._urn.value + ") is already associated with a model. Would you like to update the URN to this model? (If not, save will be cancelled.)");
			if(!overwrite) {
				// Reverts the urn to its original value and exits early.
				this._urn.value = this._model.urn;
				return;
			}
		}

		// If we get there we can create/overwrite
		// @TODO: replace with clone function (add to JAG model)
		const description = this._model.toJSON();
		description.urn = urn;
		const new_model = JAG.fromJSON(description);

		// Update model references.
		this._node.model = new_model;
		this._model = new_model;

		// Store the updated model.
		// @TODO: switch to update when avail.
		idb_service.create(new_model);

		// Remove unsaved box shadow on URN property input.
		this._urn.classList.toggle("edited", false);
	}

	_initHandlers() {
		this._urn.addEventListener('keyup', e => {
			this._urn.classList.toggle('edited', this._urn.value != this._model.urn);
		});

		this._urn.addEventListener('keypress', e => {
			if (e.key == "Enter") {
				this._updateURN(this._urn.value);
			}
		});

		this._name.addEventListener('keyup', () => {
			this._model.name = this._name.value;
		});

		this._desc.addEventListener('keyup', () => {
			this._model.description = this._desc.value;
		});

		this._name_ctx.addEventListener('keyup', () => {
			this._node.setContextualName(this._name_ctx.value);
		});

		this._desc_ctx.addEventListener('keyup', () => {
			this._node.setContextualDescription(this._desc_ctx.value);
		});

		this._execution.addEventListener('change', e => {
			this._model.execution = this._execution.value;
		});

		this._operator.addEventListener('change', e => {
			this._model.operator = this._operator.value;
		});

		this._export.addEventListener('click', e => {
			const node = this._model;

			const json = JSON.stringify(node.toJSON());
			const a = document.createElement('a');
			const data = `data:application/json,${encodeURI(json)}`;
			a.href = data;
			a.download = `${node.name}.json`;
			a.click();
		});
	}

	_clearProperties() {
		this._urn.value = '';
		this._name.value = '';
		this._desc.value = '';
		this._name_ctx.value = '';
		this._desc_ctx.value = '';
		this._execution.value = JAG.EXECUTION.NONE;
		this._operator.value = JAG.OPERATOR.NONE;

		this._urn.classList.toggle("edited", false);

		this._clearIO();
		this._clearAnnotations();

		for (const input of this.querySelectorAll("input")) {
			input.title = '';
		}
	}

	_clearIO() {
		this._input_elements.clear();
		while(this._inputs.firstChild) {
			this._inputs.removeChild(this._inputs.firstChild);
		}

		this._output_elements.clear();
		while(this._outputs.firstChild) {
			this._outputs.removeChild(this._outputs.firstChild);
		}

		while (this._bindings.firstChild) {
			this._bindings.removeChild(this._bindings.firstChild);
		}
	}

	_clearAnnotations() {
		while (this._annotations.firstChild) {
			this._annotations.removeChild(this._annotations.firstChild);
		}
	}

	_enableProperties(enabled) {
		this._urn.disabled = !enabled;
		this._name.disabled = !enabled;
		this._desc.disabled = !enabled;
		this._name_ctx.disabled = !enabled;
		this._desc_ctx.disabled = !enabled;
		this._execution.disabled = !enabled;
		this._operator.disabled = !enabled;

		this._input_elements.disabled = !enabled;
		this._output_elements.disabled = !enabled;
		this._export.disabled = !enabled;

		if (this._node && this._node.getParent() != undefined && (enabled || this._model instanceof UndefinedJAG)) {
			this._childOf.innerHTML = `As child of ${this._node.getParentURN()}`;
			this.classList.toggle('root-node', false);
			this._name_ctx.disabled = false;
			this._desc_ctx.disabled = false;
		} else {
			this.classList.toggle('root-node', true);
			this._name_ctx.disabled = true;
			this._desc_ctx.disabled = true;
		}

		if (enabled || (!enabled && !this._model)) {
			this.classList.toggle('defined-model', true);
			this.classList.toggle('non-leaf-node', true);
		} else if (this._model instanceof UndefinedJAG) {
			this.classList.toggle('defined-model', false);

			if (this._node.getParent()) {
				this.classList.toggle('non-leaf-node', false);
			}
		}
	}
});

export default customElements.get('jag-properties');

function createPropertyElement(id, name) {
	const element = document.createElement('div');

	const label = document.createElement('label');
	label.setAttribute('for', id);
	label.innerHTML = name;

	element.appendChild(label);

	return element;
}

function createEmptyInputContainer(id) {
	const container = document.createElement('div');
	container.setAttribute('id', id);
	return container;
}

function createTextInput(id) {
	const input = document.createElement('input');
	input.setAttribute('type', 'text');
	input.setAttribute('id', id);
	return input;
}

function createSelect(id, options, selected = undefined) {
	const input = document.createElement('select');
	input.setAttribute('id', id);

	options.forEach(item => {
		if (item.label) {
			const opgr_el = document.createElement('optgroup');
			opgr_el.setAttribute('label', item.label);

			item.options.forEach(option => {
				const opt_el = document.createElement('option');
				opt_el.value = option.value;
				opt_el.text = option.text;
				opgr_el.appendChild(opt_el);
			});

			input.add(opgr_el);
		} else {
			const opt_el = document.createElement('option');
			opt_el.value = item.value;
			opt_el.text = item.text;
			input.add(opt_el);
		}
	});

	if (selected) {
		input.value = selected;
	} else {
		input.value = undefined;
	}

	return input;
}

function toggleSelectValues(select_el, valid_values) {
	const selected_option = select_el.selectedOptions[0];

	for (let option of select_el.options) {
		option.disabled = !valid_values.has(option.value);
	}

	if (selected_option) {
		select_el.value = selected_option.value;
	}
}

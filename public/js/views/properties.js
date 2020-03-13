/**
 * @file Node properties panel.
 *
 * @author cwilber
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.17
 */

import JAG from '../models/jag.js';
import JAGService from '../services/jag.js';

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
	}

	handleSelectionUpdate(selection) {
		if (this._model)
		{
			this._model.removeEventListener('update', this._boundUpdate);
		}

		this._clearProperties();
		this._enableProperties(selection.size != 0);

		if (selection.size == 1) {
			this._node = selection.values().next().value;
			this._model = this._node.model;

			this._updateProperties();
			this._updateIO();
			this._updateAnnotations();
			this._model.addEventListener('update', this._boundUpdate);
		}
	}

	_updateProperties() {
		this._urn.value = this._model.urn;
		this._name.value =  this._model.name;
		this._execution.value =  this._model.execution || 'none';
		this._operator.value =  this._model.operator || 'none';
		this._desc.value =  this._model.description;

		this._enableProperties(true);
	}

	addInput(e) {
		const name = window.prompt('Input name');
		if(name === null)
			return;

		const type = window.prompt('Input type');
		if (type == null)
			return;

		const input = {
			name: name,
			type: type
		};
		
		this._model.addInput(input);
	}

	addOutput(e) {
		const name = window.prompt('Output name');
		if(name === null)
			return;

		const type = window.prompt('Output type');
		if (type == null)
			return;

		const output = {
			name: name,
			type: type
		};

		this._model.addOutput(output);
	}

	addInputElement(id, input) {
		const input_el = createPropertyElement(id, input);

		this._inputs.appendChild(input_el);
	}

	addOutputElement(id, output) {
		const output_el = createPropertyElement(id, output);

		this._outputs.appendChild(output_el);
	}

	createBindingInputs(options) {
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

	createBindingOutputs(options) {
		const select_el = createSelect('binding-outputs', options.map(node => {

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

	findInputOptions() {
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

	findOutputOptions() {
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

		return options;
	}

	_updateIO() {
		this._clearIO();

		// Create node input panel
		for (let input of this._model.inputs) {
			const input_id = `${input.name}-inputs-property`;
			this.addInputElement(input_id, input.name);
		}

		// Create node output panel
		for (let output of this._model.outputs) {
			const output_id = `${output.name}-outputs-property`;
			this.addOutputElement(output_id, output.name);
		}

		// Create binding panel
		let output_options = this.findOutputOptions();
		let input_options = this.findInputOptions();

		if (output_options.length > 0 && input_options.length > 0)
		{
			// Create input and output select elements
			let output_select_el = this.createBindingOutputs(output_options);
			let input_select_el = this.createBindingInputs(input_options);

			// Create new binding panel
			let newBindingPanel = document.createElement("div");
			newBindingPanel.appendChild(output_select_el);
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

				let valid_for_output = new Set();

				if (output_option) {
					const provider = output_option.value.split(':');

					if (provider[0] == 'this') {
						for (let option of input_select_el.options) {
							valid_for_output.add(option.value);
						}
					} else {
						// TODO: Check if type matches selected output type (probably need to get output type first)
						this._model.outputs.forEach((output) => valid_for_output.add(`this:${output.name}`));

						if (this._model.execution == JAG.EXECUTION.SEQUENTIAL) {
							const order = this._model.getOrderForId(provider[0]);

							for (let child of this._model.children) {
								if (child.model) {
									if (this._model.getOrderForId(child.id) > order) {
										for (let input of child.model.inputs) {
											// TODO: Check if type matches selected output type (probably need to get output type first)
											valid_for_output.add(`${child.id}:${input.name}`);
										}
									}
								}
							}
						}
					}

					toggleSelectValues(input_select_el, valid_for_output);
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

			if (binding.provider.id == 'this') {
				output_label.value = `this:${binding.provider.property}`;
			} else {
				const provider_node = this._model.getCanonicalNode(binding.provider.id);
				output_label.value = `${provider_node.model.name}:${binding.provider.property}`;
			}

			output_label.className = "binding output";
			
			binding_box.appendChild(output_label);

			let arrow = document.createElement("span");
			arrow.innerHTML = "&#x2192;";
			arrow.className = "binding arrow";
			binding_box.appendChild(arrow);

			let input_label = document.createElement("input");
			input_label.disabled = true;

			if (binding.consumer.id == 'this') {
				input_label.value = `this:${binding.consumer.property}`;
			} else {
				const consumer_node = this._model.getCanonicalNode(binding.consumer.id);
				input_label.value = `${consumer_node.model.name}:${binding.consumer.property}`;
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

		let newAnnotationPanel = document.createElement("div");

		const select_el = createSelect('annotation-nodes', this._model.children.map((child) => {
			let label = child.id;
			if (child.id != 'this' && child.model) {
				label = child.model.name;
				const order = this._model.getOrderForId(child.id);
				if (order != 0) {
					label += ` (${order})`;
				}
			}

			return { text: label, value: child.id };
		}));

		let name_el = document.createElement("input");
		name_el.className = "annotation name";
		name_el.disabled = true;

		let equals_el = document.createElement("span");
		equals_el.className = "annotation equals";
		equals_el.textContent = "=";
		
		let value_el = document.createElement("input");
		value_el.className = "annotation value";
		value_el.disabled = true;
		
		select_el.onchange = function (e) {
			name_el.disabled = false;
			value_el.disabled = false;
		}.bind(this);

		let newButton = document.createElement("button");
		newButton.id = "new-annotation";
		newButton.innerHTML = "Annotate";
		newButton.addEventListener("click", function (e) {
			this._model.addAnnotation(select_el.value, name_el.value, value_el.value);
		}.bind(this));

		newAnnotationPanel.appendChild(select_el);
		newAnnotationPanel.appendChild(name_el);
		newAnnotationPanel.appendChild(equals_el);
		newAnnotationPanel.appendChild(value_el);
		newAnnotationPanel.appendChild(newButton);

		this._annotations.appendChild(newAnnotationPanel);

		for (const child of this._model.children) {
			if (child.annotations && child.annotations.size > 0) {
				let child_annotations_label = document.createElement("p");
				child_annotations_label.className = "annotation node";

				if (child.model) {
					child_annotations_label.textContent = child.model.name;
				} else {
					child_annotations_label.textContent = child.id;
				}

				this._annotations.appendChild(child_annotations_label);

				for (let annotation of child.annotations) {
					let annotation_box = createEmptyInputContainer(`annotation-${annotation[0]}`);
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
					annotation_value.value = annotation[1];

					annotation_value.className = "annotation value";

					annotation_box.appendChild(annotation_value);

					const remove = document.createElement('span');
					remove.innerHTML = "-";
					remove.className = "annotation remove";

					remove.addEventListener('click', function (e) {
						this._model.removeAnnotation(child.id, annotation[0]);
					}.bind(this));

					annotation_box.appendChild(remove);

					this._annotations.appendChild(annotation_box);
				}
			}
		}
	}

	_initUI() {
		const urn_el = createPropertyElement('urn-property', 'URN');
		this._urn = createTextInput('urn-property');
		urn_el.appendChild(this._urn);

		const name_el = createPropertyElement('name-property', 'Name');
		this._name = createTextInput('name-property');
		name_el.appendChild(this._name);

		const desc_el = createPropertyElement('desc-property', 'Description');
		this._desc = createTextInput('desc-property');
		desc_el.appendChild(this._desc);

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

		operator_el.appendChild(this._operator);

		// Create inputs area
		const inputs_el = createPropertyElement('inputs-property', 'Inputs');

		const input_add = document.createElement('span');
		input_add.innerHTML = '+';
		input_add.className = 'io-add';
		input_add.addEventListener('click', this.addInput.bind(this));
		inputs_el.appendChild(input_add);

		this._inputs = createEmptyInputContainer('inputs-property');
		inputs_el.appendChild(this._inputs);

		// Create outputs area
		const outputs_el = createPropertyElement('outputs-property', 'Outputs');

		const output_add = document.createElement('span');
		output_add.innerHTML = '+';
		output_add.className = 'io-add';
		output_add.addEventListener('click', this.addOutput.bind(this));
		outputs_el.appendChild(output_add);

		this._outputs = createEmptyInputContainer('outputs-property');
		outputs_el.appendChild(this._outputs);

		// Create bindings area
		const bindings_el = createPropertyElement('bindings-property', 'Bindings');
		
		this._bindings = createEmptyInputContainer('bindings-property');
		bindings_el.appendChild(this._bindings);

		// Create annotation area
		const annotations_el = createPropertyElement('annotations-property', 'Annotations');

		this._annotations = createEmptyInputContainer('annotations-property');
		annotations_el.appendChild(this._annotations);

		// Create export area
		const export_el = createEmptyInputContainer('export');
		this._export = document.createElement('button');
		this._export.innerHTML = 'export';
		export_el.appendChild(this._export);

		this._enableProperties(false);

		this.appendChild(urn_el);
		this.appendChild(name_el);
		this.appendChild(desc_el);
		this.appendChild(execution_el);
		this.appendChild(operator_el);
		this.appendChild(inputs_el);
		this.appendChild(outputs_el);
		this.appendChild(bindings_el);
		this.appendChild(annotations_el);
		this.appendChild(export_el);
	}

	async _updateURN(urn) {
		if (this._urn.value != this._model.urn) {
			let update = false;

			if (window.confirm("The URN has changed. Would you like to save this model to the new URN (" + this._urn.value + ")? (URN cannot be modified except to create a new model.)")) {
				if (await JAGService.has(this._urn.value)) {
					update = window.confirm("The new URN (" + this._urn.value + ") is already associated with a model. Would you like to update the URN to this model? (If not, save will be cancelled.)");
				} else {
					update = true;
				}
			}

			if (update) {
				// Copy model with new URN.
				let schema = this._model.toJSON();
				schema.urn = urn;
				let model = new JAG(schema);

				// Update model references.
				let old_model = this._model;
				this._node.model = model;
				this._model = model;

				// Remove unsaved box shadow on URN property input.
				this._urn.style.boxShadow = "none";

				// Store the new model.
				await JAGService.store(model);

				// Notify listeners of copied model.
				old_model.copied(urn);
			}
		}
	}

	_initHandlers() {
		this._urn.addEventListener('keyup', e => {
			if (this._urn.value != this._model.urn) {
				this._urn.style.boxShadow = "3px 3px orange";
			} else {
				this._urn.style.boxShadow = "none";
			}
		});

		this._urn.addEventListener('keypress', e => {
			if (e.key == "Enter") {
				this._updateURN(this._urn.value);
			}
		});

		this._name.addEventListener('keyup', e => {
			this._model.name = this._name.value;
		});

		this._desc.addEventListener('keyup', e => {
			this._model.description = this._desc.value;
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
		this._execution.value = JAG.EXECUTION.NONE;
		this._operator.value = JAG.OPERATOR.NONE;

		this._urn.style.boxShadow = "none";

		this._clearIO();
		this._clearAnnotations();
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
		this._execution.disabled = !enabled;
		this._operator.disabled = !enabled;

		this._input_elements.disabled = !enabled;
		this._output_elements.disabled = !enabled;
		this._export.disabled = !enabled;
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
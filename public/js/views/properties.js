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
		this._boundIOUpdate = this._updateIO.bind(this);
	}

	handleSelectionUpdate(selection) {
		if (this._model)
		{
			this._model.removeEventListener('update', this._boundIOUpdate);
		}

		this._clearProperties();
		this._enableProperties(selection.size != 0);

		if (selection.size == 1) {
			this._node = selection.values().next().value;
			this._model = this._node.model;

			this._updateProperties();
			this._updateIO();
			this._model.addEventListener('update', this._boundIOUpdate);
		}
	}

	_updateProperties() {
		this._urn.value = this._model.urn;
		this._name.value =  this._model.name;
		this._execution.value =  this._model.execution || 'none';
		this._operator.value =  this._model.operator || 'none';
		this._desc.value =  this._model.description;

		this._enableProperties(this._model.editable);
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

	addBindingInputs(options) {
		const select_el = createSelect('binding-inputs', options);

		select_el.onfocus = function (e) {
			this._previous_value = this.value;
		}.bind(select_el);

		return select_el;
	}

	addBindingOutputs(options) {
		const select_el = createSelect('binding-outputs', options);
		
		select_el.onfocus = function (e) {
			this._previous_value = this.value;
		}.bind(select_el);

		return select_el;
	}

	findInputOptions() {
		const options = [];

		// We can "input" a value into any of this node's children's inputs.
		this._model.getAvailableInputs().forEach((input) => {
			options.push({
				text: `${input.model.name}:${input.property}`,
				value: `${input.id}:${input.property}`
			});
		});

		// We can also "input" a value to this node's outputs.
		this._model.outputs.forEach((output) => {
			options.push({
				text: `this:${output.name}`,
				value: `this:${output.name}`
			});
		});

		return options;
	}

	findOutputOptions() {
		const options = [];

		// We can "output" a value from this node's inputs.
		this._model.inputs.forEach((input) => {
			options.push({
				text: `this:${input.name}`,
				value: `this:${input.name}`
			});
		});

		// We can also "output" a value from this node's children's outputs.
		this._model.getAvailableOutputs().forEach((output) => {
			options.push({
				text: `${output.model.name}:${output.property}`,
				value: `${output.id}:${output.property}`
			});
		});

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
			let output_select_el = this.addBindingOutputs(output_options);
			let input_select_el = this.addBindingInputs(input_options);

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

				if (output_option) {
					const provider = output_option.value.split(':');

					if (provider[0] != 'this') {
						// TODO: Check if type matches selected output type (probably need to get output type first)
						let valid_for_output = new Set(this._model.outputs.map((output) => `this:${output.name}`));

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

						toggleSelectValues(input_select_el, valid_for_output);
					}
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
				const provider_node = this._model.getNodeForId(binding.provider.id);
				output_label.value = `${provider_node.model.name}:${binding.provider.property}`;
			}
			
			binding_box.appendChild(output_label);

			let arrow = document.createElement("span");
			arrow.innerHTML = "&#x2192;";
			binding_box.appendChild(arrow);

			let input_label = document.createElement("input");
			input_label.disabled = true;

			if (binding.consumer.id == 'this') {
				input_label.value = `this:${binding.consumer.property}`;
			} else {
				const consumer_node = this._model.getNodeForId(binding.consumer.id);
				input_label.value = `${consumer_node.model.name}:${binding.consumer.property}`;
			}

			binding_box.appendChild(input_label);

			this._bindings.appendChild(binding_box);
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

	options.forEach(option => {
		const opt_el = document.createElement('option');
		opt_el.value = option.value;
		opt_el.text = option.text;
		input.add(opt_el);
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
'use strict';

import Listenable from '../listenable.js';

export default class NodeProperties extends Listenable {

	constructor(propreties_container) {
		super();
		this._container = propreties_container;
		this._node = undefined;
		this._input_elements = new Map();
		this._output_elements = new Map();
		this._initUI();
		this._initHandlers();
	}

	handleSelectionUpdate(selection) {
		this._clearProperties();
		if(selection.size == 1) {
			const node = selection.values().next().value;
			this._node = node;
			this._urn.value = node.model.urn;
			this._name.value = node.model.name;
			this._desc.value = node.model.description;

			const input_options = this.findInputOptions();
			node.model.inputs.forEach(input => {
				const input_id = `${input}-inputs-property`;
				this.addInputElement(input_id, input, input_options);
			});

			const output_options = [];
			node.model.outputs.forEach(output => {
				const output_id = `${output}-outputs-property`;
				this.addOutputElement(output_id, output, output_options);
			});

			if(node.model.parent) {
				node.model.parent.bindings.forEach(binding => {
					if(node.model.id != binding.consumer.id)
						return;

					const in_property = binding.consumer.property;
					const select = this._input_elements.get(`${in_property}-inputs-property`);

					select.value = `${binding.provider.id}:${binding.provider.property}`;
				});
			}
		}
	}

	addInput(e) {
		const name = window.prompt('Input name');
		const options = this.findInputOptions();
		const input_id = `${name}-inputs-property`;
		this.addInputElement(input_id, name, options);
		this._node.model.addInput(name);
	}

	addInputElement(id, name, options) {
		const input_el = createPropertyElement(id, name);
		const input = createSelect(id, options);
		input.addEventListener('change', e => {
			const provider = e.target.selectedOptions[0].value.split(':');
			this._node.model.parent.addBinding({
				consumer: {
					id: this._node.model.id,
					property: name
				},
				provider: {
					id: provider[0],
					property: provider[1]
				}
			});
		});
		input_el.appendChild(input);
		this._input_elements.set(id, input);
		this._inputs.appendChild(input_el);
	}

	addOutputElement(id, name, options) {
		const output_el = createPropertyElement(id, name);
		const output = createSelect(id, options);
		output_el.appendChild(output);
		this._output_elements.set(id, output);
		this._outputs.appendChild(output_el);
	}

	findInputOptions() {
		const options = [{
			name:'not bound',
			value:'not bound'
		}];

		if(!this._node.model.parent)
			return options;

		this._node.model.parent.inputs.forEach((input) => {
			options.push({
				name: `${this._node.model.parent.name}:${input}`,
				value: `this:${input}`
			});
		});

		this._node.model.parent.children.forEach(sibling => {
			if(sibling === this._node.model)
				return;

			sibling.outputs.forEach((output) => {
				options.push({
					name: `${sibling.name}:${output}`,
					value: `${sibling.id}:${output}`
				});
			});
		});

		return options;
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
			name: 'none',
			value: 'None'
		},{
			name: 'sequential',
			value: 'Sequential'
		},{
			name: 'parallel',
			value: 'Parallel'
		}]);

		execution_el.appendChild(this._execution);

		const logic_el = createPropertyElement('logic-property', 'Logic');
		this._logic  = createSelect('logic-property', [{
			name: 'none',
			value: 'None'
		},{
			name: 'and',
			value: 'And'
		},{
			name: 'or',
			value: 'Or'
		}]);
		logic_el.appendChild(this._logic);

		const inputs_el = createPropertyElement('inputs-property', 'Inputs');

		const input_add = document.createElement('span');
		input_add.innerHTML = '+';
		input_add.className = 'io-add';
		input_add.addEventListener('click', this.addInput.bind(this));
		inputs_el.appendChild(input_add);

		this._inputs = createEmptyInputContainer('inputs-property');
		inputs_el.appendChild(this._inputs);

		const outputs_el = createPropertyElement('outputs-property', 'Outputs');
		this._outputs = createEmptyInputContainer('outputs-property');
		outputs_el.appendChild(this._outputs);

		this._container.appendChild(urn_el);
		this._container.appendChild(name_el);
		this._container.appendChild(desc_el);
		this._container.appendChild(execution_el);
		this._container.appendChild(logic_el);
		this._container.appendChild(inputs_el);
		this._container.appendChild(outputs_el);
	}

	_initHandlers() {
		this._urn.addEventListener('keyup', e => {
			this._doNotifyUpdate('urn', this._urn.value);
		});

		this._name.addEventListener('keyup', e => {
			this._doNotifyUpdate('name', this._name.value);
		});

		this._desc.addEventListener('keyup', e => {
			this._doNotifyUpdate('description', this._desc.value);
		});

	}

	_doNotifyUpdate(property, new_value) {
		this.notify('update', {
			property: property,
			value: new_value
		});
	}

	_clearProperties() {
		this._urn.value = '';
		this._name.value = '';
		this._desc.value = '';
		this._execution.selected = 'none';
		this._logic.selected = 'none';

		this._input_elements.clear();
		while(this._inputs.firstChild) {
			this._inputs.removeChild(this._inputs.firstChild);
		}

		this._output_elements.clear();
		while(this._outputs.firstChild) {
			this._outputs.removeChild(this._outputs.firstChild);
		}
	}
}

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

function createSelect(id, options) {
	const input = document.createElement('select');
	input.setAttribute('id', id);

	options.forEach(option => {
		const opt_el = document.createElement('option');
		opt_el.value = option.value;
		opt_el.text = option.name;
		input.add(opt_el);
		// opt_el.innerHTML = option.name;

		// input.appendChild(opt_el);
	});

	return input;
}

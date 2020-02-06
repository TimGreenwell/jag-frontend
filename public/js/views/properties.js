/**
 * @file Node properties panel.
 *
 * @author cwilber
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.17
 */

import JAG from '../models/jag.js';

customElements.define('jag-properties', class extends HTMLElement {

	constructor() {
		super();
		this._node = undefined;
		this._input_elements = new Map();
		this._output_elements = new Map();
		this._initUI();
		this._initHandlers();
		this._boundIOUpdate = this._updateIO.bind(this);
	}

	handleSelectionUpdate(selection) {
		if (this._node)
		{
			this._node.removeEventListener('update', this._boundIOUpdate);
		}

		this._clearProperties();
		this._enableProperties(selection.size != 0);

		if(selection.size == 1) {
			const node = selection.values().next().value.model;
			this._node = node;
			this._urn.value = node.urn;
			this._name.value = node.name;
			this._execution.value = node.execution || 'none';
			this._operator.value = node.operator || 'none';
			this._desc.value = node.description;

			this._updateIO();
			this._node.addEventListener('update', this._boundIOUpdate);
		}
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
		
		this._node.addInput(input);
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

		this._node.addOutput(output);
	}

	addInputElement(id, input, options) {
		const input_el = createPropertyElement(id, input.name);

		// only creates select element if option is defined
		if(options != undefined) {
			const select_el = createSelect(id, options);

			select_el.onfocus = function (e) {
				this._previous_value = this.value;
			}.bind(select_el);

			select_el.addEventListener('change', function (e) {
				const value = e.target.selectedOptions[0].value;
				
				if (select_el._previous_value != 'not bound') {
					const previous_binding = select_el._previous_value.split(':');
					const current_bindings = this._node.getBindings();

					for (let binding of current_bindings) {
						if (binding.provider.id == previous_binding[0] &&
							binding.provider.property == previous_binding[1])
						{
							if (!this._node.removeBinding(binding)) {
								this._node.parent.removeBinding(binding);
							}
						}
					}
				}

				if (value != 'not bound') {
					const provider = value.split(':');
					this._node.createBinding(input.name, this._node.parent.getNodeForId(provider[0]), provider[1]);
				}

				select_el._previous_value = value;

			}.bind(this));
			input_el.appendChild(select_el);
			this._input_elements.set(id, select_el);
		}

		this._inputs.appendChild(input_el);
	}

	addOutputElement(id, output, options) {
		const output_el = createPropertyElement(id, output.name);

		// only creates select element if option is defined
		if(options != undefined) {
			const select_el = createSelect(id, options);
			
			select_el.onfocus = function (e) {
				this._previous_value = this.value;
			}.bind(select_el);

			select_el.addEventListener('change', function (e) {
				const value = e.target.selectedOptions[0].value;
				
				if (select_el._previous_value != 'not bound') {
					const previous_binding = select_el._previous_value.split(':');
					const current_bindings = this._node.getBindings();

					for (let binding of current_bindings) {
						if (binding.provider.node.id == previous_binding[0] &&
							binding.provider.property == previous_binding[1])
						{
							if (!this._node.removeBinding(binding)) {
								let res = this._node.parent.removeBinding(binding);
							}
						}
					}
				}

				if (value != 'not bound') {
					const provider = value.split(':');
					this._node.createBinding(output.name, this._node.getNodeForId(provider[0]), provider[1]);
				}

				select_el._previous_value = value;
			}.bind(this));

			output_el.appendChild(select_el);

			this._output_elements.set(id, select_el);
		}

		this._outputs.appendChild(output_el);
	}

	findInputOptions() {
		const options = [{
			text:'not bound',
			value:'not bound'
		}];

		this._node.getAvailableInputs().forEach((input) => {
			options.push({
				text: `${input.model.name}:${input.property}`,
				value: `${input.id}:${input.property}`
			})
		});

		return options;
	}

	findOutputOptions() {
		const options = [{
			text:'not bound',
			value:'not bound'
		}];

		this._node.getAvailableOutputs().forEach((output) => {
			options.push({
				text: `${output.model.name}:${output.property}`,
				value: `${output.id}:${output.property}`
			})
		});

		return options;
	}

	_updateIO() {
		this._clearIO();

		let input_options = undefined;
		if(this._node.parent)
			input_options = this.findInputOptions();

		for (let input of this._node.inputs) {
			const input_id = `${input.name}-inputs-property`;
			this.addInputElement(input_id, input, input_options);
		}

		const output_options = this.findOutputOptions();
		
		for (let output of this._node.outputs) {
			const output_id = `${output.name}-outputs-property`;
			this.addOutputElement(output_id, output, output_options);
		}

		for (let binding of this._node.getBindings()) {
			if(this._node.id != binding.consumer.id)
				return;

			let id_base = `${binding.consumer.id}-${binding.consumer.property}`;

			let select = this._input_elements.get(`${id_base}-inputs-property`);
			if (select == undefined)
				select = this._output_elements.get(`${id_base}-outputs-property`);

			select.value = `${binding.provider.id}:${binding.provider.property}`;
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

		const inputs_el = createPropertyElement('inputs-property', 'Inputs');

		const input_add = document.createElement('span');
		input_add.innerHTML = '+';
		input_add.className = 'io-add';
		input_add.addEventListener('click', this.addInput.bind(this));
		inputs_el.appendChild(input_add);

		this._inputs = createEmptyInputContainer('inputs-property');
		inputs_el.appendChild(this._inputs);

		const outputs_el = createPropertyElement('outputs-property', 'Outputs');

		const output_add = document.createElement('span');
		output_add.innerHTML = '+';
		output_add.className = 'io-add';
		output_add.addEventListener('click', this.addOutput.bind(this));
		outputs_el.appendChild(output_add);

		this._outputs = createEmptyInputContainer('outputs-property');
		outputs_el.appendChild(this._outputs);

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
		this.appendChild(export_el);
	}

	_initHandlers() {
		this._urn.addEventListener('keyup', e => {
			this._node.urn = this._urn.value;
		});

		this._name.addEventListener('keyup', e => {
			this._node.name = this._name.value;
		});

		this._desc.addEventListener('keyup', e => {
			this._node.description = this._desc.value;
		});

		this._execution.addEventListener('change', e => {
			this._node.execution = this._execution.value;
		});

		this._operator.addEventListener('change', e => {
			this._node.operator = this._operator.value;
		});

		this._export.addEventListener('click', e => {
			const node = this._node;

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

function createSelect(id, options) {
	const input = document.createElement('select');
	input.setAttribute('id', id);

	options.forEach(option => {
		const opt_el = document.createElement('option');
		opt_el.value = option.value;
		opt_el.text = option.text;
		input.add(opt_el);
	});

	return input;
}


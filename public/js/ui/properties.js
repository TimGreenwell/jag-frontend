'use strict';

import GraphNode from '../graph/node.js';

export default class NodeProperties extends EventTarget {

	constructor(propreties_container) {
		super();
		this._container = propreties_container;
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
			this._node.model.removeEventListener('update-input', this._boundIOUpdate);
			this._node.model.removeEventListener('update-output', this._boundIOUpdate);
			this._node.model.removeEventListener('update-children', this._boundIOUpdate);
			this._node.model.removeEventListener('update-parent', this._boundIOUpdate);
		}

		this._clearProperties();
		this._enableProperties(selection.size != 0);

		if(selection.size == 1) {
			const node = selection.values().next().value;
			this._node = node;
			this._urn.value = node.model.urn;
			this._name.value = node.model.name;
			this._execution.value = node.model.execution || 'none';
			this._operator.value = node.model.operator || 'none';
			this._desc.value = node.model.description;

			this._updateIO();
			this._node.model.addEventListener('update-input', this._boundIOUpdate);
			this._node.model.addEventListener('update-output', this._boundIOUpdate);
			this._node.model.addEventListener('update-children', this._boundIOUpdate);
			this._node.model.addEventListener('update-parent', this._boundIOUpdate);
		}
	}

	addInput(e) {
		const name = window.prompt('Input name');
		if(name === null)
			return;
		
		const type = window.prompt('Input type');
		if (type == null)
			return;

		let options = undefined;
		if(this._node.model.parent)
			options = this.findInputOptions();

		const input = {
			name: name,
			type: type
		};

		const input_id = `${name}-inputs-property`;
		this.addInputElement(input_id, input, options);
		this._node.model.addInput(input);
	}

	addOutput(e) {
		const name = window.prompt('Output name');
		if(name === null)
			return;
		
		const type = window.prompt('Output type');
		if (type == null)
			return;

		let options = this.findOutputOptions();

		const output = {
			name: name,
			type: type
		};

		const output_id = `${name}-outputs-property`;
		this.addOutputElement(output_id, output, options);
		this._node.model.addOutput(output);
	}

	addInputElement(id, input, options) {
		const input_el = createPropertyElement(id, input.name);

		// only creates select element if option is defined
		if(options != undefined) {
			const select_el = createSelect(id, options);
			select_el.addEventListener('change', e => {
				const provider = e.target.selectedOptions[0].value.split(':');

				this._node.model.parent.addBinding({
					consumer: {
						id: this._node.model.id,
						property: input.name
					},
					provider: {
						id: provider[0],
						property: provider[1]
					}
				});
			});
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
			select_el.addEventListener('change', e => {
				const provider = e.target.selectedOptions[0].value.split(':');

				this._node.model.addBinding({
					consumer: {
						id: this._node.model.id,
						property: output.name
					},
					provider: {
						id: provider[0],
						property: provider[1]
					}
				});
			});
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

		this._node.model.parent.inputs.forEach((input) => {
			options.push({
				text: `${this._node.model.parent.name}:${input.name}`,
				value: `this:${input.name}`
			});
		});

		if (this._node.model.parent.execution == GraphNode.EXECUTION.SEQUENTIAL)
		{
			const index = this._node.model.parent.getOrderForId(this._node.model.id);

			this._node.model.parent.children.forEach(sibling => {
				if(sibling === this._node.model)
					return;
				
				if(this._node.model.parent.getOrderForId(sibling.id) > index)
					return;

				sibling.outputs.forEach((output) => {
					options.push({
						text: `${sibling.name}:${output.name}`,
						value: `${sibling.id}:${output.name}`
					});
				});
			});
		}

		return options;
	}

	findOutputOptions() {
		const options = [{
			text:'not bound',
			value:'not bound'
		}];

		this._node.model.children.forEach((child) => {
			child.outputs.forEach((output) => {
				options.push({
					text: `${child.name}:${output.name}`,
					value: `${child.id}:${output.name}`
				});
			});
		});

		return options;
	}

	_updateIO() {
		this._clearIO();

		let input_options = undefined;
		if(this._node.model.parent)
			input_options = this.findInputOptions();

		this._node.model.inputs.forEach(input => {
			const input_id = `${input.name}-inputs-property`;
			this.addInputElement(input_id, input, input_options);
		});

		const output_options = this.findOutputOptions();
		this._node.model.outputs.forEach(output => {
			const output_id = `${output.name}-outputs-property`;
			this.addOutputElement(output_id, output, output_options);
		});

		if(this._node.model.parent) {
			this._node.model.parent.bindings.forEach(binding => {
				if(this._node.model.id != binding.consumer.id)
					return;

				const in_property = binding.consumer.property;
				const select = this._input_elements.get(`${in_property}-inputs-property`);

				select.value = `${binding.provider.id}:${binding.provider.property}`;
			});
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
			value: GraphNode.EXECUTION.NONE,
			text: 'None'
		},{
			value: GraphNode.EXECUTION.SEQUENTIAL,
			text: 'Sequential'
		},{
			value: GraphNode.EXECUTION.PARALLEL,
			text: 'Parallel'
		}]);

		execution_el.appendChild(this._execution);

		const operator_el = createPropertyElement('operator-property', 'Operator');
		this._operator  = createSelect('operator-property', [{
			value: GraphNode.OPERATOR.NONE,
			text: 'None'
		},{
			value: GraphNode.OPERATOR.AND,
			text: 'And'
		},{
			value: GraphNode.OPERATOR.OR,
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

		this._container.appendChild(urn_el);
		this._container.appendChild(name_el);
		this._container.appendChild(desc_el);
		this._container.appendChild(execution_el);
		this._container.appendChild(operator_el);
		this._container.appendChild(inputs_el);
		this._container.appendChild(outputs_el);
		this._container.appendChild(export_el);
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
			const node = this._node.model;

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
		this._execution.value = GraphNode.EXECUTION.NONE;
		this._operator.value = GraphNode.OPERATOR.NONE;

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
		opt_el.text = option.text;
		input.add(opt_el);
	});

	return input;
}

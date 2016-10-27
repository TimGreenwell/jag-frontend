'use strict';

import Listenable from './listenable.js';

export default class IDE extends Listenable {
	constructor(ide_container) {
		super();
		this._container = ide_container;
		this._variables = new Map();
		this._inputs = this._container.querySelector('#behavior-inputs');
		this._actor = this._container.querySelector('#behavior-actor');
		this._instance_inputs = new Map();
		this._init();
	}

	handleConnection(event) {
		if(event.type == 'open') {
			this._handleNewConnection();
		} else if (event.type == 'error') {
			const progress = this._container.querySelector('#connect .button-progress');
			this._setFeedback('Connection failed ! Try accepting the certificate at this address <a href="https://localhost:8887">localhost</a>.', true);
			this._resetButtonProgress(progress);
		}
	}

	handleInfo(message) {
		let info = message.data;
		this._setFeedback(info);
	}

	handleError(message) {
		let error = 'An unknown error occurred. This should not happen.';
		if(message.data)
			error = message.data;

		this._setFeedback(error, true);
	}

	handleInputs(message) {
		message.data.sort();
		message.data.forEach(input => {
			const typed_input_set = this._getInputSetForVariableType(input.type);
			typed_input_set.add({
				id: input.id,
				name: input.name
			});
		});

		this._updateActorOptions();
	}

	handleSelectionUpdate(selection) {
		this._instance_inputs.clear();

		while(this._inputs.firstChild)
			this._inputs.removeChild(this._inputs.firstChild);

		if(selection.size == 1) {
			const node = selection.values().next().value;
			node.model.inputs.forEach(input => {
				if(this._variables.has(input.type))
					this.addSelectInputElement(input.name, this._variables.get(input.type))
				else
					this.addTextInputElement(input.name);
			});
		}
	}

	addTextInputElement(name) {
		const li = document.createElement('li');
		const label = document.createElement('label');
		const textfield = document.createElement('input');
		textfield.setAttribute('type', 'text');

		label.innerHTML = name;
		this._instance_inputs.set(name, textfield);

		li.appendChild(label);
		li.appendChild(textfield);
		this._inputs.appendChild(li);
	}

	addSelectInputElement(name, options) {
		const li = document.createElement('li');
		const label = document.createElement('label');
		const select = document.createElement('select');

		label.innerHTML = name;

		options.forEach(option => {
			const opt_el = document.createElement('option');
			opt_el.value = option.id;
			opt_el.text = option.name;
			select.add(opt_el);
		});

		select.addEventListener('change', e => {});

		this._instance_inputs.set(name, select);

		li.appendChild(label);
		li.appendChild(select);
		this._inputs.appendChild(li);
	}

	stop() {
		const icon = this._run.querySelector('.button-icon');
		icon.style.backgroundImage = 'url("icons/ic_play_arrow_black_24dp.png")';
	}


	_getInstanceActor() {
		return this._actor.value;
	}

	_getInputSetForVariableType(type) {
		if(!this._variables.has(type))
			this._variables.set(type, new Set());

		return this._variables.get(type);
	}

	_createInstanceProvider() {
		const provider = [];
		this._instance_inputs.forEach((select, key) => {
			provider.push({
				property: key,
				value: select.value
			});
		});

		return provider;
	}

	_init() {
		this._connect = this._container.querySelector('#connect');
		this._connect.addEventListener('click', e => {
			const progress = this._connect.querySelector('.button-progress');
			progress.style.transform = 'translateY(-120%) scaleX(0.25)';
			this.notify('connect');
		});

		this._upload = this._container.querySelector('#upload');
		this._upload.addEventListener('click', e => {
			const progress = this._upload.querySelector('.button-progress');
			progress.style.transform = 'translateY(-120%) scaleX(1.0)';
			setTimeout(this._resetButtonProgress.bind(this, progress), 1500);
			this.notify('upload');
		});

		this._run = this._container.querySelector('#run');
		this._run.addEventListener('click', e => {
			const icon = this._run.querySelector('.button-icon');
			// icon.style.backgroundImage = 'url("icons/ic_pause_black_24dp.png")';
			const provider = this._createInstanceProvider();
			const actor = this._getInstanceActor();
			const instance_data = {
				'inputs': provider,
				'actor': actor
			};

			this.notify('run', instance_data);
		});

		this._feedback = this._container.querySelector('#ide-feedback');
	}

	_handleNewConnection() {
		const progress = this._connect.querySelector('.button-progress');
		const icon = this._connect.querySelector('.button-icon');
		icon.style.backgroundImage = "url('icons/ic_engine_black_24dp.png')";
		progress.style.transform = 'translateY(-120%) scaleX(1.0)';
		setTimeout(this._resetButtonProgress.bind(this, progress), 1500);
		this._setFeedback('Connection successfull');
	}

	_resetButtonProgress(button) {
		button.addEventListener('animationend', () => {
			button.classList.remove('progress-reset');
			button.style.transform = 'translateY(-120%) scaleX(0.0)';
		});

		button.classList.add('progress-reset');
	}

	_setFeedback(msg, error = false) {
		this._feedback.innerHTML = msg;
		if(error)
			this._feedback.classList.add('error');
		else
			this._feedback.classList.remove('error');
	}

	_updateActorOptions() {
		// Clear the current options
		while(this._actor.firstChild)
			this._actor.removeChild(this._actor.firstChild);

		// Add all the actors available
		const available_actors = this._getInputSetForVariableType('actor');
		available_actors.forEach(actor => {
			const opt_el = document.createElement('option');
			opt_el.value = actor.id;
			opt_el.text = actor.name;
			this._actor.add(opt_el);
		});
	}
}


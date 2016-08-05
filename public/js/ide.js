'use strict';

import Listenable from './listenable.js';

export default class IDE extends Listenable {
	constructor(ide_container) {
		super();
		this._container = ide_container;
		this._variables = new Set();
		this._inputs = this._container.querySelector('#ide-inputs');
		this._instance_inputs = new Map();
		this._init();
	}

	handleConnection(event) {
		if(event.type == 'open') {
			this._handleNewConnection();
		} else if (event.type == 'error') {
			const progress = this._container.querySelector('#connect .button-progress');
			this._setFeedback('Connection failed', true);
			this._resetButtonProgress(progress);
		}
	}

	handleError(event) {
		let msg = 'An unknown error occurred. This should not happen.';
		if(event.data)
			msg = event.data;

		this._setFeedback(msg, true);
	}

	handleInputs(data) {
		data.inputs.sort();
		data.inputs.forEach(input => {
			this._variables.add(input);
		});
	}

	handleSelectionUpdate(selection) {
		this._instance_inputs.clear();
		while(this._inputs.firstChild)
			this._inputs.removeChild(this._inputs.firstChild);

		if(selection.size == 1) {
			const node = selection.values().next().value;

			node.model.inputs.forEach(input => {
				this.addInputElement(input, this._variables);
			});
		}
	}

	addInputElement(name, options) {
		const li = document.createElement('li');
		const label = document.createElement('label');
		const select = document.createElement('select');

		label.innerHTML = name;

		options.forEach(option => {
			const opt_el = document.createElement('option');
			opt_el.value = option;
			opt_el.text = option;
			select.add(opt_el);
		});

		select.addEventListener('change', e => {});

		this._instance_inputs.set(name, select);

		li.appendChild(label);
		li.appendChild(select);
		this._inputs.appendChild(li);
	}

	_createInstanceProvider() {
		const provider = [];
		this._instance_inputs.forEach((select, key) => {
			provider.push({
				property: key,
				name: select.value
			});
		});

		return provider;
	}

	_init() {
		this._connect = this._container.querySelector('#connect');
		this._connect.addEventListener('click', e => {
			const progress = this._connect.querySelector('.button-progress');
			progress.style.transform = 'translateY(-100%) scaleX(0.25)';
			this.notify('connect');
		});

		this._upload = this._container.querySelector('#upload');
		this._upload.addEventListener('click', e => {
			const progress = this._upload.querySelector('.button-progress');
			progress.style.transform = 'translateY(-100%) scaleX(1.0)';
			setTimeout(this._resetButtonProgress.bind(this, progress), 1500);
			this.notify('upload');
		});

		this._run = this._container.querySelector('#run');
		this._run.addEventListener('click', e => {
			const icon = this._run.querySelector('.button-icon');
			icon.style.backgroundImage = 'url("/icons/pause.png")';
			const provider = this._createInstanceProvider();
			this.notify('run', provider);
		});

		this._feedback = this._container.querySelector('#ide-feedback');
	}

	_handleNewConnection() {
		const progress = this._connect.querySelector('.button-progress');
		const icon = this._connect.querySelector('.button-icon');
		icon.style.backgroundImage = "url('/icons/connected.png')";
		progress.style.transform = 'translateY(-100%) scaleX(1.0)';
		setTimeout(this._resetButtonProgress.bind(this, progress), 1500);
		this._setFeedback('Connection successfull');
	}

	_resetButtonProgress(button) {
		button.addEventListener('animationend', () => {
			button.classList.remove('progress-reset');
			button.style.transform = 'translateY(-100%) scaleX(0.0)';
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

}


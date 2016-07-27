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

	handleNewConnection() {
		const progress = this._connect.querySelector('.button-progress');
		const icon = this._connect.querySelector('.button-icon');
		icon.style.backgroundImage = "url('/icons/connected.png')";
		progress.style.transform = 'translateY(-100%) scaleX(1.0)';
		setTimeout(() => {
			progress.addEventListener('animationend', () => {
				progress.classList.remove('progress-reset');
				progress.style.transform = 'translateY(-100%) scaleX(0.0)';
			});
			progress.classList.add('progress-reset');

		}, 2000);
	}

	handleInputs(data) {
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
			setTimeout(() => {
				progress.addEventListener('animationend', () => {
					progress.classList.remove('progress-reset');
					progress.style.transform = 'translateY(-100%) scaleX(0.0)';
				});
				progress.classList.add('progress-reset');
			},2000);
			this.notify('upload');
		});

		this._run = this._container.querySelector('#run');
		this._run.addEventListener('click', e => {
			const icon = this._run.querySelector('.button-icon');
			icon.style.backgroundImage = 'url("/icons/pause.png")';

			const provider = this._createInstanceProvider();
			this.notify('run', provider);
		});
	}
}


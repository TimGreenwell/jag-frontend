export default class Popupable extends HTMLElement {
    constructor() {
        super();

		this._content = document.createElement('div');
		this._content.className = "popup-box";
		this._content.style.visibility = "hidden";
		this.appendChild(this._content);

		this._popups = [];
		this._popupHighlights = [];
		this._popupOutputs = {};
    }

	static _createPopup({type, name, description, properties, actions, fallback, skip}) {
		const _p = document.createElement("p");
		_p.classList.add("popup-content");
		_p.classList.add(type);

		const _name = document.createElement("span");
		_name.className = "popup-name";

		if (typeof name === 'string') _name.innerText = name;
		else _p.$name = (inputs) => _name.innerText = name(inputs);

		const _description = document.createElement("span");
		_description.className = "popup-description";

		if (typeof description === 'string') _description.innerText = description;
		else _p.$description = (inputs) => _description.innerText = description(inputs);

		_p.append(_name, _description);

		_p.setAttributeNS(null, 'popup-type', type);

		return { type: type, display: _p, properties: properties, actions: actions, fallback: fallback, skip: skip };
	}

	async _displayNextPopup() {
		if (this._popupCallback) {
			await this._popupCallback({outputs: this._popupOutputs});
		}

		for (let highlight of this._popupHighlights) {
			highlight.classList.remove(`${this._activePopup.content.type}-highlight`);
		}

		this._popupHighlights = [];

		let displayNext = true, displayThis = true;

		if (this._popups.length > 0) {
			this._activePopup = this._popups.splice(0, 1)[0];

			if (!this._popups) this._popups = [];

			const {content, trackEl, callback, properties, inputs, highlights} = this._activePopup;
			const loc = trackEl.getBoundingClientRect();
			const ix = loc.x, iy = loc.y, width = loc.width;

			this._content.innerHTML = "";

			const data = { inputs: inputs, outputs: this._popupOutputs };

			if (content.skip) {
				if (content.skip(data)) {
					if (properties) {
						for (const property in properties)
							this._popupOutputs[property] = properties[property].value;

						data.outputs = this._popupOutputs;
					}

					let result;

					if (content.fallback != undefined) {
						if (typeof content.fallback === 'number') {
							const boundAction = content.actions[content.fallback].action.bind(this);
							result = await boundAction(data);
						} else {
							result = await content.fallback(data);
						}
					} else if (callback) {
						this._popupCallback = callback;
					}

					if (result) {
						for (const output in result) {
							this._popupOutputs[output] = result[output];
						}
					}

					displayThis = false;
				}
			}

			if (displayThis) {
				displayNext = false;

				if (content.display.$name) content.display.$name(inputs);
				if (content.display.$description) content.display.$description(inputs);

				this._content.appendChild(content.display);

				const {x, y} = this._popupBounds.getBoundingClientRect();
				this._content.style.left = (ix - x + (width / 2) - 100) + "px";
				this._content.style.top = (iy - y + 50) + "px";

				trackEl.addEventListener('change-position', (e) => {
					const newLoc = trackEl.getBoundingClientRect();
					const nx = newLoc.x, ny = newLoc.y;
					this._content.style.left = (nx - x + (width / 2) - 100) + "px";
					this._content.style.top = (ny - y - 160) + "px";
				});

				this._popupHighlights = highlights;

				for (let highlight of highlights) {
					highlight.classList.add(`${content.type}-highlight`);
				}

				if (!this._popupInterval && !content.actions) {
					this._popupInterval = setInterval(this._displayNextPopup.bind(this), 4000);
				} else if (this._popupInterval && content.actions) {
					clearInterval(this._popupInterval);
					this._popupInterval = undefined;
				}

				if (content.properties) {
					this._activePopup.properties = {};

					for (const {name, label, type, value = null, options = null} of content.properties) {
						const $label = document.createElement('label');
						$label.setAttribute('for', name);
						$label.innerHTML = label;

						let input_el = 'input';
						if (type === 'select') input_el = 'select';
						if (type === 'textarea') input_el = 'textarea';

						const $input = document.createElement(input_el);
						$input.setAttribute('name', name);

						if (input_el === 'input')
							$input.setAttribute('type', type);

						if (options) {
							let roptions = options;

							if (typeof options !== 'array')
								roptions = await options(data);

							if (type === 'select') {
								for (const {text, value} of roptions) {
									const $option = document.createElement('option');
									$option.setAttribute('value', value);
									$option.innerHTML = text;

									$input.appendChild($option);
								}
							}
						}

						if (value) $input.setAttribute('value', value);

						this._content.appendChild($label);
						this._content.appendChild($input);

						this._activePopup.properties[name] = $input;
					}
				}

				if (content.actions) {
					for (const {text, color, bgColor, action} of content.actions) {
						const boundAction = action ? action.bind(this) : undefined;
						const actionBtn = document.createElement('button');
						actionBtn.className = "popup-action";
						actionBtn.innerText = text;

						if (color) actionBtn.style.color = color;
						if (bgColor) actionBtn.style.backgroundColor = bgColor;

						actionBtn.onclick = async function () {
							let result;

							if (this._activePopup.properties) {
								for (const property in this._activePopup.properties)
									this._popupOutputs[property] = this._activePopup.properties[property].value;

								data.outputs = this._popupOutputs;
							}

							if (boundAction)
								result = await boundAction(data);

							if (result) {
								for (const output in result) {
									this._popupOutputs[output] = result[output];
								}
							}

							this._displayNextPopup();
						}.bind(this);

						this._content.appendChild(actionBtn);
					}
				} else if (callback) {
					this._popupCallback = callback;
				}

				this._content.style.visibility = "visible";
			}
		}

		if (displayNext) {
			if (this._popupInterval) {
				clearInterval(this._popupInterval);
				this._popupInterval = undefined;
			}

			this._popupCallback = undefined;

			this._activePopup = undefined;

			this._content.style.visibility = "hidden";
		}
	}

	setPopupBounds(bounds) {
		this._popupBounds = bounds;
	}

	popup({ content, trackEl, callback, inputs = {}, highlights = [] }) {
		this._popups.push({
			content: content,
			trackEl: trackEl,
			callback: callback,
			inputs: inputs,
			highlights: highlights
		});

		if (!this._popupInterval && !this._activePopup) {
			this._displayNextPopup();
		}
	}
}
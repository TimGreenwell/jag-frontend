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

	static _createPopup({type, name, description, actions, fallback, skip}) {
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

		return { type: type, display: _p, actions: actions, fallback: fallback, skip: skip };
	}

	async _displayNextPopup() {
		if (this._popupCallback) {
			await this._popupCallback();
			this._popupOutputs = {};
		}

		for (let highlight of this._popupHighlights) {
			highlight.classList.remove(`${this._activePopup.content.type}-highlight`);
		}

		this._popupHighlights = [];

		let displayNext = true, displayThis = true;

		if (this._popups.length > 0) {
			this._activePopup = this._popups.splice(0, 1)[0];

			if (!this._popups) this._popups = [];

			const {content, trackEl, callback, inputs, highlights} = this._activePopup;
			const loc = trackEl.getBoundingClientRect();
			const ix = loc.x, iy = loc.y, width = loc.width;

			this._content.innerHTML = "";

			if (content.skip) {
				if (content.skip({ inputs: inputs, outputs: this._popupOutputs })) {
					if (content.fallback != undefined) {
						if (typeof content.fallback === 'number') {
							const boundAction = content.actions[content.fallback].action.bind(this);

							let result;

							if (callback) {
								result = await boundAction(callback());
							} else {
								result = await boundAction();
							}

							if (result) {
								for (const output in result) {
									outputs[output] = result[output];
								}
							}
						} else {
							if (callback) {
								content.fallback(callback());
							} else {
								content.fallback();
							}
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

							if (boundAction) {
								if (callback) {
									result = await boundAction(callback());
								} else {
									result = await boundAction();
								}
							} else if (callback) {
								result = await callback();
							}

							if (result) {
								for (const output in result) {
									outputs[output] = result[output];
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
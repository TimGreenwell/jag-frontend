export default class Popupable extends HTMLElement {
    constructor() {
        super();

		this._content = document.createElement('div');
		this._content.className = "popup-box";
		this._content.style.visibility = "hidden";
		this.appendChild(this._content);

		this._popups = [];
		this._popupHighlights = [];
    }

	static _createPopup(type, name, description, actions) {
		const _p = document.createElement("p");
		_p.classList.add("popup-content");
		_p.classList.add(type);

		const _name = document.createElement("span");
		_name.className = "popup-name";
		_name.innerText = name;

		const _description = document.createElement("span");
		_description.className = "popup-description";
		_description.innerText = description;

		_p.append(_name, _description);

		_p.setAttributeNS(null, 'popup-type', type);

		return { type: type, display: _p, actions: actions };
	}

	_displayNextPopup() {
		if (this._popupCallback) {
			this._popupCallback();
		}

		for (let highlight of this._popupHighlights) {
			highlight.classList.remove(`${this._activePopup.content.type}-highlight`);
		}

		this._popupHighlights = [];

		if (this._popups.length > 0) {
			this._activePopup = this._popups.splice(0, 1)[0];

			if (!this._popups) this._popups = [];

			const {content, trackEl, callback, highlights} = this._activePopup;
			const loc = trackEl.getBoundingClientRect();
			const ix = loc.x, iy = loc.y, width = loc.width;

			this._content.innerHTML = "";
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

					actionBtn.onclick = function () {
						if (boundAction) {
							if (callback) {
								boundAction(callback());
							} else {
								boundAction();
							}
						} else {
							callback();
						}

						this._displayNextPopup();
					}.bind(this);

					this._content.appendChild(actionBtn);
				}
			} else if (callback) {
				this._popupCallback = callback;
			}

			this._content.style.visibility = "visible";
		} else {
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

	popup(content, trackEl, callback, highlights = []) {
		this._popups.push({
			content: content,
			trackEl: trackEl,
			callback: callback,
			highlights: highlights
		});

		if (!this._popupInterval && !this._activePopup) {
			this._displayNextPopup();
		}
	}
}
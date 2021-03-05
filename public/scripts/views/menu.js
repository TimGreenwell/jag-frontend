/**
 * @file Configuration/settings menu for Authoring Tool.
 *
 * @author cwilber
 * @copyright Copyright © 2021 IHMC, all rights reserved.
 * @version 0.23
 */


customElements.define('jag-menu', class extends HTMLElement {

	constructor() {
		super();

		this.$left = null;
		this.$right = null;

		this._initUI();
	}

	_createMenuItem(id, img, text) {
		const $el = document.createElement("span");
		$el.id = `menu-${id}`;
		$el.classList.add("menu-item");

		if (img) {
			const $img = document.createElement("img");
			$img.src = img;
			$el.appendChild($img);
		}

		if (text) {
			const $text = document.createElement("span");
			$text.innerText = text;
			$el.appendChild($text);
		}

		return $el;
	}

	_initUI() {
		const $body = document.createElement("ul");

		const $left_outer = document.createElement("li");
		const $left = document.createElement("div");
		$left_outer.appendChild($left);

		const $header = this._createMenuItem("header", null, "JAG Authoring Tool");
		$left.appendChild($header);

		const $center_outer = document.createElement("li");
		const $center = document.createElement("div");
		$center_outer.appendChild($center);

		const $right_outer = document.createElement("li");
		const $right = document.createElement("div");
		$right_outer.appendChild($right);

		const $clear = this._createMenuItem("clear", null, "Clear");

		$clear.addEventListener('click', function (e) {
			this.dispatchEvent(new CustomEvent("item-selected", { "detail": { "action": "clear" } }));
		}.bind(this));

		$center.appendChild($clear);

		$body.appendChild($left_outer);
		$body.appendChild($center_outer);
		$body.appendChild($right_outer);

		this.$left = $left;
		this.$center = $center;
		this.$right = $right;

		this.appendChild($body);
	}
});

export default customElements.get('jag-menu');


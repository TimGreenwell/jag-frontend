/**
 * @file Configuration/settings menu for Authoring Tool.
 *
 * @author cwilber
 * @copyright Copyright © 2021 IHMC, all rights reserved.
 * @version 0.23
 */

import JAG from '../models/jag.js';
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
		const $ul = document.createElement("ul");
		//
		//    The left section containing the application name "JAG Authoring Tool"
		//
		const $leftLi = document.createElement("li");
		$ul.appendChild($leftLi);

		const $leftLiDiv = document.createElement("div");
		$leftLi.appendChild($leftLiDiv);

		const $title = document.createElement("span");
		$title.id = "menu-title";
		$title.classList.add("menu-item");
		$title.innerText = "JAG Authoring Tool";
		$leftLiDiv.appendChild($title);

		//
		// The center section containing the menu options (Currently: Clear)
		//
		const $centerLi = document.createElement("li");
		$ul.appendChild($centerLi);

		const $centerLiDiv = document.createElement("div");
		$centerLi.appendChild($centerLiDiv);

		const $new = document.createElement("span");
		$new.id = "menu-new";
		$new.classList.add("menu-item");
		$new.innerText = "new\nnode";
		$centerLiDiv.appendChild($new);


		$new.addEventListener('click', function (e) {
			this.dispatchEvent(new CustomEvent('add-new-node-to-playground', {
				detail: {
					model: new JAG({ name: " New ", description: "" }),
					model_set: [],
					expanded: false
				}
			}));

		}.bind(this));


		const $clear = document.createElement("span");
		$clear.id = "menu-clear";
		$clear.classList.add("menu-item");
		$clear.innerText = "clear\nspace";
		$centerLiDiv.appendChild($clear);
		$clear.addEventListener('click', function (e) {
			this.dispatchEvent(new CustomEvent("clear-playground", { "detail": { "action": "clear" } }));
		}.bind(this));

		const $delete = document.createElement("span");
		$delete.id = "menu-delete";
		$delete.classList.add("menu-item");
		$delete.innerText = "delete\nnode";
		$centerLiDiv.appendChild($delete);
		$delete.addEventListener('click', function (e) {
			this.dispatchEvent(new CustomEvent("item-selected", { "detail": { "action": "delete" } }));
		}.bind(this));

		//
		// The right section containing the IHMC logo
		//
		const $rightLi = document.createElement("li");
		$ul.appendChild($rightLi);

		const $rightLiDiv = document.createElement("div");
		$rightLiDiv.classList.add("menu-item");
		$rightLi.appendChild($rightLiDiv);

		const $logoImage = document.createElement("img");
		$logoImage.classList.add("menu-item");
		$logoImage.id = "menu-logo";
		$logoImage.setAttribute('src',"icons/ihmc_logo.png");  //@TODO put in css
		$rightLiDiv.appendChild($logoImage);

		this.appendChild($ul);

		this.$leftLiDiv = $leftLiDiv;
		this.$centerLiDiv = $centerLiDiv;
		this.$rightLiDiv = $rightLiDiv;


	}
});

// 	_initUI() {
// 		const $body = document.createElement("ul");
//
// 		const $left_outer = document.createElement("li");
// 		const $left = document.createElement("div");
// 		$left_outer.appendChild($left);
//
// 		const $header = this._createMenuItem("header", null, "JAG Authoring Tool");
// 		$left.appendChild($header);
//
// 		const $center_outer = document.createElement("li");
// 		const $center = document.createElement("div");
// 		$center_outer.appendChild($center);
//
// 		const $right_outer = document.createElement("li");
// 		const $right = document.createElement("div");
// 		$right_outer.appendChild($right);
//
// 		const $clear = this._createMenuItem("clear", null, "Clear");
//
// 		$clear.addEventListener('click', function (e) {
// 			this.dispatchEvent(new CustomEvent("item-selected", { "detail": { "action": "clear" } }));
// 		}.bind(this));
//
// 		$center.appendChild($clear);
//
// 		$body.appendChild($left_outer);
// 		$body.appendChild($center_outer);
// 		$body.appendChild($right_outer);
//
// 		this.$left = $left;
// 		this.$center = $center;
// 		this.$right = $right;
//
// 		this.appendChild($body);
// 	}
// });

export default customElements.get('jag-menu');


/**
 * @fileOverview DOM Manipulation Utilities
 *
 * @author mvignati
 * @version 0.01
 */

'use strict';

export default class DOMUtils {


	static create(description) {
		const element = document.createElement(description.type);
		for(let attribute in description.attributes)
			element.setAttribute(attribute, description.attributes[attribute]);

		if(description.children) {
			for(let child of description.children) {
				const child_element = DOMUtils.create(child);
				element.appendChild(child_element);
			}
		}

		return element;
	}

	// Select the text in $node
	static selectNodeText($node) {
		console.log("VVVVVVVVVVVVVVVVVVVVVVVVVV")
		console.log($node)

		const selection = window.getSelection();
		console.log("a")
		const range = document.createRange();
		console.log("b")
		selection.removeAllRanges();
		console.log("c")
		range.selectNodeContents($node);
		console.log("d")
		selection.addRange(range);      // <    dom.js:41 addRange(): The given range isn't in document.
		console.log(selection)
		console.log(range)
		console.log("e")
		console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^")
	}

}

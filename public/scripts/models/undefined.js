// /**
//  * @file JAG model.
//  *
//  * @author mvignati
//  * @copyright Copyright © 2019 IHMC, all rights reserved.
//  * @version 0.2
//  */
//
// import JAG from '../models/jag.js';
//
// export default class UndefinedJAG extends EventTarget {
//
// 	constructor(urn) {
// 		super();
//
// 		this._urn = urn;
// 	}
//
// 	get urn() {
// 		return this._urn;
// 	}
//
// 	get name() {
// 		return "Undefined";
// 	}
//
// 	get description() {
// 		return "This URN has no model available.";
// 	}
//
// 	get execution() {
// 		return JAG.EXECUTION.NONE;
// 	}
//
// 	get operator() {
// 		return JAG.OPERATOR.NONE;
// 	}
//
// 	get children() {
// 		return [];
// 	}
//
// 	get inputs() {
// 		return [];
// 	}
//
// 	get outputs() {
// 		return [];
// 	}
//
// 	get bindings() {
// 		return [];
// 	}
//
// 	/* TODO: consider throwing exceptions when properties are modified */
//
// 	defined(model) {
// 		this.dispatchEvent(new CustomEvent('define', { "detail": { "urn": this._urn, "model": model }}));
// 	}
// }
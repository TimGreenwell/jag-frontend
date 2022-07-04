/**
 * @fileOverview Agent model.
 *
 * @version 0.01
 */

'use strict';


export default class Subscription extends EventTarget {

	constructor({ name , lastReportTime = null, lastReportedCode = null } = {}) {
		super();
		this._name = name;
		this._lastReportTime = lastReportTime;
		this._lastReportedCode = lastReportedCode;
	}


	get name() {
		return this._name;
	}

	set name(value) {
		this._name = value;
	}

	get lastReportTime() {
		return this._lastReportTime;
	}

	set lastReportTime(value) {
		this._lastReportTime = value;
	}

	get lastReportedCode() {
		return this._lastReportedCode;
	}

	set lastReportedCode(value) {
		this._lastReportedCode = value;
	}

	static fromJSON(json) {
		return new Subscription(json);
	}

	toJSON() {
		let json = {
			name: this._name,
			lastReportTime: this._lastReportTime,
			lastReportedCode: this._lastReportedCode
		};
		return json;
	}
}


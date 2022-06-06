/**
 * @fileOverview DOM Manipulation Utilities
 *
 * @author mvignati
 * @version 0.01
 */

'use strict';

export default class UserPrefs {


	static defaultUrnPrefix = "";

	static getDefaultUrn(name) {
		console.log("Setting Prefix+name.............................")
		console.log(this.defaultUrnPrefix + name)
		return this.defaultUrnPrefix + name;
	}

	static getDefaultUrnPrefix() {
		console.log("Getting Prefix.............................")
		console.log(this.defaultUrnPrefix)
		return this.defaultUrnPrefix;
	}

	static setDefaultUrnPrefix(urnPrefix) {
		this.defaultUrnPrefix = urnPrefix;
	}

	static setDefaultUrnPrefixFromUrn(urn) {
		console.log("Setting Prefix.......from URN......................")
		this.defaultUrnPrefix = urn.split(':').slice(0, -1).join(':') + ":";
		console.log(this.defaultUrnPrefix)
	}



}

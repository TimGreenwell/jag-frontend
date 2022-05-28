/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

// These are the

'use strict';

import { UUIDv4 }  from '../utils/uuid.js';
import JAG from './jag.js';
import StorageService from '../services/storage-service.js';
import JAGATValidation from '../utils/validation.js';

// node (with view/jag)  = at's jag-node       -- both syn with JAG model
export default class Node extends EventTarget {

	constructor({ id = UUIDv4(), jag, color, link_status = true, collapsed = false, is_root = false } = {}) {
		super();
		this._id = id;                       // An assigned unique ID given at construction
		this._jag = jag;                     // The Jag Model representing this node

		this._children = new Array();            // Links to actual children [objects]
		this._parent = undefined;            // Link to parent object
//		this._isValid = false;               // passes validation. //? even needed?


		this._link_status = link_status;     // dont know what this is.
		this._color = color;                 // Derived color
		this._collapsed = collapsed;         // Collapsed (table) or folded in (graph)

		this._breadth = 1;                   // Analysis dependent condition  -- Should move to Analysis eventually
		this._height = 0;                    // Analysis dependent condition  -- Should move to Analysis eventually
	}

	get id() {
		return this._id;
	}
	set id(value) {
		this._id = value;
	}
	get jag() {
		return this._jag;
	}
	set jag(value) {
		this._jag = value;
	}
	hasChildren() {
		return (this.children.length !== 0);
	}
	get children() {
		return this._children;
	}
	set children(value) {
		this._children = value;
	}
	addChild(node){                              // moved to controller
		if (this.canHaveChildren) {
			const child = new Node();
			this._children.push(node);
			node.parent = this;
		} else {
			alert("Node must first be assigned a valid URN")
		}
	}
	getLastChild(){
		return this._children[this.children.length - 1]
	}
	get canHaveChildren() {
		return ((this.jag !== undefined) && (JAGATValidation.isValidUrn(this.jag.urn)));
	}



	get parent() {
		return this._parent;
	}
	set parent(parent) {
		this._parent = parent;
	}

	get linkStatus() {
		return this._link_status;
	}
	set linkStatus(value) {
		this._link_status = value;
	}

	get color() {
		return this._color;
	}
	set color(value) {
		this._color = value;
	}

	get collapsed() {
		return this._collapsed;
	}
	set collapsed(collapsed) {
		this._collapsed = collapsed;
	}
	toggleCollapse() {
		this.collapsed = !this.collapsed;
		// 2 dispatches here - 1 listener in views/Analysis
		this.dispatchEvent(new CustomEvent('layout'));
	}

	get breadth() {
		return this._breadth;
	}
	set breadth(value) {
		this._breadth = value;
	}
	get height() {
		return this._height;
	}
	set height(value) {
		this._height = value;
	}

	get name() {
		return (this.jag === undefined) ? Node.DEFAULT_JAG_NAME : this.jag.name;
	}
	get urn() {
		return (this.jag === undefined) ? Node.default_urn : this.jag.urn;
	}


	isRoot() {
		return this.parent === undefined;
	}         // is determined by lack of parent.


	// Number of children for a particular node.
	get childCount() {
		return this._children.length;
	}





	toJSON() {
		const json = {
			id: this._id,
			jag: this.urn,
			color: this._color,
			link_status: this._link_status,
			collapsed: this._collapsed
		};
		json.children = this._children.map(child => child.id);
		return json;
	}

	static async fromJSON(json) {
		// Replaces the id with the actual jag model.
		//const jag = await JAGService.instance('idb-service').get(json.jag);

		const jag = await StorageService.get(json.jag,'jag');
		if (jag instanceof JAG) {
			json.jag = jag;
		}
		else {
			json.jag = undefined;
		}
		//json.jag = (jag != null) ? jag : undefined;

		const node = new Node(json);

		// // @TODO: Can we lazy load these ?
		// const promisedChildren = json.children.map(async child_node_id => {
		// 	const child = await StorageService.get(child_node_id,'jag');
		// 	return child;
		// });
		//
		// const children = await Promise.all(promisedChildren);
		// children.forEach(child => {
		// 	if(child === undefined)
		// 		child = new Node();
		// 	node.addChild(child);
		// });

		return node;
	}



}

Node.DEFAULT_JAG_NAME = 'Activity';
Node.default_urn = 'us:ihmc:';


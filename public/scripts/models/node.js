/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.52
 */

'use strict';

import { UUIDv4 }  from '../utils/uuid.js';

import JAG from './jag.js';
import JAGService from '../services/jag.js';
import NodeService from '../services/node.js';
import JAGATValidation from '../utils/validation.js';

export default class Node extends EventTarget {

	constructor({ id = UUIDv4(), jag, color, link_status = true, collapsed = false, is_root = false } = {}) {
		super();
		this._id = id;
		this._jag = jag;
		this._color = color;
		this._link_status = link_status;
		this._collapsed = collapsed;
		this._is_root = is_root;

		// Transient properties
		this._parent = undefined;
		this._breadth = 1;
		this._height = 0;
		this._children = Array();
	}

	static async fromJSON(json) {
		// Replaces the id with the actual jag model.
		const jag = await JAGService.instance('idb-service').get(json.jag);
		json.jag = jag;

		const node = new Node(json);

		// @TODO: Can we lazy load these ?
		const children = json.children.map(child_node_id => {
			return NodeService.instance('idb-service').get(child_node_id);
		});

		(await Promise.all(children)).forEach(child => {
			if(child === undefined)
				child = new Node();

			node.addChild(child);
		});

		return node;
	}

	get id() {
		return this._id;
	}

	get children() {
		return this._children;
	}

	get breadth() {
		return this._breadth;
	}

	get height() {
		return this._height;
	}

	get collapsed() {
		return this._collapsed;
	}

	set collapsed(collapsed) {
		this._collapsed = collapsed;
	}

	get isRoot()  {
		return this._is_root;
	}

	get jag() {
		return this._jag;
	}

	get name() {
		return (this.jag === undefined) ? Node.DEFAULT_JAG_NAME : this.jag.name;
	}

	get urn() {
		return (this.jag === undefined) ? '' : this.jag.urn;
	}


	get linkStatus() {
		return this._link_status;
	}

	get parent() {
		return this._parent;
	}

	set parent(parent) {
		this._parent = parent;
	}

	/**
	 * Recursively get the left most leaf from this node
	 */
	get lastLeaf() {
		if(this._children.length === 0)
			return this;

		return this._children[this._children.length - 1].lastLeaf;
	}

	get childCount() {
		return this._children.length;
	}

	get canHaveChildren() {
		return true;//this.jag !== undefined;// && this.jag.hasValidURN;
	}

	newChild() {
		// @TODO: Show user feedback message when trying to create a child on an usaved jag.
		if(!this.canHaveChildren)
			return;

		const child = new Node();
		NodeService.instance('idb-service').create(child);
		this.addChild(child);
	}

	addChild(child, layout = true) {
		child.parent = this;
		this._children.push(child);

		this.dispatchEvent(new CustomEvent('attach', { detail: {
			target: child,
			reference: this,
			layout: layout
		}}));

		this.save();
		this.dispatchEvent(new CustomEvent('sync'));
	}

	deleteChild(child) {
		const index = this._children.indexOf(child);
		this._children.splice(index, 1);

		this.save();
		this.dispatchEvent(new CustomEvent('sync'));
	}

	deleteAllChildren() {
		const safe_children_list = this.children.slice();
		safe_children_list.forEach(child => {
			child.deleteAllChildren();
			this.dispatchEvent(new CustomEvent('detach', { detail: {
				target: child,
				layout: false
			}}));
		});

		this._children = [];
		this.dispatchEvent(new CustomEvent('sync'));
	}

	delete() {
		this.deleteAllChildren();
		this.parent.deleteChild(this);
		this.dispatchEvent(new CustomEvent('detach', { detail: {
			target: this
		}}));
	}

	unlink() {
		this._link_status = false;
	}

	toggleCollapse() {
		this._collapsed = !this._collapsed;
		this.dispatchEvent(new CustomEvent('layout'));
	}

	async commitNameChange(view) {
		if (this.linkStatus)
			await this.syncJAG(view, false);
		else
			this.jag.name = view.name;
	}

	syncView() {
		this.dispatchEvent(new CustomEvent('sync'));
	}

	/**
	 * Synchronizes the display values with the underlying jag model.
	 * Actions could be, load a new jag model, create a new jag model or change the name of the current jag.
	 */
	async syncJAG(view, replace = true) {
		const urn = view.urn;
		const name = view.name;

		// If the urn is not valid just notify and revert to previous state
		// @TODO: Implement the notification.
		try {
			JAGATValidation.validateURN(urn);
		} catch (e) {
			this.syncView();
			return;
		}

		let jag = await JAGService.instance('idb-service').get(urn);

		// If the model does not exists create one from the view values.
		// if the model does exists, reset to previous state unless replace is true.
		if (!jag) {
			jag = new JAG({
				urn: urn,
				name: name
			});
			
			await JAGService.instance('idb-service').create(jag);
		} else if (!replace) {
			// If the jag already exists we want to abort unless replace is set to true.
			//@TODO: notify the user why this is prevented and how to go about doing it (edit the urn manually).
			// Potentially we could ask the user if s/he wants to load the existing jag.
			this.syncView();
			return;
		}

		this._updateJAG(jag);

		const valid = true;//this.jag.hasValidURN;
		view.valid = valid;
		if(valid)
			this.unlink();

		this.dispatchEvent(new CustomEvent('layout'));
	}


	update() {
		this._breadth = 1;
		this._height = 0;

		if(this._children.length !== 0 && !this._collapsed)
		{
			this._breadth = 0;
			let max_height = 0;

			for(let child of this._children) {
				child.update();
				this._breadth += child.breadth;
				max_height = Math.max(max_height, child.height);
			}

			this._height = max_height + 1;
		}
	}

	async save() {
		await NodeService.instance('idb-service').update(this);

		//if(!this.hasValidURN)
			//return;

		// Replapce with JAGNodeService
		// return JAGService.store(this);
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

	async _createChildren() {
		for(let child_urn of this.jag.children) {
			const jag = await JAGService.instance('idb-service').get(child_urn);
			const model = new Node({
				jag: jag
			});

			this.addChild(model, false);
		}
	}

	_updateJAG(jag) {
		this._jag = jag;
		this.save();
		this.syncView();
		this.deleteAllChildren();

		//this._createChildren();
	}

}

Node.DEFAULT_JAG_NAME = 'Activity';


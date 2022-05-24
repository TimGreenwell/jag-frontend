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
		this._isRoot = is_root;
		this._children = Array();            // Links to children []
		this._parent = undefined;            // Link to parent
		this._isValid = false;               // passes validation. //? even needed?


		this._link_status = link_status;
		this._color = color;                 // Derived color

		this._collapsed = collapsed;         // Analysis dependent condition
		this._breadth = 1;                   // Analysis dependent condition  -- Should move to Analysis eventually
		this._height = 0;                    // Analysis dependent condition
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
	get isRoot()  {
		return this._isRoot;
	}            // not related to Analysis root node,
	set isRoot(value) {
		this._isRoot = value;
	}        // isRoot is set explicitly

	isRootNode() {
		return this.parent === undefined;
	}         // is determined by lack of parent.

	get children() {
		return this._children;
	}
	set children(value) {
		this._children = value;
	}
	hasChildren(node = this) {
		return (node.childCount !== 0);
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
		return (this.jag === undefined) ? '' : this.jag.urn;
	}







	// Number of children for a particular node.
	get childCount() {
		return this._children.length;
	}

	get canHaveChildren() {
		return ((this.jag !== undefined) && (JAGATValidation.isValidUrn(this.jag.urn)));
	}


	async save() {
		if (await StorageService.has(this, 'node')){
			await StorageService.update(this,'node');
		}
		else {
		await StorageService.create(this,'node');}
	}

	async newChild() {
		// @TODO: Show user feedback message when trying to create a child on an unsaved jag.
		if (!this.canHaveChildren)
			return;
		const child = new Node();
//		await StorageService.create(child,'node');
		this.addChild(child);
	}

	addChild(child, layout = true) {
		child.parent = this;
		this._children.push(child);

		// Only Dispatcher & Only Listener in views/Analysis
		this.dispatchEvent(new CustomEvent('attach', { detail: {
			target: child,
			reference: this,
			layout: layout
		}}));

		// 6 dispatchers here - Only Listener in views/Jag
		this.dispatchEvent(new CustomEvent('sync'));
	}



	async commitNameChange(view) {
		if (this.linkStatus)
			await this.syncJAG(view, false);
		else
			this.jag.name = view.name;
		await StorageService.update(this,'node');
	}

	/**
	 * Synchronizes the display values with the underlying jag model.
	 * Actions could be, load a new jag model, create a new jag model or change the name of the current jag.
	 * tlg - if nodes are instances of a jag, why should their change affect the jag itself?
	 */
	async syncJAG(view, replace = true) {
		const urn = view.urn;
		const name = view.name;

		// If the urn is not valid just notify and revert to previous state
		// @TODO: Implement the notification.
		try {
			JAGATValidation.validateURN(urn);
		} catch (e) {
			// 6 dispatchers here - Only Listener in views/Jag
			this.dispatchEvent(new CustomEvent('sync'));
			return;
		}

		//let jag = await JAGService.instance('idb-service').get(urn);
		let jag = await StorageService.get(urn,'jag');

		// If the model does not exists create one from the view values.
		// if the model does exists, reset to previous state unless replace is true.
		if (!jag) {
			jag = new JAG({
				urn: urn,
				name: name
			});
			
			//await JAGService.instance('idb-service').create(jag);
			await StorageService.create(jag,'jag');
		} else if (!replace) {
			// If the jag already exists we want to abort unless replace is set to true.
			//@TODO: notify the user why this is prevented and how to go about doing it (edit the urn manually).
			// Potentially we could ask the user if s/he wants to load the existing jag.
			// 6 dispatchers here - Only Listener in views/Jag
			this.dispatchEvent(new CustomEvent('sync'));
			return;
		}

		this._updateJAG(jag);
		const valid = true;//this.jag.hasValidURN;
		view.valid = valid;
		if(valid)
			this.link_status = false;
		// 2 dispatches here - 1 listener in views/Analysis
		this.dispatchEvent(new CustomEvent('layout'));
	}


	//  This should be shifted to the view --- doesn't belong in the model.

	update(node = this) {
		node._breadth = 1;    // number of leaves = height of table (skipping collapsed nodes)
		node._height = 0;     // depth of tree  (skipping collapsed nodes)
		if(node.hasChildren(this) && !node._collapsed)
		{
			node._breadth = 0;
			let max_height = 0;
			this.children.forEach(child => {
				child.update();
				node._breadth += child.breadth;
				max_height = Math.max(max_height, child.height);
			})
			node._height = max_height + 1;
		}
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

	async _createChildren() {
		for (let child of this.jag.children) {
			//const jag = await JAGService.instance('idb-service').get(child.urn);
			const jag = await StorageService.get(child.urn,'jag');
			const model = new Node({jag: jag});
			//await NodeService.instance('idb-service').create(model);
			await StorageService.create(model,'node');
			this.addChild(model, true);
		}
	}

	async _updateJAG(jag) {
		this._jag = jag;
		this.save();
		this.deleteAllChildren();
		await this._createChildren();
		// 6 dispatchers here - Only Listener in views/Jag
		this.dispatchEvent(new CustomEvent('sync'));
	}

}

Node.DEFAULT_JAG_NAME = 'Activity';


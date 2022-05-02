/**
 * @fileOverview Analysis view.
 *
 * @author mvignati
 * @version 2.50
 */

'use strict';

import AgentModel from '../models/agent.js';
import DOMUtils from '../utils/dom.js';
import ContextMenu from '../ui/context-menu.js';
import ColumnHeader from './column-header.js';
import AssessmentView from './assessment.js';
import JAGView from './jag.js';

class AnalysisView extends HTMLElement {

	constructor(analysisModel, table) {
		super();

		this._model = analysisModel;
		this._views = new Map();
		this._column_headers = new Map();
		this._leaf_set = new Array();

		this._root = undefined;
		this._assessment_menu = undefined;
	}

	initialize(table) {
		// Appends this view to the specified ia-table
		table.appendChild(this);

		// Registers root view
		this._root = this._model.root;

		console.log("herehere................................................");
		console.log(this._root);
		this._initializeContextMenus();
		this._initializeStaticHeaders();
		this._initializeTree(this._root);

		// TODO: temporary ugly fix
		this._views.get(this._root.id).model.syncJAG(this._views.get(this._root.id));

		this.layout();
	}

	getAssessments(agent) {
		let agent_assessment_views = this._views.get(agent.id);

		if(agent_assessment_views === undefined) {
			agent_assessment_views = new Map();
			this._views.set(agent.id, agent_assessment_views);
		}

		return agent_assessment_views;
	}

	getAssessmentView(agent, node, agent_assessment_views = this.getAssessments(agent)) {
		let view = agent_assessment_views.get(node.id);

		if(view === undefined) {
			view = new AssessmentView(agent, node, this._assessment_menu);
			agent_assessment_views.set(node.id, view);
		}

		return view;
	}

	getNodeView(node) {
		let view = this._views.get(node.id);

		if(view === undefined) {
			view = new JAGView(node);
			this._views.set(node.id, view);
		}

		return view;
	}

	attach({target, reference = null, layout = true, select = true } = {}) {
		target.addEventListener('layout', this.layout.bind(this));
		target.addEventListener('attach', this._handleAttach.bind(this));
		target.addEventListener('detach', this._handleDetach.bind(this));

		// Finds the element representing the left most leaf in the tree.
		if(reference === null)
			reference = target.lastLeaf;

		const $target = this.getNodeView(target);
		const $reference = this.getNodeView(reference);

		this.insertBefore($target, $reference.nextSibling);
		if(select) this.selectName($target);
		if(layout) this.layout();
	}

	_handleAttach(e) {
		this.attach(e.detail);
	}

	detach({target, layout = true } = {}) {
		const $target = this.getNodeView(target);
		this.removeChild($target);
		if(layout) this.layout();
	}

	_handleDetach(e) {
		this.detach(e.detail);
	}

	selectName(child) {
		DOMUtils.selectNodeText(child.nameElement);
	}

	layout() {
		// level_count changes width of level 1's box

		// @TODO: Investigate changing that so the update only happens when necessary
		// and only on branches that need it.

		this._root.update();
		// Resets the leaf set.
		this._leaf_set.length = 0;

		let height = -1;
		let rows = 0;

		this._layoutJAG(this._root, AnalysisView.HEADER_DEPTH, 0);
		height = this._root.height;
		rows = this._root.breadth;

		const level_count = height + 1;                                        //  this is the depth actually.
		const agent_count = this._layoutHeaders(level_count);


		this._layoutAssessments(level_count, AnalysisView.HEADER_DEPTH);
		this.style.setProperty('--jag-columns', level_count);
		this.style.setProperty('--team-columns', agent_count);
		this.style.setProperty('--rows', rows);
	}

	_initializeContextMenus() {
		this._assessment_menu = new ContextMenu();

		for(let assessment of AnalysisView.ASSESSMENTS) {
			const {color: rgb, label} = AssessmentView.ASSESSMENT_DESCRIPTIONS[assessment];
			const properties = {[AssessmentView.ASSESSMENT_SYMBOL]: assessment};
			const style = {'background-color': `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`};

			this._assessment_menu.addEntry(label, properties, style);
		}
	}

	_initializeStaticHeaders() {
		// Creates JAG section header.
		// That header does not need to be added to column headers map since it's static
		// and does not need to be updated (css takes care of its dynamic span thanks to named columns).
		const $jag_header = new ColumnHeader(AnalysisView.JAG_SECTION_HEADER_NAME, 0, 0, AnalysisView.JAG_SECTION_COLUMN_END)
		$jag_header.colSpanType = ColumnHeader.END;
		this.appendChild($jag_header);

		// Root header does not need to be updated ever.
		this.appendChild(new ColumnHeader(AnalysisView.JAG_SECTION_ROOT_HEADER_NAME, 0, 1));
	}

	_initializeTree(node) {

		this.attach({
			target: node,
			layout: false
		});

		node.children.forEach((child_node) => {
			this._initializeTree(child_node);
		});
	}

	_isNodeInTheLeafSet(node_id) {
		return this._leaf_set.findIndex(leaf => leaf.id === node_id) !== -1;
	}

	_layoutAssessments(col, row) {
		const $assessments = document.createDocumentFragment();

		let offset = 0;
		const team = this._model.team;
		for(let agent of team.agents) {
			const assessments = this.getAssessments(agent);

			// Removes all assessment views that are not part of the current leaf set.
			for(let [node_id, $assessment] of assessments)
				if(!this._isNodeInTheLeafSet(node_id) && this.contains($assessment))
					this.removeChild($assessment);

			// Relayouts all assessment views for the current leaf set.
			for(let i = 0 ; i < this._leaf_set.length ; i++) {
				const node = this._leaf_set[i];
				const $assessment = this.getAssessmentView(agent, node, assessments);
				// Adds the current assessment view to the fragment if it is not already in the DOM.
				if(!this.contains($assessment))
					$assessments.appendChild($assessment);

				// Updates the layout
				$assessment.style.setProperty('--col-start', col + offset + 1);
				$assessment.style.setProperty('--row-start', row + i + 1);
			}
			offset++;
		}

		this.appendChild($assessments);
	}

	_layoutHeaders(level_count) {
		for(let header of this._column_headers.values())
			if(this.contains(header))
				this.removeChild(header);

		const $columns = document.createDocumentFragment();

		// Starts at 1 since the root header does not need to be updated and is never removed.
		for (let i = 1 ; i < level_count ; i++) {
			if(!this._column_headers.has(i))
				this._makeHeader(i, `Level ${i}`, i, 1);

			const $column = this._column_headers.get(i);
			$columns.appendChild($column);
		}

		let offset = 0;
		const team = this._model.team;
		const agent_count = team.agents.length;
		const abs_offset = level_count + offset;

		// Gets (and makes if necessary) the team header
		if(!this._column_headers.has(team.id))
			this._makeHeader(team.id, team.name, abs_offset, 0, agent_count);
		else
			this._column_headers.get(team.id).innerText = team.name;

		const $column = this._column_headers.get(team.id);
		$column.colStart = abs_offset;
		$columns.appendChild($column);

		for (let i = abs_offset, agent_idx = 0 ; i < abs_offset + agent_count; i++, agent_idx++) {
			const agent = team.agents[agent_idx];

			if (!this._column_headers.has(agent.id))
				this._makeHeader(agent.id, agent.name, i, 1);
			else
				this._column_headers.get(agent.id).innerText = agent.name;

			const $column = this._column_headers.get(agent.id);
			$column.colStart = i;
			$columns.appendChild($column);
		}
		offset += agent_count;

		this.appendChild($columns);

		return offset;
	}

	_layoutJAG(node, row, col) {
		const $view = this.getNodeView(node);

		if(node.children.length !== 0 && !node.collapsed)
		{
			let local_row = row;
			this._showChildNodes(node, false);

			for(let child of node._children) {
				this._layoutJAG(child, local_row, col + 1);
				local_row+= child.breadth;
			}

			$view.style.setProperty('--col-end', '1 span');
		} else {
			this._leaf_set.push(node);
			this._hideChildNodes(node);
			$view.style.setProperty('--col-end', AnalysisView.JAG_SECTION_COLUMN_END);
			//$view.style.setProperty('--col-end', '1 span');
		}

		// Position the item properly
		$view.style.setProperty('--col-start', col + 1);
		$view.style.setProperty('--row-start', row + 1);
		$view.style.setProperty('--row-end', `${node.breadth} span`);
	}

	_makeHeader(id, name, col, row, col_span, row_span) {
		this._column_headers.set(id, new ColumnHeader(name, col, row, col_span, row_span));
	}

	_showChildNodes(node, recurse = true) {
		for(let child of node.children) {
			const $view = this.getNodeView(child);
			$view.show();

			if(recurse)
				this._showChildNodes(child);
		}
	}

	_hideChildNodes(node, recurse = true) {
		for(let child of node.children) {
			const $view = this.getNodeView(child);
			$view.hide();

			if(recurse)
				this._hideChildNodes(child);
		}
	}

}

AnalysisView.JAG_SECTION_ROOT_HEADER_NAME = 'Root';
AnalysisView.JAG_SECTION_HEADER_NAME = 'JAG';
AnalysisView.JAG_SECTION_COLUMN_END = 'jag-column-end';

AnalysisView.HEADER_DEPTH = 2;

AnalysisView.ASSESSMENTS = [
	AgentModel.CAN_DO_PERFECTLY,
	AgentModel.CAN_DO,
	AgentModel.CAN_HELP,
	AgentModel.CANNOT_DO
];


customElements.define('ia-analysis', AnalysisView);
export default customElements.get('ia-analysis');


/**
 * @fileOverview IA table component.
 *
 * @author mvignati
 * @version 0.95
 */

'use strict';

import Analysis from '../models/analysis.js';
import AnalysisService from '../services/analysis.js';
import JAGService from '../services/jag.js';
import Popupable from '../utils/popupable.js';
import AnalysisView from '../views/analysis.js';

class IATable extends Popupable {

	constructor() {
		super();

		this.setPopupBounds(this);

		this._analysis = undefined;

		this._elements = {
			name: undefined,
			selector: undefined,
			analysis: undefined,
		};

		this._init();
	}

	get analysisSelector() {
		return this._elements.selector;
	}

	get analysisView() {
		return this._elements.analysis;
	}

	set analysis(analysis) {
		// remove current view if it exists
		if(this._elements.analysis !== undefined)
			this.removeChild(this._elements.analysis);

		const view = new AnalysisView(analysis);
		view.initialize(this);

		this._analysis = analysis;
		this._elements.name.removeAttribute('disabled');
		this._elements.name.value = analysis.name;
		this._elements.analysis = view;
	}


	async _init() {
		this._initUI();
		this._populateAnalysis();
	}

	_initUI() {
		const $header = document.createElement('header');
		const $new_analysis = document.createElement('button');
		const $analysis_selector = document.createElement('select');
		const $analysis_name = document.createElement('input');
		const $export_analysis = document.createElement('button');
		const $import_analysis = document.createElement('button');

		$new_analysis.innerText = 'New Analysis';
		$new_analysis.setAttribute('id', 'new-analysis');
		$analysis_selector.setAttribute('id', 'select-analysis');
		$analysis_name.setAttribute('id', 'analysis-name');
		$analysis_name.setAttribute('disabled', '');
		$export_analysis.innerText = 'Export';
		$export_analysis.setAttribute('id', 'export-analysis');
		$import_analysis.innerText = 'Import';
		$import_analysis.setAttribute('id', 'import-analysis');

		$header.appendChild($new_analysis);
		$header.appendChild($analysis_selector);
		$header.appendChild($analysis_name);
		$header.appendChild($export_analysis);
		$header.appendChild($import_analysis);

		$new_analysis.addEventListener('click', this._handleNewAnalysis.bind(this));
		$analysis_selector.addEventListener('change', this._handleAnalysisChange.bind(this));
		$analysis_name.addEventListener('blur', this._handleAnalysisNameChange.bind(this));
		$export_analysis.addEventListener('click', this._handleExportAnalysis.bind(this));
		$import_analysis.addEventListener('click', this._handleImportAnalysis.bind(this));

		this.appendChild($header);

		this._elements.selector = $analysis_selector;
		this._elements.name = $analysis_name;
		this._elements.export = $export_analysis;
		this._elements.import = $import_analysis;
	}

	async _populateAnalysis() {
		const idb_service = AnalysisService.instance('idb-service');
		const analyses = await idb_service.all();

		const options = document.createDocumentFragment();

		// Adds the first entry.
		const $option_title = document.createElement('option');
		$option_title.innerText = IATable.ANALYSIS_SELECTOR_TITLE;
		$option_title.setAttribute('disabled', '');
		$option_title.setAttribute('selected', '');
		options.appendChild($option_title);

		analyses.forEach((analysis) => {
			//const local_analysis = await AnalysisService.get(id);
			const $entry = this._createAnalysisEntry(analysis);
			options.appendChild($entry);
		});

		this._elements.selector.appendChild(options);
	}

	_handleNewAnalysis() {
		const analysis = new Analysis();
		this.analysis = analysis;
		AnalysisService.instance('idb-service').create(analysis);

		// Select the new entry
		const $entry = this._createAnalysisEntry(analysis);
		this._elements.selector.appendChild($entry);
		this._elements.selector.selectedIndex = this._elements.selector.options.length - 1;
	}

	_handleAnalysisChange(event) {
		const analysis_id = event.target.value;
		AnalysisService
			.instance('idb-service')
			.get(analysis_id)
			.then(analysis => this.analysis = analysis);
	}

	_handleAnalysisNameChange(event) {
		this._analysis.name = event.target.value;
	}

	_handleExportAnalysis() {
		this.popup(IATable.NOTICE_EXPORT_STATIC, this._elements.export, function () { return this; }.bind(this), [this._elements.export])
	}

	_handleImportAnalysis() {
		
	}

	_createAnalysisEntry(analysis) {
		const $option = document.createElement('option');
		$option.setAttribute('value', analysis.id);

		let name = analysis.name;
		if(name === '')
			name = IATable.FALLBACK_ANALYSIS_NAME;

		$option.innerText = name;
		return $option;
	}

	async export(static_jags) {
		const analysis = this._analysis;
		const json = analysis.toJSON();

		const root = analysis.root;
		let children = [root];

		const jags = [];

		json.nodes = [];

		while (children.length > 0) {
			const child = children.splice(0, 1)[0];

			if (!children) children = [];

			if (child.children) {
				for (let grandchild in child.children) {
					children.push(child.children[grandchild]);
				}
			}

			json.nodes.push(child.toJSON());

			if (child.urn != '' && jags.indexOf(child.urn) === -1) {
				jags.push(child.urn);
			}
		}

		if (static_jags === true) {
			json.jags = [];
			const service = JAGService.instance('idb-service');

			for (let jag of jags) {
				const model = await service.get(jag);
				json.jags.push(model.toJSON());
			}
		}

		const teams = [];
		for (let team of analysis.teams) {
			const jteam = team.toJSON();

			const agents = [];
			for (let agent of team.agents) {
				agents.push(agent.toJSON());
			}
			jteam.agents = agents;

			teams.push(jteam);
		}
		json.teams = teams;

		const a = document.createElement('a');
		const data = `data:application/json,${encodeURI(JSON.stringify(json))}`;
		a.href = data;
		a.download = `${analysis.name}.json`;
		a.click();
	}
}

IATable.POPUP_TYPES = {
	WARNING: 'popup-warning',
	NOTICE: 'popup-notice',
	INFO: 'popup-info'
};

IATable.NOTICE_EXPORT_STATIC = Popupable._createPopup(IATable.POPUP_TYPES.NOTICE, "Export Static", "Export this IA table with a static copy of current JAGs?", [
	{ text: "Yes", color: "black", bgColor: "red", action: function (table) { table.export(true); } },
	{ text: "No", color: "white", bgColor: "black", action: function (table) { table.export(false); } }
]);

IATable.FALLBACK_ANALYSIS_NAME = 'Analysis w/o name';
IATable.ANALYSIS_SELECTOR_TITLE = 'Select an analysis';

customElements.define('ia-table', IATable);
export default customElements.get('ia-table');


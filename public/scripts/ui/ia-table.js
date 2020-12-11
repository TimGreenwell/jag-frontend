/**
 * @fileOverview IA table component.
 *
 * @author mvignati
 * @version 2.03
 */

'use strict';

import AgentModel from '../models/agent.js';
import Analysis from '../models/analysis.js';
import JAG from '../models/jag.js';
import Node from '../models/node.js';
import TeamModel from '../models/team.js';
import AgentService from '../services/agent.js';
import AnalysisService from '../services/analysis.js';
import JAGService from '../services/jag.js';
import NodeService from '../services/node.js';
import TeamService from '../services/team.js';
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

		this._initUI();

		this._boundRefresh = this._refresh.bind(this);
	}

	get analysisSelector() {
		return this._elements.selector;
	}

	get analysisView() {
		return this._elements.analysis;
	}

	get analysis() {
		return this._analysis;
	}

	set analysis(analysis) {
		// remove current view if it exists
		if (this._elements.analysis !== undefined) {
			this.removeChild(this._elements.analysis);
			this._analysis.team.removeEventListener('update', this._boundRefresh);
			for (const agent of this._agents) {
				agent.removeEventListener('update', this._boundRefresh);
			}
		}

		if (analysis) {
			const view = new AnalysisView(analysis);
			view.initialize(this);

			this._analysis = analysis;
			this._elements.name.removeAttribute('disabled');
			this._elements.name.value = analysis.name;
			this._elements.description.removeAttribute('disabled');
			this._elements.description.value = analysis.description;
			this._elements.analysis = view;

			this._analysis.team.addEventListener('update', this._boundRefresh);
			this._agents = this._analysis.team.agents;
			for (const agent of this._agents) {
				agent.addEventListener('update', this._boundRefresh);
			}
		}
	}

	_initUI() {
		const $header = document.createElement('header');
		const $new_analysis = document.createElement('button');

		const $analysis_name_wrapper = document.createElement('div');
		const $analysis_name_label = document.createElement('label');
		const $analysis_name = document.createElement('input');

		const $analysis_description_wrapper = document.createElement('div');
		const $analysis_description_label = document.createElement('label');
		const $analysis_description = document.createElement('input');

		const $export_analysis = document.createElement('button');
		const $import_analysis = document.createElement('button');
		const $analysis_file = document.createElement('input');

		$new_analysis.innerText = 'Create Analysis';
		$new_analysis.setAttribute('id', 'new-analysis');
		$analysis_name_label.setAttribute('for', 'analysis-name');
		$analysis_name_label.innerText = 'Name';
		$analysis_name.setAttribute('name', 'analysis-name');
		$analysis_name.setAttribute('id', 'analysis-name');
		$analysis_name.setAttribute('disabled', '');
		$analysis_description_label.setAttribute('for', 'analysis-description');
		$analysis_description_label.innerText = 'Description';
		$analysis_description.setAttribute('name', 'analysis-description');
		$analysis_description.setAttribute('id', 'analysis-description');
		$analysis_description.setAttribute('disabled', '');
		$export_analysis.innerText = 'Export';
		$export_analysis.setAttribute('id', 'export-analysis');
		$import_analysis.innerText = 'Import';
		$import_analysis.setAttribute('id', 'import-analysis');
		$analysis_file.setAttribute('id', 'analysis-file');
		$analysis_file.setAttribute('type', 'file');

		$header.appendChild($new_analysis);
		$header.appendChild($analysis_name_label);

		$analysis_name_wrapper.appendChild($analysis_name_label);
		$analysis_name_wrapper.appendChild($analysis_name);
		$header.appendChild($analysis_name_wrapper);

		$analysis_description_wrapper.appendChild($analysis_description_label);
		$analysis_description_wrapper.appendChild($analysis_description);
		$header.appendChild($analysis_description_wrapper);

		$header.appendChild($export_analysis);
		$header.appendChild($import_analysis);
		$header.appendChild($analysis_file);

		$new_analysis.addEventListener('click', this._handleNewAnalysis.bind(this));
		$analysis_name.addEventListener('blur', this._handleAnalysisNameChange.bind(this));
		$analysis_description.addEventListener('blur', this._handleAnalysisDescriptionChange.bind(this));
		$export_analysis.addEventListener('click', this._handleExportAnalysis.bind(this));
		$import_analysis.addEventListener('click', this._handleImportAnalysis.bind(this));
		$analysis_file.addEventListener('change', this._handleUploadAnalysis.bind(this));

		this.appendChild($header);

		this._elements.create = $new_analysis;
		this._elements.name = $analysis_name;
		this._elements.description = $analysis_description;
		this._elements.export = $export_analysis;
		this._elements.import = $import_analysis;
		this._elements.file = $analysis_file;
	}

	_refresh(e) {
		this._elements.analysis.layout();
	}

	_handleNewAnalysis() {
		this.popup({
			content: IATable.NOTICE_CREATE_ANALYSIS,
			trackEl: this._elements.create,
			inputs: { table: this },
			highlights: [this._elements.create]
		});
	}

	_handleAnalysisNameChange(event) {
		this._analysis.name = event.target.value;
	}

	_handleAnalysisDescriptionChange(event) {
		this._analysis.description = event.target.value;
	}

	_handleExportAnalysis() {
		this.popup({
			content: IATable.NOTICE_EXPORT_STATIC,
			trackEl: this._elements.export,
			inputs: { table: this },
			highlights: [this._elements.export]
		});
	}

	async _checkImportConflicts(analysis) {
		{
			const service = AnalysisService.instance('idb-service');
			if (await service.has(analysis.id))
				return true;
		}

		{
			const service = NodeService.instance('idb-service');
			for (const node of analysis.nodes)
				if (await service.has(node.id))
					return true;
		}

		{
			const service = TeamService.instance('idb-service');
			for (const team of analysis.teams)
				if (await service.has(team.id))
					return true;
		}

		{
			const service = AgentService.instance('idb-service');
			for (const team of analysis.teams)
				for (const agent of team.agents)
					if (await service.has(agent.id))
						return true;
		}
	}

	async _handleUploadAnalysis(e) {
		const files = this._elements.file.files;

		if (files.length < 1)
			return;

		const file = files[0];
		const content = await file.text();
		const analysis = JSON.parse(content);

		if (analysis.jags) {
			const service = JAGService.instance('idb-service');

			for (const jag of analysis.jags) {
				if (await service.has(jag.urn)) {
					this.popup({
						content: IATable.NOTICE_OVERWRITE_JAG,
						trackEl: this._elements.import,
						inputs: { jag: jag },
						highlights: [this._elements.import]
					});
				}
			}
		}

		this.popup({
			content: IATable.NOTICE_OVERWRITE_ANALYSIS,
			trackEl: this._elements.import,
			inputs: { table: this, analysis: analysis, conflict: await this._checkImportConflicts(analysis) },
			highlights: [this._elements.import]
		});
	}

	_handleImportAnalysis(e) {
		this._elements.file.click();
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

	async create(name, root) {
		const jag = await JAGService.instance('idb-service').get(root);

		const node = new Node({jag: jag});
		await NodeService.instance('idb-service').create(node);

		const analysis = new Analysis({name: name, root: node});
		await AnalysisService.instance('idb-service').create(analysis);

		analysis.save();
		this.analysis = analysis;

		this.dispatchEvent(new CustomEvent('create-analysis', { detail: { analysis: analysis }}));
	}

	async import(analysis) {
		{
			const service = NodeService.instance('idb-service');

			// Sort nodes with the least number of children first.
			analysis.nodes.sort((a, b) => a.children.length - b.children.length);

			for (const node of analysis.nodes) {
				const model = await Node.fromJSON(node);
				await service.create(model);
			}
		}

		{
			const team_service = TeamService.instance('idb-service');
			const agent_service = AgentService.instance('idb-service');

			for (const team of analysis.teams) {
				for (const agent of team.agents) {
					await agent_service.create(AgentModel.fromJSON(agent));
				}

				team.agents = team.agents.map((agent) => agent.id);
				const model = await TeamModel.fromJSON(team);
				await team_service.create(model);
			}
		}

		const service = AnalysisService.instance('idb-service');

		const model = await Analysis.fromJSON({
			id: analysis.id,
			name: analysis.name,
			root: analysis.root,
			description: analysis.description || '',
			teams: analysis.teams.map((team) => team.id)
		});

		await service.create(model);

		this.dispatchEvent(new CustomEvent('create-analysis', { detail: { analysis: model }}));
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

IATable.NOTICE_CREATE_ANALYSIS = Popupable._createPopup({
	type: IATable.POPUP_TYPES.NOTICE,
	name: "Create Analysis",
	description: "Provide a name and root node to create a new analysis.",
	properties: [
		{ name: 'name', label: 'Name', type: 'text' },
		{ name: 'root', label: 'Root JAG', type: 'select',
			options: async function () {
				const options = [];

				const jags = await JAGService.instance('idb-service').all();

				for (const jag of jags) {
					options.push({
						'text': jag.urn,
						'value': jag.urn
					});
				}

				return options;
			}
		}
	],
	actions: [
		{ text: "Create", color: "white", bgColor: "green",
			action: function ({inputs: {table}, outputs: {name, root}}) {
				table.create(name, root);
			}
		},
		{ text: "Cancel", color: "black", bgColor: "white" }
	]
});

IATable.NOTICE_EXPORT_STATIC = Popupable._createPopup({
	type: IATable.POPUP_TYPES.NOTICE,
	name: "Export Static",
	description: "Export this IA table with a static copy of current JAGs?",
	actions: [
		{ text: "Yes", color: "black", bgColor: "red",
			action: function ({inputs: {table}}) {
				table.export(true);
			}
		},
		{ text: "No", color: "white", bgColor: "black",
			action: function ({inputs: {table}}) {
				table.export(false);
			}
		}
	]
});

IATable.NOTICE_OVERWRITE_ANALYSIS = Popupable._createPopup({
	type: IATable.POPUP_TYPES.NOTICE,
	name: "Overwrite Analysis",
	description: "Data already exists for this analysis. Overwrite existing data?",
	actions: [
		{ text: "Overwrite", color: "black", bgColor: "red",
			action: function ({inputs: {table, analysis}}) {
				table.import(analysis);
			}
		},
		{ text: "Cancel", color: "white", bgColor: "black" }
	],
	fallback: 0,
	skip: ({inputs: {conflict}}) => !conflict
});

IATable.NOTICE_OVERWRITE_JAG = Popupable._createPopup({
	type: IATable.POPUP_TYPES.NOTICE,
	name: "Overwrite JAGs",
	description: ({inputs: {jag}}) => `The uploaded analysis contains a model for a JAG at (${jag.urn}), which you already have. Replace it?`,
	actions: [
		{ text: "Overwrite", color: "black", bgColor: "red",
			action: async function ({inputs: {jag}}) {
				const model = JAG.fromJSON(jag);
				await service.create(model);
			}
		},
		{ text: "Cancel", color: "white", bgColor: "black" }
	]
});

IATable.FALLBACK_ANALYSIS_NAME = 'Analysis w/o name';
IATable.ANALYSIS_SELECTOR_TITLE = 'Select an analysis';

customElements.define('ia-table', IATable);
export default customElements.get('ia-table');


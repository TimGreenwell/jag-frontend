/**
 * @fileOverview IA table component.
 *
 * @author mvignati
 * @version 2.03
 */

'use strict';

import AgentModel from '../models/agent.js';
import AnalysisModel from '../models/analysis-model.js';
import JAG from '../models/jag.js';
import NodeModel from '../models/node.js';
import TeamModel from '../models/team.js';
import StorageService from '../services/storage-service.js';
import Popupable from '../utils/popupable.js';
import AnalysisView from '../views/analysis.js';

class IATable extends Popupable {

    constructor() {
        super();

        this.setPopupBounds(this);

        this._analysisModel = undefined;

        this._domElements = {
            name: undefined,
            selector: undefined,
            analysis: undefined,
        };


        this._initUI();

        this._boundRefresh = this._refresh.bind(this);

        StorageService.subscribe("analysis-storage-created", this.handleAnalysisStorageCreated.bind(this));
        StorageService.subscribe("jag-storage-updated", this.handleJagStorageUpdated.bind(this));
        StorageService.subscribe("jag-storage-created", this.handleJagStorageCreated.bind(this));

        //	StorageService.subscribe("jag-storage-updated", this.updateNode.bind(this));
        //	StorageService.subscribe("analysis-storage-created", this.addListItem.bind(this));
    }

    // get analysisSelector() {
    // 	return this._domElements.selector;
    // }






    handleJagStorageCreated(newJag, newJagUrn) {
        console.log("WRITE THIS --  we have a new JAG model to handle")
        console.log(newJag)
        console.log(newJagUrn)
    }


    get analysisView() {
        return this._domElements.analysis;
    }

    get analysisModel() {
        return this._analysisModel;
    }

    set analysis(newAnalysisModel) {
        console.log("ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc");
        console.log("ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc");
        console.log("ccccccccccccccc NOBODY IS CALLING THIS ccccccccccccccccccccccccc");
        console.log("ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc");
        console.log("ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc");
    }




    set analysisModel(newAnalysisModel) {
        this._analysisModel = newAnalysisModel;

        console.log(" XxXxXxXxXx    For some reason, this setter is also being used to change elements and set up analysisView as well.")
        // remove current view if it exists
        if (this._domElements.analysis !== undefined) {

            console.log("CLEANING - in it")
            console.log(this._domElements)
            this.removeChild(this._domElements.analysis);
          //  this._analysisModel.team.removeEventListener('update', this._boundRefresh);
          //  for (const agent of this._agents) {
           //     agent.removeEventListener('update', this._boundRefresh);
           // }
        }
        console.log("past clearing");

        if (newAnalysisModel) {
            const analysisView = new AnalysisView(newAnalysisModel);
            //analysisView.initialize(); // double checked - ok to delete
            this.appendChild(analysisView);
            this._domElements.analysis = analysisView;

            this._domElements.name.removeAttribute('disabled');
            this._domElements.name.value = newAnalysisModel.name;
            this._domElements.description.removeAttribute('disabled');
            this._domElements.description.value = newAnalysisModel.description;



            this._analysisModel.team.addEventListener('update', this._boundRefresh);
            this._agents = this._analysisModel.team.agents;
            for (const agent of this._agents) {
                agent.addEventListener('update', this._boundRefresh);
            }
        }
    }




    async create(analysisName, rootUrn) {
        let rootJagModel;
        console.log("--------------------------------------------------------------------------")
        console.log(rootUrn)
        console.log("--------------------------------------------------------------------------")
        if (await StorageService.has(rootUrn, 'jag')) {
            rootJagModel = await StorageService.get(rootUrn, 'jag');
        } else {
            window.alert("There must be an initial Joint Activity Graph before an assessment can be made.")
        }
        const rootNodeModel = new NodeModel({jag: rootJagModel});
       // await StorageService.create(rootNodeModel, 'node');


        const newAnalysisModel = new AnalysisModel({name: analysisName, root: rootNodeModel});
        await StorageService.clear('node');
        // currently buildAnalysis builds and stores the mapset.
        // @TODO return the node set and iterate through storing them here.  less dependence
        await newAnalysisModel.buildAnalysisJagNodes(newAnalysisModel.root);
        await newAnalysisModel.buildDefaultTeam();

//		if (this._team == undefined) {
        newAnalysisModel.team = new TeamModel();
        newAnalysisModel.team.addAgent(new AgentModel({name: 'Agent 1'}));
        newAnalysisModel.team.addAgent(new AgentModel({name: 'Agent 2'}));
        await Promise.all(newAnalysisModel.team.agents.map(async agent => await StorageService.create(agent, 'agent')));
        await StorageService.create(newAnalysisModel.team, 'team');
//		}

     //   newAnalysisModel.save();
        this.analysisModel = newAnalysisModel;  //  < <<<  (not calling the setter...))
     //   this.dispatchEvent(new CustomEvent('create-analysis', {detail: {analysis: this._analysisModel}}));
        await StorageService.create(newAnalysisModel, 'analysis');
    }

    async handleAnalysisStorageCreated(newAnalysisModel, newAnalysisId) {
        await StorageService.clear('node');
        console.log(newAnalysisModel)
        await newAnalysisModel.buildAnalysisJagNodes(newAnalysisModel.root);
        console.log(newAnalysisModel)
        this.analysisModel = newAnalysisModel;
        console.log(newAnalysisModel)
    }



    async handleJagStorageUpdated(newJag, newJagUrn) {


     //   if (this.analysisModel) {
            let tempNewAnalysisModel = this._analysisModel;    // @TODO Change this when we seperate the analysis setter.

            console.log("o   Handling the updated JAG STORAGE")
            console.log(tempNewAnalysisModel)
            console.log("o")
            // IMPORTANT - currently, any JAGModel storage update triggers a rebuild of the root and all nodes.
            // IMPORTANT - This replaces all the nodes meaning earlier references are void.
            // IMPORTANT - All stored Analysis have root node pointers and are now lost.
            // SOLUTION - Scan through and update root references or have Analysis use JAGModel root (cleaner)
            await StorageService.clear('node');
            let rootUrn = tempNewAnalysisModel.root.jag.urn;
            const rootJagModel = await StorageService.get(rootUrn, 'jag');
            const rootNodeModel = new NodeModel({jag: rootJagModel});
            tempNewAnalysisModel.root = rootNodeModel;
            await tempNewAnalysisModel.buildAnalysisJagNodes(tempNewAnalysisModel.root);

            // // SOLUTION2 - scan through all nodes and update those with a matching JAGModel URN.
            // // SOLUTION2 - @TODO children added/deleted, (or self deleted)
            // let allStoredNodes = await StorageService.all('node');
            // console.log(allStoredNodes)
            // allStoredNodes.forEach((jagCell) => {
            //     if (jagCell.jag.urn == newJagUrn) {
            //         jagCell.jag = newJag;
            //         // Make sure any new children are linked somehow
            //         // Make sure any deleted children are removed somehow
            //     }
            // })

            this.analysisModel = tempNewAnalysisModel;
      //  }
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

        $new_analysis.innerText = 'Create AnalysisModel';
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

        this._domElements.create = $new_analysis;
        this._domElements.name = $analysis_name;
        this._domElements.description = $analysis_description;
        this._domElements.export = $export_analysis;
        this._domElements.import = $import_analysis;
        this._domElements.file = $analysis_file;
    }

    _refresh(e) {
        this._domElements.analysis.layout();
    }

    _handleNewAnalysis() {
        this.popup({
            content: IATable.NOTICE_CREATE_ANALYSIS,
            trackEl: this._domElements.create,
            inputs: {table: this},
            highlights: [this._domElements.create]
        });
    }

    _handleAnalysisNameChange(event) {
        this._analysisModel.name = event.target.value;
        StorageService.update(this._analysisModel, 'analysis');
    }

    _handleAnalysisDescriptionChange(event) {
        this._analysisModel.description = event.target.value;
        StorageService.update(this._analysisModel, 'analysis');
    }

    _handleExportAnalysis() {
        this.popup({
            content: IATable.NOTICE_EXPORT_STATIC,
            trackEl: this._domElements.export,
            inputs: {table: this},
            highlights: [this._domElements.export]
        });
    }

    async _checkImportConflicts(analysisModel) {
        {
            //const service = AnalysisService.instance('idb-service');
            if (await StorageService.has(analysisModel.id, 'analysis'))
                return true;
        }

        {
            //const service = NodeService.instance('idb-service');
            for (const node of analysisModel.nodes)
                if (await StorageService.has(node.id, 'node'))
                    return true;
        }

        {
            //const service = TeamService.instance('idb-service');
            for (const team of analysisModel.teams)
                if (await StorageService.has(team.id, 'team'))
                    return true;
        }

        {
            //const service = AgentService.instance('idb-service');
            for (const team of analysisModel.teams)
                for (const agent of team.agents)
                    if (await StorageService.has(agent.id, 'agent'))
                        return true;
        }
    }

    async _handleUploadAnalysis(e) {
        const files = this._domElements.file.files;

        if (files.length < 1)
            return;

        const file = files[0];
        const content = await file.text();
        const analysisModel = JSON.parse(content);

        if (analysisModel.jags) {
            //const service = JAGService.instance('idb-service');
            for (const jag of analysisModel.jags) {
                if (await StorageService.has(jag.urn, 'jag')) {
                    this.popup({
                        content: IATable.NOTICE_OVERWRITE_JAG,
                        trackEl: this._domElements.import,
                        inputs: {jag: jag},
                        highlights: [this._domElements.import]
                    });
                }
            }
        }

        this.popup({
            content: IATable.NOTICE_OVERWRITE_ANALYSIS,
            trackEl: this._domElements.import,
            inputs: {table: this, analysis: analysisModel, conflict: await this._checkImportConflicts(analysisModel)},
            highlights: [this._domElements.import]
        });
    }

    _handleImportAnalysis(e) {
        this._domElements.file.click();
    }

    _createAnalysisEntry(analysisModel) {
        const $option = document.createElement('option');
        $option.setAttribute('value', analysisModel.id);

        let name = analysisModel.name;
        if (name === '')
            name = IATable.FALLBACK_ANALYSIS_NAME;

        $option.innerText = name;
        return $option;
    }


    async import(analysisModel) {
        {
            //const service = NodeService.instance('idb-service');
            // const service = StorageService.getStorageInstance('idb-service');

            // Sort nodes with the least number of children first.
            analysisModel.nodes.sort((a, b) => a.children.length - b.children.length);

            for (const node of analysisModel.nodes) {
                const model = await NodeModel.fromJSON(node);
                //await service.create(model,'node');
                await StorageService.create(model, 'node');
            }
        }

        {
            //const team_service = TeamService.instance('idb-service');
            //const team_service = StorageService.getStorageInstance('idb-service');

            //const agent_service = AgentService.instance('idb-service');
            //const agent_service = StorageService.getStorageInstance('idb-service');

            for (const team of analysisModel.teams) {
                for (const agent of team.agents) {
                    await StorageService.create(AgentModel.fromJSON(agent), 'agent');
                }

                team.agents = team.agents.map((agent) => agent.id);
                const model = await TeamModel.fromJSON(team);
                await StorageService.create(model, 'team');
            }
        }

        //const service = AnalysisService.instance('idb-service');
        //	const service = StorageService.getStorageInstance('idb-service');

        const model = await AnalysisModel.fromJSON({
            id: analysisModel.id,
            name: analysisModel.name,
            root: analysisModel.root,
            description: analysisModel.description || '',
            teams: analysisModel.teams.map((team) => team.id)
        });

        await StorageService.create(model, 'analysis');

        this.dispatchEvent(new CustomEvent('create-analysis', {detail: {analysis: model}}));
    }

    async export(static_jags) {
        const analysisModel = this._analysisModel;
        const json = analysisModel.toJSON();

        const root = analysisModel.root;
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
            //const service = JAGService.instance('idb-service');
            //const service = StorageService.getStorageInstance('idb-service');

            for (let jag of jags) {
                const model = await StorageService.get(jag, 'jag');
                json.jags.push(model.toJSON());
            }
        }

        const teams = [];
        for (let team of analysisModel.teams) {
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
        a.download = `${analysisModel.name}.json`;
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
    name: "Create AnalysisModel",
    description: "Provide a name and root node to create a new analysis.",
    properties: [
        {name: 'name', label: 'Name', type: 'text'},
        {
            name: 'root', label: 'Root JAG', type: 'select',
            options: async function () {
                const options = [];

                //const jags = await JAGService.instance('idb-service').all();
                const jags = await StorageService.all('jag');
                //		const jags = jsonList.map(JAG.fromJSON);

                for (const jag of jags) {
                    options.push({
                        'text': jag.urn,
                        'value': jag.urn           //  think maybe this should only be jag.   kkkk
                    });
                }

                return options;
            }
        }
    ],
    actions: [
        {
            text: "Create", color: "white", bgColor: "green",
            action: function ({inputs: {table}, outputs: {name, root}}) {  // analysisModelname and root URN
                table.create(name, root);  // table = ia-table (this)
            }
        },
        {text: "Cancel", color: "black", bgColor: "white"}
    ]
});

IATable.NOTICE_EXPORT_STATIC = Popupable._createPopup({
    type: IATable.POPUP_TYPES.NOTICE,
    name: "Export Static",
    description: "Export this IA table with a static copy of current JAGs?",
    actions: [
        {
            text: "Yes", color: "black", bgColor: "red",
            action: function ({inputs: {table}}) {
                table.export(true);
            }
        },
        {
            text: "No", color: "white", bgColor: "black",
            action: function ({inputs: {table}}) {
                table.export(false);
            }
        }
    ]
});

IATable.NOTICE_OVERWRITE_ANALYSIS = Popupable._createPopup({
    type: IATable.POPUP_TYPES.NOTICE,
    name: "Overwrite AnalysisModel",
    description: "Data already exists for this analysis. Overwrite existing data?",
    actions: [
        {
            text: "Overwrite", color: "black", bgColor: "red",
            action: function ({inputs: {table, analysis}}) {
                table.import(analysisModel);
            }
        },
        {text: "Cancel", color: "white", bgColor: "black"}
    ],
    fallback: 0,
    skip: ({inputs: {conflict}}) => !conflict
});

IATable.NOTICE_OVERWRITE_JAG = Popupable._createPopup({
    type: IATable.POPUP_TYPES.NOTICE,
    name: "Overwrite JAGs",
    description: ({inputs: {jag}}) => `The uploaded analysisModel contains a model for a JAG at (${jag.urn}), which you already have. Replace it?`,
    actions: [
        {
            text: "Overwrite", color: "black", bgColor: "red",
            action: async function ({inputs: {jag}}) {
                const model = JAG.fromJSON(jag);
                await StorageService.create(model, 'jag');              /////  really not sure ... was an undefinced 'service.' (no schema)
            }
        },
        {text: "Cancel", color: "white", bgColor: "black"}
    ]
});

IATable.defaultUrn = "us:ihmc:";
IATable.FALLBACK_ANALYSIS_NAME = 'AnalysisModel w/o name';
IATable.ANALYSIS_SELECTOR_TITLE = 'Select an analysis';

customElements.define('ia-table', IATable);
export default customElements.get('ia-table');


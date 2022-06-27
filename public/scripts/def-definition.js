/**
 * @file Playground - Visual area for authoring JAGs.  Controls the general playground environment
 * including panning, zooming, adding and removing edges/nodes.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.80
 */


import FormUtils from "./utils/forms.js";
import Activity from "./models/activity.js";

class Definition extends HTMLElement {

    constructor() {
        super();
        this._definingProjectId = null;
        this._definingNodeId = null;
        this._functionString = String;
        this._testMap = new Map();
        this._failTrigger = false;
        this._winTrigger = false;
        this._output = null;
        this._testBank = [];

        this._initUI();
    }

    get definingProjectId() {
        return this._definingProjectId;
    }

    set definingProjectId(id) {
        this._definingProjectId = id;
    }

    get definingNodeId() {
        return this._definingNodeId;
    }

    set definingNodeId(id) {
        this._definingNodeId = id;
    }

    get functionString() {
        return this._functionString();
    }

    set functionString(string) {
        this._functionString = string
    }

    get output() {
        return this._output();
    }

    getWinTrigger() {
        return this._winTrigger();
    }

    getFailTrigger() {
        return this._failTrigger();
    }

    buildTestBank(testNode){

        testNode.children.forEach(child => {
            console.log(child)
            this.addTestItem(child);
        })



    }

    createChildTesterElement(node) {
        const li = document.createElement('li');
        const test_el = FormUtils.createPropertyElement('sub' + node.id, 'Name');
        this._nameInput = FormUtils.createTextInput('name-property');
        this._nameInput.setAttribute("placeholder", "display name");
        this._nameInput.setAttribute("tabIndex", "0");
        this._nameInput.className = "direct-property";
        test_el.appendChild(this._nameInput);
        li.appendChild(test_el)
        return li
    }


    addTestItem(childNode) {
        // handleNodeStorageCreated (@controllerAT)
        let childTester = this.createChildTesterElement(childNode)
        console.log(childTester)
        this._testBank.push(childTester);
        this._$testerList.appendChild(childTester);
    }





    _initUI() {

        const $testerList = document.createElement('ol');

        const $testerDiv = document.createElement('div');
        $testerDiv.className = 'tester';
        this._testerP = document.createElement('p');
        this._testerP.innerHTML = 'Test: ';
        this._testerP.className = 'tester-p';
        this._testerP.id = 'tester-p';
        $testerDiv.appendChild(this._testerP);
        $testerDiv.appendChild($testerList);


        const test_el = FormUtils.createPropertyElement('name-property', 'Name');
        this._nameInput = FormUtils.createTextInput('name-property');
        this._nameInput.setAttribute("placeholder", "display name");
        this._nameInput.setAttribute("tabIndex", "0");
        this._nameInput.className = "direct-property";
        this._testerP.appendChild(this._nameInput);
        $testerDiv.appendChild(this._testerP);

        const $conditionsDiv = document.createElement('div');
        $conditionsDiv.className = 'conditions';
        this._conditionsP = document.createElement('p');
        this._conditionsP.className = 'conditions-p';
        this._conditionsP.id = 'conditions-p';
        $conditionsDiv.appendChild(this._conditionsP);


        const $functionDiv = document.createElement('div');
        $functionDiv.className = 'function-string';
        this._functionsP = document.createElement('p');
        this._functionsP.className = 'conditions-p';
        this._functionsP.id = 'functions-p';
        $functionDiv.appendChild(this._functionsP);


        this._$testerList = $testerList;



        this._executionSelect = FormUtils.createSelect('execution-property', [{
            value: Activity.EXECUTION.NONE.name,
            text: Activity.EXECUTION.NONE.text
        }, {
            value: Activity.EXECUTION.SEQUENTIAL.name,
            text: Activity.EXECUTION.SEQUENTIAL.text
        }, {
            value: Activity.EXECUTION.PARALLEL.name,
            text: Activity.EXECUTION.PARALLEL.text
        }]);
        this._executionSelect.className = 'direct-property';
        $functionDiv.appendChild(this._executionSelect);


        this.appendChild($testerDiv);
        this.appendChild($conditionsDiv);
        this.appendChild($functionDiv);


        // this._nameInput.addEventListener('blur', this._handleNameChange.bind(this));  // pass urn change to ControllerIA.updateURN
        // this._nameInput.addEventListener('keyup', this._handleNameEdit.bind(this));
        //
        // this._urnInput.addEventListener('focusout', this._handleURNChange.bind(this));  // pass urn change to ControllerIA.updateURN
        // this._urnInput.addEventListener('keyup', this._handleUrnEdit.bind(this));  // pass urn change to ControllerIA.updateURN
        //
        // this._executionSelect.addEventListener('change', this._handleExecutionChange.bind(this));
        // this._operatorSelect.addEventListener('change', this._handleOperatorChange.bind(this));
        //
        // this._export.addEventListener('click', this._handleExportClick.bind(this));

    }

}

customElements.define('def-definition', Definition);

export default customElements.get('def-definition');
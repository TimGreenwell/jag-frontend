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
        const test_el = FormUtils.createPropertyElement("test-" + node.id, node.urn);
        this._nameInput = FormUtils.createTextInput('test-name-' + node.id);
        this._nameInput.setAttribute("placeholder", "test value");
        this._nameInput.className = "test-property";
        test_el.appendChild(this._nameInput);
        return test_el
    }


    addTestItem(childNode) {
        // handleNodeStorageCreated (@controllerAT)
        let childTester = this.createChildTesterElement(childNode)
        console.log(childNode)
        console.log(childTester)
        this._testBank.push(childTester);
        this.$testerDiv.appendChild(childTester)
    }

    _initUI() {

        this.$testerDiv = document.createElement('div');                   // TEST BLOCK Div - Mock input
        this.$testerDiv.className = 'tester definition-block';
        this.appendChild(this.$testerDiv);

        const $conditionsDiv = document.createElement('div');             // CONDITIONS BLOCK Div - Abort,Fail,Success conditions
        $conditionsDiv.className = 'conditions definition-block';
        this.appendChild($conditionsDiv);

        const $functionDiv = document.createElement('div');               // Synthensis / logic between input and output
        $functionDiv.className = 'function definition-block';
        this.appendChild($functionDiv);

        this._conditionsP = document.createElement('p');
        this._conditionsP.className = 'conditions-p';
        this._conditionsP.id = 'conditions-p';
        $conditionsDiv.appendChild(this._conditionsP);

        this._functionsP = document.createElement('p');
        this._functionsP.className = 'conditions-p';
        this._functionsP.id = 'functions-p';
        $functionDiv.appendChild(this._functionsP);


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
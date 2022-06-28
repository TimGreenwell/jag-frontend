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
        this._definingNode = null;
        this._functionString = String;
        this._failTrigger = false;
        this._winTrigger = false;
        this._output = null;
        this._testBankMap = new Map();

        this._initUI();
    }

    get definingNode() {
        return this._definingNode;
    }

    set definingNode(node) {
        this._definingNode = node;
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

    reset(node) {
        this._definingNode = node  // necessary? could just pass it all at this level
        this.buildTestBank(node)
    }

    removeAllChildNodes(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

    buildTestBank(testNode = this._definingNode){
        console.log("Building TestBank")
        this.removeAllChildNodes(this.$testerDiv)
        testNode.children.forEach(child => {
            console.log("Looking at child...")
            console.log(child)
            let childTester = this.createChildTesterElement(child)
            this.$testerDiv.appendChild(childTester)
        })
    }


    createChildTesterElement(node) {
        let label = node.urn + " / " + node.contextualName;
        const test_el = FormUtils.createPropertyElement("test-" + node.id, label);
        this._nameInput = FormUtils.createTextInput('test-name-' + node.id);
        this._nameInput.setAttribute("placeholder", "test value");
        this._nameInput.className = "test-property";
        if (this._testBankMap.has(node.id)){
        this._nameInput.value = this._testBankMap.get(node.id)
        }
        test_el.appendChild(this._nameInput);
        return test_el
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

    // When updating a test input --- update the testBankMap... stores test settings across reloads.

}

customElements.define('def-definition', Definition);

export default customElements.get('def-definition');
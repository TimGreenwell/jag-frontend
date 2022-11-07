/**
 * @file Node properties panel.
 *
 * @author cwilber
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 1.07
 */

import Activity from '../models/activity.js';
import FormUtils from '../utils/forms.js';
import Validator from "../utils/validation.js";
import Binding from "../models/binding.js";


customElements.define(`jag-properties`, class extends HTMLElement {

    constructor() {
        super();
        this._focusNode = undefined;
        this._producesMap = new Map();  // ?
        this._consumesMap = new Map();  // ?
        this._newBinding = new Binding();
        this._initUI();
        this.ROUTERS = [];
        this.SORTERS = []


    }


    _getRouterDefinitions() {
        const definition = [
            {
                groupId: this._focusNode.activity.urn,
                groupName: ``,
                groupType: `router`,
                endpoints: [
                    {
                        name: `General Broadcast`,
                        type: `na`
                    },
                    {
                        name: `Content Based`,
                        type: `na`
                    },
                    {
                        name: `Competitive Customers`,
                        type: `na`
                    }
                ]
            }
        ];
        return definition;
    }

    _getSorterDefinitions() {
        const definition = [
            {
                groupId: this._focusNode.activity.urn,
                groupName: ``,
                groupType: `sorter`,
                endpoints: [
                    {
                        name: `Aggregate`,
                        type: `na`
                    },
                    {
                        name: `Round Robin`,
                        type: `na`
                    },
                    {
                        name: `Priority Based`,
                        type: `na`
                    },
                    {
                        name: `Real Time`,
                        type: `na`
                    },
                    {
                        name: `Queued`,
                        type: `na`
                    }
                ]
            }
        ];
        return definition;
    }

    _initUI() {
        // The "Child-Of" banner
        const $propertyDiv = document.createElement(`div`);
        $propertyDiv.id = `property-container`;
        const $activityPropertiesDiv = document.createElement(`div`);
        $activityPropertiesDiv.id = `activity-container`;
        const $nodePropertiesDiv = document.createElement(`div`);
        $nodePropertiesDiv.id = `node-container`;

        const $urnDiv = FormUtils.createPropertyElement(`urn-property`, `URN`);
        this._$urnInput = FormUtils.createTextInput(`urn-property`);
        this._$urnInput.setAttribute(`tabIndex`, `1`);
        this._$urnInput.className = `direct-property`;
        $urnDiv.appendChild(this._$urnInput);
        $activityPropertiesDiv.appendChild($urnDiv);

        const $activityNameDiv = FormUtils.createPropertyElement(`name-property`, `Name`);
        this._$activityNameInput = FormUtils.createTextInput(`name-property`);
        this._$activityNameInput.setAttribute(`placeholder`, `display name`);
        this._$activityNameInput.setAttribute(`tabIndex`, `0`);
        this._$activityNameInput.className = `direct-property`;
        $activityNameDiv.appendChild(this._$activityNameInput);
        $activityPropertiesDiv.appendChild($activityNameDiv);

        const $activityDescDiv = FormUtils.createPropertyElement(`desc-property`, `Description`);
        this._$activityDescInput = document.createElement(`textarea`);
        this._$activityDescInput.setAttribute(`id`, `desc-property`);
        this._$activityDescInput.setAttribute(`width`, `100%`);
        this._$activityDescInput.setAttribute(`rows`, `3`);
        this._$activityDescInput.setAttribute(`placeholder`, `...`);
        this._$activityDescInput.setAttribute(`tabIndex`, `2`);
        this._$activityDescInput.className = `direct-property`;
        $activityDescDiv.appendChild(this._$activityDescInput);
        $activityPropertiesDiv.appendChild($activityDescDiv);

        const executionOptions = [];
        const execution = Activity.EXECUTION;
        for (const step in execution) {
            executionOptions.push({
                value: execution[step].name,
                text: execution[step].text
            });
        }
        const $executionDiv = FormUtils.createPropertyElement(`execution-property`, `Execution`);
        this._$executionSelect = FormUtils.createSelect(`execution-property`, executionOptions);
        this._$executionSelect.className = `direct-property`;
        $executionDiv.appendChild(this._$executionSelect);
        $activityPropertiesDiv.appendChild($executionDiv);


        const operatorOptions = [];
        const operator = Activity.OPERATOR;
        for (const step in operator) {
            operatorOptions.push({
                value: operator[step].name,
                text: operator[step].text
            });
        }
        const $operationDiv = FormUtils.createPropertyElement(`operator-property`, `Operator`);             // @TODO Map this from original structure
        this._$operatorSelect = FormUtils.createSelect(`operator-property`, operatorOptions);
        this._$operatorSelect.className = `direct-property`;
        $operationDiv.appendChild(this._$operatorSelect);
        $activityPropertiesDiv.appendChild($operationDiv);

        // Inputs --- Add & List
        const $endpointsInDiv = FormUtils.createPropertyElement(`inputs-property`, `Inputs`);
        const $endpointInAdd = document.createElement(`span`);
        $endpointInAdd.innerHTML = `+`;
        $endpointInAdd.className = `io-add`;
        $endpointInAdd.addEventListener(`click`, this._handleAddEndpointIn.bind(this));
        $endpointsInDiv.appendChild($endpointInAdd);
        this._$endpointsInListDiv = FormUtils.createEmptyInputContainer(`inputs-property`);
        this._$endpointsInListDiv.className = `directProperty`;
        $endpointsInDiv.appendChild(this._$endpointsInListDiv);
        $activityPropertiesDiv.appendChild($endpointsInDiv);

        // Outputs --- Add & List
        const $endpointsOutDiv = FormUtils.createPropertyElement(`outputs-property`, `Outputs`);
        const $endpointOutAdd = document.createElement(`span`);
        $endpointOutAdd.innerHTML = `+`;
        $endpointOutAdd.className = `io-add`;
        $endpointOutAdd.addEventListener(`click`, this._handleAddEndpointOut.bind(this));
        $endpointsOutDiv.appendChild($endpointOutAdd);
        this._$endpointsOutListDiv = FormUtils.createEmptyInputContainer(`outputs-property`);
        this._$endpointsOutListDiv.className = `directProperty`;
        $endpointsOutDiv.appendChild(this._$endpointsOutListDiv);
        $activityPropertiesDiv.appendChild($endpointsOutDiv);

        // Bindings area - built as selections made.
        const $bindingsDiv = FormUtils.createPropertyElement(`bindings-property`, `Bindings`);
        this.$bindingActionsDiv = FormUtils.createEmptyInputContainer(`bindings-property`);
        this.$bindingActionsDiv.className = `directProperty`;
        $bindingsDiv.appendChild(this.$bindingActionsDiv);
        $activityPropertiesDiv.appendChild($bindingsDiv);

        // Create annotation area
        const annotations_el = FormUtils.createPropertyElement(`annotations-property`, `Annotations`);
        this._annotations = FormUtils.createEmptyInputContainer(`annotations-property`);
        this._annotations.className = `directProperty`;
        annotations_el.appendChild(this._annotations);
        $activityPropertiesDiv.appendChild(annotations_el);

        /**
         *   Node Properties
         *
         */
        const $nodeNameDiv = FormUtils.createPropertyElement(`name-ctx`, `Contextual Name`);
        this._$nodeNameInput = FormUtils.createTextInput(`name-ctx-property`);
        this._$nodeNameInput.className = `direct-property contextual`;
        $nodeNameDiv.appendChild(this._$nodeNameInput);
        $nodePropertiesDiv.appendChild($nodeNameDiv);

        const $nodeDescDiv = FormUtils.createPropertyElement(`desc-ctx`, `Contextual Description`);
        this._$nodeDescInput = FormUtils.createTextInput(`desc-ctx-property`);
        this._$nodeDescInput.className = `direct-property contextual`;
        $nodeDescDiv.appendChild(this._$nodeDescInput);
        $nodePropertiesDiv.appendChild($nodeDescDiv);

        // Create JSON export area
        const $exportJsonDiv = FormUtils.createEmptyInputContainer(`export`);
        this._$exportJsonButton = document.createElement(`button`);
        this._$exportJsonButton.innerHTML = `Export to JSON`;
        $exportJsonDiv.className = `directProperty`;
        $exportJsonDiv.appendChild(this._$exportJsonButton);
        $nodePropertiesDiv.appendChild($exportJsonDiv);

        // Create SVG export area
        const $exportSvgDiv = FormUtils.createEmptyInputContainer(`export-svg`);
        this._$exportSvgButton = document.createElement(`button`);
        this._$exportSvgButton.innerHTML = `Export to SVG`;
        $exportSvgDiv.className = `directProperty`;
        $exportSvgDiv.appendChild(this._$exportSvgButton);
        $nodePropertiesDiv.appendChild($exportSvgDiv);

        this._enableProperties(false);
        this.appendChild($propertyDiv);
        $propertyDiv.appendChild($activityPropertiesDiv);
        $propertyDiv.appendChild($nodePropertiesDiv);

        // this._$urnInput.addEventListener('keyup', e => {
        //     this._$urnInput.classList.toggle('edited', this._$urnInput.value !== this._focusNode.activity.urn);
        // });

        this._$activityNameInput.addEventListener(`blur`, this._handleActivityNameChange.bind(this));  // pass urn change to ControllerIA.updateURN
        this._$activityNameInput.addEventListener(`keyup`, this._handleActivityNameEdit.bind(this));

        this._$urnInput.addEventListener(`focusout`, this._handleUrnChange.bind(this));  // pass urn change to ControllerIA.updateURN
        this._$urnInput.addEventListener(`keyup`, this._handleUrnEdit.bind(this));  // pass urn change to ControllerIA.updateURN

        this._$activityDescInput.addEventListener(`blur`, this._handleActivityDescChange.bind(this));
        this._$activityDescInput.addEventListener(`keyup`, this._handleActivityDescEdit.bind(this));

        this._$nodeNameInput.addEventListener(`blur`, this._handleNodeNameChange.bind(this));
        this._$nodeDescInput.addEventListener(`blur`, this._handleNodeDescChange.bind(this));

        this._$executionSelect.addEventListener(`change`, this._handleExecutionChange.bind(this));
        this._$operatorSelect.addEventListener(`change`, this._handleOperatorChange.bind(this));

        this._$exportJsonButton.addEventListener(`click`, this._handleExportJsonClick.bind(this));
        this._$exportSvgButton.addEventListener(`click`, this._handleExportSvgClick.bind(this));
    }

    _handleActivityNameChange(e) {
        e.stopImmediatePropagation();
        if (this._focusNode) {
            this._focusNode.activity.name = this._$activityNameInput.value;
            this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                bubbles: true,
                composed: true,
                detail: {activity: this._focusNode.activity}
            }));
        }
    }

    _handleActivityNameEdit(e) {
        if (e.key === `Enter`) {
            e.preventDefault();
            const inputs = this.querySelectorAll(`input:enabled, textarea`);
            const currentPosition = this._$activityNameInput.tabIndex;
            if (currentPosition < inputs.length - 1) {
                inputs.item(currentPosition + 1).focus();
            } else {
                inputs.item(currentPosition).blur();
            }
        } else {
            this._focusNode.activity.name = `[${this._$activityNameInput.value}]`;
        }
    }

    _handleUrnChange(e) {
        if (this._focusNode.activity.urn !== this._$urnInput.value) {
            if (Validator.isValidUrn(this._$urnInput.value)) {        // && entered urn is valid...
                this.dispatchEvent(new CustomEvent(`event-urn-changed`, {
                    bubbles: true,
                    composed: true,
                    detail: {
                        originalUrn: this._$urnInput.value,
                        newUrn: this._focusNode.activity.urn
                    }
                }));
            }
        }
    }

    _handleUrnEdit(e) {
        if (e.key === `Enter`) {
            e.preventDefault();
            const inputs = this.querySelectorAll(`input:enabled, textarea`);
            this._$urnInput.classList.toggle(`edited`, this._$urnInput.value !== this._focusNode.activity.urn);
            // current position in 'form'
            const currentPosition = this._$urnInput.tabIndex;
            if (currentPosition < inputs.length - 1) {
                inputs.item(currentPosition + 1).focus();
            } else {
                inputs.item(currentPosition).blur();
            }
        }
    }

    _handleActivityDescChange(e) {
        e.stopImmediatePropagation();
        if ((this._focusNode) && (this._focusNode.activity)) {
            this._focusNode.activity.description = this._$activityDescInput.value;
            this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                bubbles: true,
                composed: true,
                detail: {activity: this._focusNode.activity}
            }));
        }
    }

    _handleActivityDescEdit(e) {
        if (e.key === `Enter`) {
            e.preventDefault();
            const inputs = this.querySelectorAll(`input:enabled, textarea`);
            const currentPosition = this._$activityDescInput.tabIndex;
            if (currentPosition < inputs.length - 1) {
                inputs.item(currentPosition + 1).focus();
            } else {
                inputs.item(currentPosition).blur();
            }
        } else {
            this._focusNode.activity.description = `[${this._$activityDescInput.value}]`;
        }
    }

    _handleExecutionChange(e) {
        e.stopImmediatePropagation();
        if (this._focusNode) {
            this._focusNode.activity.connector.execution = this._$executionSelect.value;
            this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                bubbles: true,
                composed: true,
                detail: {activity: this._focusNode.activity}
            }));
        }
    }

    _handleOperatorChange(e) {
        e.stopImmediatePropagation();
        if (this._focusNode) {
            this._focusNode.activity.operator = this._$operatorSelect.value;
            this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                bubbles: true,
                composed: true,
                detail: {activity: this._focusNode.activity}
            }));
        }
    }

    _handleNodeNameChange(e) {
        e.stopImmediatePropagation();
        if (this._focusNode) {
            this._focusNode.contextualName = this._$nodeNameInput.value;
            this.dispatchEvent(new CustomEvent(`event-node-updated`, {   //
                bubbles: true,
                composed: true,
                detail: {nodeModel: this._focusNode}
            }));
        }
    }

    _handleNodeDescChange(e) {
        e.stopImmediatePropagation();
        if (this._focusNode) {
            this._focusNode.contextualDescription = this._$nodeDescInput.value;
            this.dispatchEvent(new CustomEvent(`event-node-updated`, {
                bubbles: true,
                composed: true,
                detail: {nodeModel: this._focusNode}
            }));
        }
    }

    _handleExportJsonClick(e) {
        e.stopImmediatePropagation();
        const node = this._focusNode;
        this.dispatchEvent(new CustomEvent(`event-export-jag`, {
            bubbles: true,
            composed: true,
            detail: {node: this._focusNode}
        }));
    }

    _handleExportSvgClick(e) {
        e.stopImmediatePropagation();
        const node = this._focusNode;
        this.dispatchEvent(new CustomEvent(`event-export-svg`, {
            bubbles: true,
            composed: true,
            detail: {node: this._focusNode}
        }));
    }

    _handleAddEndpointIn(e) {
        if (this._focusNode) {
            const name = window.prompt(`Input name`);
            if (name === ``) {
                return;
            }
            const type = window.prompt(`Input type`);
            if (type === ``) {
                return;
            }
            const input = {name,
                type};
            this._focusNode.activity.addInput(input);
            this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                bubbles: true,
                composed: true,
                detail: {activity: this._focusNode.activity}
            }));
        }
    }

    _handleAddEndpointOut(e) {
        if (this._focusNode) { // } && !(this._focusNode instanceof UndefinedJAG)) {
            const name = window.prompt(`Output name`);
            if (name === ``) {
                return;
            }

            const type = window.prompt(`Output type`);
            if (type === ``) {
                return;
            }

            const output = {name,
                type};

            this._focusNode.activity.addOutput(output);
            this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                bubbles: true,
                composed: true,
                detail: {activity: this._focusNode.activity}
            }));
        }
    }

    /**
     *  _refreshProperties - fill property values according to reflect this._focusNode (on Activity update or new _focusNode)
     *  _enableProperties - Property entries are turned on and flags displayed
     *  _clearProperties
     */

    _refreshProperties() {
        this._$urnInput.value = this._focusNode.activity.urn;
        this._$activityNameInput.value = this._focusNode.activity.name;
        this._$executionSelect.value = this._focusNode.activity.connector.execution || `none`;
        this._$operatorSelect.value = this._focusNode.activity.operator || `none`;
        this._$activityDescInput.value = this._focusNode.activity.description;
        this._$nodeNameInput.value = this._focusNode.contextualName;
        this._$nodeDescInput.value = this._focusNode.contextualDescription;
        this._enableProperties(true);
        this._refreshEndpoints();
        this._refreshAnnotations();
        for (const input of this.querySelectorAll(`input`)) {
            input.title = input.value;
            input.onchange = () => {
                input.title = input.value;
                return input.title;
            };
        }
    }

    _enableProperties(enabled) {
        this._$urnInput.disabled = !enabled;
        this._$activityNameInput.disabled = !enabled;
        this._$activityDescInput.disabled = !enabled;
        this._$nodeNameInput.disabled = !enabled;
        this._$nodeDescInput.disabled = !enabled;
        this._$executionSelect.disabled = !enabled;
        this._$operatorSelect.disabled = !enabled;

        this._consumesMap.disabled = !enabled;
        this._producesMap.disabled = !enabled;
        this._$exportJsonButton.disabled = !enabled;
        this._$exportSvgButton.disabled = !enabled;

        // if (this._focusNode && (enabled)) {
        //     this.classList.toggle(`root-node`, false);
        //     this._$nodeNameInput.disabled = false;
        //     this._$nodeDescInput.disabled = false;
        // } else {
        //     this.classList.toggle(`root-node`, true);
        //     this._$nodeNameInput.disabled = true;
        //     this._$nodeDescInput.disabled = true;
        // }
    }

    _clearProperties() {
        this._$urnInput.value = ``;
        this._$activityNameInput.value = ``;
        this._$activityDescInput.value = ``;
        this._$nodeNameInput.value = ``;
        this._$nodeDescInput.value = ``;
        this._$executionSelect.value = Activity.EXECUTION.NONE.name;
        this._$operatorSelect.value = Activity.OPERATOR.NONE.name;
        this._$urnInput.classList.toggle(`edited`, false);
        this._clearEndpoints();
        this._clearAnnotations();
        for (const input of this.querySelectorAll(`input`)) {
            input.title = ``;
        }
    }

    /**
     *
     * External calls
     *
     */

    handleExternalActivityUpdate(newActivity, newActivityUrn) {   // ===> Called my ControllerAT
        if (newActivityUrn === this._focusNode.activity.urn) {
            this._focusNode.activity = newActivity;
            this._refreshProperties();
        }
    }

    handleSelectionUpdate(selection) {       // <== Called by ControllerAT    (selectedNodeArray)
        this._clearProperties();
        if (selection.length > 0) {
            const selectedNodeModel = selection[0];
            this._focusNode = selectedNodeModel;
            this._refreshProperties();
        } else {
            this._enableProperties(false);
        }
    }

    handleSelectionUnselected() {              // ===> Called my ControllerAT
        this._clearProperties();
        this._enableProperties(false);
    }

    /**
     * _refreshEndpoints
     *  _clearEndpoints - Wipes the Consume/Input and Produce/Output and Binding -- both map and displays
     *  _handleAddEndpointIn
     *  _handleAddEndpointOut
     *  _addInputElement
     *  _addOutputElement
     *  _createRouteDestinations
     *  _createRouteStart
     *  _findAllInputOptions
     *  _findAllOutputOptions
     *  _findFilteredInputOptions
     *  _findFilteredOutputOptions
     */


    _refreshEndpoints() {                // (when properties update)
        this._clearEndpoints();
        const oldBindings = this._focusNode.activity.bindings;
        console.log(`bindings`);
        console.log(oldBindings);

        // Creates the list of inputs under `Inputs   +`
        for (const input of this._focusNode.activity.inputs) {
            const input_id = `${input.name}-inputs-property`;
            this._addInputElement(input_id, input.name);
        }

        // Create node output panel
        for (const output of this._focusNode.activity.outputs) {
            const output_id = `${output.name}-outputs-property`;
            this._addOutputElement(output_id, output.name);
        }

        // Create binding panel
        const selfIns = this._getSelfIns();
        const selfOuts = this._getSelfOuts();
        const childOuts = this._getChildOuts();
        console.log(JSON.stringify(childOuts));
        const startEndpointOptions = [...selfIns, ...selfOuts, ...childOuts];
        const $startEndpointSelect = this._createRouteStart(startEndpointOptions);

        const $destinationEndpointSelect = FormUtils.createSelect(`binding-destination`, []);
        $destinationEndpointSelect.multiple = true;
        $destinationEndpointSelect.classList.add(`hidden`);

        const $arrow = document.createElement(`span`);
        $arrow.innerHTML = `&#x2192;`;
        $arrow.className = `binding arrow`;

        const $bindButton = document.createElement(`button`);
        $bindButton.id = `new-binding`;
        $bindButton.innerHTML = `Bind`;


        this.$bindingActionsDiv.appendChild($startEndpointSelect);
        this.$bindingActionsDiv.appendChild($destinationEndpointSelect);
        // this.$bindingActionsDiv.appendChild($arrow);
        // this.$bindingActionsDiv.appendChild($destinationEndpointSelect);
        this.$bindingActionsDiv.appendChild($bindButton);
        // this.$bindingActionsDiv.appendChild($bindingPanel);

        // Binding Events -  selectChanges, bindButton,
        // User changes 1st Select (the `from` selection)
        $startEndpointSelect.addEventListener(`change`, function (e) {
            const selectedStartEndpoints = Array.from(e.target.selectedOptions);  // HTMLCollection
            this._newBinding.from.length = 0;

            if (selectedStartEndpoints.length < 1) {
                $destinationEndpointSelect.classList.add(`hidden`);
                $destinationEndpointSelect.size = 0;
            }

            if (selectedStartEndpoints.length === 1) {
                const selectedOption = selectedStartEndpoints[0];
                const startEndpointType = selectedOption.value.split(`/`)[0];
                const startEndpointUrn = selectedOption.value.split(`/`)[1];
                const startEndpointName = selectedOption.label.split(` `)[0];
                let allowedEndpointDestination;
                if (startEndpointType === `in`) {
                    allowedEndpointDestination = this._getSelfOuts();
                } else if (startEndpointType === `out`) {
                    if (startEndpointUrn === this._focusNode.activity.urn) {
                        allowedEndpointDestination = [...this._getSelfIns(), ...this._getChildIns(), ...this._getRouterDefinitions()];
                    } else {
                        allowedEndpointDestination = [...this._getSelfIns(), ...this._getChildIns()];
                    }
                }
                $destinationEndpointSelect.classList.remove(`hidden`);
                this._newBinding.addFrom({urn: startEndpointUrn,
                    id: startEndpointName,
                    property: startEndpointType});
                console.log(`first go:`)
                console.log(JSON.stringify(this._newBinding))
                this._updateSelectList($destinationEndpointSelect, allowedEndpointDestination);
            }

            if (selectedStartEndpoints.length > 1) {
                // 1) Check if all selected are of same type -  all in-type or all out-type (can not have a mix)
                const groupType = selectedStartEndpoints[0].value.split(`/`)[0];
                let groupTypeValid = true;
                selectedStartEndpoints.forEach((endpoint) => {
                    const startEndpointType = endpoint.value.split(`/`)[0];
                    const startEndpointUrn = endpoint.value.split(`/`)[1];
                    const startEndpointName = endpoint.label.split(` `)[0];
                    if (startEndpointType !== groupType) {
                        groupTypeValid = false;
                    }
                    this._newBinding.addFrom({urn: startEndpointUrn,
                        id: startEndpointName,
                        property: startEndpointType});
                });
                // 2) create 2nd $select of allowed endpoints to end the route.
                let allowedEndpointDestination = [];
                if (groupTypeValid) {
                    if (groupType === `in`) {
                        allowedEndpointDestination = this._getSelfOuts();
                    } else if (groupType === `out`) {
                        allowedEndpointDestination = [...this._getSorterDefinitions()];
                    }
                    $destinationEndpointSelect.classList.remove(`hidden`);
                    this._updateSelectList($destinationEndpointSelect, allowedEndpointDestination);
                }
                else {
                    $destinationEndpointSelect.classList.add(`hidden`);
                }
            }
        }.bind(this));

        // Add handler for change in output select element
        $destinationEndpointSelect.addEventListener(`change`, function (e) {
            const selectedDestinationEndpoints = Array.from(e.target.selectedOptions);  // HTMLCollection
            this._newBinding.to.length = 0;
            console.log(JSON.stringify(this._newBinding.from))


            if (selectedDestinationEndpoints.length < 1) {
                $destinationEndpointSelect.classList.add(`hidden`);
                $destinationEndpointSelect.size = 0;
            }

            if (selectedDestinationEndpoints.length === 1) {
                // wake up buttons to click
                const selectedOption = selectedDestinationEndpoints[0];
                const destinationEndpointType = selectedOption.value.split(`/`)[0];
                const destinationEndpointUrn = selectedOption.value.split(`/`)[1];
                const destinationEndpointName = selectedOption.label.split(` `)[0];
                console.log(`adding to binding`)
                this._newBinding.addTo({urn: destinationEndpointUrn,
                    id: destinationEndpointName,
                    property: destinationEndpointType});
                console.log(this._newBinding.to)
                if (this._newBinding.to[0].type === `router`) {
                    console.log(`routere alete`)
                }
            }


            if (selectedDestinationEndpoints.length > 1) {
                // wake up buttons to click --

                selectedDestinationEndpoints.forEach((selectedOption) => {
                    const destinationEndpointType = selectedOption.value.split(`/`)[0];
                    const destinationEndpointUrn = selectedOption.value.split(`/`)[1];
                    const destinationEndpointName = selectedOption.label.split(` `)[0];
                    this._newBinding.addTo({urn: destinationEndpointUrn,
                        id: destinationEndpointName,
                        property: destinationEndpointType});
                });
            }
        }.bind(this));
        //     }

        $bindButton.addEventListener(`click`, function (e) {
            console.log(`checking`);
            console.log(this._newBinding);
            this._focusNode.activity.addBinding(this._newBinding);
            console.log(`committing`);
            console.log(JSON.stringify(this._focusNode.activity.bindings));
            this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                bubbles: true,
                composed: true,
                detail: {activity: this._focusNode.activity}
            }));


            // const selectedDestination = $destinationEndpointSelect.selectedOptions[0];
            // const selectedStart = $startEndpointSelect.selectedOptions[0];
            // if (selectedDestination && selectedStart) {
            //     const provider = selectedDestination.value.split(`:`);
            //     const consumer = selectedStart.value.split(`:`);
            //
            //     this._focusNode.activity.addBinding({
            //         consumer: {
            //             id: consumer[0],
            //             property: consumer[1]
            //         },
            //         provider: {
            //             id: provider[0],
            //             property: provider[1]
            //         }
            //     });
            //
            //     $destinationEndpointSelect.value = undefined;
            //     $startEndpointSelect.value = undefined;
            // }
        }.bind(this));


        // for (const binding of this._focusNode.activity.bindings) {
        //     const binding_box = FormUtils.createEmptyInputContainer(`binding-${binding.consumer.id}-${binding.consumer.property}`);
        //
        //     const output_label = document.createElement(`input`);
        //     output_label.disabled = true;
        //
        //     if (binding.provider.id == `this` || binding.provider.id == `any`) {
        //         output_label.value = `${binding.provider.id}:${binding.provider.property}`;
        //     } else {
        //         const provider_node = this._focusNode.activity.getCanonicalNode(binding.provider.id);
        //
        //         let provider_name = binding.provider.id;
        //
        //         if (provider_node.name) {
        //             provider_name = provider_node.name;
        //         } else if (provider_node.nodeModel.activity) {
        //             provider_name = provider_node.nodeModel.activity.name;
        //         }
        //
        //         output_label.value = `${provider_name}:${binding.provider.property}`;
        //     }
        //
        //     output_label.className = `binding output`;
        //
        //     binding_box.appendChild(output_label);
        //
        //     const arrow = document.createElement(`span`);
        //     arrow.innerHTML = `&#x2192;`;
        //     arrow.className = `binding arrow`;
        //     binding_box.appendChild(arrow);
        //
        //     const input_label = document.createElement(`input`);
        //     input_label.disabled = true;
        //
        //     if (binding.consumer.id == `this` || binding.consumer.id == `any`) {
        //         input_label.value = `${binding.consumer.id}:${binding.consumer.property}`;
        //     } else {
        //         const consumer_node = this._focusNode.activity.getCanonicalNode(binding.consumer.id);
        //
        //         let consumer_name = binding.consumer.id;
        //
        //         if (consumer_node.name) {
        //             consumer_name = consumer_node.name;
        //         } else if (consumer_node.nodeModel.activity) {
        //             consumer_name = consumer_node.nodeModel.activity.name;
        //         }
        //
        //         input_label.value = `${consumer_name}:${binding.consumer.property}`;
        //     }
        //
        //     input_label.className = `binding input`;
        //
        //     binding_box.appendChild(input_label);
        //
        //     const remove = document.createElement(`span`);
        //     remove.innerHTML = `-`;
        //     remove.className = `binding remove`;
        //
        //     remove.addEventListener(`click`, function (e) {
        //         this._focusNode.activity.removeBinding(binding);
        //     }.bind(this));
        //
        //     binding_box.appendChild(remove);
        //
        //     this.$bindingActionsDiv.appendChild(binding_box);
        // }
    }

    _clearEndpoints() {
        this._consumesMap.clear();
        while (this._$endpointsInListDiv.firstChild) {
            this._$endpointsInListDiv.removeChild(this._$endpointsInListDiv.firstChild);
        }

        this._producesMap.clear();
        while (this._$endpointsOutListDiv.firstChild) {
            this._$endpointsOutListDiv.removeChild(this._$endpointsOutListDiv.firstChild);
        }

        while (this.$bindingActionsDiv.firstChild) {
            this.$bindingActionsDiv.removeChild(this.$bindingActionsDiv.firstChild);
        }
    }


    _addInputElement(id, input) {
        const input_el = FormUtils.createPropertyElement(id, input);

        this._$endpointsInListDiv.appendChild(input_el);
    }

    _addOutputElement(id, output) {
        const output_el = FormUtils.createPropertyElement(id, output);

        this._$endpointsOutListDiv.appendChild(output_el);
    }

    // _createRouteDestinations(options) {
    //     const $bindingSelect = FormUtils.createSelect(`binding-inputs`, options.map((node) => {
    //         let label = node.id;
    //         if (node.id !== `this`) {
    //             label = node.name;
    //         }
    //
    //         return [
    //             {
    //                 label,
    //                 options: node.endpoints.map((endpoint) => {
    //                     return {
    //                         text: endpoint.name,
    //                         value: `${node.id}:${endpoint.name}`
    //                     };
    //                 })
    //             }
    //         ];
    //     }).reduce((c, n) => {
    //         return c.concat(n);
    //     }));
    //
    //     $bindingSelect.onfocus = function (e) {
    //         this._previous_value = this.value;
    //     }.bind($bindingSelect);
    //
    //     return $bindingSelect;
    // }


    _rebuildSelectList(endpointOptions) {
        let options;
        if (endpointOptions.length > 0) {
            options = endpointOptions.map((endpointOption) => {
                let label;
                if (endpointOption.groupId === this._focusNode.activity.urn) {
                    label = `(${endpointOption.groupType}) this`;
                } else {
                    label = `(${endpointOption.groupType}) ${endpointOption.groupName}`;
                }

                return [
                    {
                        label,
                        options: endpointOption.endpoints.map((endpoint) => {
                            if (endpointOption.groupType === `in`){
                                console.log(`labeling an in`)
                                this._focusNode.activity.bindings.forEach((binding) => {
                                    if (binding.from.name === endpoint.name) {
                                        console.log(`Already bound!!!!!!!`);
                                    }
                                });
                            }
                            return {
                                text: endpoint.name,
                                value: `${endpointOption.groupType}/${endpointOption.groupId}`
                            };
                        })
                    }
                ];
            }).reduce((prev, current) => {
                return prev.concat(current);
            });
        } else {
            options = [];
        }
        return options;
    }

    _getSelectListSize(endpointOptions) {
        return endpointOptions.reduce((prev, curr) => {
            return prev + 1 + Number(curr.endpoints.length);
        }, 0);
    }

    _updateSelectList($selectList, endpointOptions) {
        const numRows = this._getSelectListSize(endpointOptions);
        const options = this._rebuildSelectList(endpointOptions);
        FormUtils.updateSelect($selectList, options);
        $selectList.multiple = true;
        $selectList.size = numRows;
    }


    _createRouteStart(endpointOptions) {
        const numRows = this._getSelectListSize(endpointOptions);
        const $bindingSelect = FormUtils.createSelect(`binding-start`, this._rebuildSelectList(endpointOptions));
        $bindingSelect.multiple = true;
        $bindingSelect.size = numRows;
        // $bindingSelect.onfocus = function (e) {
        //     this._previous_value = this.value;
        // }.bind($bindingSelect);
        return $bindingSelect;
    }


    _getSelfIns() {
        const availableInputs = [];
        if (this._focusNode.activity.inputs.length > 0) {
            availableInputs.push({
                groupId: this._focusNode.activity.urn,
                groupName: this._focusNode.activity.name,
                groupType: `in`,
                endpoints: this._focusNode.activity.inputs
            });
        }
        return availableInputs;
    }

    _getSelfOuts() {
        const availableOutputs = [];
        if (this._focusNode.activity.outputs.length > 0) {
            availableOutputs.push({
                groupId: this._focusNode.activity.urn,
                groupName: this._focusNode.activity.name,
                groupType: `out`,
                endpoints: this._focusNode.activity.outputs
            });
        }
        return availableOutputs;
    }

    _getChildIns() {
        const availableInputs = [];
        this._focusNode.children.forEach((child) => {
            if (child.activity.inputs.length > 0) {
                availableInputs.push({
                    groupId: child.activity.urn,
                    groupName: child.activity.name,
                    groupType: `in`,
                    endpoints: child.activity.inputs
                });
            }
        });
        return availableInputs;
    }

    _getChildOuts() {
        const availableOutputs = [];
        this._focusNode.children.forEach((child) => {
            if (child.activity.outputs.length > 0) {
                availableOutputs.push({
                    groupId: child.activity.urn,
                    groupName: child.activity.name,
                    groupType: `out`,
                    endpoints: child.activity.outputs
                });
            }
        });
        return availableOutputs;
    }

    /**
     *  _refreshAnnotations - @TODO understand this
     *  _addAnnotation
     *  _clearAnnotations
     */

    _refreshAnnotations() {
        this._clearAnnotations();
        if (this._focusNode.children.length > 0) {
            for (const child of this._focusNode.children) {
                let child_name = child.id;
                if (child.activity) {
                    child_name = child.activity.name;
                }

                const child_annotations = FormUtils.createPropertyElement(`annotations-${child.id}`, child_name);
                child_annotations.className = `annotation node`;

                const annotation_add = document.createElement(`span`);
                annotation_add.innerHTML = `+`;
                annotation_add.className = `io-add`;

                annotation_add.addEventListener(`click`, function (e) {
                    this._addAnnotation(child.id);
                }.bind(this));

                child_annotations.appendChild(annotation_add);

                const iterable_box = document.createElement(`div`);

                const iterable_checkbox = document.createElement(`input`);
                iterable_checkbox.setAttribute(`id`, `${child.id}-iterable`);
                iterable_checkbox.type = `checkbox`;

                iterable_checkbox.addEventListener(`change`, function (e) {
                    this._focusNode.activity.setIterable(child.id, iterable_checkbox.checked);
                }.bind(this));

                iterable_box.appendChild(iterable_checkbox);

                const iterable_label = document.createElement(`label`);
                iterable_label.for = `${child.id}-iterable`;
                iterable_label.textContent = `Iterable`;
                iterable_box.appendChild(iterable_label);

                if (child.iterable) {
                    iterable_checkbox.checked = true;
                }

                child_annotations.appendChild(iterable_box);

                if (child.annotations) {
                    for (const annotation of child.annotations) {
                        const annotation_box = FormUtils.createEmptyInputContainer(`annotation-${child.id}-${annotation[0]}`);
                        annotation_box.className = `annotation descriptor`;

                        const annotation_name = document.createElement(`input`);
                        annotation_name.disabled = true;
                        annotation_name.value = annotation[0];

                        annotation_name.className = `annotation name`;

                        annotation_box.appendChild(annotation_name);

                        const equals = document.createElement(`span`);
                        equals.innerHTML = `=`;
                        equals.className = `annotation equals`;
                        annotation_box.appendChild(equals);

                        const annotation_value = document.createElement(`input`);
                        annotation_value.disabled = true;

                        const value = annotation[1];
                        const value_text = value === Object(value) ? JSON.stringify(value) : value.toString();
                        annotation_value.value = value_text;

                        annotation_value.className = `annotation value`;

                        annotation_box.appendChild(annotation_value);

                        const remove = document.createElement(`span`);
                        remove.innerHTML = `-`;
                        remove.className = `annotation remove`;

                        remove.addEventListener(`click`, function (e) {
                            this._focusNode.activity.removeAnnotation(child.id, annotation[0]);
                        }.bind(this));

                        annotation_box.appendChild(remove);

                        child_annotations.appendChild(annotation_box);
                    }
                }

                this._annotations.appendChild(child_annotations);
            }
        }
    }

    _addAnnotation(id) {
        const name = window.prompt(`Annotation name`);
        if (name === null) {
            return;
        }

        let value = window.prompt(`Annotation value`);
        if (value === null) {
            return;
        }

        let parsed = false;

        if (value == `true` || value == `false`) {
            const boolean_type = window.confirm(`Treat this value as a boolean?`);
            if (boolean_type) {
                value = (value == `true`);
            }
            parsed = boolean_type;
        } else {
            const entry = new RegExp(`^(\\+|\\-)?[0-9]+(\\.[0-9]+)?$`, `u`);
            if (value.match(entry)) {
                const parseNum = new RegExp(`^(\\+|\\-)?[0-9]+$`, `u`);
                if (value.match(parseNum)) {
                    const integer_type = window.confirm(`Treat this value as an integer?`);
                    if (integer_type) {
                        value = parseInt(value, 10);
                    }
                    parsed = integer_type;
                }

                if (!parsed) {
                    const float_type = window.confirm(`Treat this value as a floating-point number?`);
                    if (float_type) {
                        value = parseFloat(value);
                    }
                    parsed = float_type;
                }
            }
        }

        if (!parsed) {
            const json_type = window.confirm(`Treat this value as an abstract JSON structure?`);

            if (json_type) {
                try {
                    value = JSON.parse(value);
                } catch {
                    window.alert(`Failed to parse value: please try again with a valid JSON string.`);
                    return;
                }
            }
        }

        this._focusNode.activity.addAnnotation(id, name, value);
    }

    _clearAnnotations() {
        while (this._annotations.firstChild) {
            this._annotations.removeChild(this._annotations.firstChild);
        }
    }


});

export default customElements.get(`jag-properties`);


// cloneActivity(sourceActivity, newURN) {
//     const description = sourceActivity.toJSON();
//     description.urn = newURN;
//     const newActivity = Activity.fromJSON(description);
//     // Update activity references.
//     this._node.activity = newActivity; // ?
//     this._focusNode.activity = newActivity;
//     this.dispatchEvent(new CustomEvent(`event-activity-created`, {
//         bubbles: true,
//         composed: true,
//         detail: {activityConstruct: newActivity}
//     }));    // event-activity-created in playground uses components
//     // Remove unsaved box shadow on URN property input.
//     this._$urnInput.classList.toggle(`edited`, false);
// }


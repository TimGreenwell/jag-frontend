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
        this._newBinding = new Binding();
        this._initUI();
        this.ARROW = `\u21D2`;
    }


    _getRouterDefinitions() {
        const definition = [
            {
                activityId: this._focusNode.activity.urn,
                activityName: ``,
                activityConnectionType: `router`,
                endpoints: [
                    {
                        identity: `GeneralBroadcast`,
                        format: `na`
                    },
                    {
                        identity: `ContentBased`,
                        format: `na`
                    },
                    {
                        identity: `CompetitiveCustomers`,
                        format: `na`
                    }
                ]
            }
        ];
        return definition;
    }

    _getCollectorDefinitions() {
        const definition = [
            {
                activityId: this._focusNode.activity.urn,
                activityName: ``,
                activityConnectionType: `collector`,
                endpoints: [
                    {
                        identity: `Aggregate`,
                        format: `na`
                    },
                    {
                        identity: `RoundRobin`,
                        format: `na`
                    },
                    {
                        identity: `Priority`,
                        format: `na`
                    },
                    {
                        identity: `RealTime`,
                        format: `na`
                    },
                    {
                        identity: `Queued`,
                        format: `na`
                    },
                    {
                        identity: `FirstResponse`,
                        format: `na`
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
        this._$urnInput.setAttribute(`tabIndex`, `0`);
        this._$urnInput.className = `direct-property`;
        $urnDiv.appendChild(this._$urnInput);
        $activityPropertiesDiv.appendChild($urnDiv);

        const $activityNameDiv = FormUtils.createPropertyElement(`name-property`, `Name`);
        this._$activityNameInput = FormUtils.createTextInput(`name-property`);
        this._$activityNameInput.setAttribute(`placeholder`, `display name`);
        this._$activityNameInput.setAttribute(`tabIndex`, `1`);
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
        const $operatorDiv = FormUtils.createPropertyElement(`operator-property`, `Operator`);             // @TODO Map this from original structure
        this._$operatorSelect = FormUtils.createSelect(`operator-property`, operatorOptions);
        this._$operatorSelect.className = `direct-property`;
        $operatorDiv.appendChild(this._$operatorSelect);
        $activityPropertiesDiv.appendChild($operatorDiv);


        // Bindings area - built in this.$bindingBuilderDiv as selections are made.
        const $bindingsDiv = FormUtils.createEmptyInputContainer(`bindings-property`);
        const $bindingAddersDiv = FormUtils.createEmptyInputContainer(`adders-property`);
        $bindingAddersDiv.className = `row-spread`;

        // Inputs --- Add & List
        // const $endpointsInDiv = FormUtils.createPropertyElement(`inputs-property`, `Inputs`);
        const $endpointInAddButton = document.createElement(`button`);
        $endpointInAddButton.innerHTML = `Add Input`;
        $endpointInAddButton.className = `directProperty`;
        $endpointInAddButton.addEventListener(`click`, this._handleAddEndpointIn.bind(this));
        $bindingAddersDiv.appendChild($endpointInAddButton);

        const $endpointOutAddButton = document.createElement(`button`);
        $endpointOutAddButton.innerHTML = `Add Output`;
        $endpointOutAddButton.className = `directProperty`;
        $endpointOutAddButton.addEventListener(`click`, this._handleAddEndpointOut.bind(this));
        $bindingAddersDiv.appendChild($endpointOutAddButton);
        $bindingsDiv.appendChild($bindingAddersDiv);

        // ///// Builder == Selects
        this.$bindingBuilderDiv = FormUtils.createEmptyInputContainer(`binding-builder-property`);
        this.$bindingBuilderDiv.className = `directProperty`;


        this.$startEndpointSelect = FormUtils.createSelect(`binding-start`);
        this.$startEndpointSelect.multiple = true;
        this.$bindingBuilderDiv.appendChild(this.$startEndpointSelect);

        this.$destinationEndpointSelect = FormUtils.createSelect(`binding-destination`);
        this.$destinationEndpointSelect.multiple = true;
        this.$destinationEndpointSelect.classList.add(`hidden`);
        this.$bindingBuilderDiv.appendChild(this.$destinationEndpointSelect);

        const $bindingButtonsDiv = FormUtils.createEmptyInputContainer(`binding-buttons`);
        this.$bindButton = document.createElement(`button`);
        this.$bindButton.id = `add-binding`;
        this.$bindButton.innerHTML = `Bind`;
        this.$bindButton.disabled = true;
        $bindingButtonsDiv.appendChild(this.$bindButton);

        this.$unbindButton = document.createElement(`button`);
        this.$unbindButton.id = `delete-binding`;
        this.$unbindButton.innerHTML = `Unbind`;
        this.$unbindButton.disabled = true;
        $bindingButtonsDiv.appendChild(this.$unbindButton);

        this.$removeButton = document.createElement(`button`);
        this.$removeButton.id = `remove-endpoint`;
        this.$removeButton.innerHTML = `Remove`;
        this.$removeButton.disabled = true;
        $bindingButtonsDiv.appendChild(this.$removeButton);
        this.$bindingBuilderDiv.appendChild($bindingButtonsDiv);

        $bindingsDiv.appendChild(this.$bindingBuilderDiv);

        $activityPropertiesDiv.appendChild($bindingsDiv);

        // Binding Events -  selectChanges, bindButton,
        // User changes 1st Select (the `from` selection)

        this.$startEndpointSelect.addEventListener(`change`, this.handleFromSelect.bind(this));
        this.$destinationEndpointSelect.addEventListener(`change`, this.handleToSelect.bind(this));
        this.$bindButton.addEventListener(`click`, this.handleBindButton.bind(this));
        this.$unbindButton.addEventListener(`click`, this.handleUnbindButton.bind(this));
        this.$removeButton.addEventListener(`click`, this.handleRemoveButton.bind(this));


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

        this._enablePropertiesInputs(false);

        $propertyDiv.appendChild($activityPropertiesDiv);
        $propertyDiv.appendChild($nodePropertiesDiv);
        this.appendChild($propertyDiv);

        this._$urnInput.addEventListener(`focusout`, this._handleUrnChange.bind(this));  // pass urn change to ControllerIA.updateURN
        this._$activityNameInput.addEventListener(`blur`, this._handleActivityNameChange.bind(this));  // pass urn change to ControllerIA.updateURN
        this._$activityDescInput.addEventListener(`blur`, this._handleActivityDescChange.bind(this));
        this._$nodeNameInput.addEventListener(`blur`, this._handleNodeNameChange.bind(this));
        this._$nodeDescInput.addEventListener(`blur`, this._handleNodeDescChange.bind(this));
        this._$executionSelect.addEventListener(`change`, this._handleExecutionChange.bind(this));
        this._$operatorSelect.addEventListener(`change`, this._handleOperatorChange.bind(this));
        this._$exportJsonButton.addEventListener(`click`, this._handleExportJsonClick.bind(this));
        this._$exportSvgButton.addEventListener(`click`, this._handleExportSvgClick.bind(this));
    }

    /**
     *  Event Handlers
     * _handleUrnChange
     * _handleActivityNameChange
     * _handleActivityDescChange
     * _handleExecutionChange
     * _handleOperatorChange
     * _handleAddEndpointIn
     * _handleAddEndpointOut
     * _handleNodeNameChange
     * _handleNodeDescChange
     * _handleExportJsonClick
     * _handleExportSvgClick
     *
     */


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


    _handleAddEndpointIn(e) {
        if (this._focusNode) {
            const identity = window.prompt(`Input name`);
            if (identity === ``) {
                return;
            }
            const format = window.prompt(`Input type`);
            if (format === ``) {
                return;
            }
            const input = {identity,
                format};
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
            const identity = window.prompt(`Output name`);
            if (identity === ``) {
                return;
            }

            const format = window.prompt(`Output type`);
            if (format === ``) {
                return;
            }

            const output = {identity,
                format};

            this._focusNode.activity.addOutput(output);
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

    /**
     *
     * External calls
     *
     */

    handleExternalActivityUpdate(newActivity, newActivityUrn) {   // ===> Called my ControllerAT
        if (newActivityUrn === this._focusNode.activity.urn) {
            this._focusNode.activity = newActivity;
            this._populatePropertyFields();
        }
    }

    handleSelectionUpdate(selection) {       // <== Called by ControllerAT    (selectedNodeArray)
        this._clearProperties();
        if (selection.length > 0) {
            const selectedNodeModel = selection[0];
            this._focusNode = selectedNodeModel;
            this._populatePropertyFields();
        } else {
            this._enablePropertiesInputs(false);
        }
    }

    handleSelectionUnselected() {              // ===> Called my ControllerAT
        this._clearProperties();
        this._enablePropertiesInputs(false);
    }


    handleFromSelect(e) {
        const selectedStartEndpoints = Array.from(e.target.selectedOptions);  // HTMLCollection
        this._newBinding.from.length = 0;
        this.$unbindButton.disabled = true;
        this.$removeButton.disabled = true;

        if (selectedStartEndpoints.length < 1) {
            this.$destinationEndpointSelect.classList.add(`hidden`);
            this.$destinationEndpointSelect.size = 0;
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
                    allowedEndpointDestination = [...this._getSelfIns(), ...this._getChildIns(), ...this._getCollectorDefinitions()];
                }
            } else if (startEndpointType === `router`) {
                if (startEndpointUrn === this._focusNode.activity.urn) {
                    allowedEndpointDestination = [...this._getChildIns()];
                } else {
                    allowedEndpointDestination = [...this._getSelfIns(), ...this._getChildIns()];  // dont think this should be allowed
                }
            } else if (startEndpointType === `collector`) {
                allowedEndpointDestination = [...this._getSelfIns()];
            }
            this.$destinationEndpointSelect.classList.remove(`hidden`);
            this._newBinding.addFrom({urn: startEndpointUrn,
                id: startEndpointName,
                property: startEndpointType});
            this._updateSelectList(this.$destinationEndpointSelect, allowedEndpointDestination);

            if (this._focusNode.activity.isBound(startEndpointUrn, startEndpointType, startEndpointName)) {
                this.$unbindButton.disabled = false;
            }
            if ((startEndpointUrn === this._focusNode.activity.urn) && !(this._focusNode.activity.isBound(startEndpointUrn, startEndpointType, startEndpointName))) {
                this.$removeButton.disabled = false;
            }
        }

        if (selectedStartEndpoints.length > 1) {
            // 1) Check if all selected are of same type -  all in-type or all out-type (can not have a mix)
            const activityConnectionType = selectedStartEndpoints[0].value.split(`/`)[0];
            let activityConnectionTypeValid = true;
            selectedStartEndpoints.forEach((endpoint) => {
                const startEndpointType = endpoint.value.split(`/`)[0];
                const startEndpointUrn = endpoint.value.split(`/`)[1];
                const startEndpointName = endpoint.label.split(` `)[0];
                if (startEndpointType !== activityConnectionType) {
                    activityConnectionTypeValid = false;
                }
                this._newBinding.addFrom({urn: startEndpointUrn,
                    id: startEndpointName,
                    property: startEndpointType});
            });
            // 2) create 2nd $select of allowed endpoints to end the route.
            let allowedEndpointDestination = [];
            if (activityConnectionTypeValid) {
                if (activityConnectionType === `in`) {
                    allowedEndpointDestination = this._getSelfOuts();
                } else if (activityConnectionType === `out`) {
                    allowedEndpointDestination = [...this._getCollectorDefinitions()];
                } else if (activityConnectionType === `collector`) {
                    allowedEndpointDestination = [...this._getSelfIns()];
                }
                this.$destinationEndpointSelect.classList.remove(`hidden`);
                this._updateSelectList(this.$destinationEndpointSelect, allowedEndpointDestination);
            } else {
                this.$destinationEndpointSelect.classList.add(`hidden`);
            }
        }
    }

    handleToSelect(e) {
        const selectedDestinationEndpoints = Array.from(e.target.selectedOptions);  // HTMLCollection
        this._newBinding.to.length = 0;


        if (selectedDestinationEndpoints.length < 1) {
            this.$destinationEndpointSelect.classList.add(`hidden`);
            this.$destinationEndpointSelect.size = 0;
            this.$bindButton.disabled = true;
        }

        if (selectedDestinationEndpoints.length === 1) {
        // wake up buttons to click
            this.$bindButton.disabled = false;
            const selectedOption = selectedDestinationEndpoints[0];
            const destinationEndpointType = selectedOption.value.split(`/`)[0];
            const destinationEndpointUrn = selectedOption.value.split(`/`)[1];
            const destinationEndpointName = selectedOption.label.split(` `)[0];
            this._newBinding.addTo({
                urn: destinationEndpointUrn,
                id: destinationEndpointName,
                property: destinationEndpointType
            });
        }


        if (selectedDestinationEndpoints.length > 1) {
        // wake up buttons to click --
            this.$bindButton.disabled = false;
            selectedDestinationEndpoints.forEach((selectedOption) => {
                const destinationEndpointType = selectedOption.value.split(`/`)[0];
                const destinationEndpointUrn = selectedOption.value.split(`/`)[1];
                const destinationEndpointName = selectedOption.label.split(` `)[0];
                this._newBinding.addTo({
                    urn: destinationEndpointUrn,
                    id: destinationEndpointName,
                    property: destinationEndpointType
                });
            });
        }
    }

    handleBindButton(e) {
        this._focusNode.activity.addBinding(this._newBinding);
        if (this._newBinding.to[0].property === `router`) {
            this._focusNode.activity.addRouter({identity: this._newBinding.to[0].id,
                format: `NoIdeaWhatToPutHere`});
        }
        if (this._newBinding.to[0].property === `collector`) {
            this._focusNode.activity.addCollector({identity: this._newBinding.to[0].id,
                format: `NoIdeaWhatToPutHere`});
        }
        console.log(this._newBinding);
        this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
            bubbles: true,
            composed: true,
            detail: {activity: this._focusNode.activity}
        }));
        this.$bindButton.disabled = true;
    }

    handleUnbindButton(e) {
        this._focusNode.activity.removeBinding(this._newBinding);
        this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
            bubbles: true,
            composed: true,
            detail: {activity: this._focusNode.activity}
        }));
        this.$unbindButton.disabled = true;
    }

    handleRemoveButton(e) {
        if (this._newBinding.from[0].property === `in`) {
            this._focusNode.activity.removeInput(this._newBinding.from[0].id);
        }
        if (this._newBinding.from[0].property === `out`) {
            this._focusNode.activity.removeOutput(this._newBinding.from[0].id);
        }
        this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
            bubbles: true,
            composed: true,
            detail: {activity: this._focusNode.activity}
        }));
        this.$removeButton.disabled = true;
    }

    /**
     *  _populatePropertyFields - fill property values according to reflect this._focusNode (on Activity update or new _focusNode)
     *  _enablePropertiesInputs - Property entries are turned on and flags displayed
     *  _clearProperties
     */

    _populatePropertyFields() {
        this._$urnInput.value = this._focusNode.activity.urn;
        this._$activityNameInput.value = this._focusNode.activity.name;
        this._$executionSelect.value = this._focusNode.activity.connector.execution || `none`;
        this._$operatorSelect.value = this._focusNode.activity.operator || `none`;
        this._$activityDescInput.value = this._focusNode.activity.description;
        this._$nodeNameInput.value = this._focusNode.contextualName;
        this._$nodeDescInput.value = this._focusNode.contextualDescription;
        this._enablePropertiesInputs(true);
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

    _enablePropertiesInputs(enabled) {
        this._$urnInput.disabled = !enabled;
        this._$activityNameInput.disabled = !enabled;
        this._$activityDescInput.disabled = !enabled;
        this._$nodeNameInput.disabled = !enabled;
        this._$nodeDescInput.disabled = !enabled;
        this._$executionSelect.disabled = !enabled;
        this._$operatorSelect.disabled = !enabled;
        this._$exportJsonButton.disabled = !enabled;
        this._$exportSvgButton.disabled = !enabled;
    }

    _refreshEndpoints() {                // (when properties update)
        this._clearEndpoints();
        const selfIns = this._getSelfIns();
        const selfOuts = this._getSelfOuts();
        const childOuts = this._getChildOuts();
        const collectors = this._getCollectors();
        const routers = this._getRouters();
        const startEndpointOptions = [...selfIns, ...selfOuts, ...childOuts, ...collectors, ...routers];
        const numRows = this._getSelectListSize(startEndpointOptions);
        this.$startEndpointSelect = FormUtils.updateSelect(this.$startEndpointSelect, this._rebuildSelectList(startEndpointOptions));
        this.$startEndpointSelect.size = numRows;
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

    _clearEndpoints() {
        while (this.$startEndpointSelect.firstChild) {
            this.$startEndpointSelect.removeChild(this.$startEndpointSelect.firstChild);
        }
        while (this.$destinationEndpointSelect.firstChild) {
            this.$destinationEndpointSelect.removeChild(this.$destinationEndpointSelect.firstChild);
        }
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


    // isBoundFrom(urn,name,type) {
    //     this._focusNode.activity.bindings.forEach((extantBinding) => {
    //         extantBinding.from.forEach((extantFromEndpoint) => {
    //             if (extantFromEndpoint.id === selectOptionEndpoint.name) {
    //                 const toEndpoints = extantBinding.to.map((extantToEndpoints) => {
    //                     return extantToEndpoints.id;
    //                 });
    //                 optionDisplay = `${selectOptionEndpoint.name} ${this.ARROW} ${toEndpoints}`;
    //             }
    //         });
    //     });
    // }

    _rebuildSelectList(selectOptions) {
        let options;
        if (selectOptions.length > 0) {
            options = selectOptions.map((selectOption) => {
                let label;
                if (selectOption.activityId === this._focusNode.activity.urn) {
                    label = `(${selectOption.activityConnectionType}) this`;
                } else {
                    label = `(${selectOption.activityConnectionType}) ${selectOption.activityName}`;
                }

                return [
                    {
                        label,
                        options: selectOption.endpoints.map((selectOptionEndpoint) => {
                            // urn (us:ihmc:111) id(111in1) property(in)
                            // has a name(111in1) and type(111)
                            let optionDisplay = selectOptionEndpoint.identity;
                            // if ((selectOption.activityConnectionType === `in`) || (selectOption.activityConnectionType === `out`)) {
                            this._focusNode.activity.bindings.forEach((extantBinding) => {
                                extantBinding.from.forEach((extantFromEndpoint) => {
                                    if (extantFromEndpoint.id === selectOptionEndpoint.identity) {
                                        const toEndpoints = extantBinding.to.map((extantToEndpoints) => {
                                            return extantToEndpoints.id;
                                        });
                                        optionDisplay = `${selectOptionEndpoint.identity} ${this.ARROW} ${toEndpoints}`;
                                    }
                                });
                            });
                            // }
                            return {
                                text: optionDisplay,
                                value: `${selectOption.activityConnectionType}/${selectOption.activityId}`
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


    _getRouters() {
        const availableInputs = [];
        if (this._focusNode.activity.routers.length > 0) {
            availableInputs.push({
                activityId: this._focusNode.activity.urn,
                activityName: this._focusNode.activity.name,
                activityConnectionType: `router`,
                endpoints: this._focusNode.activity.routers
            });
        }
        return availableInputs;
    }

    _getCollectors() {
        const availableInputs = [];
        if (this._focusNode.activity.collectors.length > 0) {
            availableInputs.push({
                activityId: this._focusNode.activity.urn,
                activityName: this._focusNode.activity.name,
                activityConnectionType: `collector`,
                endpoints: this._focusNode.activity.collectors
            });
        }
        return availableInputs;
    }


    _getSelfIns() {
        const availableInputs = [];
        if (this._focusNode.activity.inputs.length > 0) {
            availableInputs.push({
                activityId: this._focusNode.activity.urn,
                activityName: this._focusNode.activity.name,
                activityConnectionType: `in`,
                endpoints: this._focusNode.activity.inputs
            });
        }
        return availableInputs;
    }

    _getSelfOuts() {
        const availableOutputs = [];
        if (this._focusNode.activity.outputs.length > 0) {
            availableOutputs.push({
                activityId: this._focusNode.activity.urn,
                activityName: this._focusNode.activity.name,
                activityConnectionType: `out`,
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
                    activityId: child.activity.urn,
                    activityName: child.activity.name,
                    activityConnectionType: `in`,
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
                    activityId: child.activity.urn,
                    activityName: child.activity.name,
                    activityConnectionType: `out`,
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


//  Had these awhile to 'tab' through the entry inputs with a Return instead of tab.
//  Works but Abandoned - it slightly limited text field entries.
// this._$urnInput.addEventListener(`keyup`, this._handleUrnEdit.bind(this));
// this._$activityNameInput.addEventListener(`keyup`, this._handleActivityNameEdit.bind(this));
// this._$activityDescInput.addEventListener(`keyup`, this._handleActivityDescEdit.bind(this));
// _handleUrnEdit(e) {
//     if (e.key === `Enter`) {
//         e.preventDefault();
//         const inputs = this.querySelectorAll(`input:enabled, textarea`);
//         this._$urnInput.classList.toggle(`edited`, this._$urnInput.value !== this._focusNode.activity.urn);
//         const currentPosition = this._$urnInput.tabIndex;
//         if (currentPosition < inputs.length - 1) {
//             inputs.item(currentPosition + 1).focus();
//         } else {
//             inputs.item(currentPosition).blur();
//         }
//     }
// }
// _handleActivityNameEdit(e) {
//     if (e.key === `Enter`) {
//         e.preventDefault();
//         const $inputs = this.querySelectorAll(`input:enabled, textarea`);
//         const currentPosition = this._$activityNameInput.tabIndex;
//         if (currentPosition < $inputs.length - 1) {
//             $inputs.item(currentPosition + 1).focus();
//         } else {
//             $inputs.item(currentPosition).blur();
//         }
//     } else {
//         this._focusNode.activity.name = `[${this._$activityNameInput.value}]`;
//     }
// }
// _handleActivityDescEdit(e) {
//     if (e.key === `Enter`) {
//         e.preventDefault();
//         const inputs = this.querySelectorAll(`input:enabled, textarea`);
//         const currentPosition = this._$activityDescInput.tabIndex;
//         if (currentPosition < inputs.length - 1) {
//             inputs.item(currentPosition + 1).focus();
//         } else {
//             inputs.item(currentPosition).blur();
//         }
//     } else {
//         this._focusNode.activity.description = `[${this._$activityDescInput.value}]`;
//     }
// }

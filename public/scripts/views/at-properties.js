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
import atPropertyUi from "./at-properties-ui.js";

customElements.define(`jag-properties`, class extends HTMLElement {

    constructor() {
        super();
        this._focusNode = undefined;
        this._newBinding = new Binding();
        this._elementMap = new Map();
        this._initUI();
        this.ARROW = `\u21D2`;
    }

    _initUI() {
        this._elementMap = atPropertyUi();
        const $container = this._elementMap.get(`property-container`);
        this.appendChild($container);
        this._enablePropertyInputs(false);
        this._elementMap.get(`urn-input`).addEventListener(`focusout`, this._handleUrnChange.bind(this));
        this._elementMap.get(`name-input`).addEventListener(`blur`, this._handleActivityNameChange.bind(this));
        this._elementMap.get(`desc-input`).addEventListener(`blur`, this._handleActivityDescChange.bind(this));

        this._elementMap.get(`execution-select`).addEventListener(`change`, this._handleExecutionChange.bind(this));
        this._elementMap.get(`operator-select`).addEventListener(`change`, this._handleOperatorChange.bind(this));

        this._elementMap.get(`input-button`).addEventListener(`click`, this._handleAddEndpointIn.bind(this));
        this._elementMap.get(`output-button`).addEventListener(`click`, this._handleAddEndpointOut.bind(this));
        this._elementMap.get(`binding-from-select`).addEventListener(`change`, this.handleFromSelect.bind(this));
        this._elementMap.get(`binding-to-select`).addEventListener(`change`, this.handleToSelect.bind(this));
        this._elementMap.get(`bind-button`).addEventListener(`click`, this.handleBindButton.bind(this));
        this._elementMap.get(`unbind-button`).addEventListener(`click`, this.handleUnbindButton.bind(this));
        this._elementMap.get(`remove-button`).addEventListener(`click`, this.handleRemoveButton.bind(this));

        this._elementMap.get(`node-name-input`).addEventListener(`blur`, this._handleNodeNameChange.bind(this));
        this._elementMap.get(`node-desc-input`).addEventListener(`blur`, this._handleNodeDescChange.bind(this));
        this._elementMap.get(`export-json-button`).addEventListener(`click`, this._handleExportJsonClick.bind(this));
        this._elementMap.get(`export-svg-button`).addEventListener(`click`, this._handleExportSvgClick.bind(this));
    }

    /**
     * _getRouterDefinitions
     * _getCollectorDefinitions
     */

    _getRouterDefinitions() {
        const definition = [
            {
                activityId: this._focusNode.activity.urn,
                activityName: ``,
                activityConnectionType: `every`,
                endpoints: [
                    {
                        identity: `SendToEvery`,
                        format: `na`
                    },
                    {
                        identity: `--ContentBased`,
                        format: `na`
                    },
                    {
                        identity: `--CompetitiveCustomers`,
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
                activityConnectionType: `any`,
                endpoints: [
                    {
                        identity: `FromAny`,
                        format: `na`
                    },
                    {
                        identity: `--RoundRobin`,
                        format: `na`
                    },
                    {
                        identity: `--Priority`,
                        format: `na`
                    },
                    {
                        identity: `--RealTime`,
                        format: `na`
                    },
                    {
                        identity: `--Queued`,
                        format: `na`
                    },
                    {
                        identity: `--FirstResponse`,
                        format: `na`
                    }
                ]
            }
        ];
        return definition;
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
     * handleFromSelect
     * handleToSelect
     * handleBindButton
     * handleUnbindButton
     * handleRemoveButton
     */

    _handleUrnChange() {
        const $urnInput = this._elementMap.get(`urn-input`);
        if (this._focusNode.activity.urn !== $urnInput.value) {
            if (Validator.isValidUrn($urnInput.value)) {        // && entered urn is valid...
                this.dispatchEvent(new CustomEvent(`event-urn-changed`, {
                    bubbles: true,
                    composed: true,
                    detail: {
                        originalUrn: $urnInput.value,
                        newUrn: this._focusNode.activity.urn
                    }
                }));
            }
        }
    }

    _handleActivityNameChange(e) {
        e.stopImmediatePropagation();
        const $activityNameInput = this._elementMap.get(`name-input`);
        if (this._focusNode) {
            this._focusNode.activity.name = $activityNameInput.value;
            this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                bubbles: true,
                composed: true,
                detail: {activity: this._focusNode.activity}
            }));
        }
    }

    _handleActivityDescChange(e) {
        e.stopImmediatePropagation();
        const $activityDescInput = this._elementMap.get(`desc-input`);
        if ((this._focusNode) && (this._focusNode.activity)) {
            this._focusNode.activity.description = $activityDescInput.value;
            this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                bubbles: true,
                composed: true,
                detail: {activity: this._focusNode.activity}
            }));
        }
    }

    _handleExecutionChange(e) {
        e.stopImmediatePropagation();
        const $executionSelect = this._elementMap.get(`execution-select`);
        if (this._focusNode) {
            this._focusNode.activity.connector.execution = $executionSelect.value;
            this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                bubbles: true,
                composed: true,
                detail: {activity: this._focusNode.activity}
            }));
        }
    }

    _handleOperatorChange(e) {
        e.stopImmediatePropagation();
        const $operatorSelect = this._elementMap.get(`operator-select`);
        if (this._focusNode) {
            this._focusNode.activity.operator = $operatorSelect.value;
            this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                bubbles: true,
                composed: true,
                detail: {activity: this._focusNode.activity}
            }));
        }
    }

    _handleAddEndpointIn() {
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

    _handleAddEndpointOut() {
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
        const $nodeNameInput = this._elementMap.get(`node-name-input`);
        if (this._focusNode) {
            this._focusNode.contextualName = $nodeNameInput.value;
            this.dispatchEvent(new CustomEvent(`event-node-updated`, {   //
                bubbles: true,
                composed: true,
                detail: {nodeModel: this._focusNode}
            }));
        }
    }

    _handleNodeDescChange(e) {
        e.stopImmediatePropagation();
        const $nodeDescInput = this._elementMap.get(`node-desc-input`);
        if (this._focusNode) {
            this._focusNode.contextualDescription = $nodeDescInput.value;
            this.dispatchEvent(new CustomEvent(`event-node-updated`, {
                bubbles: true,
                composed: true,
                detail: {nodeModel: this._focusNode}
            }));
        }
    }

    _handleExportJsonClick(e) {
        e.stopImmediatePropagation();
        this.dispatchEvent(new CustomEvent(`event-export-jag`, {
            bubbles: true,
            composed: true,
            detail: {node: this._focusNode}
        }));
    }

    _handleExportSvgClick(e) {
        e.stopImmediatePropagation();
        this.dispatchEvent(new CustomEvent(`event-export-svg`, {
            bubbles: true,
            composed: true,
            detail: {node: this._focusNode}
        }));
    }

    handleFromSelect(e) {
        const $unbindButton = this._elementMap.get(`unbind-button`);
        const $removeButton = this._elementMap.get(`remove-button`);
        const $destinationEndpointSelect = this._elementMap.get(`binding-to-select`);
        const selectedStartEndpoints = Array.from(e.target.selectedOptions);  // HTMLCollection
        this._newBinding.from.length = 0;
        $unbindButton.disabled = true;
        $removeButton.disabled = true;
        const endpointArray = Array.from(selectedStartEndpoints).map((selectedFromEndpoint) => {
            const startEndpointType = selectedFromEndpoint.value.split(`/`)[0];
            const startEndpointUrn = selectedFromEndpoint.value.split(`/`)[1];
            const startEndpointName = selectedFromEndpoint.label.split(` `)[0];
            const fromEndpointDefinition = {urn: startEndpointUrn,
                id: startEndpointName,
                property: startEndpointType};
            return fromEndpointDefinition;
        })

        if (endpointArray.length < 1) {
            $destinationEndpointSelect.classList.add(`hidden`);
            $destinationEndpointSelect.size = 0;
        }

        if (endpointArray.length === 1) {
            let allowedEndpointDestination;
            if (endpointArray[0].property === `in`) {
                allowedEndpointDestination = this._getChildIns();
            } else if (endpointArray[0].property === `out`) {
                allowedEndpointDestination = [...this._getSelfOuts(), ...this._getChildIns()];
            } else if (endpointArray[0].property === `router`) {
                if (endpointArray[0].urn === this._focusNode.activity.urn) {
                    allowedEndpointDestination = [...this._getChildIns()];
                } else {
                    allowedEndpointDestination = [...this._getSelfIns(), ...this._getChildIns()];  // dont think this should be allowed
                }
            } else if (endpointArray[0].property === `collector`) {
                allowedEndpointDestination = [...this._getSelfIns()];
            }
            $destinationEndpointSelect.classList.remove(`hidden`);
            this._newBinding.addFrom(endpointArray[0]);
            this._addAllowedEndpointsToSelect($destinationEndpointSelect, allowedEndpointDestination, false);

            if (this._focusNode.activity.isBound(endpointArray[0].urn, endpointArray[0].property, endpointArray[0].id)) {
                $unbindButton.disabled = false;
            }
            if ((endpointArray[0].urn === this._focusNode.activity.urn) && !(this._focusNode.activity.isBound(endpointArray[0].urn, endpointArray[0].property, endpointArray[0].id))) {
                $removeButton.disabled = false;
            }
        }

        if (endpointArray.length > 1) {
            // 1) Check if all selected are of same type -  all in-type or all out-type (can not have a mix)
            const activityConnectionType = endpointArray[0].property;
            let activityConnectionTypeValid = true;
            endpointArray.forEach((endpoint) => {
                if (endpoint.property !== activityConnectionType) {
                    activityConnectionTypeValid = false;
                }
                this._newBinding.addFrom(endpoint);
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
                $destinationEndpointSelect.classList.remove(`hidden`);
                this._addAllowedEndpointsToSelect($destinationEndpointSelect, allowedEndpointDestination, false);
            } else {
                $destinationEndpointSelect.classList.add(`hidden`);
            }
        }

        this.dispatchEvent(new CustomEvent(`event-endpoints-selected`, {
            bubbles: true,
            composed: true,
            detail: {from: endpointArray}
        }));
    }

    handleToSelect(e) {
        const $destinationEndpointSelect = this._elementMap.get(`binding-to-select`);
        const $bindButton = this._elementMap.get(`bind-button`);
        const selectedDestinationEndpoints = Array.from(e.target.selectedOptions);  // HTMLCollection
        this._newBinding.to.length = 0;


        if (selectedDestinationEndpoints.length < 1) {
            $destinationEndpointSelect.classList.add(`hidden`);
            $destinationEndpointSelect.size = 0;
            $bindButton.disabled = true;
        }

        if (selectedDestinationEndpoints.length === 1) {
            // wake up buttons to click
            $bindButton.disabled = false;
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
            $bindButton.disabled = false;
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
        const $bindButton = this._elementMap.get(`bind-button`);
        this._newBinding.from.forEach((fromPoint) => {
            this._newBinding.to.forEach((toPoint) => {
                const binding = new Binding({from: [fromPoint],
                    to: [toPoint]});
                this._focusNode.activity.addBinding(binding);
            });
        });
        // this._focusNode.activity.addBinding(this._newBinding);
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
        $bindButton.disabled = true;
    }

    handleUnbindButton() {
        const $unbindButton = this._elementMap.get(`unbind-button`);
        this._focusNode.activity.removeBinding(this._newBinding);
        this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
            bubbles: true,
            composed: true,
            detail: {activity: this._focusNode.activity}
        }));
        $unbindButton.disabled = true;
    }

    handleRemoveButton() {
        const $removeButton = this._elementMap.get(`remove-button`);
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
        $removeButton.disabled = true;
    }

    /**
     * External calls
     * handleExternalActivityUpdate
     * handleSelectionUpdate
     * handleSelectionUnselected
     */

    handleExternalActivityUpdate(newActivity, newActivityUrn) {   // ===> Called by ControllerAT
        if (this._focusNode) {
            if (newActivityUrn === this._focusNode.activity.urn) {
                this._focusNode.activity = newActivity;
                this._populatePropertyFields();
            }
        }
    }

    handleSelectionUpdate(selection) {       // <== Called by ControllerAT    (selectedNodeArray)
        this._clearProperties();
        if (selection.length > 0) {
            const selectedNodeModel = selection[0];
            this._focusNode = selectedNodeModel;
            this._populatePropertyFields();
        } else {
            this._enablePropertyInputs(false);
        }
    }

    handleSelectionUnselected() {              // ===> Called my ControllerAT
        this._clearProperties();
        this._enablePropertyInputs(false);
    }


    /**
     *  _populatePropertyFields - fill property values according to reflect this._focusNode (on Activity update or new _focusNode)
     *  _enablePropertyInputs - Property entries are turned on and flags displayed
     *  _addPropertyTooltips
     *   _clearProperties
     */


    _populatePropertyFields() {
        this._elementMap.get(`urn-input`).value = this._focusNode.activity.urn;
        this._elementMap.get(`name-input`).value = this._focusNode.activity.name;
        this._elementMap.get(`execution-select`).value = this._focusNode.activity.connector.execution || `none`;
        this._elementMap.get(`operator-select`).value = this._focusNode.activity.operator || `none`;
        this._elementMap.get(`desc-input`).value = this._focusNode.activity.description;
        this._elementMap.get(`node-name-input`).value = this._focusNode.contextualName;
        this._elementMap.get(`node-desc-input`).value = this._focusNode.contextualDescription;
        this._enablePropertyInputs(true);
        this._addPropertyTooltips();
        this._populateEndpoints();
        this._populateAnnotations();
    }

    _enablePropertyInputs(enabled) {
        this._elementMap.get(`urn-input`).disabled = !enabled;
        this._elementMap.get(`name-input`).disabled = !enabled;
        this._elementMap.get(`desc-input`).disabled = !enabled;
        this._elementMap.get(`node-name-input`).disabled = !enabled;
        this._elementMap.get(`node-desc-input`).disabled = !enabled;
        this._elementMap.get(`execution-select`).disabled = !enabled;
        this._elementMap.get(`operator-select`).disabled = !enabled;
        this._elementMap.get(`export-json-button`).disabled = !enabled;
        this._elementMap.get(`export-svg-button`).disabled = !enabled;
    }

    _addPropertyTooltips() {
        for (const input of this.querySelectorAll(`input`)) {
            input.title = input.value;
            input.onchange = () => {
                input.title = input.value;
                return input.title;
            };
        }
    }

    _clearProperties() {
        this._elementMap.get(`urn-input`).value = ``;
        this._elementMap.get(`name-input`).value = ``;
        this._elementMap.get(`desc-input`).value = ``;
        this._elementMap.get(`node-name-input`).value = ``;
        this._elementMap.get(`node-desc-input`).value = ``;
        this._elementMap.get(`execution-select`).value = Activity.EXECUTION.NONE.name;
        this._elementMap.get(`operator-select`).value = Activity.OPERATOR.NONE.name;
        this._elementMap.get(`urn-input`).classList.toggle(`edited`, false);
        this._clearEndpoints();
        this._clearAnnotations();
        for (const input of this.querySelectorAll(`input`)) {
            input.title = ``;
        }
    }

    /**
     *  _populateEndpoints
     * _clearEndpoints
     */

    _populateEndpoints() {                // (when properties update)
        const $startEndpointSelect = this._elementMap.get(`binding-from-select`);
        this._clearEndpoints();
        const selfIns = this._getSelfIns();
        const childOuts = this._getChildOuts();
        const startEndpointOptions = [...selfIns, ...childOuts];
        this._addAllowedEndpointsToSelect($startEndpointSelect, startEndpointOptions, true);

        // const numRows = this._getSelectListSize(startEndpointOptions);
        // $startEndpointSelect = FormUtils.updateSelect($startEndpointSelect, this._convertEndpointsToOptions(startEndpointOptions, true));
        // $startEndpointSelect.size = numRows;
    }

    _clearEndpoints() {
        const $startEndpointSelect = this._elementMap.get(`binding-from-select`);
        const $destinationEndpointSelect = this._elementMap.get(`binding-to-select`);
        const $bindButton = this._elementMap.get(`bind-button`);
        const $unbindButton = this._elementMap.get(`unbind-button`);
        const $removeButton = this._elementMap.get(`remove-button`);
        while ($startEndpointSelect.firstChild) {
            $startEndpointSelect.removeChild($startEndpointSelect.firstChild);
        }
        while ($destinationEndpointSelect.firstChild) {
            $destinationEndpointSelect.removeChild($destinationEndpointSelect.firstChild);
        }
        $destinationEndpointSelect.classList.add(`hidden`);
        $bindButton.disabled = true;
        $unbindButton.disabled = true;
        $removeButton.disabled = true;
    }

    /**
     *  _populateAnnotations - @TODO understand this
     *  _addAnnotation
     *  _clearAnnotations
     */

    _populateAnnotations() {
        const $annotationsProperty = this._elementMap.get(`annotations-property`);
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

                annotation_add.addEventListener(`click`, function () {
                    this._addAnnotation(child.id);
                }.bind(this));

                child_annotations.appendChild(annotation_add);

                const iterable_box = document.createElement(`div`);

                const iterable_checkbox = document.createElement(`input`);
                iterable_checkbox.setAttribute(`id`, `${child.id}-iterable`);
                iterable_checkbox.type = `checkbox`;

                iterable_checkbox.addEventListener(`change`, function () {
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

                        remove.addEventListener(`click`, function () {
                            this._focusNode.activity.removeAnnotation(child.id, annotation[0]);
                        }.bind(this));

                        annotation_box.appendChild(remove);

                        child_annotations.appendChild(annotation_box);
                    }
                }

                $annotationsProperty.appendChild(child_annotations);
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
        const $annotationsProperty = this._elementMap.get(`annotations-property`);
        while ($annotationsProperty.firstChild) {
            $annotationsProperty.removeChild($annotationsProperty.firstChild);
        }
    }


    /**
     * Binding Select Builders
     * _convertEndpointsToOptions - given allowed endpoints, convert to option elements
     * _getSelectListSize
     * _addAllowedEndpointsToSelect
     * _getRouters
     * _getCollectors
     * _getSelfIns
     * _getSelfOuts
     * _getChildIns
     * _getChildOuts
     */

    _convertEndpointsToOptions(selectOptions, addBindings) {
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
                            if (addBindings) {
                                const foundBindings = [];
                                this._focusNode.activity.bindings.forEach((extantBinding) => {
                                    extantBinding.from.forEach((extantFromEndpoint) => {
                                        if (extantFromEndpoint.id === selectOptionEndpoint.identity) {
                                            const toEndpoints = extantBinding.to.map((extantToEndpoints) => {
                                                return extantToEndpoints.id;
                                            });
                                            foundBindings.push(toEndpoints);
                                        }
                                    });
                                });
                                if (foundBindings.length > 0) {
                                    optionDisplay = `${optionDisplay} ${this.ARROW} `;
                                    foundBindings.forEach((foundToEndpoints) => {
                                        optionDisplay = `${optionDisplay} ${foundToEndpoints}`;
                                    });
                                }
                            }
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

    _addAllowedEndpointsToSelect($selectList, allowedEndpoints, addBindings) {
        const numRows = this._getSelectListSize(allowedEndpoints);
        const options = this._convertEndpointsToOptions(allowedEndpoints, addBindings);
        FormUtils.updateSelect($selectList, options);
        $selectList.multiple = true;
        $selectList.size = numRows;
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

    _getCollectors() {2
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
            } this._annotations;
        });
        return availableOutputs;
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

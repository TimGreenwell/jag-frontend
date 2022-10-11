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


customElements.define(`jag-properties`, class extends HTMLElement {

    constructor() {
        super();
        this._nodeModel = undefined;
        this._consumesMap = new Map();
        this._producesMap = new Map();
        this._initUI();

        this._boundUpdate = function (e) {
            const property = e.detail.property;

            if (property === `bindings` || property === `children` || property === `inputs` || property === `outputs`) {
                this._updateIO();
            }

            if (property === `annotations` || property === `children`) {
                this._updateAnnotations();
            }
        }.bind(this);

        this._boundDefine = function (e) {
            this._nodeModel = e.detail.nodeModel;

            this._updateProperties();
        }.bind(this);

        this._$nameInput.value = `kk`;
    }


    _initUI() {
        // The "Child-Of" banner
        const propertyContainer = document.createElement(`div`);
        propertyContainer.id = `property-container`;

        const childOf_el = document.createElement(`div`);
        childOf_el.className = `special-wrapper child-of-notice`;
        this._childOf = document.createElement(`p`);
        this._childOf.className = `special child-of-notice`;
        this._childOf.id = `child-of`;
        childOf_el.appendChild(this._childOf);

        // The "Leaf" banner
        // const leafNode_el = document.createElement(`div`);
        // leafNode_el.className = `special-wrapper leaf-node-notice`;
        // this._leafNode = document.createElement(`p`);
        // this._leafNode.innerHTML = `Possible leaf node: it is a child without a model.`;
        // this._leafNode.className = `special leaf-node-notice`;
        // this._leafNode.id = `leaf-node`;
        // leafNode_el.appendChild(this._leafNode);

        const name_el = FormUtils.createPropertyElement(`name-property`, `Name`);
        this._$nameInput = FormUtils.createTextInput(`name-property`);
        this._$nameInput.setAttribute(`placeholder`, `display name`);
        this._$nameInput.setAttribute(`tabIndex`, `0`);
        this._$nameInput.className = `direct-property`;
        name_el.appendChild(this._$nameInput);

        const urn_el = FormUtils.createPropertyElement(`urn-property`, `URN`);
        this._$urnInput = FormUtils.createTextInput(`urn-property`);
        this._$urnInput.setAttribute(`tabIndex`, `1`);
        this._$urnInput.className = `direct-property`;
        urn_el.appendChild(this._$urnInput);

        const desc_el = FormUtils.createPropertyElement(`desc-property`, `Description`);
        this._$descInput = document.createElement(`textarea`);
        this._$descInput.setAttribute(`id`, `desc-property`);
        this._$descInput.setAttribute(`width`, `100%`);
        this._$descInput.setAttribute(`rows`, `3`);
        this._$descInput.setAttribute(`placeholder`, `...`);
        this._$descInput.setAttribute(`tabIndex`, `2`);
        this._$descInput.className = `direct-property`;
        desc_el.appendChild(this._$descInput);

        const name_ctx_el = FormUtils.createPropertyElement(`name-ctx`, `Contextual Name`);
        this._$name_ctxInput = FormUtils.createTextInput(`name-ctx-property`);
        this._$name_ctxInput.className = `direct-property contextual`;
        name_ctx_el.appendChild(this._$name_ctxInput);

        const desc_ctx_el = FormUtils.createPropertyElement(`desc-ctx`, `Contextual Description`);
        this._$desc_ctxInput = FormUtils.createTextInput(`desc-ctx-property`);
        this._$desc_ctxInput.className = `direct-property contextual`;
        desc_ctx_el.appendChild(this._$desc_ctxInput);

        const executionOptions = [];
        const execution = Activity.EXECUTION;
        for (const step in execution) {
            executionOptions.push({
                value: execution[step].name,
                text: execution[step].text
            });
        }

        const execution_el = FormUtils.createPropertyElement(`execution-property`, `Execution`);
        this._$executionSelect = FormUtils.createSelect(`execution-property`, executionOptions);
        this._$executionSelect.className = `direct-property`;
        execution_el.appendChild(this._$executionSelect);


        const operatorOptions = [];
        const operator = Activity.OPERATOR;
        for (const step in operator) {
            operatorOptions.push({
                value: operator[step].name,
                text: operator[step].text
            });
        }

        const operator_el = FormUtils.createPropertyElement(`operator-property`, `Operator`);             // @TODO Map this from original structure
        this._$operatorSelect = FormUtils.createSelect(`operator-property`, operatorOptions);
        this._$operatorSelect.className = `direct-property`;
        operator_el.appendChild(this._$operatorSelect);

        // Create inputs area
        const inputs_el = FormUtils.createPropertyElement(`inputs-property`, `Inputs`);

        const input_add = document.createElement(`span`);
        input_add.innerHTML = `+`;
        input_add.className = `io-add`;
        input_add.addEventListener(`click`, this._addInput.bind(this));
        inputs_el.appendChild(input_add);

        this._inputs = FormUtils.createEmptyInputContainer(`inputs-property`);
        this._inputs.className = `directProperty`;
        inputs_el.appendChild(this._inputs);

        // Create outputs area
        const outputs_el = FormUtils.createPropertyElement(`outputs-property`, `Outputs`);

        const output_add = document.createElement(`span`);
        output_add.innerHTML = `+`;
        output_add.className = `io-add`;
        output_add.addEventListener(`click`, this._addOutput.bind(this));
        outputs_el.appendChild(output_add);

        this._outputs = FormUtils.createEmptyInputContainer(`outputs-property`);
        this._outputs.className = `directProperty`;
        outputs_el.appendChild(this._outputs);

        // Create bindings area
        const bindings_el = FormUtils.createPropertyElement(`bindings-property`, `Bindings`);

        this._bindings = FormUtils.createEmptyInputContainer(`bindings-property`);
        this._bindings.className = `directProperty`;
        bindings_el.appendChild(this._bindings);

        // Create annotation area
        const annotations_el = FormUtils.createPropertyElement(`annotations-property`, `Annotations`);

        this._annotations = FormUtils.createEmptyInputContainer(`annotations-property`);
        this._annotations.className = `directProperty`;
        annotations_el.appendChild(this._annotations);

        // Create export area
        const export_el = FormUtils.createEmptyInputContainer(`export`);
        this._export = document.createElement(`button`);
        this._export.innerHTML = `Export to File`;
        export_el.className = `directProperty`;
        export_el.appendChild(this._export);

        // Create projt area
        const projectButton_el = FormUtils.createEmptyInputContainer(`export`);
        this._projectButton = document.createElement(`button`);
        this._projectButton.innerHTML = `Create New JAG`;
        projectButton_el.appendChild(this._projectButton);
        projectButton_el.className = `directProperty`;


        this._enableProperties(false);
        this.appendChild(propertyContainer);
        propertyContainer.appendChild(childOf_el);
        // propertyContainer.appendChild(leafNode_el);
        propertyContainer.appendChild(name_el);
        propertyContainer.appendChild(urn_el);
        propertyContainer.appendChild(desc_el);
        propertyContainer.appendChild(name_ctx_el);
        propertyContainer.appendChild(desc_ctx_el);
        propertyContainer.appendChild(execution_el);
        propertyContainer.appendChild(operator_el);
        propertyContainer.appendChild(inputs_el);
        propertyContainer.appendChild(outputs_el);
        propertyContainer.appendChild(bindings_el);
        propertyContainer.appendChild(annotations_el);
        propertyContainer.appendChild(export_el);
        propertyContainer.appendChild(projectButton_el);


        // this._$urnInput.addEventListener('keyup', e => {
        //     this._$urnInput.classList.toggle('edited', this._$urnInput.value !== this._nodeModel.activity.urn);
        // });

        this._$nameInput.addEventListener(`blur`, this._handleNameChange.bind(this));  // pass urn change to ControllerIA.updateURN
        this._$nameInput.addEventListener(`keyup`, this._handleNameEdit.bind(this));

        this._$urnInput.addEventListener(`focusout`, this._handleURNChange.bind(this));  // pass urn change to ControllerIA.updateURN
        this._$urnInput.addEventListener(`keyup`, this._handleUrnEdit.bind(this));  // pass urn change to ControllerIA.updateURN

        this._$descInput.addEventListener(`blur`, this._handleDescriptionChange.bind(this));
        this._$descInput.addEventListener(`keyup`, this._handleDescriptionEdit.bind(this));

        this._$name_ctxInput.addEventListener(`blur`, this._handleContextualNameChange.bind(this));
        this._$desc_ctxInput.addEventListener(`blur`, this._handleContextualDescriptionChange.bind(this));

        this._$executionSelect.addEventListener(`change`, this._handleExecutionChange.bind(this));
        this._$operatorSelect.addEventListener(`change`, this._handleOperatorChange.bind(this));

        this._export.addEventListener(`click`, this._handleExportClick.bind(this));
        this._projectButton.addEventListener(`click`, this._handleProjectButtonClick.bind(this));
    }

    _handleNameChange(e) {
        e.stopImmediatePropagation();
        if (this._nodeModel) {
            this._nodeModel.activity.name = this._$nameInput.value;
            this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                bubbles: true,
                composed: true,
                detail: {activity: this._nodeModel.activity}
            }));
        }
    }

    _handleNameEdit(e) {
        if (e.key === `Enter`) {
            e.preventDefault();
            const inputs = this.querySelectorAll(`input:enabled, textarea`);
            const currentPosition = this._$nameInput.tabIndex;
            if (currentPosition < inputs.length - 1) {
                inputs.item(currentPosition + 1).focus();
            } else {
                inputs.item(currentPosition).blur();
            }
        } else {
            this._nodeModel.activity.name = `[${this._$nameInput.value}]`;
        }
    }

    _handleURNChange(e) {
        if (this._nodeModel.activity.urn !== this._$urnInput.value) {
            if (Validator.isValidUrn(this._$urnInput.value)) {        // && entered urn is valid...
                this.dispatchEvent(new CustomEvent(`event-urn-changed`, {
                    bubbles: true,
                    composed: true,
                    detail: {
                        originalUrn: this._$urnInput.value,
                        newUrn: this._nodeModel.activity.urn
                    }
                }));
            }
        }
    }

    _handleUrnEdit(e) {
        if (e.key === `Enter`) {
            e.preventDefault();
            const inputs = this.querySelectorAll(`input:enabled, textarea`);
            this._$urnInput.classList.toggle(`edited`, this._$urnInput.value !== this._nodeModel.activity.urn);
            // current position in 'form'
            const currentPosition = this._$urnInput.tabIndex;
            if (currentPosition < inputs.length - 1) {
                inputs.item(currentPosition + 1).focus();
            } else {
                inputs.item(currentPosition).blur();
            }
        }
    }


    _handleDescriptionChange(e) {
        e.stopImmediatePropagation();
        if ((this._nodeModel) && (this._nodeModel.activity)) {
            this._nodeModel.activity.description = this._$descInput.value;
            this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                bubbles: true,
                composed: true,
                detail: {activity: this._nodeModel.activity}
            }));
        }
    }

    _handleDescriptionEdit(e) {
        if (e.key === `Enter`) {
            e.preventDefault();
            const inputs = this.querySelectorAll(`input:enabled, textarea`);
            const currentPosition = this._$descInput.tabIndex;
            if (currentPosition < inputs.length - 1) {
                inputs.item(currentPosition + 1).focus();
            } else {
                inputs.item(currentPosition).blur();
            }
        } else {
            this._nodeModel.activity.description = `[${this._$descInput.value}]`;
        }
    }

    _handleContextualNameChange(e) {
        e.stopImmediatePropagation();
        if (this._nodeModel) {
            this._nodeModel.contextualName = this._$name_ctxInput.value;
            this.dispatchEvent(new CustomEvent(`event-node-updated`, {   //
                bubbles: true,
                composed: true,
                detail: {nodeModel: this._nodeModel}
            }));
        }
    }

    _handleContextualDescriptionChange(e) {
        e.stopImmediatePropagation();
        if (this._nodeModel) {
            this._nodeModel.contextualDescription = this._$desc_ctxInput.value;
            this.dispatchEvent(new CustomEvent(`event-node-updated`, {
                bubbles: true,
                composed: true,
                detail: {nodeModel: this._nodeModel}
            }));
        }
    }

    _handleExecutionChange(e) {
        e.stopImmediatePropagation();
        if (this._nodeModel) {
            this._nodeModel.activity.connector.execution = this._$executionSelect.value;
            this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                bubbles: true,
                composed: true,
                detail: {activity: this._nodeModel.activity}
            }));
        }
    }

    _handleOperatorChange(e) {
        e.stopImmediatePropagation();
        if (this._nodeModel) {
            this._nodeModel.activity.operator = this._$operatorSelect.value;
            this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                bubbles: true,
                composed: true,
                detail: {activity: this._nodeModel.activity}
            }));
        }
    }


    _handleExportClick(e) {
        e.stopImmediatePropagation();
        const node = this._nodeModel;
        this.dispatchEvent(new CustomEvent(`event-export-jag`, {
            bubbles: true,
            composed: true,
            detail: {node: this._nodeModel}
        }));
    }

    _handleProjectButtonClick(e) {
        e.stopImmediatePropagation();
        const node = this._nodeModel;
        this.dispatchEvent(new CustomEvent(`event-promote-project`, {
            bubbles: true,
            composed: true,
            detail: {node: this._nodeModel}
        }));
    }


    handleStorageUpdate(newActivity, newActivityUrn) {
        if (newActivityUrn === this._$urnInput) {
            this._nodeModel.activity = newActivity;
            this._updateProperties();
        }
    }


    // Called by user selecting one or more Nodes in the playground

    handleSelectionUpdate(selection) {       // (selectedNodeArray)
        if (this._nodeModel) {
            this._nodeModel.removeEventListener(`update`, this._boundUpdate);
            //  this._node = undefined;
            this._nodeModel = undefined;
        }
        this._clearProperties();
        if (selection.length === 1) {
            const selectedNodeModel = selection[0];
            //    if (selectedNodeModel._nodeModel) {         // why wouldnt this have a model(node)?
            //        this._node = selectedNodeModel;
            this._nodeModel = selectedNodeModel;
            this._updateProperties();
            this._nodeModel.addEventListener(`update`, this._boundUpdate);
            //    }
        } else {
            this._enableProperties(false);
        }
    }

    handleSelectionUnselected() {
        this._clearProperties();
        this._enableProperties(false);
    }


    // @TODO Add a button to properties to delete the Jag. --
    // @TODO Same for 'publish'/'lock'
    deleteActivity(deadActivity) {
        this._nodeModel.activity = undefined;
        this._$urnInput.classList.toggle(`edited`, false);
        this._clearProperties();
        this.dispatchEvent(new CustomEvent(`event-activity-deleted`, {
            detail: {urn: deadActivity.urn}
        }));
    }

    cloneActivity(sourceActivity, newURN) {
        const description = sourceActivity.toJSON();
        description.urn = newURN;
        const newActivity = Activity.fromJSON(description);
        // Update activity references.
        this._node.activity = newActivity; // ?
        this._nodeModel.activity = newActivity;
        this.dispatchEvent(new CustomEvent(`event-activity-created`, {
            bubbles: true,
            composed: true,
            detail: {activityConstruct: newActivity}
        }));    // event-activity-created in playground uses components
        // await StorageService.create(newActivity, 'activity');
        // Remove unsaved box shadow on URN property input.
        this._$urnInput.classList.toggle(`edited`, false);

        //  WHEN GOOD -->             this._nodeModel.activity.url = this._$urnInput.value;
    }


    /**
     * _updateIO
     *  _clearIO - Wipes the Consume/Input and Produce/Output and Binding -- both map and displays
     *  _addInput
     *  _addOutput
     *  _addInputElement
     *  _addOutputElement
     *  _createBindingInputs
     *  _createBindingOutputs
     *  _findInputOptions
     *  _findOutputOptions
     */


    _updateIO() {
        this._clearIO();

        // Create node input panel
        for (const input of this._nodeModel.activity.inputs) {
            const input_id = `${input.name}-inputs-property`;
            this._addInputElement(input_id, input.name);
        }

        // Create node output panel
        for (const output of this._nodeModel.activity.outputs) {
            const output_id = `${output.name}-outputs-property`;
            this._addOutputElement(output_id, output.name);
        }

        // Create binding panel
        const output_options = this._findOutputOptions();
        const input_options = this._findInputOptions();

        if (output_options.length > 0 && input_options.length > 0) {
            // Create input and output select elements
            const output_select_el = this._createBindingOutputs(output_options);
            const input_select_el = this._createBindingInputs(input_options);

            // Create new binding panel
            const newBindingPanel = document.createElement(`div`);

            const arrow_el = document.createElement(`span`);
            arrow_el.innerHTML = `&#x2192;`;
            arrow_el.className = `binding arrow`;

            newBindingPanel.appendChild(output_select_el);
            newBindingPanel.appendChild(arrow_el);
            newBindingPanel.appendChild(input_select_el);

            const newButton = document.createElement(`button`);
            newButton.id = `new-binding`;
            newButton.innerHTML = `Bind`;
            newButton.addEventListener(`click`, function (e) {
                const output_option = output_select_el.selectedOptions[0];
                const input_option = input_select_el.selectedOptions[0];

                if (output_option && input_option) {
                    const provider = output_option.value.split(`:`);
                    const consumer = input_option.value.split(`:`);

                    this._nodeModel.activity.addBinding({
                        consumer: {
                            id: consumer[0],
                            property: consumer[1]
                        },
                        provider: {
                            id: provider[0],
                            property: provider[1]
                        }
                    });

                    output_select_el.value = undefined;
                    input_select_el.value = undefined;
                }
            }.bind(this));

            newBindingPanel.appendChild(newButton);

            this._bindings.appendChild(newBindingPanel);

            // Add handler for change in output select element
            output_select_el.addEventListener(`change`, function (e) {
                const output_option = e.target.selectedOptions[0];

                const valid_input_values_for_output = new Set();

                if (output_option) {
                    const provider = output_option.value.split(`:`);

                    const this_inputs_names = new Set();
                    this._nodeModel.activity.inputs.forEach((input) => {
                        return this_inputs_names.add(input.name);
                    });

                    // TODO: Check if type matches selected output type (probably need to get output type first)
                    if (provider[0] == `this`) {
                        for (const option of input_select_el.options) {
                            valid_input_values_for_output.add(option.value);
                        }
                    } else {
                        // TODO: Check if type matches selected output type (probably need to get output type first)
                        this._nodeModel.activity.outputs.forEach((output) => {
                            return valid_input_values_for_output.add(`this:${output.name}`);
                        });

                        if (this._nodeModel.activity.connector.execution === Activity.EXECUTION.SEQUENTIAL.name) {
                            if (provider[0] === `any`) {
                                const all_cumulative_outputs = new Set();

                                this._nodeModel.activity.inputs.forEach((input) => {
                                    return all_cumulative_outputs.add(input.name);
                                });

                                const valid_any_outputs_from_children = new Set();

                                for (const child of this._nodeModel.activity.children) {
                                    if (valid_any_outputs_from_children.has(provider[1])) {
                                        child.nodeModel.activity.inputs.forEach((input) => {
                                            return valid_input_values_for_output.add(`${child.id}:${input.name}`);
                                        });
                                    }

                                    child.nodeModel.activity.outputs.forEach((output) => {
                                        if (all_cumulative_outputs.has(output.name)) {
                                            valid_any_outputs_from_children.add(output.name);
                                        } else {
                                            all_cumulative_outputs.add(output.name);
                                        }
                                    });
                                }
                            } else {
                                const order = this._nodeModel.activity.getOrderForId(provider[0]);

                                for (const child of this._nodeModel.activity.children) {
                                    if (child.nodeModel.activity) {
                                        if (this._nodeModel.activity.getOrderForId(child.id) > order) {
                                            for (const input of child.nodeModel.activity.inputs) {
                                                // TODO: Check if type matches selected output type (probably need to get output type first)
                                                valid_input_values_for_output.add(`${child.id}:${input.name}`);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    FormUtils.toggleSelectValues(input_select_el, valid_input_values_for_output);
                }

                this._previous_value = output_option.value;
            }.bind(this));

            input_select_el.addEventListener(`change`, function (e) {
                const input_option = e.target.selectedOptions[0];

                if (input_option) {
                    const consumer = input_option.value.split(`:`);

                    // TODO: Check if types match selected output type (probably as a .filter before .map)
                    const valid_for_input = new Set(this._nodeModel.activity.inputsTo(consumer[0]).map((output) => {
                        return `${output.id}:${output.property}`;
                    }));
                    FormUtils.toggleSelectValues(output_select_el, valid_for_input);
                }
            }.bind(this));
        }

        for (const binding of this._nodeModel.activity.bindings) {
            const binding_box = FormUtils.createEmptyInputContainer(`binding-${binding.consumer.id}-${binding.consumer.property}`);

            const output_label = document.createElement(`input`);
            output_label.disabled = true;

            if (binding.provider.id == `this` || binding.provider.id == `any`) {
                output_label.value = `${binding.provider.id}:${binding.provider.property}`;
            } else {
                const provider_node = this._nodeModel.activity.getCanonicalNode(binding.provider.id);

                let provider_name = binding.provider.id;

                if (provider_node.name) {
                    provider_name = provider_node.name;
                } else if (provider_node.nodeModel.activity) {
                    provider_name = provider_node.nodeModel.activity.name;
                }

                output_label.value = `${provider_name}:${binding.provider.property}`;
            }

            output_label.className = `binding output`;

            binding_box.appendChild(output_label);

            const arrow = document.createElement(`span`);
            arrow.innerHTML = `&#x2192;`;
            arrow.className = `binding arrow`;
            binding_box.appendChild(arrow);

            const input_label = document.createElement(`input`);
            input_label.disabled = true;

            if (binding.consumer.id == `this` || binding.consumer.id == `any`) {
                input_label.value = `${binding.consumer.id}:${binding.consumer.property}`;
            } else {
                const consumer_node = this._nodeModel.activity.getCanonicalNode(binding.consumer.id);

                let consumer_name = binding.consumer.id;

                if (consumer_node.name) {
                    consumer_name = consumer_node.name;
                } else if (consumer_node.nodeModel.activity) {
                    consumer_name = consumer_node.nodeModel.activity.name;
                }

                input_label.value = `${consumer_name}:${binding.consumer.property}`;
            }

            input_label.className = `binding input`;

            binding_box.appendChild(input_label);

            const remove = document.createElement(`span`);
            remove.innerHTML = `-`;
            remove.className = `binding remove`;

            remove.addEventListener(`click`, function (e) {
                this._nodeModel.activity.removeBinding(binding);
            }.bind(this));

            binding_box.appendChild(remove);

            this._bindings.appendChild(binding_box);
        }
    }

    _clearIO() {
        this._consumesMap.clear();
        while (this._inputs.firstChild) {
            this._inputs.removeChild(this._inputs.firstChild);
        }

        this._producesMap.clear();
        while (this._outputs.firstChild) {
            this._outputs.removeChild(this._outputs.firstChild);
        }

        while (this._bindings.firstChild) {
            this._bindings.removeChild(this._bindings.firstChild);
        }
    }

    _addInput(e) {
        if (this._nodeModel) { // } && !(this._nodeModel instanceof UndefinedJAG)) {
            const name = window.prompt(`Input name`);
            if (name === null) {
                return;
            }

            const type = window.prompt(`Input type`);
            if (type === null) {
                return;
            }

            const input = {name,
                type};
            this._nodeModel.activity.addInput(input);
        }
    }

    _addOutput(e) {
        if (this._nodeModel) { // } && !(this._nodeModel instanceof UndefinedJAG)) {
            const name = window.prompt(`Output name`);
            if (name === null) {
                return;
            }

            const type = window.prompt(`Output type`);
            if (type === null) {
                return;
            }

            const output = {name,
                type};

            this._nodeModel.activity.addOutput(output);
        }
    }

    _addInputElement(id, input) {
        const input_el = FormUtils.createPropertyElement(id, input);

        this._inputs.appendChild(input_el);
    }

    _addOutputElement(id, output) {
        const output_el = FormUtils.createPropertyElement(id, output);

        this._outputs.appendChild(output_el);
    }

    _createBindingInputs(options) {
        const select_el = FormUtils.createSelect(`binding-inputs`, options.map((node) => {
            let label = node.id;
            if (node.id != `this`) {
                label = node.nodeModel.activity.name;
                const order = this._nodeModel.activity.getOrderForId(node.id);
                if (order !== 0) {
                    label = `${label} (${order})`;
                }
            }

            return [
                {
                    label,
                    options: node.inputs.map((input) => {
                        return {
                            text: input.name,
                            value: `${node.id}:${input.name}`
                        };
                    })
                }
            ];
        }).reduce((c, n) => {
            return c.concat(n);
        }));

        select_el.onfocus = function (e) {
            this._previous_value = this.value;
        }.bind(select_el);

        return select_el;
    }

    _createBindingOutputs(options) {
        const select_el = FormUtils.createSelect(`binding-outputs`, options.map((node) => {
            let label = node.id;
            if (node.id !== `this` && node.id !== `any`) {
                label = node.nodeModel.activity.name;
                const order = this._nodeModel.activity.getOrderForId(node.id);
                if (order !== 0) {
                    label = `${label} (${order})`;
                }
            }

            return [
                {
                    label,
                    options: node.outputs.map((output) => {
                        return {
                            text: output.name,
                            value: `${node.id}:${output.name}`
                        };
                    })
                }
            ];
        }).reduce((c, n) => {
            return c.concat(n);
        }));

        select_el.onfocus = function (e) {
            this._previous_value = this.value;
        }.bind(select_el);

        return select_el;
    }

    _findInputOptions() {
        // We can "input" a value into any of this node's children's inputs.
        const options = this._nodeModel.activity.getAvailableInputs();

        // We can also "input" a value to this node's outputs.
        if (this._nodeModel.activity.outputs.length > 0) {
            options.push({
                id: `this`,
                activity: this._nodeModel.activity,
                inputs: this._nodeModel.activity.outputs
            });
        }

        return options;
    }

    _findOutputOptions() {
        const options = [];

        // We can "output" a value from this node's inputs.
        if (this._nodeModel.activity.inputs.length > 0) {
            options.push({
                id: `this`,
                activity: this._nodeModel.activity,
                outputs: this._nodeModel.activity.inputs
            });
        }

        // We can also "output" a value from this node's children's outputs.
        this._nodeModel.activity.getAvailableOutputs().forEach((node) => {
            return options.push(node);
        });

        // We can also opt to accept any output with a matching name based on all available outputs.
        if (this._nodeModel.activity.inputs.length > 0 && this._nodeModel.activity.children.length > 0) {
            const output_properties = new Set();
            const any_outputs = new Set();

            for (const input of this._nodeModel.activity.inputs) {
                output_properties.add(input.name);
            }

            for (const child of this._nodeModel.activity.children) {
                if (child.nodeModel.activity) {
                    child.nodeModel.activity.outputs.forEach((child_output) => {
                        if (output_properties.has(child_output.name)) {
                            any_outputs.add(child_output);
                        } else {
                            output_properties.add(child_output.name);
                        }
                    });
                }
            }

            if (any_outputs.size > 0) {
                options.push({
                    id: `any`,
                    outputs: Array.from(any_outputs)
                });
            }
        }

        return options;
    }


    /**
     *  _updateAnnotations - @TODO understand this
     *  _addAnnotation
     *  _clearAnnotations
     */

    _updateAnnotations() {
        this._clearAnnotations();
        if (this._nodeModel.children.length > 0) {
            for (const child of this._nodeModel.children) {
                //        child.nodeModel(child.nodeModel)
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
                    this._nodeModel.activity.setIterable(child.id, iterable_checkbox.checked);
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
                            this._nodeModel.activity.removeAnnotation(child.id, annotation[0]);
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

        this._nodeModel.activity.addAnnotation(id, name, value);
    }

    _clearAnnotations() {
        while (this._annotations.firstChild) {
            this._annotations.removeChild(this._annotations.firstChild);
        }
    }

    /**
     *  _updateProperties
     *  _enableProperties - Property entries are turned on and flags displayed
     *  _clearProperties
     */


    _updateProperties() {
        this._$urnInput.value = this._nodeModel.activity.urn;
        this._$nameInput.value = this._nodeModel.activity.name;
        this._$executionSelect.value = this._nodeModel.activity.connector.execution || `none`;
        this._$operatorSelect.value = this._nodeModel.activity.operator || `none`;
        this._$descInput.value = this._nodeModel.activity.description;
        this._$name_ctxInput.value = this._nodeModel.contextualName;
        this._$desc_ctxInput.value = this._nodeModel.contextualDescription;
        this._enableProperties(true);
        this._updateIO();
        this._updateAnnotations();
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
        this._$nameInput.disabled = !enabled;
        this._$descInput.disabled = !enabled;
        this._$name_ctxInput.disabled = !enabled;
        this._$desc_ctxInput.disabled = !enabled;
        this._$executionSelect.disabled = !enabled;
        this._$operatorSelect.disabled = !enabled;

        this._consumesMap.disabled = !enabled;
        this._producesMap.disabled = !enabled;
        this._export.disabled = !enabled;
        this._projectButton.disabled = !enabled;

        if (this._nodeModel && (enabled)) {
            if (this._nodeModel.parent) {
                this._childOf.innerHTML = `As child of ${this._nodeModel.parent.urn}`;
            }
            this.classList.toggle(`root-node`, false);
            this._$name_ctxInput.disabled = false;
            this._$desc_ctxInput.disabled = false;
        } else {
            this.classList.toggle(`root-node`, true);
            this._$name_ctxInput.disabled = true;
            this._$desc_ctxInput.disabled = true;
        }
        // tlg 9 sep
        // if (enabled || (!enabled && !this._nodeModel)) {
        //     this.classList.toggle(`defined-model`, true);   // This block useful?
        //     this.classList.toggle(`non-leaf-node`, true);
        // }
    }

    _clearProperties() {
        this._$urnInput.value = ``;
        this._$nameInput.value = ``;
        this._$descInput.value = ``;
        this._$name_ctxInput.value = ``;
        this._$desc_ctxInput.value = ``;
        this._$executionSelect.value = Activity.EXECUTION.NONE.name;
        this._$operatorSelect.value = Activity.OPERATOR.NONE.name;

        this._$urnInput.classList.toggle(`edited`, false);

        this._clearIO();
        this._clearAnnotations();

        for (const input of this.querySelectorAll(`input`)) {
            input.title = ``;
        }
    }


});

export default customElements.get(`jag-properties`);

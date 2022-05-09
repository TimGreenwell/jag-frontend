/**
 * @file Node properties panel.
 *
 * @author cwilber
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 1.07
 */

import JAG from '../models/jag.js';
import StorageService from '../services/storage-service.js';
import UndefinedJAG from '../models/undefined.js';
import InputValidator from '../utils/validation.js';
import FormUtils from '../utils/forms.js';


customElements.define('jag-properties', class extends HTMLElement {

    constructor() {
        super();
        this._jagModel = undefined;
        this._consumesMap = new Map();
        this._producesMap = new Map();
        this._initUI();
        this._initHandlers();
        StorageService.subscribe("jag-storage-updated", this.handleStorageUpdate.bind(this)); // only case is when selected playground item is updated by the jag-ia updates.

        this._boundUpdate = function (e) {
            const property = e.detail.property;

            if (property == "bindings" || property == "children" || property == "inputs" || property == "outputs") {
                this._updateIO();
            }

            if (property == "annotations" || property == "children") {
                this._updateAnnotations();
            }
        }.bind(this);

        this._boundDefine = function (e) {
            const model = e.detail.model;

            this._jagModel = model;

            this._updateProperties();
        }.bind(this);
    }

    handleStorageUpdate(newJagModel) {
        if (newJagModel.urn == this._urnInput) {
            this._jagModel = newJagModel;
            this._updateProperties();
        }
    }
    // Called by user selecting one or more Nodes in the playground

    handleSelectionUpdate(selection) {
        if (this._jagModel) {
            if (this._jagModel instanceof UndefinedJAG) {
                this._jagModel.removeEventListener('define', this._boundDefine);
            } else {
                this._jagModel.removeEventListener('update', this._boundUpdate);
            }
            this._node = undefined;
            this._jagModel = undefined;
        }
        this._clearProperties();
        if (selection.size == 1) {
            const selectedNodeModel = selection.values().next().value;
            if (selectedNodeModel._model) {         // why wouldnt this have a model(node)?
                this._node = selectedNodeModel;
                this._jagModel = this._node.model;
                this._updateProperties();
                if (this._jagModel instanceof UndefinedJAG) {
                    this._jagModel.addEventListener('define', this._boundDefine);
                } else {
                    this._jagModel.addEventListener('update', this._boundUpdate);
                }
            }
        } else {
            this._enableProperties(false);
        }
    }


    _updateProperties() {

        this._urnInput.value = this._jagModel.urn
        this._nameInput.value = this._jagModel.name;
        this._executionSelect.value = this._jagModel.execution || 'none';
        this._operatorSelect.value = this._jagModel.operator || 'none';
        this._descInput.value = this._jagModel.description;
        this._name_ctxInput.value = this._node.getContextualName();
        this._desc_ctxInput.value = this._node.getContextualDescription();

        if (this._jagModel instanceof UndefinedJAG) {
            this._enableProperties(false);
        } else {
            this._enableProperties(true);
            this._updateIO();
            this._updateAnnotations();
        }

        for (const input of this.querySelectorAll("input")) {
            input.title = input.value;
            input.onchange = () => input.title = input.value;
        }


    }

    _addInput(e) {
        if (this._jagModel && !(this._jagModel instanceof UndefinedJAG)) {
            const name = window.prompt('Input name');
            if (name === null)
                return;

            const type = window.prompt('Input type');
            if (type === null)
                return;

            const input = {
                name: name,
                type: type
            };

            this._jagModel.addInput(input);
        }
    }

    _addOutput(e) {
        if (this._jagModel && !(this._jagModel instanceof UndefinedJAG)) {
            const name = window.prompt('Output name');
            if (name === null)
                return;

            const type = window.prompt('Output type');
            if (type === null)
                return;

            const output = {
                name: name,
                type: type
            };

            this._jagModel.addOutput(output);
        }
    }

    _addAnnotation(id) {
        const name = window.prompt('Annotation name');
        if (name === null)
            return;

        let value = window.prompt('Annotation value');
        if (value === null)
            return;

        let parsed = false;

        if (value == "true" || value == "false") {
            const boolean_type = window.confirm('Treat this value as a boolean?');
            if (boolean_type) value = (value == "true");
            parsed = boolean_type;
        } else if (value.match(/^(\+|\-)?[0-9]+(\.[0-9]+)?$/)) {

            if (value.match(/^(\+|\-)?[0-9]+$/)) {
                const integer_type = window.confirm('Treat this value as an integer?');
                if (integer_type) value = parseInt(value);
                parsed = integer_type;
            }

            if (!parsed) {
                const float_type = window.confirm('Treat this value as a floating-point number?');
                if (float_type) value = parseFloat(value);
                parsed = float_type;
            }
        }

        if (!parsed) {
            const json_type = window.confirm('Treat this value as an abstract JSON structure?');

            if (json_type) {
                try {
                    value = JSON.parse(value);
                } catch {
                    window.alert('Failed to parse value: please try again with a valid JSON string.');
                    return;
                }
            }
        }

        this._jagModel.addAnnotation(id, name, value);
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
        const select_el = FormUtils.createSelect('binding-inputs', options.map(node => {
            let label = node.id;
            if (node.id != 'this') {
                label = node.model.name;
                const order = this._jagModel.getOrderForId(node.id);
                if (order != 0) {
                    label += ` (${order})`;
                }
            }

            return [{
                label: label,
                options: node.inputs.map((input) => {
                    return {
                        text: input.name,
                        value: `${node.id}:${input.name}`
                    }
                })
            }];
        }).reduce((c, n) => c.concat(n)));

        select_el.onfocus = function (e) {
            this._previous_value = this.value;
        }.bind(select_el);

        return select_el;
    }

    _createBindingOutputs(options) {
        const select_el = FormUtils.createSelect('binding-outputs', options.map(node => {

            let label = node.id;
            if (node.id != 'this' && node.id != 'any') {
                label = node.model.name;
                const order = this._jagModel.getOrderForId(node.id);
                if (order != 0) {
                    label += ` (${order})`;
                }
            }

            return [{
                label: label,
                options: node.outputs.map((output) => {
                    return {
                        text: output.name,
                        value: `${node.id}:${output.name}`
                    }
                })
            }];
        }).reduce((c, n) => c.concat(n)));

        select_el.onfocus = function (e) {
            this._previous_value = this.value;
        }.bind(select_el);

        return select_el;
    }

    _findInputOptions() {
        // We can "input" a value into any of this node's children's inputs.
        const options = this._jagModel.getAvailableInputs();

        // We can also "input" a value to this node's outputs.
        if (this._jagModel.outputs.length > 0) {
            options.push({
                id: 'this',
                model: this._jagModel,
                inputs: this._jagModel.outputs
            });
        }

        return options;
    }

    _findOutputOptions() {
        const options = [];

        // We can "output" a value from this node's inputs.
        if (this._jagModel.inputs.length > 0) {
            options.push({
                id: 'this',
                model: this._jagModel,
                outputs: this._jagModel.inputs
            });
        }

        // We can also "output" a value from this node's children's outputs.
        this._jagModel.getAvailableOutputs().forEach(node => options.push(node));

        // We can also opt to accept any output with a matching name based on all available outputs.
        if (this._jagModel.inputs.length > 0 && this._jagModel.children.length > 0) {
            const output_properties = new Set();
            const any_outputs = new Set();

            for (const input of this._jagModel.inputs) {
                output_properties.add(input.name);
            }

            for (const child of this._jagModel.children) {
                if (child.model) {
                    child.model.outputs.forEach((child_output) => {
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
                    id: 'any',
                    outputs: Array.from(any_outputs)
                });
            }
        }

        return options;
    }

    _updateIO() {
        this._clearIO();

        // Create node input panel
        for (let input of this._jagModel.inputs) {
            const input_id = `${input.name}-inputs-property`;
            this._addInputElement(input_id, input.name);
        }

        // Create node output panel
        for (let output of this._jagModel.outputs) {
            const output_id = `${output.name}-outputs-property`;
            this._addOutputElement(output_id, output.name);
        }

        // Create binding panel
        let output_options = this._findOutputOptions();
        let input_options = this._findInputOptions();

        if (output_options.length > 0 && input_options.length > 0) {
            // Create input and output select elements
            let output_select_el = this._createBindingOutputs(output_options);
            let input_select_el = this._createBindingInputs(input_options);

            // Create new binding panel
            let newBindingPanel = document.createElement("div");

            let arrow_el = document.createElement("span");
            arrow_el.innerHTML = "&#x2192;";
            arrow_el.className = "binding arrow";

            newBindingPanel.appendChild(output_select_el);
            newBindingPanel.appendChild(arrow_el);
            newBindingPanel.appendChild(input_select_el);

            let newButton = document.createElement("button");
            newButton.id = "new-binding";
            newButton.innerHTML = "Bind";
            newButton.addEventListener('click', function (e) {
                const output_option = output_select_el.selectedOptions[0];
                const input_option = input_select_el.selectedOptions[0];

                if (output_option && input_option) {
                    const provider = output_option.value.split(":");
                    const consumer = input_option.value.split(":");

                    this._jagModel.addBinding({
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
            output_select_el.addEventListener('change', function (e) {
                const output_option = e.target.selectedOptions[0];

                let valid_input_values_for_output = new Set();

                if (output_option) {
                    const provider = output_option.value.split(':');

                    const this_inputs_names = new Set();
                    this._jagModel.inputs.forEach(input => this_inputs_names.add(input.name));

                    // TODO: Check if type matches selected output type (probably need to get output type first)
                    if (provider[0] == 'this') {
                        for (let option of input_select_el.options) {
                            valid_input_values_for_output.add(option.value);
                        }
                    } else {
                        // TODO: Check if type matches selected output type (probably need to get output type first)
                        this._jagModel.outputs.forEach((output) => valid_input_values_for_output.add(`this:${output.name}`));

                        if (this._jagModel.execution == JAG.EXECUTION.SEQUENTIAL) {
                            if (provider[0] == 'any') {
                                const all_cumulative_outputs = new Set();

                                this._jagModel.inputs.forEach(input => all_cumulative_outputs.add(input.name));

                                const valid_any_outputs_from_children = new Set();

                                for (const child of this._jagModel.children) {
                                    if (valid_any_outputs_from_children.has(provider[1])) {
                                        child.model.inputs.forEach(input => valid_input_values_for_output.add(`${child.id}:${input.name}`));
                                    }

                                    child.model.outputs.forEach(output => {
                                        if (all_cumulative_outputs.has(output.name)) {
                                            valid_any_outputs_from_children.add(output.name)
                                        } else {
                                            all_cumulative_outputs.add(output.name);
                                        }
                                    });
                                }
                            } else {
                                const order = this._jagModel.getOrderForId(provider[0]);

                                for (const child of this._jagModel.children) {
                                    if (child.model) {
                                        if (this._jagModel.getOrderForId(child.id) > order) {
                                            for (const input of child.model.inputs) {
                                                // TODO: Check if type matches selected output type (probably need to get output type first)
                                                valid_input_values_for_output.add(`${child.id}:${input.name}`);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    toggleSelectValues(input_select_el, valid_input_values_for_output);
                }

                this._previous_value = output_option.value;

            }.bind(this));

            input_select_el.addEventListener('change', function (e) {
                const input_option = e.target.selectedOptions[0];

                if (input_option) {
                    const consumer = input_option.value.split(':');

                    // TODO: Check if types match selected output type (probably as a .filter before .map)
                    let valid_for_input = new Set(this._jagModel.inputsTo(consumer[0]).map((output) => `${output.id}:${output.property}`));
                    toggleSelectValues(output_select_el, valid_for_input);
                }
            }.bind(this));
        }

        for (let binding of this._jagModel.bindings) {
            let binding_box = FormUtils.createEmptyInputContainer(`binding-${binding.consumer.id}-${binding.consumer.property}`);

            let output_label = document.createElement("input");
            output_label.disabled = true;

            if (binding.provider.id == 'this' || binding.provider.id == 'any') {
                output_label.value = `${binding.provider.id}:${binding.provider.property}`
            } else {
                const provider_node = this._jagModel.getCanonicalNode(binding.provider.id);

                let provider_name = binding.provider.id;

                if (provider_node.name) {
                    provider_name = provider_node.name;
                } else if (provider_node.model) {
                    provider_name = provider_node.model.name;
                }

                output_label.value = `${provider_name}:${binding.provider.property}`;
            }

            output_label.className = "binding output";

            binding_box.appendChild(output_label);

            let arrow = document.createElement("span");
            arrow.innerHTML = "&#x2192;";
            arrow.className = "binding arrow";
            binding_box.appendChild(arrow);

            let input_label = document.createElement("input");
            input_label.disabled = true;

            if (binding.consumer.id == 'this' || binding.consumer.id == 'any') {
                input_label.value = `${binding.consumer.id}:${binding.consumer.property}`;
            } else {
                const consumer_node = this._jagModel.getCanonicalNode(binding.consumer.id);

                let consumer_name = binding.consumer.id;

                if (consumer_node.name) {
                    consumer_name = consumer_node.name;
                } else if (consumer_node.model) {
                    consumer_name = consumer_node.model.name;
                }

                input_label.value = `${consumer_name}:${binding.consumer.property}`;
            }

            input_label.className = "binding input";

            binding_box.appendChild(input_label);

            const remove = document.createElement('span');
            remove.innerHTML = '-';
            remove.className = 'binding remove';

            remove.addEventListener('click', function (e) {
                this._jagModel.removeBinding(binding);
            }.bind(this));

            binding_box.appendChild(remove);

            this._bindings.appendChild(binding_box);
        }
    }

    _updateAnnotations() {
        this._clearAnnotations();

        if (this._jagModel.children.length > 0) {
            for (const child of this._jagModel.children) {
                let child_name = child.id;
                if (child.model) child_name = child.model.name;

                let child_annotations = FormUtils.createPropertyElement(`annotations-${child.id}`, child_name);
                child_annotations.className = "annotation node";

                const annotation_add = document.createElement('span');
                annotation_add.innerHTML = '+';
                annotation_add.className = 'io-add';

                annotation_add.addEventListener('click', function (e) {
                    this._addAnnotation(child.id);
                }.bind(this));

                child_annotations.appendChild(annotation_add);

                const iterable_box = document.createElement("div");

                const iterable_checkbox = document.createElement("input");
                iterable_checkbox.setAttribute('id', `${child.id}-iterable`);
                iterable_checkbox.type = "checkbox";

                iterable_checkbox.addEventListener('change', function (e) {
                    this._jagModel.setIterable(child.id, iterable_checkbox.checked);
                }.bind(this));

                iterable_box.appendChild(iterable_checkbox);

                const iterable_label = document.createElement("label");
                iterable_label.for = `${child.id}-iterable`;
                iterable_label.textContent = 'Iterable';
                iterable_box.appendChild(iterable_label);

                if (child.iterable) {
                    iterable_checkbox.checked = true;
                }

                child_annotations.appendChild(iterable_box);

                if (child.annotations) {
                    for (let annotation of child.annotations) {
                        let annotation_box = FormUtils.createEmptyInputContainer(`annotation-${child.id}-${annotation[0]}`);
                        annotation_box.className = "annotation descriptor";

                        let annotation_name = document.createElement("input");
                        annotation_name.disabled = true;
                        annotation_name.value = annotation[0];

                        annotation_name.className = "annotation name";

                        annotation_box.appendChild(annotation_name);

                        let equals = document.createElement("span");
                        equals.innerHTML = "=";
                        equals.className = "annotation equals";
                        annotation_box.appendChild(equals);

                        let annotation_value = document.createElement("input");
                        annotation_value.disabled = true;

                        const value = annotation[1];
                        let value_text = value !== Object(value) ? value.toString() : JSON.stringify(value);
                        annotation_value.value = value_text;

                        annotation_value.className = "annotation value";

                        annotation_box.appendChild(annotation_value);

                        const remove = document.createElement('span');
                        remove.innerHTML = "-";
                        remove.className = "annotation remove";

                        remove.addEventListener('click', function (e) {
                            this._jagModel.removeAnnotation(child.id, annotation[0]);
                        }.bind(this));

                        annotation_box.appendChild(remove);

                        child_annotations.appendChild(annotation_box);
                    }
                }

                this._annotations.appendChild(child_annotations);
            }
        }
    }

    async _updateURN(origURN, newURN) {
        const URL_CHANGED_WARNING_POPUP = "The URN has changed. Would you like to save this model to the new URN (" + newURN + ")? (URN cannot be modified except to create a new model.)";
        const URL_RENAME_WARNING_POPUP = "The new URN (" + newURN + ") is already associated with a model. Would you like to update the URN to this model? (If not, save will be cancelled.)";
        // Changing a URN is either a rename/move or a copy or just not allowed.
        // Proposing we have a 'isPublished' tag.
        // URN changes are renames until the JagModel is marked as 'isPublished'.
        // After 'isPublished', URN changes are copies.


        //  Is it a valid URN?
        let isValid = InputValidator.isValidUrn(this._urnInput.value);
        if (isValid) {
            let origJagModel = await StorageService.get(origURN, 'jag');  // needed to check if 'isPublished'
            let urnAlreadyBeingUsed = await StorageService.has(newURN, 'jag');
            // Is the URN already taken?
            if (urnAlreadyBeingUsed) {
                // Does user confirm an overwrite??
                if (window.confirm(URL_RENAME_WARNING_POPUP)) {  // @TODO switch userConfirm with checking isPublished ?? ? idk
                    let newJagModel = await StorageService.get(origURN, 'jag');

                    // is the target JagModel published?
                    if (newJagModel.isPublished) {
                        // FAIL  - CANT OVERWRITE PUBLISHED JAGMODEL
                    } else // target JagModel is NOT published

                    { // is the original JagModel published?
                        if (origJagModel.isPublished) {
                            await StorageService.clone(origURN, newURN, 'jag');
                        } else { /// the original JAGModel is not published
                            await StorageService.replace(origURN, newURN, 'jag')
                        }
                    }
                } else {  // user says 'no' to overwrite
                    // FAIL -- NOT OVERWRITING EXISTING JAGMODEL
                }
            } else {  // urn not already being used
                // is the original JagModel published?
                console.log("is published - " + origJagModel.isPublished);
                if (origJagModel.isPublished) {
                    await this.cloneJagModel(origJagModel, newURN)
                } else {/// the original JAGModel is not published
                    await StorageService.replace(origURN, newURN, 'jag');
                }
            }
        }

    }

    async deleteJagModel(deadJagModel){
        this._jagModel = undefined;
        await StorageService.get(deadJagModel.urn,'jag');


        await StorageService.delete(deadJagModel.urn,'jag');
        this._urnInput.classList.toggle("edited", false);
        this._clearProperties();
    }

    async cloneJagModel(sourceJagModel, newURN) {
        const description = sourceJagModel.toJSON();
        description.urn = newURN;
        const newJagModel = JAG.fromJSON(description);
        // Update model references.
        this._node.model = newJagModel; //?
        this._jagModel = newJagModel;
        await StorageService.create(newJagModel, 'jag');
        // Remove unsaved box shadow on URN property input.
        this._urnInput.classList.toggle("edited", false);

        //  WHEN GOOD -->             this._jagModel.url = this._urnInput.value;
    }


    _initUI() {
        const childOf_el = document.createElement('div');
        childOf_el.className = 'special-wrapper child-of-notice';
        this._childOf = document.createElement('p');
        this._childOf.className = 'special child-of-notice';
        this._childOf.id = 'child-of';
        childOf_el.appendChild(this._childOf);

        const undefinedJAG_el = document.createElement('div');
        undefinedJAG_el.className = 'special-wrapper undefined-jag-notice';
        this._undefinedJAG = document.createElement('p');
        this._undefinedJAG.innerHTML = 'Model is undefined: its direct properties cannot be modified.';
        this._undefinedJAG.className = 'special undefined-jag-notice';
        this._undefinedJAG.id = 'undefined-jag';
        undefinedJAG_el.appendChild(this._undefinedJAG);

        const leafNode_el = document.createElement('div');
        leafNode_el.className = 'special-wrapper leaf-node-notice';
        this._leafNode = document.createElement('p');
        this._leafNode.innerHTML = 'Possible leaf node: it is a child without a model.';
        this._leafNode.className = 'special leaf-node-notice';
        this._leafNode.id = 'leaf-node';
        leafNode_el.appendChild(this._leafNode);

        const name_el = FormUtils.createPropertyElement('name-property', 'Name');
        this._nameInput = FormUtils.createTextInput('name-property');
        this._nameInput.setAttribute("placeholder", "display name");
        this._nameInput.setAttribute("tabIndex", "0");
        this._nameInput.className = "direct-property";
        name_el.appendChild(this._nameInput);

        const urn_el = FormUtils.createPropertyElement('urn-property', 'URN');
        this._urnInput = FormUtils.createTextInput('urn-property');
        this._urnInput.setAttribute("tabIndex", "1");
        this._urnInput.className = "direct-property";
        urn_el.appendChild(this._urnInput);

        const desc_el = FormUtils.createPropertyElement('desc-property', 'Description');
        this._descInput = document.createElement('textarea');
        this._descInput.setAttribute('id', 'desc-property');
        this._descInput.setAttribute('width', '100%');
        this._descInput.setAttribute('rows', '3');
        this._descInput.setAttribute("placeholder", "Enter your description of node here...");
        this._descInput.setAttribute("tabIndex", "2");
        //this._descInput = FormUtils.createTextInput('desc-property');
        this._descInput.className = "direct-property";
        desc_el.appendChild(this._descInput);

        const name_ctx_el = FormUtils.createPropertyElement('name-ctx-property', 'Contextual Name');
        this._name_ctxInput = FormUtils.createTextInput('name-ctx-property');
        this._name_ctxInput.className = "contextual";
        name_ctx_el.appendChild(this._name_ctxInput);

        const desc_ctx_el = FormUtils.createPropertyElement('desc-ctx-property', 'Contextual Description');
        this._desc_ctxInput = FormUtils.createTextInput('desc-ctx-property');
        this._desc_ctxInput.className = "contextual";
        desc_ctx_el.appendChild(this._desc_ctxInput);

        const execution_el = FormUtils.createPropertyElement('execution-property', 'Execution');
        this._executionSelect = FormUtils.createSelect('execution-property', [{
            value: JAG.EXECUTION.NONE,
            text: 'None'
        }, {
            value: JAG.EXECUTION.SEQUENTIAL,
            text: 'Sequential'
        }, {
            value: JAG.EXECUTION.PARALLEL,
            text: 'Parallel'
        }]);
        this._executionSelect.className = 'direct-property';
        execution_el.appendChild(this._executionSelect);

        const operator_el = FormUtils.createPropertyElement('operator-property', 'Operator');
        this._operatorSelect = FormUtils.createSelect('operator-property', [{
            value: JAG.OPERATOR.NONE,
            text: 'None'
        }, {
            value: JAG.OPERATOR.AND,
            text: 'And'
        }, {
            value: JAG.OPERATOR.OR,
            text: 'Or'
        }]);
        this._operatorSelect.className = 'direct-property';
        operator_el.appendChild(this._operatorSelect);

        // Create inputs area
        const inputs_el = FormUtils.createPropertyElement('inputs-property', 'Inputs');

        const input_add = document.createElement('span');
        input_add.innerHTML = '+';
        input_add.className = 'io-add';
        input_add.addEventListener('click', this._addInput.bind(this));
        inputs_el.appendChild(input_add);

        this._inputs = FormUtils.createEmptyInputContainer('inputs-property');
        this._inputs.className = 'directProperty';
        inputs_el.appendChild(this._inputs);

        // Create outputs area
        const outputs_el = FormUtils.createPropertyElement('outputs-property', 'Outputs');

        const output_add = document.createElement('span');
        output_add.innerHTML = '+';
        output_add.className = 'io-add';
        output_add.addEventListener('click', this._addOutput.bind(this));
        outputs_el.appendChild(output_add);

        this._outputs = FormUtils.createEmptyInputContainer('outputs-property');
        this._outputs.className = 'directProperty';
        outputs_el.appendChild(this._outputs);

        // Create bindings area
        const bindings_el = FormUtils.createPropertyElement('bindings-property', 'Bindings');

        this._bindings = FormUtils.createEmptyInputContainer('bindings-property');
        this._bindings.className = 'directProperty';
        bindings_el.appendChild(this._bindings);

        // Create annotation area
        const annotations_el = FormUtils.createPropertyElement('annotations-property', 'Annotations');

        this._annotations = FormUtils.createEmptyInputContainer('annotations-property');
        this._annotations.className = 'directProperty';
        annotations_el.appendChild(this._annotations);

        // Create export area
        const export_el = FormUtils.createEmptyInputContainer('export');
        this._export = document.createElement('button');
        this._export.innerHTML = 'export';
        export_el.appendChild(this._export);

        this._enableProperties(false);

        this.appendChild(childOf_el);
        this.appendChild(undefinedJAG_el);
        this.appendChild(leafNode_el);
        this.appendChild(name_el);
        this.appendChild(urn_el);
        this.appendChild(desc_el);
        this.appendChild(name_ctx_el);
        this.appendChild(desc_ctx_el);
        this.appendChild(execution_el);
        this.appendChild(operator_el);
        this.appendChild(inputs_el);
        this.appendChild(outputs_el);
        this.appendChild(bindings_el);
        this.appendChild(annotations_el);
        this.appendChild(export_el);
    }



    _initHandlers() {
        // this._urnInput.addEventListener('keyup', e => {
        // 	this._urnInput.classList.toggle('edited', this._urnInput.value != this._jagModel.urn);
        // });

        //Uncaught TypeError: Cannot set properties of undefined (setting 'name') - [this._jagModel.name = this._nameInput.value;]
        this._nameInput.addEventListener('blur', async(e) => {  // get an error if the blur goes to a playground click on empty space.
            if (this._jagModel) {
            this._jagModel.name = this._nameInput.value;
            await StorageService.update(this._jagModel, 'jag');}
        });

        this._nameInput.addEventListener('keyup', (e) => {
            if (e.key == "Enter") {
                e.preventDefault();
                let inputs = this.querySelectorAll("input:enabled, textarea");

                //current position in 'form'
                const currentPosition = this._nameInput.tabIndex;
                if (currentPosition < inputs.length - 1) {
                    inputs.item(currentPosition + 1).focus();
                } else {
                    inputs.item(currentPosition).blur();
                }
            } else {
                this._jagModel.name = this._nameInput.value;
            }
        });


        this._urnInput.addEventListener('keyup', (e) => {
            if (e.key == "Enter") {
                e.preventDefault();
                let inputs = this.querySelectorAll("input:enabled, textarea");
                this._urnInput.classList.toggle('edited', this._urnInput.value != this._jagModel.urn);
                //current position in 'form'
                const currentPosition = this._urnInput.tabIndex;
                if (currentPosition < inputs.length - 1) {
                    inputs.item(currentPosition + 1).focus();
                } else {
                    inputs.item(currentPosition).blur();
                }
            }
        });

        this._urnInput.addEventListener('focusout', async (e) => {
            if (this._jagModel.urn != this._urnInput.value) {
                await this._updateURN(this._jagModel.urn, this._urnInput.value);  // might be a rename
                this._jagModel = undefined;   //zzzz
            }
        })

        this._descInput.addEventListener('blur', async (e) => {
            if (this._jagModel) {
            this._jagModel.description = this._descInput.value;
            await StorageService.update(this._jagModel, 'jag');}
        });

        this._descInput.addEventListener('keyup', (e) => {
            if (e.key == "Enter") {
                e.preventDefault();
                let inputs = this.querySelectorAll("input:enabled, textarea");
                //current position in 'form'
                const currentPosition = this._descInput.tabIndex;
                if (currentPosition < inputs.length - 1) {
                    inputs.item(currentPosition + 1).focus();
                } else {
                    inputs.item(currentPosition).blur();
                }
            } else {
                this._jagModel.description = this._descInput.value;
            }
        });


        this._name_ctxInput.addEventListener('keyup', async () => {
            if (this._jagModel) {
                this._node.setContextualName(this._name_ctxInput.value);
                await StorageService.update(this._jagModel, 'jag');
            }
        });

        this._desc_ctxInput.addEventListener('keyup', async () => {
            if (this._jagModel) {
                this._node.setContextualDescription(this._desc_ctxInput.value);
                await StorageService.update(this._jagModel, 'jag');
            }
        });

        this._executionSelect.addEventListener('change', async  e => {
            if (this._jagModel) {
                this._jagModel.execution = this._executionSelect.value;
                await StorageService.update(this._jagModel, 'jag');
            }
        });

        this._operatorSelect.addEventListener('change', async e => {
            if (this._jagModel) {
                this._jagModel.operator = this._operatorSelect.value;
                await StorageService.update(this._jagModel, 'jag');
            }
        });

        this._export.addEventListener('click', e => {
            const node = this._jagModel;
            const json = JSON.stringify(node.toJSON());
            const a = document.createElement('a');
            const data = `data:application/json,${encodeURI(json)}`;
            a.href = data;
            a.download = `${node.name}.json`;
            a.click();
        });
    }

    _clearProperties() {
        this._urnInput.value = '';
        this._nameInput.value = '';
        this._descInput.value = '';
        this._name_ctxInput.value = '';
        this._desc_ctxInput.value = '';
        this._executionSelect.value = JAG.EXECUTION.NONE;
        this._operatorSelect.value = JAG.OPERATOR.NONE;

        this._urnInput.classList.toggle("edited", false);

        this._clearIO();
        this._clearAnnotations();

        for (const input of this.querySelectorAll("input")) {
            input.title = '';
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

    _clearAnnotations() {
        while (this._annotations.firstChild) {
            this._annotations.removeChild(this._annotations.firstChild);
        }
    }

    _enableProperties(enabled) {
        this._urnInput.disabled = !enabled;
        this._nameInput.disabled = !enabled;
        this._descInput.disabled = !enabled;
        this._name_ctxInput.disabled = !enabled;
        this._desc_ctxInput.disabled = !enabled;
        this._executionSelect.disabled = !enabled;
        this._operatorSelect.disabled = !enabled;

        this._consumesMap.disabled = !enabled;
        this._producesMap.disabled = !enabled;
        this._export.disabled = !enabled;

        if (this._node && this._node.getParent() != undefined && (enabled || this._jagModel instanceof UndefinedJAG)) {
            this._childOf.innerHTML = `As child of ${this._node.getParentURN()}`;
            this.classList.toggle('root-node', false);
            this._name_ctxInput.disabled = false;
            this._desc_ctxInput.disabled = false;
        } else {
            this.classList.toggle('root-node', true);
            this._name_ctxInput.disabled = true;
            this._desc_ctxInput.disabled = true;
        }

        if (enabled || (!enabled && !this._jagModel)) {
            this.classList.toggle('defined-model', true);
            this.classList.toggle('non-leaf-node', true);
        } else if (this._jagModel instanceof UndefinedJAG) {
            this.classList.toggle('defined-model', false);

            if (this._node.getParent()) {
                this.classList.toggle('non-leaf-node', false);
            }
        }
    }
});

export default customElements.get('jag-properties');

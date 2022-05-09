/**
 * @file JAG model.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.89
 */

import {UUIDv4} from '../utils/uuid.js';
import JAGATValidation from '../utils/validation.js';

/**
 * Joint Activity Graph (JAG) model.
 *
 * @class
 * @constructor
 * @public
 */
export default class JAG extends EventTarget {

    constructor({
                    urn,
                    name,
                    description = '',
                    connector = {execution: JAG.EXECUTION.NONE, operator: JAG.OPERATOR.NONE},
                    inputs = undefined,
                    outputs = undefined,
                    children = undefined,
                    bindings = undefined
                }) {
        super();

        // All string properties can be copied.
        /**
         * @name JAG#urn
         * @type {String}
         * @default undefined
         */
        this._urn = urn;

        /**
         * @name JAG#name
         * @type {String}
         * @default undefined
         */
        this._name = name;

        /**
         * @name JAG#description
         * @type {String}
         * @default ''
         */
        this._description = description;

        /**
         * @name JAG#execution
         * @type {String}
         * @default JAG.EXECUTION.NONE
         */
        this._execution = connector.execution;

        /**
         * @name JAG#operator
         * @type {String}
         * @default JAG.OPERATOR.NONE
         */
        this._operator = connector.operator;

        // Copy each array (inputs, outputs and children) for the instance if provided, else create a new array.
        this._inputs = inputs ? [...inputs] : new Array();
        this._outputs = outputs ? [...outputs] : new Array();
        this._children = children ? [...children] : new Array();

        for (let child of this._children) {
            if (child.annotations) {
                const annotations = new Map();

                for (let annotation in child.annotations) {
                    annotations.set(annotation, child.annotations[annotation]);
                }

                child.annotations = annotations;
            }
        }

        // Copy bindings for the instance if provided, else create a new set.
        this._bindings = new Set(bindings);

        this._isPublished = false;
    }

    static fromJSON(json) {

        try {
            JAGATValidation.validateJAG(json);
        } catch (e) {
            throw new Error(`Error fromJSON parsing ${json}: ${e.message}`);  // note to self: if you get an error bringing you here, it might be forgetting the schema.
        }

        return new JAG(json);
        // @TODO: explode the json definition to use the constructor below
        //return new JAG(urn, name, connector, inputs, outputs, children, bindings);
    }

    get urn() {
        return this._urn;
    }

    set name(name) {
        if (this._name != name) {
            this._name = name;
        }
    }

    get name() {
        return this._name;
    }

    set execution(type) {
        if (this._execution != type) {
            this._execution = type;
        }
    }

    get execution() {
        return this._execution;
    }

    set operator(type) {
        if (this._operator != type) {
            this._operator = type;
        }
    }

    get operator() {
        return this._operator;
    }

    set description(description) {
        if (this._description != description) {
            this._description = description;
        }
    }

    get description() {
        return this._description;
    }

    get inputs() {
        return [...this._inputs];
    }

    get outputs() {
        return [...this._outputs];
    }

    get children() {
        return [...this._children];
    }

    get bindings() {
        return [...this._bindings];
    }

    get isPublished() {
        return this._isPublished;
    }

    set isPublished(bool) {
        this._isPublished = bool;
    }

    isValid() {
        let regex = new RegExp("^[a-zA-Z0-9-:]+([a-zA-Z0-9])$");
        if (this._urn.match(regex)) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * Adds the given input to the inputs of this JAG.
     * Dispatches an update.
     *
     * @param {{name:String,type:String}} input Input to add.
     */
    addInput(input) {
        this._inputs.push(input);
    }

    /**
     * Adds the given output to the outputs of this JAG.
     * Dispatches an update.
     *
     * @param {{name:String,type:String}} output Output to add.
     */
    addOutput(output) {
        this._outputs.push(output);
    }

    /**
     * Adds the given JAG as a child to this JAG.
     * If an ID already exists, the child already exists, and this was likely called
     * during creation of a graphical edge for the child of an existing JAG; the call
     * will be ignored and the given ID will be returned.
     * Dispatches an update if ID is undefined.
     *
     * @param {JAG} child Model to add.
     * @param {String} id ID for child, if it exists.
     * @returns {String} UUIDv4 string of the child.
     */
    addChild(child, id = undefined) {
        if (id == undefined) {
            this._children.push({
                id: id = UUIDv4(),
                urn: child.urn,
                model: child
            });

        }

        return id;
    }

    /**
     * Removes the given child from this JAG.
     * Dispatches an update.
     *
     * @param {{id:String,model:JAG}} child Child to remove.
     */
    removeChild(child) {
        for (let index in this._children) {
            if (this._children[index].id == child.id) {
                this._children.splice(index, 1);
                break;
            }
        }

        for (let binding of this._bindings)
            if (binding.provider.id == child.id || binding.consumer.id == child.id)
                this.removeBinding(binding);

        //	this.dispatchEvent(new CustomEvent('update', { "detail": { "urn": this._urn, "property": "children", "extra": { "children": this._children, "operator": this._operator, "execution": this._execution } } }));
    }

    /**
     * Sets the name of the child with the given ID to the given name.
     *
     * @param {String} id ID of the child whose name will be set.
     * @param {String} name Name to set to.
     */
    setChildName(id, name) {
        for (const child of this._children) {
            if (child.id == id) {
                if (child.name != name) {
                    child.name = name;
                }
                break;
            }
        }
    }

    /**
     * Sets the description of the child with the given ID to the given description.
     *
     * @param {String} id ID of the child whose description will be set.
     * @param {String} description Description to set to.
     */
    setChildDescription(id, description) {
        for (const child of this._children) {
            if (child.id == id) {
                if (child.description != description) {
                    child.description = description;
                }

                break;
            }
        }
    }

    /**
     * Gets the ID, JAG, property name and type of all possible inputs to the child with the given ID.
     * Includes inputs to this JAG and outputs from sequential children preceding the child with the given ID.
     *
     * @param {String} id ID of the child for which to seek inputs.
     * @returns {Array<{id:String,model:JAG,property:String,type:String}>} Inputs available to the child with the given ID.
     */
    inputsTo(id) {
        let availableInputs = this._inputs.map((input) => {
            return {
                id: 'this',
                model: this,
                property: input.name,
                type: input.type
            };
        });

        if (this._execution == JAG.EXECUTION.SEQUENTIAL) {
            for (let child of this._children) {
                if (child.id == id)
                    break;

                if (child.model) {
                    let child_outputs = child.model.outputs;

                    for (let child_output of child_outputs) {
                        availableInputs.push({
                            id: child.id,
                            model: child.model,
                            property: child_output.name,
                            type: child_output.type
                        });
                    }
                }
            }
        }

        return availableInputs;
    }

    /**
     * Gets the ID, JAG, property name and type of all inputs of children of this JAG.
     *
     * @returns {Array<{id:String,model:JAG,property:String,type:String}>} Inputs of children of this JAG.
     */
    getAvailableInputs() {
        let availableInputs = [];

        for (let child of this._children) {
            if (child.model) {
                if (child.model.inputs.length > 0) {
                    availableInputs.push({
                        id: child.id,
                        model: child.model,
                        inputs: child.model.inputs
                    });
                }
            }
        }

        return availableInputs;
    }

    /**
     * Gets the ID, JAG, property name and type of all outputs of children of this JAG.
     *
     * @returns {Array<{id:String,model:JAG,property:String,type:String}>} Outputs of children of this JAG.
     */
    getAvailableOutputs() {
        let availableOutputs = [];

        for (let child of this._children) {
            if (child.model) {
                if (child.model.outputs.length > 0) {
                    availableOutputs.push({
                        id: child.id,
                        model: child.model,
                        outputs: child.model.outputs
                    });
                }
            }
        }

        return availableOutputs;
    }

    /**
     * Gets the child of this JAG with the given ID.
     *
     * @param {String} id
     * @returns {{id:String,model:JAG}} Child of this JAG with the given ID.
     */
    getCanonicalNode(id) {
        if (id === 'this')
            return {id: 'this', model: this};

        for (let child of this._children)
            if (child.id == id)
                return child;

        return undefined;
    }

    /**
     * Adds the given binding to the bindings of this JAG.
     * Will remove an existing binding with the same consumer.
     * Dispatches an update.
     *
     * @param {{provider:{id:String,property:String},consumer:{id:String,property:String}}} binding Binding to add.
     */
    addBinding(binding) {
        const existing_binding = this.getBinding(binding.consumer.id, binding.consumer.property);

        if (existing_binding !== undefined)
            this._bindings.delete(existing_binding);

        this._bindings.add(binding);

    }

    /**
     * Check if a binding exists for the given consumer ID and property.
     *
     * @param {String} consumer_id The ID to seek.
     * @param {String} consumer_property The property to seek.
     * @returns {boolean} Whether or not a binding exists for the given consumer ID and property.
     */
    hasBinding(consumer_id, consumer_property) {
        const binding = this.getBinding(consumer_id, consumer_property);
        return binding !== undefined;
    }

    /**
     * Gets a binding for the given consumer ID and property.
     *
     * @param {String} consumer_id ID of the consumer for the binding to be returned.
     * @param {String} consumer_property Name of the consumer property for the binding to be returned.
     * @returns {{provider:{id:String,property:String},consumer:{id:String,property:String}}|undefined} Binding for the given consumer ID and property, or undefined if none exists.
     */
    getBinding(consumer_id, consumer_property) {
        for (let binding of this._bindings) {
            if (consumer_id === binding.consumer.id &&
                consumer_property === binding.consumer.property)
                return binding;
        }
        return undefined;
    }

    /**
     * Removes the provided binding from this node.
     *
     * @param {{provider:{id:String,property:String},consumer:{id:String,property:String}}} binding The binding to remove.
     */
    removeBinding(binding) {
        if (this._bindings.delete(binding)) {

        }
    }

    /**
     * Adds the given annotation with name and value to the given child JAG.
     * Dispatches an update.
     *
     * @param {String} id UUID of the child to which to add the annotation.
     * @param {String} name Key name for the new annotation.
     * @param {String} value Value for the new annotation.
     */
    addAnnotation(id, name, value) {
        const child = this.getCanonicalNode(id);

        if (!(child == undefined || child.model == this)) {
            if (!child.annotations || !child.annotations.has(name) || child.annotations.get(name) != value) {
                if (!child.annotations) child.annotations = new Map();
                child.annotations.set(name, value);
            }
        }
    }

    /**
     * Removes the annotation with the given name from the child JAG of the given ID.
     * Dispatches an update.
     *
     * @param {String} id UUID of the child from which to remove the annotation.
     * @param {String} name Key name for the annotation to delete.
     */
    removeAnnotation(id, name) {
        const child = this.getCanonicalNode(id);

        if (!(child == undefined || child.model == this)) {
            if (!child.annotations) return;

            if (child.annotations.has(name)) {
                child.annotations.delete(name);
            }
        }
    }

    /**
     * Marks the child with the given ID as iterable with the given value.
     *
     * @param {String} id UUID of the child to mark.
     * @param {boolean} value True or false whether or not the child is iterable.
     */
    setIterable(id, value) {
        for (const child of this._children) {
            if (child.id == id) {
                if (child.iterable == value) return;
                child.iterable = value;
                return;
            }
        }
    }

    getOrderForId(id) {
        if (this._execution == JAG.EXECUTION.PARALLEL) return 0;

        for (let i = 0; i < this._children.length; ++i) {
            if (this._children[i].id === id) {
                return i + 1;
            }
        }

        return 0;
    }


    // static _createModel(description) {
    // 	const model = JAG.fromJSON(description);
    // 	// Listen to update events to commit the change in storage.
    // //	model.addEventListener('update', this._handleUpdate.bind(this));
    // 	// @TODO: store model in cache
    // 	return model;
    // }


    toJSON() {
        const json = {
            urn: this._urn,
            name: this._name,
            description: this._description,
            type: 'node.type.plan',
            connector: {
                execution: this._execution,
                operator: this._operator
            },
            inputs: [],
            outputs: [],
            children: [],
            bindings: []
        };

        this._children.forEach((child) => {
            let descriptor = {
                urn: child.urn,
                id: child.id
            };

            if (child.name) descriptor.name = child.name;
            if (child.description) descriptor.description = child.description;

            if (child.annotations && child.annotations.size > 0) {
                descriptor.annotations = {};

                for (let annotation of child.annotations) {
                    descriptor.annotations[annotation[0]] = annotation[1];
                }
            }

            if (child.iterable) {
                descriptor.iterable = true;
            }

            json.children.push(descriptor);
        });

        this._inputs.forEach(input => {
            json.inputs.push(input);
        });

        this._outputs.forEach(output => {
            json.outputs.push(output);
        });

        this._bindings.forEach(binding => {
            json.bindings.push({
                consumer: {
                    id: binding.consumer.id,
                    property: binding.consumer.property
                },
                provider: {
                    id: binding.provider.id,
                    property: binding.provider.property
                }
            });
        });

        return json;
    }
}

JAG.EXECUTION = {
    NONE: 'node.execution.none',
    SEQUENTIAL: 'node.execution.sequential',
    PARALLEL: 'node.execution.parallel'
}

JAG.OPERATOR = {
    NONE: 'node.operator.none',
    AND: 'node.operator.and',
    OR: 'node.operator.or'
}

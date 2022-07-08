/**
 * @file Activity model.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.89
 */

import {UUIDv4} from '../utils/uuid.js';
import ValidationUtility from "../utils/validation.js";
import Validation from "../utils/validation.js";

/**
 * Joint Activity Graph (Activity) model.
 *
 * @class
 * @constructor
 * @public
 */
export default class Activity extends EventTarget {

    constructor({
                    urn,                    // identifier
                    description = '',
                    name,
                    children,               // array of childrens urn and id*
                    inputs,
                    outputs,
                    bindings,
                    connector =
                        {execution: Activity.EXECUTION.NONE.name,
                        returns: Activity.RETURNS.ALL.name,
                        operator: Activity.OPERATOR.NONE.name},
                    author,
                    lockedBy,
                    createdDate,
                    modifiedDate,
                    isLocked = false,
                    collapsed = false
                }) {
        super();

        this._urn = urn;
        this._name = name;
        this._description = description;
        this._author = author;
        this._createdDate = createdDate;
        this._modifiedDate = modifiedDate;
        this._lockedBy = lockedBy;
        this._connector = connector;
        this._execution = connector.execution;
        this._returns = connector.returns;
        this._operator = connector.operator;

        // Copy each array (inputs, outputs and children) for the instance if provided, else create a new array.
        this._inputs = inputs ? [...inputs] : new Array();
        this._outputs = outputs ? [...outputs] : new Array();
        this._children = children ? [...children] : new Array();
        // Copy bindings for the instance if provided, else create a new set.
        this._bindings = new Set(bindings);

        // The below has not been looked at.
        for (let child of this._children) {
            if (child.annotations) {
                const annotations = new Map();
                for (let annotation in child.annotations) {
                    annotations.set(annotation, child.annotations[annotation]);
                }
                child.annotations = annotations;
            }
        }

        this._isLocked = isLocked;
        this._collapsed = collapsed;
    }


    get urn() {
        return this._urn;
    }

    set urn(urn) {
        if (!ValidationUtility.isValidUrn(this._urn)) {
            this._urn = urn;
        }
    }

    set name(name) {
        this._name = name;
    }

    get name() {
        return this._name;
    }

    set description(description) {
        this._description = description;
    }

    get description() {
        return this._description;
    }

    get author() {
        return this._author;
    }

    set author(value) {
        this._author = value;
    }

    get createdDate() {
        return this._createdDate;
    }

    set createdDate(value) {
        this._createdDate = value;
    }

    get modifiedDate() {
        return this._modifiedDate;
    }

    set modifiedDate(value) {
        this._modifiedDate = value;
    }

    get lockedBy() {
        return this._lockedBy;
    }

    set lockedBy(value) {
        this._lockedBy = value;
    }

    set connector(value) {
        this._connector = value;
    }

    get connector() {
        return this._connector;
    }

    set inputs(value) {
        this._inputs = value;
    }

    get inputs() {
        return [...this._inputs];
    }

    addInput(input) {
        this._inputs.push(input);
    }

    set outputs(value) {
        this._outputs = value;
    }

    get outputs() {
        return [...this._outputs];
    }

    addOutput(output) {
        this._outputs.push(output);
    }

    set children(value) {
        this._children = value;
        if ((this._children.length !== 0) && (this._operator == Activity.OPERATOR.NONE.name)) {
            this._operator = Activity.OPERATOR.AND.name;
        }
    }

    get children() {
        return [...this._children];
    }

    addChild(urn, id = undefined) {
        /**
         * Adds the given Activity as a child to this Activity.
         * If an ID already exists, the child already exists, and this was likely called
         * during creation of a graphical edge for the child of an existing Activity; the call
         * will be ignored and the given ID will be returned.
         * Dispatches an update if ID is undefined.
         *
         * @param {Activity} child Model to add.
         * @param {String} id ID for child, if it exists.
         * @returns {String} UUIDv4 string of the child.
         */
        this._children.push({
            urn: urn,
            id: id = UUIDv4()
        });

        if ((this._children.length !== 0) && (this._operator == Activity.OPERATOR.NONE.name)) {
            this._operator = Activity.OPERATOR.AND.name;
        }
        return id;
    }

    removeChild(childId) {
        for (let index in this._children) {
            if (this._children[index].id === childId) {
                this._children.splice(index, 1);
                break;
            }
        }
        for (let binding of this._bindings)
            if (binding.provider.id == childId || binding.consumer.id == childId)
                this.removeBinding(binding);
    }

    hasChildren() {
        return (this._children.length > 0)
    }

    get canHaveChildren() {
        return (Validation.isValidUrn(this.urn));
    }

    set bindings(value) {
        this._bindings = value;
    }

    get bindings() {
        return [...this._bindings];
    }

    set execution(type) {
        this._execution = type;
    }

    get execution() {
        return this._execution;
    }

    set operator(type) {
        this._operator = type;
    }

    get operator() {
        return this._operator;
    }

    set returns(type) {
        this._returns = type;
    }

    get returns() {
        return this._returns;
    }

    set isLocked(bool) {
        this._isLocked = bool;
    }

    get isLocked() {
        return this._isLocked;
    }

    get collapsed() {
        return this._collapsed;
    }

    set collapsed(value) {
        this._collapsed = value;
    }


    /**
     * Gets the ID, Activity, property name and type of all possible inputs to the child with the given ID.
     * Includes inputs to this Activity and outputs from sequential children preceding the child with the given ID.
     *
     * @param {String} id ID of the child for which to seek inputs.
     * @returns {Array<{id:String,activity:Activity,property:String,type:String}>} Inputs available to the child with the given ID.
     */
    inputsTo(id) {
        let availableInputs = this._inputs.map((input) => {
            return {
                id: 'this',
                activity: this,
                property: input.name,
                type: input.type
            };
        });

        if (this._execution == Activity.EXECUTION.SEQUENTIAL.name) {
            for (let child of this._children) {
                if (child.id == id)
                    break;

                if (child.activity) {
                    let child_outputs = child.activity.outputs;

                    for (let child_output of child_outputs) {
                        availableInputs.push({
                            id: child.id,
                            activity: child.activity,
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
     * Gets the ID, Activity, property name and type of all inputs of children of this Activity.
     *
     * @returns {Array<{id:String,activity:Activity,property:String,type:String}>} Inputs of children of this Activity.
     */
    getAvailableInputs() {
        let availableInputs = [];

        for (let child of this._children) {
            if (child.activity) {
                if (child.activity.inputs.length > 0) {
                    availableInputs.push({
                        id: child.id,
                        activity: child.activity,
                        inputs: child.activity.inputs
                    });
                }
            }
        }
        return availableInputs;
    }

    /**
     * Gets the ID, Activity, property name and type of all outputs of children of this Activity.
     *
     * @returns {Array<{id:String,activity:Activity,property:String,type:String}>} Outputs of children of this Activity.
     */
    getAvailableOutputs() {
        let availableOutputs = [];

        for (let child of this._children) {
            if (child.activity) {
                if (child.activity.outputs.length > 0) {
                    availableOutputs.push({
                        id: child.id,
                        activity: child.activity,
                        outputs: child.activity.outputs
                    });
                }
            }
        }

        return availableOutputs;
    }


    /**
     * Adds the given binding to the bindings of this Activity.
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
     * Gets the child of this Activity with the given ID.
     *
     * @param {String} id
     * @returns {{id:String,activity:Activity}} Child of this Activity with the given ID.
     */
    getCanonicalNode(id) {

        if (id === 'this')
            return {id: 'this', activity: this};

        for (let child of this._children)
            if (child.id == id)
                return child;

        return undefined;
    }

    /**
     * Adds the given annotation with name and value to the given child Activity.
     * Dispatches an update.
     *
     * @param {String} id UUID of the child to which to add the annotation.
     * @param {String} name Key name for the new annotation.
     * @param {String} value Value for the new annotation.
     */
    addAnnotation(id, name, value) {
        const child = this.getCanonicalNode(id);

        if (!(child == undefined || child.activity == this)) {
            if (!child.annotations || !child.annotations.has(name) || child.annotations.get(name) != value) {
                if (!child.annotations) child.annotations = new Map();
                child.annotations.set(name, value);
            }
        }
    }

    /**
     * Removes the annotation with the given name from the child Activity of the given ID.
     * Dispatches an update.
     *
     * @param {String} id UUID of the child from which to remove the annotation.
     * @param {String} name Key name for the annotation to delete.
     */
    removeAnnotation(id, name) {
        const child = this.getCanonicalNode(id);

        if (!(child == undefined || child.activity == this)) {
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
        if (this._execution == Activity.EXECUTION.PARALLEL.name) return 0;

        for (let i = 0; i < this._children.length; ++i) {
            if (this._children[i].id === id) {
                return i + 1;
            }
        }

        return 0;
    }


    toJSON() {
        const json = {
            urn: this._urn,
            name: this._name,
            description: this._description,
            type: 'node.type.plan',
            connector: {
                execution: this._execution,
                returns: this._returns,
                operator: this._operator
            },
            inputs: [],
            outputs: [],
            children: [],
            bindings: [],
            isLocked: this._isLocked,
            collapsed: this._collapsed
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

        return json
    }

    static fromJSON(json) {
        if (Array.isArray(json)) {
            let jagList = json.map(function (element) {
                try {
                    ValidationUtility.validateJAG(element);
                } catch (e) {
                    throw new Error(`Error fromJSON parsing ${json}: ${e.message}`);  // note to self: if you get an error bringing you here, it might be forgetting the schema.
                }
                return new Activity(element);
            })
            return jagList;
        } else {
            try {
                ValidationUtility.validateJAG(json);
            } catch (e) {
                throw new Error(`Error fromJSON parsing ${json}: ${e.message}`);  // note to self: if you get an error bringing you here, it might be forgetting the schema.
            }
            return new Activity(json);
            // @TODO: explode the json definition to use the constructor below
            //return new Activity(urn, name, connector, inputs, outputs, children, bindings);
        }
    }



    static getExecutionOptions() {
        let executionOptions = []
        let execution = Activity.EXECUTION;
        for (let step in execution) {
            executionOptions.push({value: execution[step].name, text: execution[step].text})
        }
        return executionOptions;
    }

    static getReturnsOptions(executionName) {
        let returnsOptions = []
        let returns = Activity.RETURNS;
        for (let step in returns) {
            if (returns[step].condition.includes(executionName)) {
                returnsOptions.push({value: returns[step].name, text: returns[step].text})
            }
        }
        return returnsOptions;
    }


    static getOperatorOptions(returnName) {
        let operatorOptions = []
        let operators = Activity.OPERATOR;
        for (let step in operators) {
            if (operators[step].condition.includes(returnName)) {
                operatorOptions.push({value: operators[step].name, text: operators[step].text})
            }
        }
        return operatorOptions;
    }

}

Activity.EXECUTION = {
    NONE: {
        name: 'node.execution.none',
        text: "none",
        description: 'No reporting sub-activities'
    },
    PARALLEL: {
        name: 'node.execution.parallel',
        text: "parallel",
        description: 'Sub-activities execute simultaneously'
    },
    SEQUENTIAL:
        {
            name: 'node.execution.sequential',
            text: "sequential",
            description: 'Sub-activities execute in order'
        },
    RETRY: {
        name: 'node.execution.retry',
        text: 'sequential w/retry',
        description: 'Recover and retry all if one sub-activity fails'
    },
    LOOP: {
        name: 'node.execution.loop',
        text: "sequential loop",
        description: 'First sub-activity resumes after last finishes'
    },
    OVERLAP: {
        name: 'node.execution.overlap',
        text: "sequential w/overlap",
        description: 'Following sub-activity begins before the previous ends'
    },
    PARALLELX: {
        name: 'node.execution.parallelx',
        text: "parallel subset",
        description: 'Some sub-activities execute simultaneously'
    }
}


Activity.RETURNS = {
    AVAILABLE: {
        name: 'node.returns.available',
        text: 'all available',
        description: 'All children with currently available output',
        condition: ['node.execution.parallel', 'node.execution.sequential', 'node.execution.retry', 'node.execution.loop', 'node.execution.overlap', 'node.execution.parallelx'],
    },
    ALL: {
        name: 'node.returns.all',
        text: 'all (or none)',
        description: 'All children data when all become available',
        condition: ['node.execution.parallel', 'node.execution.parallelx']
    },
    LATEST: {
        name: 'node.returns.latest',
        text: 'most recent',
        description: 'Only data from most recently reporting child',
        condition: ['node.execution.parallel', 'node.execution.sequential', 'node.execution.retry', 'node.execution.loop', 'node.execution.overlap']
    },
    PRIORITY: {
        name: 'node.returns.priority',
        text: 'highest priority',
        description: 'Child with highest priority available input',
        condition: ['node.execution.parallel']
    },
    FINAL: {
        name: 'node.returns.final',
        text: 'final output',
        description: 'Final result from last child in sequence',
        condition: ['node.execution.sequential', 'node.execution.retry', 'node.execution.loop', 'node.execution.overlap']
    }
}


Activity.OPERATOR = {
    NONE: {
        name: 'node.operator.none',                  // does not return a value    (maybe just a state?) (maybe nada)
        text: 'none',
        symbol: '',
        condition: ['node.returns.available', 'node.returns.all', 'node.returns.latest', 'node.returns.priority', 'node.returns.final']
    },
    AND: {
        name: 'node.operator.and',                    // AND(boolean,boolean,...)
        text: 'and',
        symbol: 'and',
        condition: ['node.returns.available', 'node.returns.all']
    },
    OR: {
        name: 'node.operator.or',                      // OR(boolean,boolean,...)        @TODO  XOR?!    NAND NOR
        text: 'or',
        symbol: 'or',
        condition: ['node.returns.available', 'node.returns.all']
    },
    FIRST: {
        name: 'node.operator.first',
        text: 'first reporting',
        symbol: '1st',
        condition: ['node.returns.available', 'node.returns.all']
    },
    LAST: {
        name: 'node.operator.last',
        text: 'last reporting',
        symbol: 'nth',
        condition: ['node.returns.available', 'node.returns.all']
    },
    MAX: {
        name: 'node.operator.max',
        text: 'largest',
        symbol: 'max',
        condition: ['node.returns.available', 'node.returns.all']
    },
    MIN: {
        name: 'node.operator.min',
        text: 'smallest',
        symbol: 'min',
        condition: ['node.returns.available', 'node.returns.all']
    },
    SUM: {
        name: 'node.operator.sum',
        text: 'sum',
        symbol: 'sum',
        condition: ['node.returns.available', 'node.returns.all']
    },
    AVG: {
        name: 'node.operator.avg',
        text: 'average',
        symbol: 'avg',
        condition: ['node.returns.available', 'node.returns.all']
    },
    UNION: {
        name: 'node.operator.union',
        text: 'union',
        symbol: 'U',
        condition: ['node.returns.available', 'node.returns.all']
    },
    INT: {
        name: 'node.operator.intersection',
        text: 'intersection',
        symbol: '\uD83D\uDE00',
        condition: ['node.returns.available', 'node.returns.all']
    },
    CONVERT: {
        name: 'node.operator.convert',
        text: 'convert',
        symbol: '><',
        condition: ['node.returns.latest', 'node.returns.priority', 'node.returns.final']
    },
    INVERSE: {
        name: 'node.operator.inverse',
        text: 'inverse',
        symbol: '1/x',
        condition: ['node.returns.latest', 'node.returns.priority', 'node.returns.final']
    },
    NEGATE: {
        name: 'node.operator.negate',
        text: 'negate',
        symbol: '-x',
        condition: ['node.returns.latest', 'node.returns.priority', 'node.returns.final']
    },
    ABS: {
        name: 'node.operator.absolute',
        text: 'absolute',
        symbol: '|x|',
        condition: ['node.returns.latest', 'node.returns.priority', 'node.returns.final']
    },
    NOT: {
        name: 'node.operator.not',
        text: 'not',
        symbol: '!',
        condition: ['node.returns.latest', 'node.returns.priority', 'node.returns.final']
    }

}

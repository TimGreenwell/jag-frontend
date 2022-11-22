/**
 * @file Activity model.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.89
 */

import {uuidV4} from '../utils/uuid.js';
import Validation from "../utils/validation.js";
import Binding from "./binding.js";


export default class Activity extends EventTarget {

    constructor({
        urn,
        name,
        description = ``,
        connector = {
            execution: Activity.EXECUTION.NONE.name,
            returns: Activity.RETURNS.ALL.name,
            operator: Activity.OPERATOR.NONE.name,
            onfail: Activity.RETURNS.NONE.name
        },
        inputs = [],
        outputs = [],
        children = [],
        bindings = [],   // list of Binding
        author,
        createdDate,
        modifiedDate,
        expectedDuration,
        lockedBy,
        isLocked = Boolean(false),
        collapsed = Boolean(false)
    }) {
        super();

        this._urn = urn;
        this._name = name;
        this._description = description;
        this._connector = connector;
        this._inputs = inputs ? [...inputs] : [];
        this._outputs = outputs ? [...outputs] : [];
        this._children = children ? [...children] : [];
        this._bindings = bindings;

        this._author = author;
        this._createdDate = createdDate;
        this._modifiedDate = modifiedDate;
        this._expectedDuration = expectedDuration;
        this._lockedBy = lockedBy;
        this._isLocked = isLocked;
        this._collapsed = collapsed;


        // The below has not been looked at.
        for (const child of this._children) {
            if (child.annotations) {
                const annotations = new Map();
                for (const annotation in child.annotations) {
                    annotations.set(annotation, child.annotations[annotation]);
                }
                child.annotations = annotations;
            }
        }
    }


    get urn() {
        return this._urn;
    }

    set urn(urn) {
        if (!Validation.isValidUrn(this._urn)) {
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


    get expectedDuration() {
        return this._expectedDuration;
    }

    set expectedDuration(value) {
        this._expectedDuration = value;
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

    removeInput(identity) {
        const extantInputs = this.inputs.filter((extantInput) => {
            return extantInput.identity !== identity;
        });
        this._inputs = extantInputs;
    }

    addInput(input) {
        if (this._hasInput(input.identity)) {
            this.removeInput(input.identity);
        }
        this._inputs.push(input);
    }

    _hasInput(identity) {
        const extantIdentities = this.inputs.map((input) => {
            return input.identity;
        });
        return extantIdentities.includes(identity);
    }


    set outputs(value) {
        this._outputs = value;
    }

    get outputs() {
        return [...this._outputs];
    }

    removeOutput(identity) {
        const extantOutputs = this.outputs.filter((extantOutput) => {
            return extantOutput.identity !== identity;
        });
        this._outputs = extantOutputs;
    }

    addOutput(output) {
        if (this._hasOutput(output.identity)) {
            this.removeOutput(output.identity);
        }
        this._outputs.push(output);
    }

    _hasOutput(identity) {
        const extantIdentities = this.outputs.map((output) => {
            return output.identity;
        });
        return extantIdentities.includes(identity);
    }


    get dependencySlot() {
        return this._dependencySlot;
    }

    set dependencySlot(value) {
        this._dependencySlot = value;
    }

    equalArrays(a, b) {
        a.every((item) => {
            return b.includes(item);
        }) && b.every((item) => {
            return a.includes(item);
        });
    }

    removeBinding(removedBinding) {
        let resultBindings;
        if (removedBinding.to) {
            this.bindings = this.bindings.filter((binding) => {
                resultBindings = (!((binding.from.equals(removedBinding.from) &&
                    (binding.to.equals(removedBinding.to)))));
                return resultBindings;
            });

        } else {
            this.bindings = this.bindings.filter((checkBinding) => {
                resultBindings = (!(checkBinding.from.equals(removedBinding.from)));
                return resultBindings;
            });
        }
    }


    isBound(activityId, activityConnectionType, identity) {
        let isBound = false;
        this.bindings.forEach((binding) => {
            binding.from.forEach((outwardConnection) => {
                if ((outwardConnection.urn === activityId) &&
                    (outwardConnection.property === activityConnectionType) &&   // @TODO urn, id and property --- should be more like activityId, activityConnectionType, identity)
                    (outwardConnection.id === identity)) {
                    isBound = true;
                }
                // else {isBound = false}
            });
        });
        return isBound;
    }


    set children(value) {
        this._children = value;
        if ((this._children.length !== 0) && (this.connector.operator === Activity.OPERATOR.NONE.name)) {
            this.connector.operator = Activity.OPERATOR.AND.name;
        }
    }

    get children() {
        return [...this._children];
    }

    hasChildren() {
        return (this._children.length > 0);
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

    addBinding(value) {
        this._bindings.push(value);
    }

    set execution(type) {
        this.connector.execution = type;
    }

    get execution() {
        return this.connector.execution;
    }

    set operator(type) {
        this.connector.operator = type;
    }

    get operator() {
        return this.connector.operator;
    }

    set returns(type) {
        this.connector.returns = type;
    }

    get returns() {
        return this.connector.returns;
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


    addChild(urn, id = undefined) {  // Add uuidV4 default here
        /**
         * Adds the given Activity as a child to this Activity.
         * If an ID already exists, the child already exists, and this was likely called
         * during creation of a graphical edge for the child of an existing Activity; the call
         * will be ignored and the given ID will be returned.
         * Dispatches an update if ID is undefined.
         *
         * @param {Activity} child Model to add.
         * @param {String} id ID for child, if it exists.
         * @returns {String} uuidV4 string of the child.
         */

        let newId = id;
        if (id === undefined) {   // <-- prob obs now
            newId = uuidV4();
            this._children.push({
                urn,
                id: newId
                //    activity: child   // don't think this is really there.  would be too much to serialize
            });
        }
        if ((this._children.length !== 0) && (this.connector.operator === Activity.OPERATOR.NONE.name)) {
            this.connector.operator = Activity.OPERATOR.AND.name;
        }
        return newId;
    }


    removeChild(childId) {
        for (const index in this._children) {
            if (this._children[index].id === childId) {
                this._children.splice(index, 1);
                break;
            }
        }
        for (const binding of this._bindings) {
            if (binding.from.id === childId || binding.to.id === childId) {
                this.removeBinding(binding);
            }
        }
    }

    /**
     * Sets the name of the child with the given ID to the given name.
     *
     * @param {String} id ID of the child whose name will be set.
     * @param {String} name Name to set to.
     */
    setChildNameXXX(id, name) {
        for (const child of this._children) {
            if (child.id === id) {
                if (child.name !== name) {
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
    setChildDescriptionXXX(id, description) {
        for (const child of this._children) {
            if (child.id === id) {
                if (child.description !== description) {
                    child.description = description;
                }
                break;
            }
        }
    }


    /**
     * Gets the ID, Activity, property name and type of all possible inputs to the child with the given ID.
     * Includes inputs to this Activity and outputs from sequential children preceding the child with the given ID.
     *
     * @param {String} id ID of the child for which to seek inputs.
     * @returns {Array<{id:String,activity:Activity,property:String,type:String}>} Inputs available to the child with the given ID.
     */
    inputsTo(id) {
        const availableInputs = this._inputs.map((input) => {
            return {
                id: `this`,
                activity: this,
                property: input.identity,
                type: input.format
            };
        });

        if (this.connector.execution === Activity.EXECUTION.SEQUENTIAL.name) {
            for (const child of this._children) {
                if (child.id === id) {
                    break;
                }
                if (child.activity) {
                    const child_outputs = child.activity.outputs;

                    for (const child_output of child_outputs) {
                        availableInputs.push({
                            id: child.id,
                            activity: child.activity,
                            property: child_output.identity,
                            type: child_output.format
                        });
                    }
                }
            }
        }

        return availableInputs;
    }


    /**
     * Adds the given binding to the bindings of this Activity.
     * Will remove an existing binding with the same consumer.
     * Dispatches an update.
     *
     * @param {{provider:{id:String,property:String},consumer:{id:String,property:String}}} binding Binding to add.
     */
    // addBinding(binding) {
    //     const existing_binding = this.getBinding(binding.consumer.id, binding.consumer.property);
    //
    //     if (existing_binding !== undefined) {
    //         this._bindings.delete(existing_binding);
    //     }
    //
    //     this._bindings.add(binding);
    // }

    /**
     * Check if a binding exists for the given consumer ID and property.
     *
     * @param {String} consumer_id The ID to seek.
     * @param {String} consumer_property The property to seek.
     * @returns {boolean} Whether or not a binding exists for the given consumer ID and property.
     */
    // hasBinding(consumer_id, consumer_property) {
    //     const binding = this.getBinding(consumer_id, consumer_property);
    //     return binding !== undefined;
    // }

    /**
     * Gets a binding for the given consumer ID and property.
     *
     * @param {String} consumer_id ID of the consumer for the binding to be returned.
     * @param {String} consumer_property Name of the consumer property for the binding to be returned.
     * @returns {{provider:{id:String,property:String},consumer:{id:String,property:String}}|undefined} Binding for the given consumer ID and property, or undefined if none exists.
     */
    // getBinding(consumer_id, consumer_property) {
    //     for (const binding of this._bindings) {
    //         if (consumer_id === binding.to.id &&
    //             consumer_property === binding.to.property) {
    //             return binding;
    //         }
    //     }
    //     return undefined;
    // }

    /**
     * Removes the provided binding from this node.
     *
     * @param {{provider:{id:String,property:String},consumer:{id:String,property:String}}} binding The binding to remove.
     */


    /**
     * Gets the child of this Activity with the given ID.
     *
     * @param {String} id
     * @returns {{id:String,activity:Activity}} Child of this Activity with the given ID.
     */
    getCanonicalNode(id) {
        if (id === `this`) {
            return {
                id: `this`,
                activity: this
            };
        }

        for (const child of this._children) {
            if (child.id === id) {
                return child;
            }
        }

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
            if (!child.annotations || !child.annotations.has(name) || child.annotations.get(name) !== value) {
                if (!child.annotations) {
                    child.annotations = new Map();
                }
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
            if (!child.annotations) {
                return;
            }

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
            if (child.id === id) {
                if (child.iterable == value) {
                    return;
                }
                child.iterable = value;
                return;
            }
        }
    }

    getOrderForId(id) {
        if (this.connector.execution === Activity.EXECUTION.PARALLEL.name) {
            return 0;
        }

        for (let i = 0; i < this._children.length; ++i) {
            if (this._children[i].id === id) {
                return i + 1;
            }
        }

        return 0;
    }


    toJSON() {  // @todo -- make children in a map or something simpler
        const json = {
            urn: this._urn,
            name: this._name,
            expectedDuration: this._expectedDuration,
            description: this._description,
            type: `node.type.plan`,
            connector: {
                execution: this.connector.execution,
                returns: this.connector.returns,
                operator: this.connector.operator
            },
            inputs: [],
            outputs: [],
            children: [],
            bindings: [],
            isLocked: this._isLocked,
            collapsed: this._collapsed
        };


        this._children.forEach((child) => {
            const descriptor = {
                urn: child.urn,
                id: child.id
            };
            if (child.name) {
                descriptor.name = child.name;
            }
            if (child.description) {
                descriptor.description = child.description;
            }

            if (child.annotations && child.annotations.size > 0) {
                descriptor.annotations = {};

                for (const annotation of child.annotations) {
                    descriptor.annotations[annotation[0]] = annotation[1];
                }
            }
            if (child.iterable) {
                descriptor.iterable = true;
            }
            json.children.push(descriptor);
        });

        this._inputs.forEach((input) => {
            json.inputs.push(input);
        });
        this._outputs.forEach((output) => {
            json.outputs.push(output);
        });
        const bindingStack = [];
        this._bindings.forEach((binding) => {
            bindingStack.push(binding.toJSON());
        });
        json.bindings = bindingStack;

        return json;
    }

    static fromJSON(json) {
        if (Array.isArray(json)) {
            const jagList = json.map(function (element) {
                try {
                    Validation.validateJAG(element);
                } catch (e) {
                    throw new Error(`Error fromJSON parsing ${json}: ${e.message}`);  // note to self: if you get an error bringing you here, it might be forgetting the schema.
                }

                const returnValue = new Activity(element);
                return returnValue;
            });
            return jagList;
        } else {
            try {
                Validation.validateJAG(json);
            } catch (e) {
                throw new Error(`Error fromJSON parsing ${json}: ${e.message}`);  // note to self: if you get an error bringing you here, it might be forgetting the schema.
            }
            const bindingStack = [];
            for (const binding of json.bindings) {
                bindingStack.push(Binding.fromJSON(binding));
            }
            json.bindings = bindingStack;

            const returnValue = new Activity(json);
            return returnValue;
            // @TODO: explode the json definition to use the constructor below
            // return new Activity(urn, name, connector, inputs, outputs, children, bindings);
        }
    }


    static getExecutionOptions() {
        const executionOptions = [];
        const execution = Activity.EXECUTION;
        for (const step in execution) {
            executionOptions.push({
                value: execution[step].name,
                text: execution[step].text
            });
        }
        return executionOptions;
    }

    static getReturnsOptions(executionName) {
        const returnsOptions = [];
        const returns = Activity.RETURNS;
        for (const step in returns) {
            if (returns[step].condition.includes(executionName)) {
                returnsOptions.push({
                    value: returns[step].name,
                    text: returns[step].text
                });
            }
        }
        return returnsOptions;
    }

    static getOnFailOptions(executionName) {
        const onfailOptions = [];
        const onfails = Activity.ONFAIL;
        for (const step in onfails) {
            if (onfails[step].condition.includes(executionName)) {
                onfailOptions.push({
                    value: onfails[step].name,
                    text: onfails[step].text
                });
            }
        }
        return onfailOptions;
    }


    static getOperatorOptions(returnName) {
        const operatorOptions = [];
        const operators = Activity.OPERATOR;
        for (const step in operators) {
            if (operators[step].condition.includes(returnName)) {
                operatorOptions.push({
                    value: operators[step].name,
                    text: operators[step].text
                });
            }
        }
        return operatorOptions;
    }

}

Activity.EXECUTION = {
    NONE: {
        name: `node.execution.none`,
        text: `none`,
        description: `No reporting sub-activities`
    },
    PARALLEL: {
        name: `node.execution.parallel`,
        text: `parallel`,
        description: `Sub-activities execute simultaneously`
    },
    SEQUENTIAL:
        {
            name: `node.execution.sequential`,
            text: `sequential`,
            description: `Sub-activities execute in order`
        },
    RETRY: {
        name: `node.execution.retry`,
        text: `sequential w/retry`,
        description: `Recover and retry all if one sub-activity fails`
    },
    LOOP: {
        name: `node.execution.loop`,
        text: `sequential loop`,
        description: `First sub-activity resumes after last finishes`
    },
    OVERLAP: {
        name: `node.execution.overlap`,
        text: `sequential w/overlap`,
        description: `Following sub-activity begins before the previous ends`
    },
    PARALLELX: {
        name: `node.execution.parallelx`,
        text: `parallel subset`,
        description: `Some sub-activities execute simultaneously`
    }
};


Activity.ONFAIL = {
    NONE: {
        name: `node.onfail.none`,
        text: `none`,
        description: `No action on fail notice`,
        condition: [`node.execution.parallel`, `node.execution.sequential`, `node.execution.loop`, `node.execution.overlap`, `node.execution.parallelx`]
    },
    RETRY: {
        name: `node.onfail.retry`,
        text: `repeat this action`,
        description: `Continue to repeat this action`,
        condition: [`node.execution.parallel`, `node.execution.sequential`, `node.execution.loop`, `node.execution.overlap`, `node.execution.parallelx`]
    },
    RESTART: {
        name: `node.onfail.restart`,
        text: `return to beginning`,
        description: `Start over from first step`,
        condition: [`node.execution.sequential`, `node.execution.loop`, `node.execution.overlap`]
    },
    PREVIOUS: {
        name: `node.onfail.previous`,
        text: `return to previous`,
        description: `restart previous action`,
        condition: [`node.execution.sequential`, `node.execution.loop`, `node.execution.overlap`]
    },
    SKIP: {
        name: `node.onfail.skip`,
        text: `skip next`,
        description: `Skip the next action`,
        condition: [`node.execution.sequential`, `node.execution.loop`, `node.execution.overlap`]
    },
    RETURN: {
        name: `node.onfail.return`,
        text: `skip remaining`,
        description: `Skip the remaining actions`,
        condition: [`node.execution.sequential`, `node.execution.loop`, `node.execution.overlap`]
    },
    RECOVER: {
        name: `node.onfail.recover`,
        text: `"Recover"`,
        description: `Run the "Recover" function`,
        condition: [`node.execution.parallel`, `node.execution.sequential`, `node.execution.loop`, `node.execution.overlap`, `node.execution.parallelx`]
    },
    ABORT: {
        name: `node.onfail.abort`,
        text: `"Abort"`,
        description: `Run the "Abort" function`,
        condition: [`node.execution.parallel`, `node.execution.sequential`, `node.execution.loop`, `node.execution.overlap`, `node.execution.parallelx`]
    }

};


Activity.RETURNS = {
    NONE: {
        name: `node.returns.none`,
        text: `none`,
        description: `No data is returned`,
        condition: [`node.execution.parallel`, `node.execution.sequential`, `node.execution.retry`, `node.execution.loop`, `node.execution.overlap`, `node.execution.parallelx`]
    },
    ACTIVE: {
        name: `node.returns.active`,
        text: `active mode`,
        description: `All children in an ACTIVE mode`,
        condition: [`node.execution.parallel`, `node.execution.sequential`, `node.execution.retry`, `node.execution.loop`, `node.execution.overlap`, `node.execution.parallelx`]
    },
    AVAILABLE: {
        name: `node.returns.available`,
        text: `all available`,
        description: `All children with currently available output`,
        condition: [`node.execution.parallel`, `node.execution.sequential`, `node.execution.retry`, `node.execution.loop`, `node.execution.overlap`, `node.execution.parallelx`]
    },
    ALL: {
        name: `node.returns.all`,
        text: `all (or none)`,
        description: `All children data when all become available`,
        condition: [`node.execution.parallel`, `node.execution.parallelx`]
    },
    LATEST: {
        name: `node.returns.latest`,
        text: `most recent`,
        description: `Only data from most recently reporting child`,
        condition: [`node.execution.parallel`, `node.execution.sequential`, `node.execution.retry`, `node.execution.loop`, `node.execution.overlap`]
    },
    PRIORITY: {
        name: `node.returns.priority`,
        text: `highest priority`,
        description: `Child with highest priority available input`,
        condition: [`node.execution.parallel`]
    },
    FINAL: {
        name: `node.returns.final`,
        text: `final output`,
        description: `Final result from last child in sequence`,
        condition: [`node.execution.sequential`, `node.execution.retry`, `node.execution.loop`, `node.execution.overlap`]
    }
};


Activity.OPERATOR = {
    NONE: {
        name: `node.operator.none`,                  // does not return a value    (maybe just a state?) (maybe nada)
        text: `none`,
        symbol: ``,
        condition: [`node.returns.active`, `node.returns.available`, `node.returns.all`, `node.returns.latest`, `node.returns.priority`, `node.returns.final`]
    },
    AND: {
        name: `node.operator.and`,                    // AND(boolean,boolean,...)
        text: `and`,
        symbol: `and`,
        condition: [`node.returns.active`, `node.returns.available`, `node.returns.all`]
    },
    OR: {
        name: `node.operator.or`,                      // OR(boolean,boolean,...)        @TODO  XOR?!    NAND NOR
        text: `or`,
        symbol: `or`,
        condition: [`node.returns.active`, `node.returns.available`, `node.returns.all`]
    },
    FIRST: {
        name: `node.operator.first`,
        text: `first reporting`,
        symbol: `1st`,
        condition: [`node.returns.active`, `node.returns.available`, `node.returns.all`]
    },
    LAST: {
        name: `node.operator.last`,
        text: `last reporting`,
        symbol: `nth`,
        condition: [`node.returns.active`, `node.returns.available`, `node.returns.all`]
    },
    MAX: {
        name: `node.operator.max`,
        text: `largest`,
        symbol: `max`,
        condition: [`node.returns.active`, `node.returns.available`, `node.returns.all`]
    },
    MIN: {
        name: `node.operator.min`,
        text: `smallest`,
        symbol: `min`,
        condition: [`node.returns.active`, `node.returns.available`, `node.returns.all`]
    },
    SUM: {
        name: `node.operator.sum`,
        text: `sum`,
        symbol: `sum`,
        condition: [`node.returns.active`, `node.returns.available`, `node.returns.all`]
    },
    AVG: {
        name: `node.operator.avg`,
        text: `average`,
        symbol: `avg`,
        condition: [`node.returns.active`, `node.returns.available`, `node.returns.all`]
    },
    UNION: {
        name: `node.operator.union`,
        text: `union`,
        symbol: `U`,
        condition: [`node.returns.active`, `node.returns.available`, `node.returns.all`]
    },
    INT: {
        name: `node.operator.intersection`,
        text: `intersection`,
        symbol: `\uD83D\uDE00`,
        condition: [`node.returns.active`, `node.returns.available`, `node.returns.all`]
    },
    CONVERT: {
        name: `node.operator.convert`,
        text: `convert`,
        symbol: `><`,
        condition: [`node.returns.active`, `node.returns.latest`, `node.returns.priority`, `node.returns.final`]
    },
    INVERSE: {
        name: `node.operator.inverse`,
        text: `inverse`,
        symbol: `1/x`,
        condition: [`node.returns.active`, `node.returns.latest`, `node.returns.priority`, `node.returns.final`]
    },
    NEGATE: {
        name: `node.operator.negate`,
        text: `negate`,
        symbol: `-x`,
        condition: [`node.returns.active`, `node.returns.latest`, `node.returns.priority`, `node.returns.final`]
    },
    ABS: {
        name: `node.operator.absolute`,
        text: `absolute`,
        symbol: `|x|`,
        condition: [`node.returns.active`, `node.returns.latest`, `node.returns.priority`, `node.returns.final`]
    },
    NOT: {
        name: `node.operator.not`,
        text: `not`,
        symbol: `!`,
        condition: [`node.returns.active`, `node.returns.latest`, `node.returns.priority`, `node.returns.final`]
    }

};

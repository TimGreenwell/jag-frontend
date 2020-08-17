/**
 * @file Validator for JAGAT models.
 *
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.02
 */

export default class JAGATValidation {
    static validateJAG(json) {
		const {
			'urn': urn,
			'name': name,
			'connector': connector,
			'description': description,
			'inputs': inputs,
			'outputs': outputs,
			'children': children,
			'bindings': bindings,
        } = json;
        
        if (!urn)
            throw new Error(`Must have a URN string of valid format.`);

        if (typeof urn !== "string")
            throw new Error(`URN must be a string of valid format.`);

        if (urn.match(/^[a-z0-9:-]+$/) == null)
            throw new Error('URN must be a valid format.');

        if (!name)
            throw new Error(`Must have a name string.`);

        if (typeof name !== "string")
            throw new Error(`Name must be a string.`);

        if (name.length == 0)
            throw new Error(`Name must be at least 1 character.`);

        if (description !== undefined)
            if (typeof description !== "string")
                throw new Error(`Description must be a string.`);

        if (connector !== undefined)
        {
            if (connector.execution == undefined)
                throw new Error(`Connector must have execution and operator types.`);

            if (typeof connector.execution !== "string")
                throw new Error(`Connector must have an execution type which is a string.`);

            if (connector.execution.length == 0)
                throw new Error(`Connector execution type must be at least 1 character.`);

            if (connector.operator == undefined)
                throw new Error(`Connector must have operator type.`);

            if (typeof connector.operator !== "string")
                throw new Error(`Connector must have an operator type which is a string.`);

            if (connector.operator.length == 0)
                throw new Error(`Connector execution type must be at least 1 character.`);

            if (Object.keys(connector).length !== 2)
                throw new Error(`Connector contains unknown properties: only accepts execution and operator types.`);
        }

        if (inputs !== undefined) {

            if (!(inputs instanceof Array))
                throw new Error(`Expected inputs to be an array of objects.`);

            for (let i = 0; i < inputs.length; ++i) {
                const input = inputs[i];

                if (input == undefined)
                    throw new Error(`Input ${i} must be an object with name and type strings.`);

                if (input.name == undefined)
                    throw new Error(`Input ${i} does not have a name.`);

                if (typeof input.name !== "string")
                    throw new Error(`Input ${i} must have a name which is a string.`);

                if (input.name.length == 0)
                    throw new Error(`Input ${i} must have a name at least 1 character long.`);

                if (input.type == undefined)
                    throw new Error(`Input ${i} (${input.name}) does not have a type.`);

                if (typeof input.type !== "string")
                    throw new Error(`Input ${i} (${input.name}) must have a type which is a string.`);

                if (input.type.length == 0)
                    throw new Error(`Input ${i} (${input.name}) must have a type at least 1 character long.`);

                if (Object.keys(input).length !== 2)
                    throw new Error(`Input ${i} (${input.name}) contains unknown properties: only accepts name and type strings.`);
            }

        }

        if (outputs !== undefined) {

            if (!(outputs instanceof Array))
                throw new Error(`Expected outputs to be an array of objects.`);

            for (let i = 0; i < outputs.length; ++i) {
                const output = outputs[i];

                if (output == undefined)
                    throw new Error(`Output ${i} must be an object with name and type strings.`);

                if (output.name == undefined)
                    throw new Error(`Output ${i} does not have a name.`);

                if (typeof output.name !== "string")
                    throw new Error(`Output ${i} must have a name which is a string.`);

                if (output.name.length == 0)
                    throw new Error(`Output ${i} must have a name at least 1 character long.`);

                if (output.type == undefined)
                    throw new Error(`Output ${i} (${output.name}) does not have a type.`);

                if (typeof output.type !== "string")
                    throw new Error(`Output ${i} (${output.name}) must have a type which is a string.`);

                if (output.type.length == 0)
                    throw new Error(`Output ${i} (${output.name}) must have a type at least 1 character long.`);

                if (Object.keys(output).length !== 2)
                    throw new Error(`Output ${i} (${output.name}) contains unknown properties: only accepts name and type strings.`);
            }

        }

        if (children !== undefined) {

            if (!(children instanceof Array))
                throw new Error(`Expected children to be an array of objects.`);

            for (let i = 0; i < children.length; ++i) {
                const child = children[i];

                if (child == undefined)
                    throw new Error(`Child ${i} must be an object with URN, UUID, and optional contextual name and description strings.`);

                if (child.urn == undefined)
                    throw new Error(`Child ${i} must have a URN string.`);

                if (typeof child.urn !== "string")
                    throw new Error(`Child ${i} must have a URN which is a string.`);

                if (child.urn.length == 0)
                    throw new Error(`Child ${i} must have a URN string with at least 1 character.`);

                if (child.id == undefined)
                    throw new Error(`Child ${i} does not have a UUID specified.`);

                if (typeof child.id !== "string")
                    throw new Error(`Child ${i} must have a UUID which is a string.`);

                if (!child.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/))
                    throw new Error(`Child ${i} must have an id which is a v4 UUID conforming string.`);

                let opt_params = 0;

                if (child.iterable !== undefined) {
                    if (typeof child.iterable !== "boolean")
                        throw new Error(`Child ${i} iterable property must be a boolean.`);

                    opt_params++;
                }

                if (child.annotations !== undefined) {
                    if (child.annotations.constructor != Object)
                        throw new Error(`Child ${i} may only have an annotations which is an object.`);

                    opt_params++;
                }

                if (child.name !== undefined) {
                    if (typeof child.name !== "string")
                        throw new Error(`Child ${i} may only have a name which is a string.`);

                    if (child.name.length == 0)
                        throw new Error(`Child ${i} may only have a name string with at least 1 character.`);

                    opt_params++;
                }

                if (child.description !== undefined) {
                    if (typeof child.description !== "string")
                        throw new Error(`Child ${i} may only have a description which is a string.`);

                    if (child.description.length == 0)
                        throw new Error(`Child ${i} may only have a description string with at least 1 character.`);

                    opt_params++;
                }

                if (Object.keys(child).length !== 2 + opt_params)
                    throw new Error(`Child ${i} contains unknown properties: only accepts URN, UUID, optional annotations, and optional contextual name and description strings.`);
            }

        }

        if (bindings !== undefined) {

            if (!(bindings instanceof Array))
                throw new Error(`Expected bindings to be an array of objects.`);

            for (let i = 0; i < bindings.length; ++i) {
                const binding = bindings[i];

                if (binding == undefined)
                    throw new Error(`Binding ${i} must be an object with provider and consumer ID and property strings.`);

                if (binding.consumer == undefined)
                    throw new Error(`Binding ${i} must have a consumer with ID and property strings.`);

                if (binding.consumer.id == undefined)
                    throw new Error(`Binding ${i} must have a ID string for its consumer.`);

                if (typeof binding.consumer.id !== "string")
                    throw new Error(`Binding ${i} must have a ID for its consumer which is a string.`);

                if (!binding.consumer.id.match(/^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|any|this)$/))
                    throw new Error(`Binding ${i} must have an id for its consumer which is a v4 UUID conforming string, "any" or "this".`);

                if (binding.consumer.property == undefined)
                    throw new Error(`Binding ${i} must have a property string for its consumer.`);

                if (typeof binding.consumer.property !== "string")
                    throw new Error(`Binding ${i} must have a property for its consumer which is a string.`);

                if (binding.consumer.property.length == 0)
                    throw new Error(`Binding ${i} must have a property string for its consumer which is at least 1 character.`);

                if (Object.keys(binding.consumer).length !== 2)
                    throw new Error(`Binding ${i} has a consumer with unknown properties: only accepts ID and property strings.`);

                if (binding.provider == undefined)
                    throw new Error(`Binding ${i} must have a provider with ID and property strings.`);

                if (binding.provider.id == undefined)
                    throw new Error(`Binding ${i} must have a ID string for its provider.`);

                if (typeof binding.provider.id !== "string")
                    throw new Error(`Binding ${i} must have a ID for its provider which is a string.`);

                if (!binding.provider.id.match(/^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|any|this)$/))
                    throw new Error(`Binding ${i} must have an id for its provider which is a v4 UUID conforming string, "any" or "this".`);

                if (binding.provider.property == undefined)
                    throw new Error(`Binding ${i} must have a property string for its provider.`);

                if (typeof binding.provider.property !== "string")
                    throw new Error(`Binding ${i} must have a property for its provider which is a string.`);

                if (binding.provider.property.length == 0)
                    throw new Error(`Binding ${i} must have a property string for its provider which is at least 1 character.`);

                if (Object.keys(binding.provider).length !== 2)
                    throw new Error(`Binding ${i} has a provider with unknown properties: only accepts ID and property strings.`);

                if (Object.keys(binding).length !== 2)
                    throw new Error(`Binding ${i} has unknown properties: only accepts provider and consumer with ID and property strings.`);
            }
        }
    }
};
/**
 * @file Test creating new JAG model.
 *
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.54
 */
import '/scripts/mocha.js';
import JAG from '/src-scripts/models/jag.js';
import { UUIDv4 } from '/src-scripts/utils/uuid.js';

function validJAG({ description = undefined, inputs = undefined, outputs = undefined, children = undefined, bindings = undefined } = {}) {
    let valid_jag = {
        'urn': 'urn:ihmc:jagat:test:valid-jag',
        'name': 'Valid',
        'connector': {
            'execution': JAG.EXECUTION.NONE,
            'operator': JAG.OPERATOR.NONE
        }
    };

    if (description)
        valid_jag['description'] = description;

    if (inputs)
        valid_jag['inputs'] = inputs;

    if (outputs)
        valid_jag['outputs'] = outputs;

    if (children)
        valid_jag['children'] = children;

    if (bindings)
        valid_jag['bindings'] = bindings;

    return valid_jag;
}

function validChild(name, description) {
    let valid_child = {
        urn: 'urn:ihmc:jagat:test:valid-child',
        id: UUIDv4()
    };

    if (name)
        valid_child.name = name;

    if (description)
        valid_child.description = description;

    return valid_child;
}

function validInput() {
    return {
        name: 'valid-input',
        type: 'valid-input-type'
    };
}

function validOutput() {
    return {
        name: 'valid-output',
        type: 'valid-output-type'
    };
}

function validBinding() {
    return {
        consumer: {
            id: UUIDv4(),
            property: 'consumer-property'
        },
        provider: {
            id: UUIDv4(),
            property: 'provider-property'
        }
    };
}

suite('Create a new JAG model', () => {

    suite('Successfully create a proper JAG', () => {
        test('Create a proper JAG with only required properties', () => {
            JAG.fromJSON(validJAG());
        });

        test('Create a proper JAG with a description', () => {
            JAG.fromJSON(validJAG(
                {
                    description: 'A valid JAG.'
                }
            ));
        });

        test('Create a proper JAG with empty inputs', () => {
            JAG.fromJSON(validJAG(
                {
                    inputs: []
                }
            ));
        });

        test('Create a proper JAG with an input', () => {
            JAG.fromJSON(validJAG(
                {
                    inputs: [
                        validInput()
                    ]
                }
            ));
        });

        test('Create a proper JAG with multiple inputs', () => {
            JAG.fromJSON(validJAG(
                {
                    inputs: [
                        validInput(),
                        validInput()
                    ]
                }
            ));
        });

        test('Create a proper JAG with empty outputs', () => {
            JAG.fromJSON(validJAG(
                {
                    outputs: []
                }
            ));
        });

        test('Create a proper JAG with an output', () => {
            JAG.fromJSON(validJAG(
                {
                    outputs: [
                        validOutput()
                    ]
                }
            ));
        });

        test('Create a proper JAG with multiple outputs', () => {
            JAG.fromJSON(validJAG(
                {
                    inputs: [
                        validOutput(),
                        validOutput()
                    ]
                }
            ));
        });

        test('Create a proper JAG with empty children', () => {
            JAG.fromJSON(validJAG(
                {
                    children: []
                }
            ));
        });

        test('Create a proper JAG with a child', () => {
            JAG.fromJSON(validJAG(
                {
                    children: [
                        validChild()
                    ]
                }
            ));
        });

        test('Create a proper JAG with a child with optional name', () => {
            JAG.fromJSON(validJAG(
                {
                    children: [
                        validChild('Contextual Name')
                    ]
                }
            ));
        });

        test('Create a proper JAG with a child with optional description', () => {
            JAG.fromJSON(validJAG(
                {
                    children: [
                        validChild(undefined, 'Contextual Description')
                    ]
                }
            ));
        });

        test('Create a proper JAG with multiple children', () => {
            JAG.fromJSON(validJAG(
                {
                    children: [
                        validChild(),
                        validChild()
                    ]
                }
            ));
        });

        test('Create a proper JAG with empty bindings', () => {
            JAG.fromJSON(validJAG(
                {
                    bindings: []
                }
            ));
        });

        test('Create a proper JAG with a binding', () => {
            JAG.fromJSON(validJAG(
                {
                    bindings: [
                        validBinding()
                    ]
                }
            ));
        });

        test('Create a proper JAG with multiple bindings', () => {
            JAG.fromJSON(validJAG(
                {
                    bindings: [
                        validBinding(),
                        validBinding()
                    ]
                }
            ));
        });
    });

	suite('Fail to create a JAG with improper URN', () => {
        const jag = validJAG();

        test('Create a JAG with no URN', () => {
            try {
                delete jag['urn'];

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with no URN.');
        });

        test('Create a JAG with a non-string URN', () => {
            try {
                jag['urn'] = 0;

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a non-string URN.');
        });

        test('Create a JAG with an empty URN', () => {
            try {
                jag['urn'] = '';

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an empty URN.');
        });

        test('Create a JAG with an invalid URN', () => {
            try {
                jag['urn'] = 'invalid_urn';

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an invalid URN.');
        });
    });

    suite('Fail to create a JAG with improper name', () => {
        const jag = validJAG();

        test('Create a JAG with no name', () => {
            try {
                delete jag['name'];

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with no name.');
        });

        test('Create a JAG with a non-string name', () => {
            try {
                jag['name'] = 0;

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a non-string name.');
        });

        test('Create a JAG with an empty name', () => {
            try {
                jag['name'] = '';

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an empty name.');
        });
    });

    suite('Fail to create a JAG with improper description', () => {
        const jag = validJAG();

        test('Create a JAG with a non-string description', () => {
            try {
                jag['description'] = 0;

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a non-string description.');
        });

    });

    suite('Fail to create a JAG with improper connector', () => {
        const jag = validJAG();

        test('Create a JAG with no connector', () => {
            try {
                delete jag['connector'];

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with no connector.');
        });

        test('Create a JAG with a non-object connector', () => {
            try {
                jag.connector = 0;

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a non-object connector.');
        });

        test('Create a JAG with an empty connector', () => {
            try {
                jag.connector = {};

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an empty connector.');
        });

        test('Create a JAG with a connector with an extra property', () => {
            try {
                jag.connector = {
                    execution: JAG.EXECUTION.NONE,
                    operator: JAG.OPERATOR.NONE,
                    foo: 'bar'
                };

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a connector with an extra property.');
        });

        test('Create a JAG with a connector with no execution', () => {
            try {
                jag.connector = {
                    operator: JAG.OPERATOR.NONE
                };

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a connector with no execution.');
        });

        test('Create a JAG with a connector with a non-string execution', () => {
            try {
                jag.connector = {
                    execution: 0,
                    operator: JAG.OPERATOR.NONE
                };

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a connector with a non-string execution.');
        });

        test('Create a JAG with a connector with an empty execution', () => {
            try {
                jag.connector = {
                    execution: '',
                    operator: JAG.OPERATOR.NONE
                };

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a connector with an empty execution.');
        });

        test('Create a JAG with a connector with no operator', () => {
            try {
                jag.connector = {
                    execution: JAG.OPERATOR.NONE
                };

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a connector with no operator.');
        });

        test('Create a JAG with a connector with a non-string operator', () => {
            try {
                jag.connector = {
                    execution: JAG.OPERATOR.NONE,
                    operator: 0
                };

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a connector with a non-string operator.');
        });

        test('Create a JAG with a connector with an empty operator', () => {
            try {
                jag.connector = {
                    execution: JAG.OPERATOR.NONE,
                    operator: ''
                };

                JAG.fromJSON(jag);
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a connector with an empty operator.');
        });

    });

    suite('Fail to create a JAG with improper inputs', () => {

        const input = validInput();

        const input_name = validInput();
        const input_type = validInput();

        test('Create a JAG with a non-array inputs', () => {
            try {
                JAG.fromJSON(validJAG(
                    {
                        inputs: {

                        }
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a non-array inputs.');
        });

        test('Create a JAG with a non-object input', () => {
            try {
                JAG.fromJSON(validJAG(
                    {
                        inputs: [
                            0
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a non-object input.');
        });

        test('Create a JAG with an empty input', () => {
            try {
                JAG.fromJSON(validJAG(
                    {
                        inputs: [
                            {}
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an empty input.');
        });

        test('Create a JAG with an input with an extra property', () => {
            try {
                input.foo = 'bar';

                JAG.fromJSON(validJAG(
                    {
                        inputs: [
                            input
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an input with an extra property.');
        });

        test('Create a JAG with an input with no name', () => {
            try {
                delete input_name.name;

                JAG.fromJSON(validJAG(
                    {
                        inputs: [
                            input_name
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an input with no name.');
        });

        test('Create a JAG with an input with a non-string name', () => {
            try {
                input_name.name = 0;

                JAG.fromJSON(validJAG(
                    {
                        inputs: [
                            input_name
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an input with a non-string name.');
        });

        test('Create a JAG with an input with an empty name', () => {
            try {
                input_name.name = '';

                JAG.fromJSON(validJAG(
                    {
                        inputs: [
                            input_name
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an input with an empty name.');
        });

        test('Create a JAG with an input with no type', () => {
            try {
                delete input_type.type;

                JAG.fromJSON(validJAG(
                    {
                        inputs: [
                            input_type
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an input with no type.');
        });

        test('Create a JAG with an input with a non-string type', () => {
            try {
                input_type.type = 0;

                JAG.fromJSON(validJAG(
                    {
                        inputs: [
                            input_type
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an input with a non-string type.');
        });

        test('Create a JAG with an input with an empty type', () => {
            try {
                input_type.type = '';

                JAG.fromJSON(validJAG(
                    {
                        inputs: [
                            input_type
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an input with an empty type.');
        });

    });

    suite('Fail to create a JAG with improper outputs', () => {

        const output = validOutput();

        const output_name = validOutput();
        const output_type = validOutput();

        test('Create a JAG with a non-array outputs', () => {
            try {
                JAG.fromJSON(validJAG(
                    {
                        outputs: {

                        }
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a non-array outputs.');
        });

        test('Create a JAG with a non-object output', () => {
            try {
                JAG.fromJSON(validJAG(
                    {
                        outputs: [
                            0
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a non-object output.');
        });

        test('Create a JAG with an empty output', () => {
            try {
                JAG.fromJSON(validJAG(
                    {
                        outputs: [
                            {}
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an empty output.');
        });

        test('Create a JAG with an output with an extra property', () => {
            try {
                output.foo = 'bar';

                JAG.fromJSON(validJAG(
                    {
                        outputs: [
                            output
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an output with an extra property.');
        });

        test('Create a JAG with an output with no name', () => {
            try {
                delete output_name.name;

                JAG.fromJSON(validJAG(
                    {
                        outputs: [
                            output_name
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an output with no name.');
        });

        test('Create a JAG with an output with a non-string name', () => {
            try {
                output_name.name = 0;

                JAG.fromJSON(validJAG(
                    {
                        outputs: [
                            output_name
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an output with a non-string name.');
        });

        test('Create a JAG with an output with an empty name', () => {
            try {
                output_name.name = '';

                JAG.fromJSON(validJAG(
                    {
                        outputs: [
                            output_name
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an output with an empty name.');
        });

        test('Create a JAG with an output with no type', () => {
            try {
                delete output_type.type;

                JAG.fromJSON(validJAG(
                    {
                        outputs: [
                            output_type
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an output with no type.');
        });

        test('Create a JAG with an output with a non-string type', () => {
            try {
                output_type.type = 0;

                JAG.fromJSON(validJAG(
                    {
                        inputs: [
                            output_type
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an output with a non-string type.');
        });

        test('Create a JAG with an output with an empty type', () => {
            try {
                output_type.type = '';

                JAG.fromJSON(validJAG(
                    {
                        outputs: [
                            output_type
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an output with an empty type.');
        });

    });

    suite('Fail to create a JAG with improper children', () => {

        const child = validChild();

        const child_urn = validChild();
        const child_id = validChild();
        const child_name = validChild();
        const child_desc = validChild();

        test('Create a JAG with non-array children', () => {
            try {
                JAG.fromJSON(validJAG(
                    {
                        children: {}
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with non-array children.');
        });

        test('Create a JAG with non-object child', () => {
            try {
                JAG.fromJSON(validJAG(
                    {
                        children: [ 0 ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with non-object child.');
        });

        test('Create a JAG with an empty child', () => {
            try {
                JAG.fromJSON(validJAG(
                    {
                        children: [ {} ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with an empty child.');
        });

        test('Create a JAG with a child with an extra property', () => {
            try {
                child.foo = 'bar';

                JAG.fromJSON(validJAG(
                    {
                        children: [
                            child
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a child with an extra property.');
        });

        test('Create a JAG with a child with no URN', () => {
            try {
                delete child_urn.urn;

                JAG.fromJSON(validJAG(
                    {
                        children: [
                            child_urn
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a child with no URN.');
        });

        test('Create a JAG with a child with non-string URN', () => {
            try {
                child_urn.urn = 0;

                JAG.fromJSON(validJAG(
                    {
                        children: [
                            child_urn
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a child with non-string URN.');
        });

        test('Create a JAG with a child with an empty URN', () => {
            try {
                child_urn.urn = '';

                JAG.fromJSON(validJAG(
                    {
                        children: [
                            child_urn
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a child with an empty URN.');
        });

        test('Create a JAG with a child with no UUID', () => {
            try {
                delete child_id.id;

                JAG.fromJSON(validJAG(
                    {
                        children: [
                            child_id
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a child with no UUID.');
        });

        test('Create a JAG with a child with non-string UUID', () => {
            try {
                child_id.id = 0;

                JAG.fromJSON(validJAG(
                    {
                        children: [
                            child_id
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a child with non-string UUID.');
        });

        test('Create a JAG with a child with an empty UUID', () => {
            try {
                child_id.id = '';

                JAG.fromJSON(validJAG(
                    {
                        children: [
                            child_id
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a child with an empty UUID.');
        });

        test('Create a JAG with a child with an invalid UUID', () => {
            try {
                let invalid_uuid = UUIDv4();
                invalid_uuid = invalid_uuid.substring(0, 35);
                invalid_uuid += 'z';

                child_id.id = invalid_uuid;

                JAG.fromJSON(validJAG(
                    {
                        children: [
                            child_id
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a child with an invalid UUID.');
        });

        test('Create a JAG with a child with a non-string name', () => {
            try {
                child_name.name = 0;

                JAG.fromJSON(validJAG(
                    {
                        children: [
                            child_name
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a child with a non-string name.');
        });

        test('Create a JAG with a child with an empty name', () => {
            try {
                child_name.name = '';

                JAG.fromJSON(validJAG(
                    {
                        children: [
                            child_name
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a child with an empty name.');
        });

        test('Create a JAG with a child with a non-string description', () => {
            try {
                child_desc.description = 0;

                JAG.fromJSON(validJAG(
                    {
                        children: [
                            child_desc
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a child with a non-string description.');
        });

        test('Create a JAG with a child with an empty description', () => {
            try {
                child_desc.description = '';

                JAG.fromJSON(validJAG(
                    {
                        children: [
                            child_desc
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a child with an empty description.');
        });

    });

    suite('Fail to create a JAG with improper bindings', () => {

        const binding = validBinding();

        const binding_consumer = validBinding();
        const binding_consumer_name = validBinding();
        const binding_consumer_id = validBinding();

        const binding_provider = validBinding();
        const binding_provider_name = validBinding();
        const binding_provider_id = validBinding();

        test('Create a JAG with non-array bindings', () => {
            try {
                JAG.fromJSON(validJAG(
                    {
                        bindings: {}
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with non-array bindings.');
        });

        test('Create a JAG with non-object binding', () => {
            try {
                JAG.fromJSON(validJAG(
                    {
                        bindings: [ 0 ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with non-object binding.');
        });

        test('Create a JAG with a binding with an extra property', () => {
            try {
                binding.foo = 'bar';

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with an extra property.');
        });

        test('Create a JAG with a binding with a consumer with an extra property', () => {
            try {
                binding_consumer.consumer.foo = 'bar';

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_consumer
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with a consumer with an extra property.');
        });

        test('Create a JAG with a binding with no consumer', () => {
            try {
                delete binding_consumer.consumer;

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_consumer
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with no consumer.');
        });

        test('Create a JAG with a binding with non-object consumer', () => {
            try {
                binding_consumer.consumer = 0;

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_consumer
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with non-object consumer.');
        });

        test('Create a JAG with a binding with a consumer with no property', () => {
            try {
                delete binding_consumer_name.consumer.property;

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_consumer_name
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with a consumer with no property.');
        });

        test('Create a JAG with a binding with a consumer with non-string property', () => {
            try {
                binding_consumer_name.consumer.property = 0;

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_consumer_name
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with a consumer with non-string property.');
        });

        test('Create a JAG with a binding with a consumer with an empty property', () => {
            try {
                binding_consumer_name.consumer.property = '';

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_consumer_name
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with a consumer with an empty property.');
        });

        test('Create a JAG with a binding with a consumer with no id', () => {
            try {
                delete binding_consumer_id.consumer.id;

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_consumer_id
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with a consumer with no id.');
        });

        test('Create a JAG with a binding with a consumer with non-string id', () => {
            try {
                binding_consumer_id.consumer.id = 0;

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_consumer_id
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with a consumer with non-string id.');
        });

        test('Create a JAG with a binding with a consumer with an empty id', () => {
            try {
                binding_consumer_id.consumer.id = '';

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_consumer_id
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with a consumer with an empty id.');
        });

        test('Create a JAG with a binding with a consumer with an invalid id', () => {
            try {
                let invalid_uuid = UUIDv4();
                invalid_uuid = invalid_uuid.substring(0, 35);
                invalid_uuid += 'z';

                binding_consumer_id.consumer.id = invalid_uuid;

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_consumer_id
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with a consumer with an invalid id.');
        });

        test('Create a JAG with a binding with a provider with an extra property', () => {
            try {
                binding_provider.provider.foo = 'bar';

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_provider
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with a provider with an extra property.');
        });

        test('Create a JAG with a binding with no provider', () => {
            try {
                delete binding_provider.provider;

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_provider
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with no provider.');
        });

        test('Create a JAG with a binding with non-object provider', () => {
            try {
                binding_provider.provider = 0;

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_provider
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with non-object provider.');
        });

        test('Create a JAG with a binding with a provider with no property', () => {
            try {
                delete binding_provider_name.provider.property;

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_provider_name
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with a provider with no property.');
        });

        test('Create a JAG with a binding with a provider with non-string property', () => {
            try {
                binding_provider_name.provider.property = 0;

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_provider_name
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with a provider with non-string property.');
        });

        test('Create a JAG with a binding with a provider with an empty property', () => {
            try {
                binding_provider_name.provider.property = '';

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_provider_name
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with a provider with an empty property.');
        });

        test('Create a JAG with a binding with a provider with no id', () => {
            try {
                delete binding_provider_id.provider.id;

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_provider_id
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with a provider with no id.');
        });

        test('Create a JAG with a binding with a provider with non-string id', () => {
            try {
                binding_provider_id.provider.id = 0;

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_provider_id
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with a provider with non-string id.');
        });

        test('Create a JAG with a binding with a provider with an empty id', () => {
            try {
                binding_provider_id.provider.id = '';

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_provider_id
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with a provider with an empty id.');
        });

        test('Create a JAG with a binding with a provider with an invalid id', () => {
            try {
                let invalid_uuid = UUIDv4();
                invalid_uuid = invalid_uuid.substring(0, 35);
                invalid_uuid += 'z';

                binding_provider_id.provider.id = invalid_uuid;

                JAG.fromJSON(validJAG(
                    {
                        bindings: [
                            binding_provider_id
                        ]
                    }
                ));
            } catch {
                // Success; should have thrown error

                return;
            }

            throw new Error('Should fail to create JAG with a binding with a provider with an invalid id.');
        });

    });
});


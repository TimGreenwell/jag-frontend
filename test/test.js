const assert = require('assert');
import JAG from '../public/js/models/jag.js';

describe('JAG Model', function () {
    const jag_description = {
        urn: "test-jag",
        name: "Test JAG",
        connector: {
            execution: JAG.EXECUTION.NONE,
            operator: JAG.OPERATOR.NONE
        },
        description: "A JAG for testing."
    };

    const child_description = {
        urn: "test-child",
        name: "Test Child",
        connector: {
            execution: JAG.EXECUTION.NONE,
            operator: JAG.OPERATOR.NONE
        },
        description: "A child JAG for testing."
    };

    const sibling_description = {
        urn: "test-sibling",
        name: "Test Sibling",
        connector: {
            execution: JAG.EXECUTION.NONE,
            operator: JAG.OPERATOR.NONE
        },
        description: "A sibling JAG for testing."
    };

    describe('#JAG()', function () {
        let jag;

        before(function () {
            jag = new JAG(jag_description);
        });

        it('should initialize a JAG model', function () {
            assert(jag.urn == "test-jag");
            assert(jag.name == "Test JAG");
            assert(jag.execution == JAG.EXECUTION.NONE);
            assert(jag.operator == JAG.OPERATOR.NONE);
            assert(jag.description == "A JAG for testing.");
        });
    });

    describe('#addChild()', function () {
        let jag;

        before(function () {
            jag = new JAG(jag_description);
        });

        it('should add a single child', function () {
            const child = new JAG(child_description);
    
            jag.addChild(child);
    
            const children = jag.children;
    
            assert(children.length == 1);
            assert(children[0].urn == child.urn);
            assert(children[0].model == child);
        });
    });
});
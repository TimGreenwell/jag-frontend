import JAG from '../js/models/jag.js';

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
            chai.expect(jag.urn).to.equal("test-jag");
            chai.expect(jag.name).to.equal("Test JAG");
            chai.expect(jag.execution).to.equal(JAG.EXECUTION.NONE);
            chai.expect(jag.operator).to.equal(JAG.OPERATOR.NONE);
            chai.expect(jag.description).to.equal("A JAG for testing.");
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
    
            chai.expect(children).to.have.lengthOf(1);
            chai.expect(children[0].urn).to.equal(child.urn);
            chai.expect(children[0].model).to.equal(child);
        });
    });
});
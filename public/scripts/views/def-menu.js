/**
 * @file Configuration/settings menu for Authoring Tool.
 *
 * @author cwilber
 * @copyright Copyright © 2021 IHMC, all rights reserved.
 * @version 0.23
 */

import FormUtils from "../utils/forms.js";
import Activity from "../models/activity.js";

customElements.define('def-menu', class extends HTMLElement {

    constructor() {
        super();
        this.$leftLiDiv = null;
        this.$rightLiDiv = null;
        this._initUI();
    }

    _createMenuItem(id, img, text) {
        const $el = document.createElement("span");
        $el.id = `def-menu-${id}`;
        $el.classList.add("menu-item");

        if (img) {
            const $img = document.createElement("img");
            $img.src = img;
            $el.appendChild($img);
        }

        if (text) {
            const $text = document.createElement("span");
            $text.innerText = text;
            $el.appendChild($text);
        }

        return $el;
    }


    _initUI() {
        const $ul = document.createElement("ul");                                //  The horizontal list of menu areas (Title, <options>, logo)
        //
        //    The left section containing the application name "JAG Authoring Tool"
        //
        const $leftLi = document.createElement("li");                            // Leftmost item (Title)
        $ul.appendChild($leftLi);

        const $leftLiDiv = document.createElement("div");                        // (Title) - Div wrapper (needed?)
        $leftLiDiv.classList.add("menu-title")
        $leftLi.appendChild($leftLiDiv);

        const $title = document.createElement("span");                           // (Title) - Span containing text
        $title.id = "def-menu-title";
        $title.classList.add("menu-item");
        $title.innerText = "Node Definition";
        $leftLiDiv.appendChild($title);

        //
        // The center section containing the menu options (Currently: Clear)
        //
        const $centerLi = document.createElement("li");                          // Center item (<options>)
        $leftLiDiv.classList.add("menu-options")
        $ul.appendChild($centerLi);

        const $centerLiDiv = document.createElement("div");                      // (<options>) - Div wrapper for options
        $centerLi.appendChild($centerLiDiv);


        let executionOptions = []
        let execution = Activity.EXECUTION;
        for (let step in execution) {
            executionOptions.push({value: execution[step].name, text: execution[step].text})
        }

        const execution_el = FormUtils.createPropertyElement('operator-property', 'Execution');
        const executionSelect = FormUtils.createSelect('execution-property', executionOptions);
        executionSelect.label = "Execution"
        executionSelect.className = 'executor';
        execution_el.appendChild(executionSelect);
        $centerLiDiv.appendChild(execution_el);

        let returnsOptions = []
        let returns = Activity.RETURNS;
        for (let step in returns) {
            returnsOptions.push({value: returns[step].name, text: returns[step].text})                             // @TODO Limit list on previously selected value
        }

        const return_el = FormUtils.createPropertyElement('operator-property', 'Return');
        const returnSelect = FormUtils.createSelect('execution-property', returnsOptions);
        returnSelect.label = "Return"
        returnSelect.className = 'return';
        return_el.appendChild(returnSelect);
        $centerLiDiv.appendChild(return_el);

        let operatorOptions = []
        let operator = Activity.OPERATOR;
         for (let step in operator) {
             operatorOptions.push({value: operator[step].name, text: operator[step].text})
         }

        const operator_el = FormUtils.createPropertyElement('operator-property', 'Operator');
        const operatorSelect = FormUtils.createSelect('operator-property', operatorOptions);
        operatorSelect.label = "Operator"
        operatorSelect.className = 'operator';
        operator_el.appendChild(operatorSelect);
        $centerLiDiv.appendChild(operator_el);


        //
        // The right section containing the IHMC logo
        //
        const $rightLi = document.createElement("li");
        $ul.appendChild($rightLi);

        const $rightLiDiv = document.createElement("div");
        $rightLiDiv.classList.add("menu-item");
        $rightLi.appendChild($rightLiDiv);

        const $logoImage = document.createElement("img");
        $logoImage.classList.add("menu-item");
        $logoImage.id = "menu-logo";
        $logoImage.setAttribute('src', "icons/ihmc_logo.png");
        $rightLiDiv.appendChild($logoImage);

        this.appendChild($ul);

        this.$leftLiDiv = $leftLiDiv;
        this.$centerLiDiv = $centerLiDiv;
        this.$rightLiDiv = $rightLiDiv;

    }
});

export default customElements.get('def-menu');


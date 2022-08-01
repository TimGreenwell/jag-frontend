class FormUtils {
    static createEmptyInputContainer (id) {
        const container = document.createElement(`div`);
        container.setAttribute(`id`, id);
        return container;
    }

    static createPropertyElement (id, name) {
        const element = document.createElement(`div`);
        const label = document.createElement(`label`);
        label.setAttribute(`for`, id);
        label.innerHTML = name;
        element.appendChild(label);
        return element;
    }

    static createTextInput (id) {
        const input = document.createElement(`input`);
        input.setAttribute(`type`, `text`);
        input.setAttribute(`id`, id);
        return input;
    }

    static createSelect (id, options, selected = undefined) {
        const input = document.createElement(`select`);
        input.setAttribute(`id`, id);

        options.forEach(item => {
            if (item.label) {
                const opgr_el = document.createElement(`optgroup`);
                opgr_el.setAttribute(`label`, item.label);

                item.options.forEach(option => {
                    const opt_el = document.createElement(`option`);
                    opt_el.value = option.value;
                    opt_el.text = option.text;
                    opgr_el.appendChild(opt_el);
                });

                input.add(opgr_el);
            } else {
                const opt_el = document.createElement(`option`);
                opt_el.value = item.value;
                opt_el.text = item.text;
                input.add(opt_el);
            }
        });

        if (selected) {
            input.value = selected;
        } else {
            input.value = undefined;
        }

        return input;
    }

    static toggleSelectValues (select_el, valid_values) {
        const selected_option = select_el.selectedOptions[0];

        for (let option of select_el.options) {
            option.disabled = !valid_values.has(option.value);
        }

        if (selected_option) {
            select_el.value = selected_option.value;
        }
    }
}

export default FormUtils;
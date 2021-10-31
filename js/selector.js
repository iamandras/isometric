class Selector {
    append(parent, html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        parent.appendChild(div);
    }

    $(id) {
        return document.getElementById(id);
    }

    getElements(selector) {
        return document.querySelectorAll(selector);
    }

    setAttribute(element, attributeName, attributeValue) {
        element.setAttribute(attributeName, attributeValue);
    }

    getAttribute(element, attributeName) {
        return element.getAttribute(attributeName);
    }

    setCss(element, cssRuleName, value) {
        element.style[cssRuleName] = value;
    }

    getCss(element, cssRuleName) {
        return getComputedStyle(element)[cssRuleName];
    }

    removeClasses(element, classNames) {
        classNames.forEach(className => {
            element.classList.remove(className);
        });
    }

    addClass(element, className) {
        element.classList.add(className);
    }

    hasClass(element, className) {
        return element.classList.contains(className);
    }

    getPosition(element) {
        const rect = element.getBoundingClientRect();

        return {
            x: rect.left + document.body.scrollLeft,
            y: rect.top + document.body.scrollTop,
        };
    }

    setPosition(element, point) {
        this.setCss(element, 'left', point.x + 'px');
        this.setCss(element, 'top', point.y + 'px');
    }

    show(element) {
        this.setCss(element, 'display', 'block');
    }

    hide(element) {
        this.setCss(element, 'display', 'none');
    }

    on(element, eventName, eventHandler) {
        element.addEventListener(eventName, eventHandler);
    }

    remove(element) {
        if (element.parentNode !== null) {
            element.parentNode.removeChild(element);
        }
    }
}

const $s = new Selector();
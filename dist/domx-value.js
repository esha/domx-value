/*! domx-value - v0.2.13 - 2015-04-15
* http://esha.github.io/domx-value/
* Copyright (c) 2015 ESHA Research; Licensed MIT, GPL */

(function(D) {
    "use strict";

    // shortcuts
    var X = D.x,
        _ = X._;

var V = _.xValue = {
    /*jshint evil:true */
    resolve: function(context, reference) {
        var full = 'context["'+reference+'"]';
        try {
            return eval(full+'||context.'+reference);
        } catch (e) {
            return eval(full);
        }
    },
    name: function(node) {
        if (node.nodeType === 3 && !node.noSubNames) {
            node.splitOnName();// ensure this is run before node.name
        }
        return node.tagName === 'FORM' ? node.getAttribute('name') : node.name;
    },
    parse: function(value) {
        if (typeof value === "string") {
            try {
                value = JSON.parse(value);
            } catch (e) {}
        } else if (Array.isArray(value)) {
            value = value.map(V.parse);
        }
        return value;
    },
    string: function(value) {
        if (value !== undefined && typeof value !== "string") {
            try {
                value = JSON.stringify(value);
            } catch (e) {
                value = value+'';
            }
        }
        return value;
    },
    stringifyFor: function(el) {
        var stringify = el.getAttribute('x-value-stringify');
        return stringify && V.resolve(window, stringify) || V.string;        
    },
    nameNodes: function(parent, nameFn, possibleParentFn, attrFn) {
        for (var i=0, done = []; i<parent.childNodes.length; i++) {
            var node = parent.childNodes[i],
                name = V.name(node);
            if (name && done.indexOf(name) < 0) {
                done.push(name);
                nameFn(name, node);
            } else if (possibleParentFn && !node.useBaseValue()) {
                possibleParentFn(node);
            } else if (node.useAttrValues) {
                V.nameAttrs(node, attrFn);
            }
        }
        if (parent.useAttrValues) {
            V.nameAttrs(parent, attrFn);
        }
    },
    nameAttrs: function(node, attrFn) {
        var allowed = node.getAttribute('x-value-attr').split(',');
        for (var a=0; a < node.attributes.length; a++) {
            var attr = node.attributes[a];
            if (allowed.indexOf(attr.name) >= 0) {
                attrFn(attr);
            }
        }
    },
    combine: function(oldValue, newValue, rejectNull) {
        if (oldValue === undefined || oldValue === newValue ||
            (rejectNull && oldValue === null)) {
            return newValue;
        }
        if (Array.isArray(oldValue)) {
            if (oldValue.indexOf(newValue) < 0) {
                oldValue.push(newValue);
            }
            return oldValue;
        }
        return [oldValue, newValue];
    },
    getNameValue: function(parent, value) {
        V.nameNodes(parent, function(name, node) {
            value[name] = V.combine(value[name], node.nameValue);
        }, function(possibleParent) {
            V.getNameValue(possibleParent, value);
        }, function(attr) {
            value[attr.name] = attr.baseValue;
        });
        return value;
    },
    setNameValue: function(parent, values) {
        V.nameNodes(parent, function(name, node) {
            var value = V.resolve(values, name);
            if (value !== undefined) {
                node.nameValue = value;
            }
        }, function(possibleParent) {
            V.setNameValue(possibleParent, values);
        }, function(attr) {
            var value = V.resolve(values, attr.name);
            if (value !== undefined) {
                attr.baseValue = value;
            }
        });
    },
    booleanAttr: function(attr) {
        return {
            get: function() {
                return this.hasAttribute(attr);
            },
            set: function(value) {
                this[value ? 'setAttribute' : 'removeAttribute'](attr, true);
            }
        };
    },
    nameRE: /\$\{([^}]+)\}/,
    changeEvent: window.CustomEvent ? function(node) {
        node.dispatchEvent(new CustomEvent('change', { bubbles:true }));
    } : function(node) {
        var e = D.createEvent('CustomEvent');
        e.initCustomEvent('change', true);
        node.dispatchEvent(e);
    }
};

_.define([Node], {
    value: {
        get: function() {
            return this.hasAttribute && this.hasAttribute('value') ?
                this.getAttribute('value') :
                this.textContent;
        },
        set: function(value) {
            if (this.hasAttribute && this.hasAttribute('value')) {
                this.setAttribute('value', value);
            } else {
                this.textContent = value;
            }
        }
    },
    baseValue:  {
        get: function(){ return V.parse(this.value); },
        set: function(value) {
            var oldValue = this.value,
                newValue = this.value = V.string(value);
            if (oldValue !== newValue) {
                V.changeEvent(this);
            }
        }
    },
    useBaseValue: function() {
        var kids = this.childNodes;
        if (this.noSubNames || !kids.length) {
            return true;// always use base when no descendents
        }
        if (kids.length > 1 || kids[0].name || this.children.length) {
            return false;// never use base with multiple kids, named kid, or element children
        }
        // if Text, check if it just hasn't be split yet.
        return !kids[0].splitOnName || !kids[0].splitOnName();
    },
    nameParent: {
        get: function() {
            var node = this,
                parent;
            while ((parent = node.parentNode)) {
                if (V.name(parent) ||
                    (parent.hasAttribute && parent.hasAttribute('x-value-parent'))) {
                    return parent;
                }
                node = parent;
            }
            return node === this ? null : node;
        }
    },
    nameGroup: {
        get: function() {
            var el = this,
                name = V.name(el);
            return name ? el.parentNode ?
                el.nameParent.queryNameAll(name) :
                new X.List(el) :
                null;
        }
    },
    nameValue: {
        get: function() {
            var values;
            if (V.name(this)) {
                this.nameGroup.each(function(node) {
                    values = V.combine(values, node.xValue);
                });
            }
            return values || this.xValue;
        },
        set: function(values) {
            if (V.name(this) && Array.isArray(values)) {
                var group = this.nameGroup;
                if (_.repeat && !values.length && group.length && !group[0].hasAttribute(_.repeat.id)) {
                    _.repeat.init(group[0], true);
                }
                group.each(function(node, i) {
                    if (i < values.length) {
                        node.nameValue = values[i];
                    } else {
                        node.remove();
                    }
                });
                while (group.length < values.length) {
                    var last = group[group.length - 1];
                    group.add(last.repeat(values[group.length]));
                }
            } else if (this.tagName === 'X-REPEAT') {
                this.repeat(values);
            } else {
                this.xValue = values;
            }
        }
    },
    xValue: {
        get: function() {
            return this.useBaseValue() ? this.baseValue : V.getNameValue(this, {});
        },
        set: function(value) {
            if (this.useBaseValue() || typeof value !== "object") {
                this.baseValue = value;
            } else {
                V.setNameValue(this, value);
            }
        }
    }
});
_.define([Attr], {
    useBaseValue: function(){ return true; },
}, true);

_.define([Element], {
    name: {
        get: function(){ return this.getAttribute('name'); },
        set: function(name){ this.setAttribute('name', name); }
    },
    baseProperty: 'value',
    baseValue: {
        get: function() {
            var parser = this.getAttribute('x-value-parse');
            parser = parser && V.resolve(window, parser) || V.parse;
            return parser.call(this, this[this.baseProperty]);
        },
        set: function(value) {
            var oldValue = this[this.baseProperty],
                newValue = this[this.baseProperty] = V.stringifyFor(this).call(this, value);
            if (oldValue !== newValue) {
                V.changeEvent(this);
            }
        }
    },
    useAttrValues: V.booleanAttr('x-value-attr'),
    noSubNames: V.booleanAttr('x-value-none')
}, true);

_.define(X.containers, {
    queryName: function(name) {
        return this.queryNameAll(name, 1)[0];
    },
    queryNameAll: function(name, count, _list) {
        _list = _list || new X.List(count);
        var parents = _.isList(this) ? this : [this];
        for (var s=0; s < parents.length && !_list.isFull(); s++) {
            var parent = parents[s],
                xrepeat = null;
            for (var i=0; i < parent.childNodes.length && !_list.isFull(); i++) {
                var node = parent.childNodes[i],
                    nodeName = V.name(node);
                if (nodeName === name) {
                    if (node.tagName === 'X-REPEAT') {
                        if (xrepeat !== false) {
                            xrepeat = node;
                        }
                    } else {
                        xrepeat = false;
                        _list.add(node);
                    }
                } else if (node.nodeType === 1) {
                    if (nodeName) {
                        if (name.indexOf(nodeName+'.') === 0) {
                            node.queryNameAll(name.substring(nodeName.length+1), count, _list);
                        }
                    } else {
                        node.queryNameAll(name, count, _list);
                    }
                }
            }
            if (xrepeat) {
                _list.add(xrepeat);
            }
            if (parent.useAttrValues && !_list.isFull()) {
                var el = this,
                    allowed = parent.getAttribute('x-value-attr').split(',');
                if (allowed.indexOf(name) >= 0) {
                    for (var a=0; a < el.attributes.length; a++) {
                        var attr = el.attributes[a];
                        if (attr.name === name) {
                            if (!attr.parentNode) {
                                attr.parentNode = el;
                            }
                            _list.add(attr);
                            break;
                        }
                    }
                }
            }
        }
        return _list;
    }
});

_.define([Text], {
    useBaseValue: function() {
        return true;
    },
    splitOnName: function() {
        var text = this,
            match = text.textContent.match(V.nameRE);
        if (match) {
            var start = match.index,
                name = match[0];
            if (start > 0) {
                text.splitText(start);
                text.noSubNames = true;
                text = text.nextSibling;
            }
            if (text.textContent.length > name.length) {
                text.splitText(name.length);
            }
            text.name = match[1];
            text.textContent = '';
        }
        // all have no sub names after splitting
        text.noSubNames = true;
        return !!match;
    }
}, true);

_.define([HTMLInputElement], {
    checkable: {
        get: function() {
            return this.type === 'radio' || this.type === 'checkbox';
        }
    },
    xValue:  {
        get: function() {
            return !this.checkable || this.checked ? this.baseValue : null;
        },
        set: function(value) {
            this.nameValue = value;
        }
    },
    nameValue: {
        get: function() {
            if (this.checkable) {
                var group = this.nameGroup || new X.List(this),
                    value;
                group.each(function(node) {
                    value = V.combine(value, node.xValue, true);
                });
                return Array.isArray(value) && (this.type === 'radio' || group.length === 1) ?
                    value[0] :
                    value;
            }
            return this.baseValue;
        },
        set: function(value) {
            var input = this;
            if (input.checkable &&
                ((input.value !== 'on' && input.value !== '') ||
                  input.hasAttribute('value'))) {
                value = (Array.isArray(value) ? value : [value]).map(V.stringifyFor(input));
                var changed = false,
                    group = input.nameGroup || new X.List(input);
                group.each(function(el) {
                    var was = el.checked;
                    el.checked = value.indexOf(el.value) >= 0;
                    if (was !== el.checked) {
                        changed = true;
                    }
                });
                if (changed) {
                    V.changeEvent(input);
                }
            } else {
                input.baseValue = value;
            }
        }
    }
}, true);

_.define([HTMLSelectElement], {
    xValue: {
        get: function() {
            if (this.multiple) {
                var selected = this.children.only('selected', true);
                return selected.length ? selected.each('xValue') :
                    this.children.length > 1 ? [] : null;
            }
            return V.parse(this.baseValue);
        },
        set: function(value) {
            if (this.multiple) {
                value = (Array.isArray(value) ? value : [value]).map(V.string);
                var changed = false;
                this.children.each(function(option) {
                    var was = option.selected;
                    option.selected = value.indexOf(option.value) >= 0;
                    if (option.select !== was) {
                        changed = true;
                    }
                });
                if (changed) {
                    V.changeEvent(this);
                }
            } else {
                this.baseValue = value;
            }
        }
    }
}, true);

_.define([HTMLLIElement], {
    baseProperty: {
        get: function() {
            // ordered ones use relative index, unordered ones use text
            return this.parentNode instanceof HTMLOListElement ?
                'value' :
                'textContent';
        } 
    }
}, true);

_.define([HTMLOptionElement], {
    baseProperty: {
        get: function() {
            return this.hasAttribute('value') ?
                'value' :
                'textContent';
        }
    }
}, true);


})(document);

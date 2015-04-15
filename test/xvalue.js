(function(D) {
 
    function testProperty(set, prop, getOnly) {
        if (!Array.isArray(set)){ set = [set]; }
        test("."+prop+" presence", function() {
            set.forEach(function(_class) {
                var desc = Object.getOwnPropertyDescriptor(_class.prototype, prop);
                ok(desc, 'should have descriptor for '+prop+' in '+_class.name);
                if (desc) {
                    ok(desc.get, 'should have getter for '+prop+' in '+_class.name);
                    if (!getOnly) {
                        ok(desc.set, 'should have setter for '+prop+' in '+_class.name);
                    }
                    ok(!desc.enumerable, prop+' should not be enumerable in '+_class.name);
                    ok(!desc.writable, prop+' should not be writable in '+_class.name);
                    ok(desc.configurable, prop+' should stay configurable in '+_class.name);
                }
            });
        });
    }

    function testMethod(set, method) {
        test(method+"() presence", function() {
            set.forEach(function(_class) {
                var parent = _class.prototype || _class;
                equal(typeof parent[method], "function", _class.name+'.prototype.'+method);
            });
        });
    }

    var X = D.x,
        _ = X._,
        V = _.xValue;
    module("xValue");

    test("_.", function() {
        equal(typeof _.xValue, "object", "_.xValue");
    });

    testMethod([Node,Attr], 'useBaseValue');
    ['value','baseValue','xValue','nameValue'].forEach(function(prop) {
        testProperty(Node, prop);
    });
    ['nameParent','nameGroup'].forEach(function(prop) {
        testProperty(Node, prop, 'get');
    });

    testProperty(Element, 'noSubNames');
    testProperty(Element, 'useAttrValues');

    testMethod(X.parents, 'queryName');
    testMethod(X.parents, 'queryNameAll');

    test("_.resolve", function() {
        window.foo = { bar: true };
        window['foo.baz'] = true;
        strictEqual(V.resolve(window, 'foo.bar'), true);
        strictEqual(V.resolve(window, 'foo.baz'), true);
        delete window.foo;
        delete window['foo.baz'];
    });

    function testBaseValue(node, initial) {
        if (arguments.length !== 2) {
            initial = node.baseValue;
        }
        if (node.nodeType !== 1) {
            equal(node.baseValue, node.nodeValue);
        }
        equal(node.baseValue, initial);
        node.baseValue = true;
        strictEqual(node.baseValue, true);
        node.baseValue = 42;
        strictEqual(node.baseValue, 42);
        node.baseValue = ['an','array'];
        deepEqual(node.baseValue, ['an','array']);
        node.baseValue = {key:'value'};
        deepEqual(node.baseValue, {key:"value"});
        node.baseValue = 'string';
        equal(node.baseValue, 'string');
        node.baseValue = initial;
    }

    test("text node", function() {
        testBaseValue(D.createTextNode('text'), 'text');
    });

    test("comment", function() {
        testBaseValue(D.createComment('<content>'), '<content>');
    });

    test("element", function() {
        var node = D.body.append('span[value=attr]{text}');
        equal(node.baseProperty, 'value');
        equal(node.textContent, 'text');
        testBaseValue(node, 'attr');
        node.removeAttribute('value');
        testBaseValue(node, 'text');
        equal(node.children.length, 0);
        node.remove();
    });

    test('internal text values', function() {
        var el = D.createElement('div');
        el.textContent = 'a ${b} c ${d}';
        deepEqual({ b: '', d: '' }, el.xValue);
        el.xValue = {b:1, d:true};
        equal('a 1 c true', el.textContent);
        var val = el.xValue = {b:2, d:{e:false}};
        equal('a 2 c {"e":false}', el.textContent);
        deepEqual(val, el.xValue);
        ok(val !== el.xValue, 'should be different object');

        var a = D.createElement('a');
        a.setAttribute('name', 'nest');
        a.value = '${test}';
        ok(!a.useBaseValue(), "a should not use base value");
        a.xValue = { test: 'deep single'};
        equal(a.textContent, 'deep single');
    });

    test('change event', function() {
        expect(10);
        var el = D.body.append('input[value=old]'),
            listener = function(e) {
                ok(e instanceof window.Event);
                equal(e.target, el);
            };
        D.body.addEventListener('change', listener);

        equal(el.xValue, 'old');
        el.xValue = 'new';
        equal(el.xValue, 'new');
        el.remove();

        el = D.body.append('input[type=radio][value=value][checked=true]');
        el.xValue = 'old';
        el.remove();

        el = D.body.append('select[multiple]');
        el.append('option*3').each('textContent', '${i}');
        deepEqual(el.xValue, []);
        el.xValue = [0,1,2];
        deepEqual(el.xValue, [0,1,2]);
        el.remove();

        D.body.removeEventListener('change', listener);
    });

    test('ul li base change', function() {
        var li = D.createElement('li'),
            ul = D.createElement('ul'),
            ol = D.createElement('ol');
        li.textContent = 'true';
        equal('textContent', li.baseProperty);
        ol.appendChild(li);
        equal('value', li.baseProperty);
        strictEqual(li.xValue, 0);
        li.remove();
        ul.appendChild(li);
        equal('textContent', li.baseProperty);
        strictEqual(li.xValue, true);
    });

    test('queryName', function() {
        var el = D.queryName('named');
        strictEqual(el, D.query('[name=named]'));
        equal(el.getAttribute('name'), 'named');
        var nested = D.queryName('named.nested');
        strictEqual(nested, D.query('[name=nested]'));
        equal(nested.getAttribute('name'), 'nested');

        var named = D.queryAll('[name=named]');
        nested = named.queryName('nested');
        strictEqual(nested, D.query('[name=nested]'));
    });

    test('queryNameAll', function() {
        var els = D.queryNameAll('named');
        equal(els.length, 2);
        equal(els[0].getAttribute('name'), 'named');
        equal(els[1].getAttribute('name'), 'named');

        els = D.body.children.queryNameAll('named');
        equal(els.length, 2);
    });

    test('queryName text node', function() {
        var text = D.createTextNode('${greeting} world!'),
            el = D.createElement('div');
        el.appendChild(text);
        D.body.appendChild(el);
        var result = D.body.queryName('greeting');
        ok(result);
        strictEqual(text, result);
        equal(el.childNodes.length, 2);
        el.remove();
    });

    test('queryNameAll only returns x-repeat element if no others w/name', function() {
        var ol = D.getElementById('repeats');
        ok(ol);
        equal(ol.children.length, 2, "list should two kids");
        equal(D.queryNameAll('items').length, 1, "queryNameAll should return one child");
        var xrepeat = D.queryName('items');
        equal(xrepeat.tagName, 'X-REPEAT', "queryName should get the x-repeat");
        xrepeat.repeat('one');
        equal(ol.children.length, 3, "list should have 3 children");
        equal(D.queryNameAll('items').length, 1, "queryNameAll should still return one child");
        var li = D.queryName('items');
        equal(li.tagName, 'LI', 'queryName should return li');
    });

    test('x-value-attr', function() {
        var a = D.createElement('a'),
            div = D.createElement('div');
        a.setAttribute('x-value-attr', 'test,foo');
        a.setAttribute('test','');
        a.setAttribute('name', 'object');
        a.textContent = '${text}';

        div.appendChild(a);
        ok(a.useAttrValues, 'should support attribute values');
        ok(a.hasAttribute('test'));
        strictEqual(a.parentNode, div);
        strictEqual(div.queryName('object'), a);

        div.xValue = { object: { text: 'text', test: 'changed', foo: 'bar' }};
        equal(a.textContent, 'text', 'should have text content');
        equal(a.getAttribute('test'), 'changed', 'should have test attribute changed');
        ok(!a.hasAttribute('foo'), 'should not create attributes');
        deepEqual(div.xValue, {object:{text:'text',test:'changed'}});

        ok(a.queryName('test'), 'should be able to query [test] attribute');
        a.setAttribute('query', 'true');
        ok(!a.queryName('query'), 'should not be able to query [query] attr');

    });

    test('x-value-attr single node', function() {
        var el = D.createElement('div'),
            child = D.createElement('span');
        child.setAttribute('name', 'test');
        el.appendChild(child);
        el.setAttribute('x-value-attr','status');
        el.setAttribute('status', '');
        el.xValue = { status: 'READ', test: true };
        equal(el.getAttribute('status'), 'READ', 'should have status attribute set');
        equal(child.textContent, 'true', 'child should get content too');
        deepEqual(el.xValue, {status:'READ',test:true});
    });

    test('x-value-attr nested under named parent', function() {
        var el = D.createElement('div'),
            child = D.createElement('span');
        child.setAttribute('x-value-attr', 'test');
        child.setAttribute('test', 'false');
        el.appendChild(child);
        el.appendChild(D.createElement('span'));// force non-baseValue
        deepEqual(el.xValue, {test:false});
        el.xValue = { test: true };
        equal(child.getAttribute('test'), 'true', 'should have test attribute set');
        deepEqual(el.xValue, {test:true});
    });

    test('x-value-parent', function() {
        var root = D.createElement('section'),
            parent = D.createElement('div'),
            named = D.createElement('span');
        root.appendChild(parent);
        parent.appendChild(named);
        parent.setAttribute('x-value-parent','');
        strictEqual(named.nameParent, parent);

        named.setAttribute('name', 'values');
        named.setAttribute('x-repeat','');
        var uncle = parent.cloneNode(true),
            cousin = uncle.children[0];
        root.appendChild(uncle);
        deepEqual(named.nameGroup, new X.List(named));
        deepEqual(cousin.nameGroup, new X.List(cousin));

        var value = root.xValue = { values: [1,2] };
        deepEqual(parent.xValue, value);
        deepEqual(uncle.xValue, value);
    });

    test('element.useBaseValue()', function() {
        var el = D.createElement('div');
        equal(el.useBaseValue(), true, "empty element");
        el.textContent = ' ${foo} ';
        equal(el.useBaseValue(), false, "element containing ${text} name");
        el.textContent = 'plain';
        equal(el.useBaseValue(), true, "element w/plain text");
        el.appendChild(D.createElement('span'));
        equal(el.useBaseValue(), false, "element w/child element");
        el.textContent = '';
        equal(el.useBaseValue(), true, "empty again");
        el.appendChild(D.createTextNode('text'));
        equal(el.useBaseValue(), true, "single plain text node");
        el.appendChild(D.createComment('comment'));
        equal(el.useBaseValue(), false, "multiple child nodes");
        el.textContent = '';
        equal(el.useBaseValue(), true, "empty again");
        var node = D.createTextNode('name me');
        node.name = 'name';
        el.appendChild(node);
        equal(el.useBaseValue(), false, "single named child");
    });

    test('input.checkable', function() {
        var el = D.createElement('input');
        ok('checkable' in el, 'has checkable properties');
        equal(false, el.checkable, 'text type is not checkable');
        el.type = 'radio';
        equal(true, el.checkable, 'radio is checkable');
        el.type = 'number';
        equal(false, el.checkable, 'number is not checkable');
        el.type = 'checkbox';
        equal(true, el.checkable, 'checkbox is checkable');
    });

    test('use xValue/nameValue to populate checkable value', function() {
        var check = D.createElement('input'),
            parent = D.createElement('div'),
            radio = D.createElement('input');
        check.type = 'checkbox';
        radio.type = 'radio';
        radio.setAttribute('name', 'name');
        parent.appendChild(check);
        parent.appendChild(radio);

        ok(!check.hasAttribute('value'), 'checkbox should not have a value attribute');
        ok(!radio.hasAttribute('value'), 'radio should not have a value attribute');
        ok(check.value === '' || check.value === 'on', 'checkbox should have default value');
        ok(radio.value === '' || radio.value === 'on', 'radio should have default value');

        check.xValue = 'checky';
        parent.xValue = { name: 'rad' };
        check.xValue = 'nope';
        parent.xValue = { name: 'nope'};
        equal(check.value, 'checky', 'checkbox should have first set value');
        equal(radio.value, 'rad', 'radio should have first set value');
        ok(!check.checked, 'checkbox should not be checked');
        ok(!radio.checked, 'radio should not be checked');
        equal(check.xValue, null, 'checkbox should have null value');
        equal(radio.nameValue, null, 'radio should have null value');
        check.xValue = ['checky'];
        parent.xValue = { name: 'rad'};
        equal(check.xValue, 'checky', 'checkbox xValue when checked');
        equal(radio.nameValue, 'rad', 'radio xValue when checked');
    });

    test('<option> baseProperty savviness', function() {
        var value = D.createElement('option'),
            text = D.createElement('option');
        value.setAttribute('value', 'value');
        value.textContent = 'text';
        text.textContent = 'text';

        equal(value.xValue, value.value, 'should get value attr/prop, not text');
        equal(text.xValue, text.textContent, 'should get text, not value attr/prop');

        value.xValue = 'new value';
        text.xValue = 'new text';
        equal(value.value, 'new value', 'xValue should have set value property');
        equal(text.textContent, 'new text', 'xValue should have set text property');
    });

}(document));

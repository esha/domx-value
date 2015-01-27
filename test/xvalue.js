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
    });

}(document));

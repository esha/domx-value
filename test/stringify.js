(function(D) {
/*
======== A Handy Little QUnit Reference ========
http://api.qunitjs.com/

Test methods:
  module(name, {[setup][ ,teardown]})
  test(name, callback)
  expect(numberOfAssertions)
  stop(increment)
  start(decrement)
Test assertions:
  ok(value, [message])
  equal(actual, expected, [message])
  notEqual(actual, expected, [message])
  deepEqual(actual, expected, [message])
  notDeepEqual(actual, expected, [message])
  strictEqual(actual, expected, [message])
  notStrictEqual(actual, expected, [message])
  throws(block, [expected], [message])
*/
    var X = D.x,
        _ = X._;

    module("dev API");

    test("D.x._.stringify", function() {
        equal(typeof _.stringify, "object", "D.x._.stringify exists");
    });

    module("user API");

    test("stringify presense", function() {
        equal(typeof D.html.stringify, "function", "element stringify fn");
        equal(typeof D.queryAll('#qunit-fixture').stringify, "function", "NodeList stringify fn");
    });

    test("single element", function() {
        var el = D.createElement('div');
        equal(el.stringify(), '<div></div>');
        el.setAttribute('x-dot','');
        equal(el.stringify(), '<div x-dot></div>');
        el.setAttribute('id', 'test');
        equal(el.stringify(), '<div x-dot id="test"></div>');
        el.textContent = 'test';
        equal(el.stringify(), '<div x-dot id="test">\ntest\n</div>');
    });

    test("element list", function() {
        var els = D.queryAll('.foo div');
        deepEqual(els.stringify(), [
            '<div id="first">\n    <span id="inner"></span>\n</div>',
            '<div id="identity"></div>',
            '<div></div>',
            '<div id="last"></div>'
        ]);
    });

}(document));


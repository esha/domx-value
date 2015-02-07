xValue is a [DOMx][domx] that makes it trivial to read and write rich, typed, nested model values to and from the DOM using name attributes and ${name} placeholders in textContent.

[home]: http://esha.github.io/domx-value
[domx]: http://esha.github.io/domx
[demo]: http://esha.github.io/domx#demo

[Bower][bower]: `bower install domx-value`  
[NPM][npm]: `npm install domx-value`   
[Component][component]: `component install esha/domx-value`  

[npm]: https://npmjs.org/package/domx-value
[bower]: http://bower.io/
[component]: http://component.io/

<!-- build/coverage status, climate -->
[![Build Status](https://travis-ci.org/esha/domx-value.png?branch=master)](https://travis-ci.org/esha/domx-value)  

<!-- npm, bower versions, downloads -->
[![Bower version](https://badge.fury.io/bo/domx-value.png)](http://badge.fury.io/bo/domx-value)
[![NPM version](https://badge.fury.io/js/domx-value.png)](http://badge.fury.io/js/domx-value)
[![Downloads per month](https://img.shields.io/npm/dm/domx-value.svg)](https://www.npmjs.org/package/domx-value)

<!-- deps status -->
[![Dependency Status](https://david-dm.org/esha/domx-value.png?theme=shields.io)](https://david-dm.org/esha/domx-value)
[![devDependency Status](https://david-dm.org/esha/domx-value/dev-status.png?theme=shields.io)](https://david-dm.org/esha/domx-value#info=devDependencies)

#### Full Version:

Download: [domx-value.min.js][full-min] or [domx-value.js][full]  

Adds the `xValue` getter/setter to DOM nodes and the `queryName(name)` and `queryNameAll(name)` functions to DOM nodes and lists.  

[full-min]: https://raw.github.com/esha/domx-value/master/dist/domx-value.min.js
[full]: https://raw.github.com/esha/domx-value/master/dist/domx-value.js

### Release History
* 2014-12-10 [v0.1.0][] (first independent release)
* 2014-12-23 [v0.2.0][] (s/xvalue-/x-value- for plugin attribute hooks)
* 2015-01-27 [v0.2.5][] (fix x-value-attr get/set/query, textContent that is all one var, better path resolution, more robust handling of x-repeat)
* 2015-02-06 [v0.2.6][] (faster and cleaner get/set of nameValue, especially w/x-value-attr)

[v0.1.0]: https://github.com/esha/domx/tree/0.1.0
[v0.2.0]: https://github.com/esha/domx/tree/0.2.0
[v0.2.2]: https://github.com/esha/domx/tree/0.2.2
[v0.2.5]: https://github.com/esha/domx/tree/0.2.5

# justcore [![Build Status](https://travis-ci.org/valentin-lozev/justcore.svg?branch=master)](https://travis-ci.org/dwyl/esta)

**justcore** is a lightweight Javascript library that helps you modularize and structure your code. Simple, easy-to-use module management solution for building scalable applications.

* **Highly decoupled:** **justcore** pushes you to write modules as self-contained pieces of code that work independently of each other.
* **Easy to maintain:** When modules don't have direct access to each other, a bug in one module will not have impact on the others. A module can be even removed completely without affecting the application. Finding bugs in a well-organized code will be no more annoying.
* **Easy to test:** Each module can be tested separately in complete isolation from the application.
* **Extensible extensions:** **justcore** is built for extension. You can extend your modules' capabilities, plug into application lifecycle hooks or introduce your own hooks.
* **External dependencies:** None.

## Getting started

### Installation

`npm install justcore --save`

### Documentation

You can see the [wiki pages](https://github.com/valentin-lozev/justcore/wiki).

### Examples

*app.js*
```javascript
import { Core } from "justcore";
import { SearchModule } from "./SearchModule";

const app = new Core();
app.use([
  // your extensions
]);
app.init(() => {
  // everything is hooked up and DOM is ready
  
  // register your modules
  app.addModule('search', sandbox => new SearchModule(sandbox));
  
  // start your modules
  app.startModule('search', {
    // these props will be passed to the module's init method
    props: {
      root: document.getElementById('search-module')
    }
  });
});
```
*SearchModule.js*
```javascript
export class SearchModule {
  constructor(sandbox) {
    this.sandbox = sandbox;
    this.input = null;
    this.handleInputChanged = this.handleInputChanged.bind(this);
  }
  
  // will be called first time when something starts the module
  // this is where you can create view, store etc.
  init(props) {
    this.input = props.root.querySelector('input');
    this.input.addEventListener("change", this.handleInputChanged);
  }
  
  
  // will be called when something stops the module
  // this is where you can release resources, clear intervals etc.
  destroy() {
    this.input.removeEventListener("change", this.handleInputChanged);
    this.input = null;
  }
  
  handleInputChanged(ev) {
    // other modules can subscribe to that message
    this.sandbox.publishAsync({
      type: 'search.changed',
      query: ev.currentTarget.value
    });
  }
}
```

## Core concepts

<p align="center">
  <img alt="justcore flow" src="docs/justcore-diagram.png" />
</p>

### Modules

Modules are the objects that describe your domain. Each module contains business logic related to its particular job. In sports application, one could be your soccer result widget that is responsible for displaying soccer score, or in an online store application, it could be your product panel that lists all available products. Modules consist of data and view, and since they are decoupled from each other, you can make different architecture decisions per each one, е.g. for some small module, you might not have actual objects representing its view and data.

It is also **important** to distinguish modules from ui elements / components / widgets - the latest are just reusable pieces of UI that contain no business logic, the **'V'** in **MV*** patterns. All modules can use ui elements within their views.

Some rules that modules should follow:
* A module should call its own methods or those on the sandbox;
* A module should not access DOM elements outside of its root;
* A module should not access non-native global objects;
* A module should ask its sandbox for anything else that is external to it;
* A module should not create global objects;
* A module should not directly reference other modules.

### Sandbox

The sandbox is an interface that connects the modules to the outside world. Modules only know about their sandbox instance and the rest of the architecture doesn't exist to them. Each sandbox instance acts like a facade of the core - translates its module's requests into core actions. Take time to design the Sandbox interface, because many modules will depend on it and changing it later will require you to update the affected modules too.

### Application core

The application core is a mediator object that hooks everything together and runs your application. Its responsibilities:
* The core manages the modules;
* The core provides inter-module communication mechanisms;
* The core is open to extensions.

### Extensions

Extensions are pieces of code that can extend the core in some of the following ways:
* An extension may add such new functionality to the core that modules can use;
* An extension may handle side effects by plugging into some of the application lifecycle hooks;
* An extension may act as an adapter between your modules and 3rd party library. Such decoupling enables you to swap base libraries without changing the modules. This is something trivial and yet many developers reference 3rd party code directly;
* Combination of the options above. For instance you might create a React adapter that provides *mountView()* method to the modules, plugs into modules' *destroy* method and unmounts the view. As a result, React's usage will be abstracted and developers will not worry about unmounting given view when its module is destroyed.

Also, each extension can expose its own lifecycle hook which other extensions can plug into.

## Credits

Inspired by the fascinating patterns recommended by Nicolas Zakas in his talk ["Scalable Javascript Application Architecture"](https://www.youtube.com/watch?v=mKouqShWI4o).

## License

**justcore** is licensed under the [MIT License](LICENSE).

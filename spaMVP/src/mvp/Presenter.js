var spaMVP;
(function (spaMVP) {
    "use strict";
    /**
     *  @class spaMVP.Presenter
     */
    var Presenter = (function () {
        function Presenter() {
            this._view = null;
            this._model = null;
            this._modelHandlers = {};
        }
        Object.defineProperty(Presenter.prototype, "view", {
            get: function () {
                return this._view;
            },
            set: function (value) {
                if (this.view === value) {
                    return;
                }
                if (this.view) {
                    this.view.destroy();
                }
                this._view = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Presenter.prototype, "model", {
            get: function () {
                return this._model;
            },
            set: function (model) {
                var _this = this;
                if (this._model === model) {
                    return;
                }
                Object.keys(this._modelHandlers).forEach(function (type) {
                    var eventHandler = _this._modelHandlers[type];
                    if (_this._model) {
                        _this._model.off(type, eventHandler, _this);
                    }
                    if (model) {
                        model.on(type, eventHandler, _this);
                    }
                });
                this._model = model;
                this.render();
            },
            enumerable: true,
            configurable: true
        });
        /**
         *  Determins which events to handle when model notifies.
         */
        Presenter.prototype.onModel = function (eventType, handler) {
            if (eventType && handler) {
                this._modelHandlers[eventType] = handler;
            }
            return this;
        };
        /**
         *  Renders its view.
         */
        Presenter.prototype.render = function () {
            if (this.view && this.model) {
                return this.view.render(this.model);
            }
            return null;
        };
        /**
         *  Destroys its view and model.
         */
        Presenter.prototype.destroy = function () {
            this.view = null;
            this.model = null;
        };
        Presenter.subclass = spaMVP.subclassFactory;
        return Presenter;
    }());
    spaMVP.Presenter = Presenter;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=Presenter.js.map
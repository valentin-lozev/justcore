var spaMVP = (function (spaMVP) {
    /**
     *  @class spaMVP.Presenter
     *  @param {spaMVP.View} view - An interface of all view methods used in the presenter.
     */
    function Presenter(view) {
        if (!(view instanceof spaMVP.View)) {
            throw new Error('Given view must be a subclass of View.js');
        }

        this._view = null;
        this._model = null;

        this.setView(view);
    }

    /**
     *  Returns its view.
     *  @returns {spaMVP.View}
     */
    Presenter.prototype.getView = function () {
        return this._view;
    };

    /**
     *  Sets a new view.
     *  @param {spaMVP.View} view
     */
    Presenter.prototype.setView = function (view) {
        if (this._view === view) {
            return;
        }

        if (this._view) {
            this._view.destroy();
        }

        if (view) {
            view.setPresenter(this);
        }

        this._view = view;
    };

    /**
     *  Returns its model.
     *  @returns {spaMVP.Model}
     */
    Presenter.prototype.getModel = function () {
        return this._model;
    };

    /**
     *  Sets a new model, subscribes to it for all mapped events defined in getModelEventsMap(),
     *  and if the model is not null it renders its view.
     *  @param {spaMVP.Model} model
     */
    Presenter.prototype.setModel = function (model) {
        var modelEventsMap = null, eventHandler = null;

        if (model && !(model instanceof spaMVP.Model)) {
            throw new Error('Model must be a subclass of spaMVP.Model');
        }

        if (this._model === model) {
            return;
        }

        modelEventsMap = this.getModelEventsMap();
        for (var eventType in modelEventsMap) {

            eventHandler = modelEventsMap[eventType];

            if (this._model) {
                this._model.off(eventType, this[eventHandler], this);
            }

            if (model) {
                model.on(eventType, this[eventHandler], this);
            }
        }

        this._model = model;
        if (this._model) {
            this.render();
        }
    };

    /**
     *  Renders its view.
     */
    Presenter.prototype.render = function () {
        this.getView().render(this.getModel());
    };

    /**
     *  Determines which model events to listen for and map them to specific methods.
     *  Default mappings: 
     *      'change' handled by 'onModelChange',
     *      'destroy' handled by 'onModelDestroy'.
     *  @returns {Object}
     */
    Presenter.prototype.getModelEventsMap = function () {
        return {
            'change': 'onModelChange',
            'destroy': 'onModelDestroy'
        };
    };

    /**
     *  Handles model's change event.
     *  @param {ModelEvent} ev
     */
    Presenter.prototype.onModelChange = function () {
        // Must be overriden
    };

    /**
     *  Handles model's destroy event.
     *  @param {ModelEvent} ev
     */
    Presenter.prototype.onModelDestroy = function () {
        this.destroy();
    };

    /**
     *  Destroys its view and model.
     */
    Presenter.prototype.destroy = function () {
        this.setView(null);
        this.setModel(null);
    };

    spaMVP.Presenter = Presenter;
    return spaMVP;

}(spaMVP));
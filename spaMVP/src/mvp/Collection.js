var spaMVP = (function (spaMVP) {

    /**
     *  Composite pattern on spaMVP.Model.
     *  It is usefull when you want to listen for collection of models.
     *  @class spaMVP.Collection
     *  @augments spaMVP.Model
     *  @property {spaMVP.HashSet} models - Set of models
     *  @param {Function} [hashingFunc] - Provides hash codes for models placed in the set.
     *          If not provided, the set checks whether the model has a hashCode() method, 
     *          and if not, calls its toString() method.
     *  @param {Function} [equalityFunc] - Checks for equality between two models with the same hash code.
     *          If not provided, the set checks whether the model being compared has an equals(other) method, 
     *          and if not, compares the models by using the === operator.
     */
    function Collection(hashingFunc, equalityFunc) {
        spaMVP.Model.call(this);
        this.models = new spaMVP.HashSet(hashingFunc, equalityFunc);
    }

    Collection.prototype = Object.create(spaMVP.Model.prototype);

    Collection.prototype.constructor = Collection;

    /**
     *  Adds a new model to the set, subscribes to its change and destroy events, 
     *  and notifies the listeners if the model is added successfully.
     *  @param {spaMVP.Model} model
     *  @returns {Boolean}
     */
    Collection.prototype.add = function (model) {
        return this.addRange([model]);
    };

    /**
     *  Adds range of models to the set, subsribes to their change and destroy events, 
     *  and notifies the listeners if there are successfully added models.
     *  @param {Array} models - The array of models to be added.
     *  @returns {Boolean}
     */
    Collection.prototype.addRange = function (models) {
        var added = [];
        for (var i = 0, len = models.length; i < len; i++) {
            var model = models[i];

            if (!(model instanceof spaMVP.Model)) {
                throw new ReferenceError('Item must be a subclass of spaMVP.Model.js');
            }

            if (!this.models.add(model)) {
                continue;
            }

            model.on('change', this.onItemChange, this);
            model.on('destroy', this.onItemDestroy, this);

            added.push(model);
        }

        var isModified = added.length > 0;
        if (isModified) {
            this.notify({
                type: 'change',
                addedTargets: added,
                deletedTargets: [],
                updatedTargets: []
            });
        }

        return isModified;
    };

    /**
     *   Removes a model from the set, unsubscribes from it and notifies the listeners.
     *   @param {spaMVP.Model} model
     *   @returns {Boolean}
     */
    Collection.prototype.remove = function (model) {
        return this.removeRange([model]);
    };

    /**
     *  Removes range of models, unsubsribes from them and notifies the listeners.
     *  @param {Array} models - The array of models to be removed.
     *  @returns {Boolean}
     */
    Collection.prototype.removeRange = function (models) {
        var deleted = [];
        for (var i = 0, len = models.length; i < len; i++) {
            var model = models[i];
            if (!this.models.remove(model)) {
                continue;
            }

            model.off('change', this.onItemChange, this);
            model.off('destroy', this.onItemDestroy, this);

            deleted.push(model);
        }

        var isModified = deleted.length > 0;
        if (isModified) {
            this.notify({
                type: 'change',
                addedTargets: [],
                deletedTargets: deleted,
                updatedTargets: []
            });
        }

        return isModified;
    };

    /**
     *  Removes all models from the set, unsubscribes from them and notifies the listeners.
     *  @returns {Boolean}
     */
    Collection.prototype.clear = function () {
        var allItems = this.toArray();
        return this.removeRange(allItems);
    };

    /**
     *  Determines whether a model is in the collection.
     *  @returns {Boolean}
     */
    Collection.prototype.contains = function (model) {
        return this.models.contains(model);
    };

    /**
     *  Determines whether the collection is not empty.
     *  @returns {Boolean}
     */
    Collection.prototype.any = function () {
        return this.models.size > 0;
    };

    /**
     *  Returns the models as Array without copying them.
     *  @returns {Array}
     */
    Collection.prototype.toArray = function () {
        return this.models.toArray();
    };

    /**
     *  Performs a specified action on each model in the set.
     *  @param {Function} action
     *  @param {Object} [context] - Value to use as this when executing the action.
     */
    Collection.prototype.forEach = function (action /* , context */) {
        var context = arguments[1];
        this.models.forEach(action, context);
    };

    /**
     *  Handles the change event of its models by notifying the listeners.
     *  @param {ModelEvent} ev - The dispatched event from the changed model.
     */
    Collection.prototype.onItemChange = function (ev) {
        this.notify({
            type: 'change',
            addedTargets: [],
            deletedTargets: [],
            updatedTargets: [ev.currentTarget]
        });
    };

    /**
     *  Handles the destroy event of its models by removing the destroyed one 
     *  and notifying the listeners.
     *  @param {ModelEvent} ev - The dispatched event from the destroyed model.
     */
    Collection.prototype.onItemDestroy = function (ev) {
        this.remove(ev.currentTarget);
    };

    spaMVP.Collection = Collection;
    return spaMVP;

}(spaMVP));
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var spaMVP;
(function (spaMVP) {
    var Hidden;
    (function (Hidden) {
        "use strict";
        function onItemChange(item) {
            this.notify(Hidden.Model.CollectionEvents.UpdatedItem, item);
        }
        function onItemDestroy(item) {
            this.removeRange([item]);
        }
        /**
         *  Composite pattern on spaMVP.Model.
         *  It is usefull when you want to listen for collection of models.
         *  @class spaMVP.Collection
         *  @augments spaMVP.Model
         */
        var Collection = (function (_super) {
            __extends(Collection, _super);
            function Collection() {
                _super.call(this);
                this.models = new Hidden.HashSet();
            }
            Object.defineProperty(Collection.prototype, "size", {
                get: function () {
                    return this.models.size;
                },
                enumerable: true,
                configurable: true
            });
            Collection.prototype.equals = function (other) {
                return false;
            };
            Collection.prototype.hash = function () {
                return this.size ^ 17;
            };
            /**
             *  Adds new model to the set.
             *  @returns {Boolean}
             */
            Collection.prototype.add = function (model) {
                return this.addRange([model]);
            };
            /**
             *  Adds range of models to the set.
             *  @returns {Boolean}
             */
            Collection.prototype.addRange = function (models) {
                var added = [];
                for (var i = 0, len = models.length; i < len; i++) {
                    var model = models[i];
                    if (!this.models.add(model)) {
                        continue;
                    }
                    model.on(Hidden.Model.Events.Change, onItemChange, this);
                    model.on(Hidden.Model.Events.Destroy, onItemDestroy, this);
                    added.push(model);
                }
                var isModified = added.length > 0;
                if (isModified) {
                    this.notify(Hidden.Model.CollectionEvents.AddedItems, added);
                }
                return isModified;
            };
            /**
             *  Removes a model from the set.
             *  @returns {Boolean}
             */
            Collection.prototype.remove = function (model) {
                return this.removeRange([model]);
            };
            /**
             *  Removes range of models.
             *  @returns {Boolean}
             */
            Collection.prototype.removeRange = function (models) {
                var deleted = [];
                for (var i = 0, len = models.length; i < len; i++) {
                    var model = models[i];
                    if (!this.models.remove(model)) {
                        continue;
                    }
                    model.off(Hidden.Model.Events.Change, onItemChange, this);
                    model.off(Hidden.Model.Events.Destroy, onItemDestroy, this);
                    deleted.push(model);
                }
                var isModified = deleted.length > 0;
                if (isModified) {
                    this.notify(Hidden.Model.CollectionEvents.DeletedItems, deleted);
                }
                return isModified;
            };
            /**
             *  Removes all models from the set.
             *  @returns {Boolean}
             */
            Collection.prototype.clear = function () {
                return this.removeRange(this.toArray());
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
                return this.size > 0;
            };
            /**
             *  Returns the models as Array.
             *  @returns {Array}
             */
            Collection.prototype.toArray = function () {
                return this.models.toArray();
            };
            /**
             *  Performs an action on each model in the set.
             */
            Collection.prototype.forEach = function (action, context) {
                this.models.forEach(action, context);
            };
            return Collection;
        }(Hidden.Model));
        Hidden.Collection = Collection;
    })(Hidden = spaMVP.Hidden || (spaMVP.Hidden = {}));
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=Collection.js.map
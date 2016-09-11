namespace spaMVP {
    "use strict";

    export let CollectionEvents = {
        AddedItems: "added-items",
        DeletedItems: "deleted-items",
        UpdatedItem: "updated-item"
    };

    /**
     *  Composite pattern on spaMVP.Model.
     *  It is usefull when you want to listen for collection of models.
     *  @class spaMVP.Collection
     *  @augments spaMVP.Model
     */
    export class Collection<TModel extends Model & Equatable<TModel>> extends Model {
        private models: HashSet<TModel> = new HashSet<TModel>();

        constructor() {
            super();
        }

        get size(): number {
            return this.models.size;
        }

        static subclass: (getInheritorFunc: () => Function) => Function = subclassFactory;

        equals(other: TModel): boolean {
            return false;
        }

        hash(): number {
            return this.size ^ 17;
        }

        /**
         *  Adds new model to the set.
         *  @returns {Boolean}
         */
        add(model: TModel): boolean {
            return this.addRange([model]);
        }

        /**
         *  Adds range of models to the set.
         *  @returns {Boolean}
         */
        addRange(models: TModel[]): boolean {
            let added = [];
            for (let i = 0, len = models.length; i < len; i++) {
                let model = models[i];
                if (!this.models.add(model)) {
                    continue;
                }

                model.on(ModelEvents.Change, this.onItemChange, this);
                model.on(ModelEvents.Destroy, this.onItemDestroy, this);
                added.push(model);
            }

            let isModified = added.length > 0;
            if (isModified) {
                this.notify(CollectionEvents.AddedItems, added);
            }

            return isModified;
        }

        /**
         *  Removes a model from the set.
         *  @returns {Boolean}
         */
        remove(model: TModel): boolean {
            return this.removeRange([model]);
        }

        /**
         *  Removes range of models.
         *  @returns {Boolean}
         */
        removeRange(models: TModel[]): boolean {
            let deleted = [];
            for (let i = 0, len = models.length; i < len; i++) {
                let model = models[i];
                if (!this.models.remove(model)) {
                    continue;
                }

                model.off(ModelEvents.Change, this.onItemChange, this);
                model.off(ModelEvents.Destroy, this.onItemDestroy, this);
                deleted.push(model);
            }

            let isModified = deleted.length > 0;
            if (isModified) {
                this.notify(CollectionEvents.DeletedItems, deleted);
            }

            return isModified;
        }

        /**
         *  Removes all models from the set.
         *  @returns {Boolean}
         */
        clear(): boolean {
            return this.removeRange(this.toArray());
        }

        /**
         *  Determines whether a model is in the collection.
         *  @returns {Boolean}
         */
        contains(model: TModel): boolean {
            return this.models.contains(model);
        }

        /**
         *  Determines whether the collection is not empty.
         *  @returns {Boolean}
         */
        any(): boolean {
            return this.size > 0;
        }

        /**
         *  Returns the models as Array.
         *  @returns {Array}
         */
        toArray(): TModel[] {
            return this.models.toArray();
        }

        /**
         *  Performs an action on each model in the set.
         */
        forEach(action: (item: TModel, index: number) => void, context: Object): void {
            this.models.forEach(action, context);
        }

        private onItemChange(item: TModel): void {
            this.notify(CollectionEvents.UpdatedItem, item);
        }

        private onItemDestroy(item: TModel): void {
            this.removeRange([item]);
        }
    }

}
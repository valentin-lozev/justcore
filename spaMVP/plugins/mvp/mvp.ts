namespace spaMVP {
    "use strict";

    import mvp = plugins.mvp;

    export interface MVPPlugin {
        Model: typeof mvp.Model;
        asModel<T>(target: T): T & mvp.Model;
        ModelEvents: {
            Change: string,
            Destroy: string
        };
        Collection: typeof mvp.Collection;
        CollectionEvents: {
            AddedItems: string,
            DeletedItems: string,
            UpdatedItem: string
        };
        View: typeof mvp.View;
        Presenter: typeof mvp.Presenter;
    }

    export interface Core {
        useMVP(): void;
        mvp: MVPPlugin;
    }

    Core.prototype.useMVP = function (): void {
        let that = <Core>this;
        if (that.mvp) {
            return;
        }

        that.mvp = {
            Model: mvp.Model,
            asModel: mvp.asModel,
            ModelEvents: mvp.ModelEvents,
            Collection: mvp.Collection,
            CollectionEvents: mvp.CollectionEvents,
            View: mvp.View,
            Presenter: mvp.Presenter,
        };
    };
}
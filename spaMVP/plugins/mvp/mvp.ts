namespace spaMVP {
    "use strict";

    import mvp = plugins.mvp;

    export interface MVPPlugin {
        Model: typeof mvp.Model;
        Collection: typeof mvp.Collection;
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
            Collection: mvp.Collection,
            View: mvp.View,
            Presenter: mvp.Presenter,
        };
    };
}
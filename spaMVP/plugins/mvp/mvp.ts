namespace spaMVP {
    "use strict";

    import hidden = spaMVP.Hidden;

    export interface MVPPlugin {
        Model: typeof hidden.Model;
        Collection: typeof hidden.Collection;
        View: typeof hidden.View;
        Presenter: typeof hidden.Presenter;
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

        let mvp: MVPPlugin = {
            Model: hidden.Model,
            Collection: hidden.Collection,
            View: hidden.View,
            Presenter: hidden.Presenter,
        };
        that.mvp = mvp;
    };
}
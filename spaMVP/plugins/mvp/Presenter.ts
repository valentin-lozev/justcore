namespace spaMVP.plugins.mvp {
    "use strict";

    /**
     *  @class spaMVP.Presenter
     */
    export class Presenter<TView extends View, TModel extends Model> {
        private _view: TView = null;
        private _model: TModel = null;
        private _modelHandlers: Object = {};

        get view(): TView {
            return this._view;
        }

        set view(value: TView) {
            if (this.view === value) {
                return;
            }

            if (this.view) {
                this.view.destroy();
            }

            this._view = value;
        }

        get model(): TModel {
            return this._model;
        }

        set model(model: TModel) {
            if (this._model === model) {
                return;
            }

            Object.keys(this._modelHandlers).forEach(type => {
                let eventHandler = this._modelHandlers[type];
                if (this._model) {
                    this._model.off(type, eventHandler, this);
                }

                if (model) {
                    model.on(type, eventHandler, this);
                }
            });

            this._model = model;
            this.render();
        }

        /**
         *  Determins which events to handle when model notifies. 
         */
        onModel(eventType: string, handler: (data?: any) => void): this {
            if (eventType && handler) {
                this._modelHandlers[eventType] = handler;
            }

            return this;
        }

        /**
         *  Renders its view.
         */
        render(): HTMLElement {
            if (this.view) {
                return this.view.render(this.model);
            }

            return null;
        }

        /**
         *  Destroys its view and model.
         */
        destroy(): void {
            this.view = null;
            this.model = null;
        }
    }

}
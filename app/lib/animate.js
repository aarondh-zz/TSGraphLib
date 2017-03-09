"use strict";
(function (LayoutState) {
    LayoutState[LayoutState["Stopped"] = 0] = "Stopped";
    LayoutState[LayoutState["Starting"] = 1] = "Starting";
    LayoutState[LayoutState["Started"] = 2] = "Started";
    LayoutState[LayoutState["Stopping"] = 3] = "Stopping";
})(exports.LayoutState || (exports.LayoutState = {}));
var LayoutState = exports.LayoutState;
var Animate = (function () {
    function Animate(_layout, _renderer) {
        this._layout = _layout;
        this._renderer = _renderer;
        this._state = LayoutState.Stopped;
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = (function () {
                return window.webkitRequestAnimationFrame ||
                    window["mozRequestAnimationFrame"] ||
                    window["oRequestAnimationFrame"] ||
                    window["msRequestAnimationFrame"] ||
                    function (/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
                        window.setTimeout(callback, 1000 / 60);
                    };
            })();
        }
    }
    Object.defineProperty(Animate.prototype, "state", {
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    Animate.prototype.step = function (onRenderStop, onRenderStart) {
        var _this = this;
        if (this._state == LayoutState.Starting) {
            this._state = LayoutState.Started;
        }
        this._layout.tick(0.03);
        this._renderer.frameStart();
        this._layout.forEachEdge(function (edge, p1, p2) {
            _this._renderer.drawEdge(edge, p1, p2);
        });
        this._layout.forEachVertex(function (vertex, p) {
            _this._renderer.drawVertex(vertex, p);
        });
        this._renderer.frameEnd();
        // stop simulation when energy of the system goes below a threshold
        if (this._state == LayoutState.Stopping || !this._layout.isReady()) {
            this._state = LayoutState.Stopped;
            ;
            if (typeof onRenderStop !== 'undefined') {
                onRenderStop();
            }
        }
        else {
            window.requestAnimationFrame(this.step.bind(this, onRenderStop, onRenderStart));
        }
    };
    Animate.prototype.start = function (onRenderStop, onRenderStart) {
        var t = this;
        if (this._state !== LayoutState.Stopped)
            return;
        this._state = LayoutState.Starting;
        if (typeof onRenderStart !== 'undefined') {
            onRenderStart();
        }
        window.requestAnimationFrame(this.step.bind(this, onRenderStop, onRenderStart));
    };
    Animate.prototype.stop = function () {
        if (this._state === LayoutState.Started) {
            this._state = LayoutState.Stopping;
        }
    };
    return Animate;
}());
exports.Animate = Animate;
//# sourceMappingURL=animate.js.map
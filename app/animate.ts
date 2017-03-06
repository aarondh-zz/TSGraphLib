
import { IEdge, IVertex } from "./graph";
import { Vector, Rectangle } from "./math";
export enum LayoutState {
    Stopped,
    Starting,
    Started,
    Stopping
}
export interface Layout<V, E> {
    tick(timestep: number): void;
    isReady(): boolean;
    forEachVertex(each: (vertex: IVertex<V>, p: Vector) => void): void
    forEachEdge(earch: (edge: IEdge<E>, p1: Vector, p2: Vector) => void): void
    getBoundingBox(): Rectangle;
}
export interface Renderer<V, E> {
    start(): void;
    end(): void;
    frameStart(): void
    drawEdge(edge: IEdge<E>, p1: Vector, p2: Vector): void;
    drawVertex(vertex: IVertex<V>, p: Vector): void;
    frameEnd(): void
}
export class Animate<V, E> {

    private _state: LayoutState = LayoutState.Stopped;
    public get state(): LayoutState {
        return this._state;
    }
    constructor(private _layout: Layout<V, E>, private _renderer: Renderer<V, E>) {
        if (!window.requestAnimationFrame) {

            window.requestAnimationFrame = (function () {

                return window.webkitRequestAnimationFrame ||
                    window["mozRequestAnimationFrame"] || // comment out if FF4 is slow (it caps framerate at ~30fps: https://bugzilla.mozilla.org/show_bug.cgi?id=630127)
                    window["oRequestAnimationFrame"] ||
                    window["msRequestAnimationFrame"] ||
                    function ( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {

                        window.setTimeout(callback, 1000 / 60);

                    };

            })();

        }

    }
    private step(onRenderStop: () => void, onRenderStart: () => void): void {

        if (this._state == LayoutState.Starting) {
            this._state = LayoutState.Started;
        }
        this._layout.tick(0.03);

        this._renderer.frameStart();

        this._layout.forEachEdge((edge, p1, p2) => {
            this._renderer.drawEdge(edge, p1, p2);
        });

        this._layout.forEachVertex((vertex, p) => {
            this._renderer.drawVertex(vertex, p);
        });

        this._renderer.frameEnd();

        // stop simulation when energy of the system goes below a threshold
        if (this._state == LayoutState.Stopping || !this._layout.isReady()) {
            this._state = LayoutState.Stopped;;
            if (typeof onRenderStop !== 'undefined') {
                onRenderStop();
            }
        }
        else {
            window.requestAnimationFrame(this.step.bind(this, onRenderStop, onRenderStart));
        }
    }
    public start(onRenderStop?: () => void, onRenderStart?: () => void): void {
        var t = this;

        if (this._state !== LayoutState.Stopped) return;
        this._state = LayoutState.Starting;

        if (typeof onRenderStart !== 'undefined') {
            onRenderStart();
        }

        window.requestAnimationFrame(this.step.bind(this, onRenderStop, onRenderStart));
    }

    public stop(): void {
        if (this._state === LayoutState.Started) {
            this._state = LayoutState.Stopping;
        }
    }

}

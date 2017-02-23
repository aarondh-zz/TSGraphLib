export interface IVertex<T> {
    id: number;
    payload: T;
}
export interface IEdge<E> {
    id: number;
    fromId: number;
    toId: number;
    payload: E;
}
export interface GraphListener {
    graphChanged() : void
}
class Edge<E> implements IEdge<E>
{
    private static _nextId = 1;
    private _id: number = Edge._nextId++;
    public get id(): number {
        return this._id;
    }
    public get fromId(): number {
        return this._fromId;
    }
    public get toId(): number {
        return this._toId;
    }
    constructor(private _fromId: number, private _toId: number, public payload: E) {
    }
}
class Vertex<V,E> implements IVertex<V>
{
    public adjacent: Edge<E>[];
    public get id(): number {
        return this._id;
    }
    constructor(private _id: number, public payload: V) {
    }
    public addEdge(toId: number, payload: E): Edge<E> {
        if (this.adjacent == null) {
            this.adjacent = [];
        }
        var edge = new Edge(this.id, toId, payload);
        this.adjacent.push(edge);
        return edge;
    }
}
export class Graph<V, E> {
    private _vertices: Vertex<V, E>[];
    private _listeners: GraphListener[] = [];
    constructor() {
        this.clear();
    }
    protected notify(): void {
        this._listeners.forEach((listener) => {
            try {
                listener.graphChanged();
            }
            catch (err) {

            }
        });
    }
    public clear(): void {
        this._vertices = [];
        this.notify();
    }
    public get vertices(): number {
        return this._vertices.length;
    }
    public addVertex(payload: V): IVertex<V> {
        var vertex = new Vertex<V, E>(this._vertices.length, payload);
        this._vertices.push(vertex);
        this.notify();
        return vertex;
    }
    public getVertex(id: number): Vertex<V, E> {
        if (id < 0 || id >= this._vertices.length) {
            throw "Vertex " + id + " does not exists in this graph";
        }
        return this._vertices[id];
    }
    public getEdges(fromId: number, toId: number): IEdge<E>[] {
        var edges: IEdge<E>[] = [];
        var vertex = this.getVertex(fromId);
        vertex.adjacent.forEach((edge) => {
            edges.push(edge);
        });
        return edges;
    }
    public addEdge(fromId: number, toId: number, payload?: E) : IEdge<E> {
        var fromVertex = this.getVertex(fromId);

        var toVertex = this.getVertex(toId);

        var edge = fromVertex.addEdge(toId, payload);

        this.notify();

        return edge;
    }
    public forEachVertex(each: (vertex: IVertex<V>) => any) {
        for (var i = 0; i < this._vertices.length; i++) {
            var result = each(this._vertices[i]);
            if (typeof result === 'boolean') {
                if (!result) {
                    return;
                }
            }
        }
    }
    public forEachEdge(each: (edge: IEdge<E>) => any) {
        this.forEachVertex((vertex: Vertex<V,E>) =>{
            if (vertex.adjacent) {
                vertex.adjacent.forEach(edge => {
                    var result = each(edge);
                    if (typeof result === 'boolean') {
                        if (!result) {
                            return false;
                        }
                    }
                });
            }
        });
    }
    public forEachVertexBreadthFirst(startId: number, each: (vertex: IVertex<V>) => void): void {
        var vertex = this.getVertex(startId); //validate

        var visited: boolean[] = [];

        var vertices: number[] = [];

        var index = 0;

        visited[startId] = true;

        vertices.push(startId);

        while (index < vertices.length) {
            var vertexId = vertices[index++];
            var vertex = this.getVertex(vertexId);
            var result = each(vertex);
            if (typeof result === 'boolean') {
                if (!result) {
                    return;
                }
            }

            var adjacent = vertex.adjacent;
            if (adjacent) {
                adjacent.forEach((edge) => {
                    if (!visited[edge.toId]) {
                        visited[edge.toId] = true;
                        vertices.push(edge.toId);
                    }
                });
            }
        }
    }
    private _forEachVertexDF(id: number, each: (vertex: IVertex<V>) => any, visited: boolean[]): boolean {
        var vertex = this.getVertex(id);
        visited[id] = true;
        var result = each(vertex);
        if (typeof result === 'boolean') {
            if (!result) {
                return false;
            }
        }
        var adjacent = vertex.adjacent;
        if (adjacent) {
            adjacent.forEach((edge) => {
                if (!visited[edge.toId]) {
                    if (!this._forEachVertexDF(edge.toId, each, visited)) {
                        return false;
                    }
                }
            });
        }
        return true;
    }
    public forEachVertexDepthFirst(startId: number, each: (vertex: IVertex<V>) => any): void {
        this._forEachVertexDF(startId, each, []);
    }

}
export interface Layout<V,E> {
    tick(timestep: number): void;
    isReady(): boolean;
    forEachVertex(each:(vertex: IVertex<V>, p: Position)=>void): void
    forEachEdge(earch:(edge: IEdge<E>, p1: Position, p2: Position)=>void): void
}
interface Nearest<V> {
    vertex?: IVertex<V>
    position?: Position;
    distance?: number
}
interface Position {
    x: number;
    y: number;
}
interface BoundingBox {
    bottomLeft: Position;
    topRight: Position
}
class Vector implements Position {
    constructor( public x:number, public y:number) {
	}

    public static random(): Vector {
        return new Vector(10.0 * (Math.random() - 0.5), 10.0 * (Math.random() - 0.5));
    }

    public add(v2: Vector): Vector {
        return new Vector(this.x + v2.x, this.y + v2.y);
    }

    public subtract(v2:Vector): Vector {
        return new Vector(this.x - v2.x, this.y - v2.y);
    }

    public multiply(n:number): Vector {
        return new Vector(this.x * n, this.y * n);
    }

    public divide(n: number): Vector  {
        return new Vector((this.x / n) || 0, (this.y / n) || 0); // Avoid divide by zero errors..
    }

    public magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public normal(): Vector {
        return new Vector(-this.y, this.x);
    }

    public normalise() {
        return this.divide(this.magnitude());
    }
}

class Point {
    public velocity: Vector;
    public acceleration: Vector;
    constructor(public position: Vector, public mass: number) {
        this.velocity = new Vector(0, 0);
        this.acceleration = new Vector(0, 0);
    };

    public applyForce(force: Vector): void {
        this.acceleration = this.acceleration.add(force.divide(this.mass));
    };
}
class Spring {
    constructor(public point1: Point, public point2: Point, public length:number, public k: number) {
    }
}

export class ForceDirected<V, E> implements Layout<V,E> {
    private _points: { [key: string]: Point };
    private _springs: { [key: string]: Spring };
    constructor(
        public graph: Graph<V, E>,
        public stiffness: number,
        public repulsion: number,
        public damping: number,
        public minEnergyThreshold: number = 0.01,
        public maxSpeed: number = Infinity) {
        this._points = {};
        this._springs = {};
    }

    //return a spring for an edge
    private getSpring(edge: IEdge<E>): Spring {
        if (!(edge.id in this._springs)) {
            var length = (edge.payload["length"] !== undefined) ? edge.payload["length"] : 1.0;

            var existingSpring: Spring = null;

            var from = this.graph.getEdges(edge.fromId, edge.toId);
            from.forEach(function (e) {
                if (existingSpring === null && e.id in this._springs) {
                    existingSpring = this._springs[e.id];
                }
            }, this);

            if (existingSpring !== null) {
                return new Spring(existingSpring.point1, existingSpring.point2, 0.0, 0.0);
            }

            var to = this.graph.getEdges(edge.toId, edge.fromId);
            from.forEach(function (e) {
                if (existingSpring === null && e.id in this._springs) {
                    existingSpring = this._springs[e.id];
                }
            }, this);

            if (existingSpring !== null) {
                return new Spring(existingSpring.point2, existingSpring.point1, 0.0, 0.0);
            }

            this._springs[edge.id] = new Spring(
                this.getPoint(this.graph.getVertex(edge.fromId)), this.getPoint(this.graph.getVertex(edge.toId)), length, this.stiffness
            );
        }

        return this._springs[edge.id];
    }

    //return the point for a vector

    public getPoint(vertex: IVertex<V>): Point {
        if (!(vertex.id in this._points)) {
            var mass = (vertex.payload["mass"] !== undefined) ? vertex.payload["mass"] : 1.0;
            this._points[vertex.id] = new Point(Vector.random(), mass);
        }

        return this._points[vertex.id];
    }

    private forEachVertexPoint(each: (vertex: IVertex<V>, point: Point) => void): void {
        this.graph.forEachVertex((vertex) => {
            each(vertex, this.getPoint(vertex));
        });
    }

    private forEachEdgeSpring(each: (edge: IEdge<E>, spring: Spring) => void): void {
        this.graph.forEachEdge((edge) => {
            each(edge, this.getSpring(edge));
        });
    }
    private applyCoulombsLaw() {
        this.forEachVertexPoint(function (v1, point1) {
            this.forEachVertexPoint(function (v2, point2) {
                if (point1 !== point2) {
                    var d = point1.position.subtract(point2.position);
                    var distance = d.magnitude() + 0.1; // avoid massive forces at small distances (and divide by zero)
                    var direction = d.normalise();

                    // apply force to each end point
                    point1.applyForce(direction.multiply(this.repulsion).divide(distance * distance * 0.5));
                    point2.applyForce(direction.multiply(this.repulsion).divide(distance * distance * -0.5));
                }
            });
        });
    }
    private applyHookesLaw () {
        this.forEachEdgeSpring(function (edge, spring) {
            var d = spring.point2.position.subtract(spring.point1.position); // the direction of the spring
            var displacement = spring.length - d.magnitude();
            var direction = d.normalise();

            // apply force to each end point
            spring.point1.applyForce(direction.multiply(spring.k * displacement * -0.5));
            spring.point2.applyForce(direction.multiply(spring.k * displacement * 0.5));
        });
    }
    private attractToCentre() {
        this.forEachVertexPoint(function (vertex, point) {
            var direction = point.position.multiply(-1.0);
            point.applyForce(direction.multiply(this.repulsion / 50.0));
        });
    }
    private updateVelocity(timestep:number) {
        this.forEachVertexPoint((vertex, point) => {
            point.velocity = point.velocity.add(point.acceleration.multiply(timestep)).multiply(this.damping);
            if (point.velocity.magnitude() > this.maxSpeed) {
                point.velocity = point.velocity.normalise().multiply(this.maxSpeed);
            }
            point.acceleration = new Vector(0, 0);
        });
    }
    private updatePosition(timestep: number) {
        this.forEachVertexPoint((vertex, point) => {
            point.position = point.position.add(point.velocity.multiply(timestep));
        });
    }
    private totalEnergy() {
        var energy = 0.0;
        this.forEachVertexPoint((vertex, point)=>{
            var speed = point.velocity.magnitude();
            energy += 0.5 * point.mass * speed * speed;
        });

        return energy;
    }
    public tick(timestep:number) {
        this.applyCoulombsLaw();
        this.applyHookesLaw();
        this.attractToCentre();
        this.updateVelocity(timestep);
        this.updatePosition(timestep);
    }
    public isReady(): boolean {
        return this.totalEnergy() > this.minEnergyThreshold
    }
    public forEachVertex(each: (vertex: IVertex<V>, p: Position) => void): void {
        this.forEachVertexPoint((vertex, point) => {
            each(vertex, point.position);
        });
    }

    public forEachEdge(each: (edge: IEdge<E>, p1: Position, p2: Position) => void): void {
        this.forEachEdgeSpring((edge,spring) => {
            each(edge, spring.point1.position, spring.point2.position );
        });
    }
    public nearest(position: { x: number, y: number }): Nearest<V> {
        var min: Nearest<V> = {}
        var t = this;
        this.forEachVertexPoint(function (vertex, point) {
            var distance = point.position.subtract(position as Vector).magnitude();

            if (min.distance === null || distance < min.distance) {
                min = { vertex: vertex, position: point.position, distance: distance };
            }
        });

        return min;
    }
    public getBoundingBox(): BoundingBox {
        var bottomLeft = new Vector(-2, -2);
        var topRight = new Vector(2, 2);

        this.forEachVertexPoint((vector, point) => {
            if (point.position.x < bottomLeft.x) {
                bottomLeft.x = point.position.x;
            }
            if (point.position.y < bottomLeft.y) {
                bottomLeft.y = point.position.y;
            }
            if (point.position.x > topRight.x) {
                topRight.x = point.position.x;
            }
            if (point.position.y > topRight.y) {
                topRight.y = point.position.y;
            }
        });

        var padding = topRight.subtract(bottomLeft).multiply(0.07); // ~5% padding

        return { bottomLeft: bottomLeft.subtract(padding), topRight: topRight.add(padding) };
    }
}
export enum LayoutState {
    Stopped,
    Starting,
    Started,
    Stopping
}
function __bind(fn, me): any {
    return function () { return fn.apply(me, arguments); };
}
export interface Renderer<V,E> {
    frameStart(): void
    drawEdge(edge: IEdge<E>, p1: Position, p2: Position): void;
    drawVertex(vertex: IVertex<V>, p: Position): void;
    frameEnd(): void
}
export class Animate<V,E> {
    
    private _state: LayoutState = LayoutState.Stopped;
    public get state(): LayoutState {
        return this._state;
    }
    constructor(private _element: any, private _layout: Layout<V,E>, private _renderer: Renderer<V, E>) {

    }
    private requestAnimationFrame(element: any, callback: () => void) {
        return callback.bind(element.requestAnimationFrame ||
            element.webkitRequestAnimationFrame ||
            element.mozRequestAnimationFrame ||
            element.oRequestAnimationFrame ||
            element.msRequestAnimationFrame ||
            (function (callback, element) {
                this.setTimeout(callback, 10);
            }), this);
    }
    private step(render: () => void, onRenderStop: () => void, onRenderStart: () => void): void {

        if (this._state == LayoutState.Starting) {
            this._state = LayoutState.Started;
        }
        this._layout.tick(0.03);

        this._renderer.frameStart();

        this._layout.forEachEdge( (edge, p1, p2) => {
            this._renderer.drawEdge(edge, p1, p2);
        });

        this._layout.forEachVertex((vertex, p) => {
            this._renderer.drawVertex(vertex, p);
        });

        this._renderer.frameEnd();

        // stop simulation when energy of the system goes below a threshold
        if (this._state == LayoutState.Stopping || !this._layout.isReady()) {
            this._state = LayoutState.Stopped;;
            if (onRenderStop !== undefined) {
                onRenderStop();
            }
        }
        else {
            this.requestAnimationFrame(this._element, this.step.bind(this, render, onRenderStop, onRenderStart) );
        }
    }
    public start(onRenderStop: () => void, onRenderStart:() => void): void {
        var t = this;

        if (this._state !== LayoutState.Stopped) return;
        this._state = LayoutState.Starting;

        if (typeof onRenderStart !== undefined) {
            onRenderStart();
        }

        this.requestAnimationFrame(this._element, this.step.bind(this, onRenderStop, onRenderStart));
    }

}

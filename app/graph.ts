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

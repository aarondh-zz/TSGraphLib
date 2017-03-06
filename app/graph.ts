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
export interface VertexComparer<T> {
    (a: IVertex<T>, b: IVertex<T>): number;
}
export interface VertexEquality<T> {
    (a: IVertex<T>, b: IVertex<T>): boolean;
}
export interface VertexFilter<T> {
    (vertex: IVertex<T>): boolean;
}
export interface EdgeComparer<E> {
    (a: IEdge<E>, b: IEdge<E>): number;
}
export interface EdgeEquality<E> {
    (a: IEdge<E>, b: IEdge<E>): boolean;
}
export interface EdgeFilter<E> {
    (edge: IEdge<E>): boolean;
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
    public addEdge(toId: number, payload: E, allowDuplicates: boolean = true): Edge<E> {
        if (this.adjacent == null) {
            this.adjacent = [];
        }
        if (!allowDuplicates) {
            for (let i = 0; i < this.adjacent.length; i++) {
                let existingEdge = this.adjacent[i];
                if (existingEdge.toId === toId) {
                    return existingEdge;
                }
            }
        }
        var edge = new Edge(this.id, toId, payload);
        this.adjacent.push(edge);
        return edge;
    }
}
export interface IGraph<V, E> {
    vertices: IVertex<V>[];
    edges: IEdge<E>[];
}
export class Graph<V, E> {
    private _vertices: Vertex<V, E>[];
    private _listeners: GraphListener[] = [];
    constructor() {
        this.clear();
    }
    public get vertexCount(): number {
        return this._vertices.length;
    }
    public get vertices(): IVertex<V>[] {
        return this._vertices;
    }
    public get edges(): IEdge<E>[] {
        let edges: IEdge<E>[] = [];
        this.forEachEdge((edge) => {
            edges.push(edge);
        })
        return edges;
    }
    public get edgeCount(): number {
        let count: number = 0;
        this.forEachEdge((edge) => {
            count++;
        });
        return count;
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
            if (edge.toId === toId) {
                edges.push(edge);
            }
        });
        return edges;
    }
    public addEdge(fromId: number, toId: number, payload?: E, allowDuplicates: boolean = true) : IEdge<E> {
        var fromVertex = this.getVertex(fromId);

        var toVertex = this.getVertex(toId);

        var edge = fromVertex.addEdge(toId, payload, allowDuplicates);

        this.notify();

        return edge;
    }
    public merge(graph: { vertices: IVertex<V>[], edges: IEdge<E>[] }, equality: VertexEquality<V> ) {

        var vertices = {};

        graph.vertices.forEach(function (vertex) {
            let matches = this.filterVertices(equality);
            if (matches.length > 0) {
                vertices[vertex.id] = matches[0];
            }
            else {
                vertices[vertex.id] = this.addVertex(vertex.payload);
            }

        }, this);

        graph.edges.forEach(function (edge) {

            var from = vertices[edge.fromId];

            var to = vertices[edge.toId];

            var newEdge = this.addEdge(from.id, to.id, edge.payload, false);

        }, this);

    };

    public filterVertices(filter: VertexFilter<V>): IVertex<V>[] {
        var matching: IVertex<V>[] = [];
        this.forEachVertex((vertex) => {
            if (filter(vertex)) {
                matching.push(vertex);
            }
        });
        return matching;
    }
    public filterEdges(filter: EdgeFilter<E>): IEdge<E>[] {
        var matching: IEdge<E>[] = [];
        this.forEachEdge((edge) => {
            if (filter(edge)) {
                matching.push(edge);
            }
        });
        return matching;
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

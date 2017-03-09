import { objectAssign } from "./utils";
export interface IVertex<T> {
    id: number;
    payload: T;
}
export interface IEdge<E> {
    id: number;
    fromId: number;
    toId: number;
    payload?: E;
}
export interface GraphListener {
    graphChanged() : void
}
export interface VertexComparer<T> {
    (a: IVertex<T>, b: IVertex<T>): number;
}
export interface VertexFilter<T> {
    (vertex: IVertex<T>): boolean;
}
export interface VertexKeyGenerator<T> {
    (vertex: IVertex<T>): string;
}
export interface EdgeComparer<E> {
    (a: IEdge<E>, b: IEdge<E>): number;
}
export interface EdgeFilter<E> {
    (edge: IEdge<E>): boolean;
}
/* Cost Provider
 *
 *   provides the cost of traversing one edge/vertex
 *   note that the initial edge may have a null payload
 *
 */
export interface CostProvider<V, E> {
    (edge: IEdge<E>, vertex: IVertex<V>): number;
}
/* PathBetweenOptions
 *
 * options provided to the pathBetween method
 *
 *    for details see pathBetween
 *
 */
export interface PathBetweenOptions<V, E> {
    longest?: boolean;
    costProvider?: CostProvider<V,E>;
    unusedEdges?: IEdge<E>[],
    unusedVertices?: IVertex<V>[]
}
/*    Edge<E>
 *
 *    an Graph internal representation of an IEdge<E>
 *
 */
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
    constructor(private _fromId: number, private _toId: number, public payload?: E) {
    }
}
/*   Vertex<V,E>
 *
 *    an Graph internal representation of an IVertex<V>
 *
 */
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

        this.unremoveEdge(edge); //make sure it is not flagged as removed

        this.notify();

        return edge;
    }
    public removeEdge(edge: IEdge<E>) {
        edge["$removed"] = true;
    }
    public isRemovedEdge(edge: IEdge<E>) {
        return edge["$removed"] === true;
    }
    public unremoveEdge(edge: IEdge<E>) {
        if (edge["$removed"]) {
            delete edge["$removed"];
        };
    }
    public unremoveAllEdges() {
        this.forEachEdge((edge) => {
            this.unremoveEdge(edge);
        }, true);
    }
    public roots(): IVertex<V>[] {
        let roots: IVertex<V>[] = [];
        let candidates: { [id: string]: IVertex<V> } = {};
        this._vertices.forEach((vertex) => {
            candidates[vertex.id] = vertex;
        });
        this.forEachEdge((edge) => {
            delete candidates[edge.toId];
        });
        for (let key in candidates) {
            roots.push(candidates[key])
        }
        return roots;
    }
    public leafs(): IVertex<V>[] {
        let leafs: IVertex<V>[] = [];
        this._vertices.forEach((vertex) => {
            if (!vertex.adjacent || vertex.adjacent.length == 0) {
                leafs.push(vertex);
            }
        });
        return leafs;
    }
    // A recursive function used by longestPath. See below link for details
    // http://www.geeksforgeeks.org/topological-sorting/
    public topologicalSortUtil(vertexId: number, stack: number[], visited: boolean[])
    {
        visited[vertexId] = true;
 
        let vertex = this.getVertex(vertexId);
        if (vertex.adjacent) {
            vertex.adjacent.forEach((edge) => {
                if (!visited[edge.toId]) {
                    let adjacentVertex = this.getVertex(edge.toId);
                    this.topologicalSortUtil(edge.toId, stack, visited)
                }

            });
        }

        stack.push(vertexId);
    }
    // The function to find longest distances from a given vertex. It uses
    // recursive topologicalSortUtil() to get topological sorting.
    public longestPath(startId: number, each: (vertex: IVertex<V>, cost: number) => void, costProvider?: CostProvider<V,E>) {
        let stack: number[] = [];
        let cost: number[] = [];

        let visited: boolean[] = [];

        if (!costProvider) {
            costProvider = (edge, vertex) => { return 1.0 };
        }

        // Call the recursive helper function to store Topological Sort
        // starting from all vertices's one by one
        for (let id = 0; id < this._vertices.length; id++) {
            if (!visited[id]) {
                this.topologicalSortUtil(id, stack, visited);
            }
        }

        // Initialize distances to all vertices as infinite and distance
        // to source as 0
        for (let id = 0; id < this._vertices.length; id++) {
            cost[id] = Infinity;
        }
        cost[startId] = 0;

        // Process vertices in topological order
        while (stack.length > 0) {
            // Get the next vertex from topological order
            let next = stack.pop();

            // Update distances of all adjacent vertices's
            if (cost[next] !== Infinity) {
                let vertex = this.getVertex(next);
                let adjacent = vertex.adjacent;
                if (adjacent) {
                    for (let i = 0; i < adjacent.length; i++) {
                        let edge = adjacent[i];
                        let length = costProvider(edge,this.getVertex(edge.toId));
                        if (cost[edge.toId] < cost[next] + length) {
                            cost[edge.toId] = cost[next] + length;
                        }
                    }
                }
            }
        }
        for (let id = 0; id < this._vertices.length; id++) {
            each(this.getVertex(id), cost[id]);
        }
    }
    public getEdgeCount(vertexId:number) {
        let edges = 0;
        let vertex = this.getVertex(vertexId);
        let adjacent = vertex.adjacent;
        if (adjacent) {
            for (let i = 0; i < adjacent.length; i++) {
                let edge = adjacent[i];
                if (!this.isRemovedEdge(edge)) {
                    edges++;
                }
            }
        }
        return edges;
    }
    /* pathBetweenUtil
     *
     *    an internal function used by pathBetween
     *
     *    parameters:
     *
     *       edge: the edge being traversed
     *
     *       editId: the id of the ending vertex
     *
     *       cost: the cost of traversal so far
     *
     *       path:  an array of edges travelled so far
     *
     *       context: see pathBetween options
     *
     *   returns:
     *
     *       the total cost of traversing the path returned in the path array
     *
     *       if Infinity, the ending vertex could not be reached
     */
    private pathBetweenUtil(edge:IEdge<E>, endId: number, cost: number, path: IEdge<E>[], context: PathBetweenOptions<V,E>): number {
        let vertex = this.getVertex(edge.toId);
        path.push(edge);
        cost += context.costProvider(edge, vertex);
        if (edge.toId == endId) {
            return cost;
        }
        let adjacent = vertex.adjacent;
        if (adjacent) {
            let selectedDistance = context.longest? -Infinity: Infinity;
            let selectedPath: IEdge<E>[];
            let selectedEdge: IEdge<E> = null;
            for (let i = 0; i < adjacent.length; i++) {
                let edge = adjacent[i];
                if (!this.isRemovedEdge(edge)) {
                    this.removeEdge(edge);
                    let nextPath:IEdge<E>[] = [];
                    let result = this.pathBetweenUtil(edge, endId, cost, nextPath, context);
                    if (result !== Infinity) {
                        if (context.longest && selectedDistance < result) {
                            if (selectedEdge) {
                                context.unusedEdges.push(selectedEdge);
                            }
                            selectedPath = nextPath;
                            selectedDistance = result;
                            selectedEdge = edge;
                        }
                        else if (!context.longest && selectedDistance > result) {
                            if (selectedEdge) {
                                context.unusedEdges.push(selectedEdge);
                            }
                            selectedPath = nextPath;
                            selectedDistance = result;
                            selectedEdge = edge;
                       }
                       else {
                           context.unusedEdges.push(edge);
                       }
                        
                    }
                    this.unremoveEdge(edge);
                }
            }
            if (selectedPath) {
                for (let i = 0; i < selectedPath.length; i++) {
                    path.push(selectedPath[i]);
                }
                return cost + selectedDistance;
            }
        }
        return Infinity;
    }
    /*
     * pathBetween
     *
     * A brute force graph walking algorithm to walk the longest or shortest path between two vertices's
     *
     * it optionally returns an array of unused viable edges and/or an array of unused vertices's
     *
     * parameters:
     *
     *    startId:  the id of the starting vertex
     *
     *    endId: the id of the ending vertex
     *
     *    each: callback function to receive each edge traversed in the winning path
     *
     *    options: an array of PathBetweenOptions as follows:
     *
     *          options.longest:  if true the longest path with be followed, else shortest (default: true)
     *
     *          options.unusedEdges: an array that accumulates all unused viable edges
     *
     *          options.unusedVertices:  an array of all vertices's not visited in the winning path
     *
     *          options.costProvider: a callback function that returns the cost of traversing one edge/vertex
     *
     *   returns:
     *
     *       the total cost of traversing the winning path
     *
     *       if Infinity, the ending vertex could not be reached
     */
    public pathBetween(startId: number, endId: number, each: (edge: IEdge<E>) =>void = null, options?: PathBetweenOptions<V,E> ): number {
        var path: IEdge<E>[] = [];

        var context = objectAssign<PathBetweenOptions<V, E>>({}, {
            longest: true,
            costProvider: (edge,vertex) => { return 1.0; },
            unusedEdges: []
        }, options);

        context.unusedEdges.splice(0, context.unusedEdges.length);

        let cost = this.pathBetweenUtil({ id: -1, fromId: -1, toId: startId }, endId, 0, path, context);

        if (each) {
            path.forEach(each);
        }

        if (context.unusedVertices) {
           var visited: boolean[] = [];
           visited[startId] = true;
           for (let i = 0; i < path.length; i++) {
                visited[path[i].toId] = true;
            }
            for (let id = 0; id < this._vertices.length; id++) {
                if (!visited[id]) {
                    context.unusedVertices.push(this.getVertex(id));
                }
            }
        }
        return cost;
    }
    //mark all other edges in the vertex containing unused edges as removed
    public markUnused(unused: IEdge<E>[]) : void {
        if (unused) {
            let cleared: boolean[] = [];
            unused.forEach((unusedEdge) => {
                let vertex = this.getVertex(unusedEdge.fromId);
                if (!cleared[vertex.id]) {
                    if (vertex.adjacent) {
                        vertex.adjacent.forEach((edge) => {
                            this.removeEdge(edge);
                        });
                    }
                    cleared[vertex.id] = true;
                }
                this.unremoveEdge(unusedEdge);
            });
        }
    }
    public merge(graph: { vertices: IVertex < V > [], edges: IEdge < E > [] }, keyGenerator: VertexKeyGenerator<V>) {

        var vertices = [];  //map incoming to new vertices

        var existingVertices: { [key: string]: IVertex<V> } = {}; //existing vertices by key

        this._vertices.forEach(function (vertex) {
            existingVertices[keyGenerator(vertex)] = vertex;
        });

        graph.vertices.forEach(function (vertex) {
            let key = keyGenerator(vertex);
            let existingVertex = existingVertices[key];
            if (existingVertex ) {
                vertices[vertex.id] = existingVertex;
            }
            else {
                let newVertex = this.addVertex(vertex.payload);
                existingVertices[key] = vertices[vertex.id] = newVertex;
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
    public forEachEdge(each: (edge: IEdge<E>) => any, all: boolean = false) {
        this.forEachVertex((vertex: Vertex<V,E>) =>{
            if (vertex.adjacent) {
                vertex.adjacent.forEach(edge => {
                    if ( all || !this.isRemovedEdge(edge))
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
    public forEachVertexBreadthFirst(startId: number, each: (vertex: IVertex<V>, edge?: IEdge<E>) => void, all: boolean = false): void {
        var vertex = this.getVertex(startId); //validate

        var visited: boolean[] = [];

        var travelledEdges: IEdge<E>[] = [];

        var index = 0;

        visited[startId] = true;

        travelledEdges.push({ id: -1, fromId:-1, toId: startId });

        while (index < travelledEdges.length) {
            var travelled = travelledEdges[index++];
            var vertex = this.getVertex(travelled.toId);
            var result = each(vertex, travelled);
            if (typeof result === 'boolean') {
                if (!result) {
                    return;
                }
            }

            var adjacent = vertex.adjacent;
            if (adjacent) {
                adjacent.forEach((edge) => {
                    if (all || !this.isRemovedEdge(edge)) {
                        if (!visited[edge.toId]) {
                            visited[edge.toId] = true;
                            travelledEdges.push(edge);
                        }
                    }
                });
            }
        }
    }
    private _forEachVertexDF(travelled: IEdge<E>, each: (vertex: IVertex<V>, edge?: IEdge<E>) => any, all:boolean, visited: boolean[]): boolean {
        var vertex = this.getVertex(travelled.toId);
        visited[vertex.id] = true;
        var result = each(vertex, travelled);
        if (typeof result === 'boolean') {
            if (!result) {
                return false;
            }
        }
        var adjacent = vertex.adjacent;
        if (adjacent) {
            for (let i = 0; i < adjacent.length; i++) {
                let edge = adjacent[i];
                if (all || !this.isRemovedEdge(edge)) {
                    if (!visited[edge.toId]) {
                        if (!this._forEachVertexDF(edge, each, all, visited)) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }
    public forEachVertexDepthFirst(startId: number, each: (vertex: IVertex<V>, edge?: IEdge<E>) => any, all: boolean = false): void {
        this._forEachVertexDF({ id: -1, fromId: -1, toId: startId }, each, all, []);
    }
    public dfsCount(vertexId: number): number {
        var count = 0;
        this.forEachVertexDepthFirst(vertexId, (vertex) => {
            count++;
        })
        return count;
    }
    public eulerTour(startId: number, each: (vertex: IVertex<V>) => any, ) {
        if (startId < 0) {
            // Find a vertex with odd degree
            var oddDegreeVertexId = -1;
            for (let id = 0; id < this._vertices.length; id++) {
                let vertex = this._vertices[id];
                if (vertex.adjacent && vertex.adjacent.length & 1) {
                    oddDegreeVertexId = id;
                    break;
                }
            }
            startId = oddDegreeVertexId;
        }

        this.eulerTourUtil(startId, each);

        this.unremoveAllEdges();
    }
    private eulerTourUtil(startId: number, each: (vertex: IVertex<V>) => any): boolean {
        var vertex = this.getVertex(startId);
        let result = each(vertex);
        if (typeof result === 'boolean') {
            if (!result) {
                return false;
            }
        }
        var adjacent = vertex.adjacent;
        if (adjacent) {
            for (let i = 0; i < adjacent.length; i++) {
                let edge = adjacent[i];
                if (!this.isRemovedEdge(edge) && this.isValidNextEulerTourEdge(edge)) {
                    let to = this.getVertex(edge.toId);
                    this.removeEdge(edge);
                    if (!this.eulerTourUtil(to.id, each)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    // The edge is valid in one of the following two cases:
    // case 1: If edge is the only adjacent vertex 
    // case 2: If there are multiple adjacent vertices's, and edge is not a bridge
    private isValidNextEulerTourEdge(edge: IEdge<E>): boolean {
        let isThisOnlyOne = true;
        let adjacent = this.getVertex(edge.fromId).adjacent;
        if (adjacent) {
            for (let i = 0; i < adjacent.length; i++) {
                let edgeOther = adjacent[i];
                if (edge !== edgeOther && !this.isRemovedEdge(edgeOther)) {
                    isThisOnlyOne = false;
                    break;
                }
            }
        }
        if (isThisOnlyOne) {
            return true;
        }


        return !this.isABridge(edge);
    }
    
    private isABridge(edge: IEdge<E>): boolean {

        let reachableCount1 = this.dfsCount(edge.fromId);

        this.removeEdge(edge);

        let reachableCount2 = this.dfsCount(edge.fromId);

        this.unremoveEdge(edge);

        return (reachableCount1 > reachableCount2);
    }
}

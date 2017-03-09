"use strict";
var utils_1 = require("./utils");
/*    Edge<E>
 *
 *    an Graph internal representation of an IEdge<E>
 *
 */
var Edge = (function () {
    function Edge(_fromId, _toId, payload) {
        this._fromId = _fromId;
        this._toId = _toId;
        this.payload = payload;
        this._id = Edge._nextId++;
    }
    Object.defineProperty(Edge.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Edge.prototype, "fromId", {
        get: function () {
            return this._fromId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Edge.prototype, "toId", {
        get: function () {
            return this._toId;
        },
        enumerable: true,
        configurable: true
    });
    Edge._nextId = 1;
    return Edge;
}());
/*   Vertex<V,E>
 *
 *    an Graph internal representation of an IVertex<V>
 *
 */
var Vertex = (function () {
    function Vertex(_id, payload) {
        this._id = _id;
        this.payload = payload;
    }
    Object.defineProperty(Vertex.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    Vertex.prototype.addEdge = function (toId, payload, allowDuplicates) {
        if (allowDuplicates === void 0) { allowDuplicates = true; }
        if (this.adjacent == null) {
            this.adjacent = [];
        }
        if (!allowDuplicates) {
            for (var i = 0; i < this.adjacent.length; i++) {
                var existingEdge = this.adjacent[i];
                if (existingEdge.toId === toId) {
                    return existingEdge;
                }
            }
        }
        var edge = new Edge(this.id, toId, payload);
        this.adjacent.push(edge);
        return edge;
    };
    return Vertex;
}());
var Graph = (function () {
    function Graph() {
        this._listeners = [];
        this.clear();
    }
    Object.defineProperty(Graph.prototype, "vertexCount", {
        get: function () {
            return this._vertices.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Graph.prototype, "vertices", {
        get: function () {
            return this._vertices;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Graph.prototype, "edges", {
        get: function () {
            var edges = [];
            this.forEachEdge(function (edge) {
                edges.push(edge);
            });
            return edges;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Graph.prototype, "edgeCount", {
        get: function () {
            var count = 0;
            this.forEachEdge(function (edge) {
                count++;
            });
            return count;
        },
        enumerable: true,
        configurable: true
    });
    Graph.prototype.notify = function () {
        this._listeners.forEach(function (listener) {
            try {
                listener.graphChanged();
            }
            catch (err) {
            }
        });
    };
    Graph.prototype.clear = function () {
        this._vertices = [];
        this.notify();
    };
    Graph.prototype.addVertex = function (payload) {
        var vertex = new Vertex(this._vertices.length, payload);
        this._vertices.push(vertex);
        this.notify();
        return vertex;
    };
    Graph.prototype.getVertex = function (id) {
        if (id < 0 || id >= this._vertices.length) {
            throw "Vertex " + id + " does not exists in this graph";
        }
        return this._vertices[id];
    };
    Graph.prototype.getEdges = function (fromId, toId) {
        var edges = [];
        var vertex = this.getVertex(fromId);
        vertex.adjacent.forEach(function (edge) {
            if (edge.toId === toId) {
                edges.push(edge);
            }
        });
        return edges;
    };
    Graph.prototype.addEdge = function (fromId, toId, payload, allowDuplicates) {
        if (allowDuplicates === void 0) { allowDuplicates = true; }
        var fromVertex = this.getVertex(fromId);
        var toVertex = this.getVertex(toId);
        var edge = fromVertex.addEdge(toId, payload, allowDuplicates);
        this.unremoveEdge(edge); //make sure it is not flagged as removed
        this.notify();
        return edge;
    };
    Graph.prototype.removeEdge = function (edge) {
        edge["$removed"] = true;
    };
    Graph.prototype.isRemovedEdge = function (edge) {
        return edge["$removed"] === true;
    };
    Graph.prototype.unremoveEdge = function (edge) {
        if (edge["$removed"]) {
            delete edge["$removed"];
        }
        ;
    };
    Graph.prototype.unremoveAllEdges = function () {
        var _this = this;
        this.forEachEdge(function (edge) {
            _this.unremoveEdge(edge);
        }, true);
    };
    Graph.prototype.roots = function () {
        var roots = [];
        var candidates = {};
        this._vertices.forEach(function (vertex) {
            candidates[vertex.id] = vertex;
        });
        this.forEachEdge(function (edge) {
            delete candidates[edge.toId];
        });
        for (var key in candidates) {
            roots.push(candidates[key]);
        }
        return roots;
    };
    Graph.prototype.leafs = function () {
        var leafs = [];
        this._vertices.forEach(function (vertex) {
            if (!vertex.adjacent || vertex.adjacent.length == 0) {
                leafs.push(vertex);
            }
        });
        return leafs;
    };
    // A recursive function used by longestPath. See below link for details
    // http://www.geeksforgeeks.org/topological-sorting/
    Graph.prototype.topologicalSortUtil = function (vertexId, stack, visited) {
        var _this = this;
        visited[vertexId] = true;
        var vertex = this.getVertex(vertexId);
        if (vertex.adjacent) {
            vertex.adjacent.forEach(function (edge) {
                if (!visited[edge.toId]) {
                    var adjacentVertex = _this.getVertex(edge.toId);
                    _this.topologicalSortUtil(edge.toId, stack, visited);
                }
            });
        }
        stack.push(vertexId);
    };
    // The function to find longest distances from a given vertex. It uses
    // recursive topologicalSortUtil() to get topological sorting.
    Graph.prototype.longestPath = function (startId, each, costProvider) {
        var stack = [];
        var cost = [];
        var visited = [];
        if (!costProvider) {
            costProvider = function (edge, vertex) { return 1.0; };
        }
        // Call the recursive helper function to store Topological Sort
        // starting from all vertices's one by one
        for (var id = 0; id < this._vertices.length; id++) {
            if (!visited[id]) {
                this.topologicalSortUtil(id, stack, visited);
            }
        }
        // Initialize distances to all vertices as infinite and distance
        // to source as 0
        for (var id = 0; id < this._vertices.length; id++) {
            cost[id] = Infinity;
        }
        cost[startId] = 0;
        // Process vertices in topological order
        while (stack.length > 0) {
            // Get the next vertex from topological order
            var next = stack.pop();
            // Update distances of all adjacent vertices's
            if (cost[next] !== Infinity) {
                var vertex = this.getVertex(next);
                var adjacent = vertex.adjacent;
                if (adjacent) {
                    for (var i = 0; i < adjacent.length; i++) {
                        var edge = adjacent[i];
                        var length_1 = costProvider(edge, this.getVertex(edge.toId));
                        if (cost[edge.toId] < cost[next] + length_1) {
                            cost[edge.toId] = cost[next] + length_1;
                        }
                    }
                }
            }
        }
        for (var id = 0; id < this._vertices.length; id++) {
            each(this.getVertex(id), cost[id]);
        }
    };
    Graph.prototype.getEdgeCount = function (vertexId) {
        var edges = 0;
        var vertex = this.getVertex(vertexId);
        var adjacent = vertex.adjacent;
        if (adjacent) {
            for (var i = 0; i < adjacent.length; i++) {
                var edge = adjacent[i];
                if (!this.isRemovedEdge(edge)) {
                    edges++;
                }
            }
        }
        return edges;
    };
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
    Graph.prototype.pathBetweenUtil = function (edge, endId, cost, path, context) {
        var vertex = this.getVertex(edge.toId);
        path.push(edge);
        cost += context.costProvider(edge, vertex);
        if (edge.toId == endId) {
            return cost;
        }
        var adjacent = vertex.adjacent;
        if (adjacent) {
            var selectedDistance = context.longest ? -Infinity : Infinity;
            var selectedPath = void 0;
            var selectedEdge = null;
            for (var i = 0; i < adjacent.length; i++) {
                var edge_1 = adjacent[i];
                if (!this.isRemovedEdge(edge_1)) {
                    this.removeEdge(edge_1);
                    var nextPath = [];
                    var result = this.pathBetweenUtil(edge_1, endId, cost, nextPath, context);
                    if (result !== Infinity) {
                        if (context.longest && selectedDistance < result) {
                            if (selectedEdge) {
                                context.unusedEdges.push(selectedEdge);
                            }
                            selectedPath = nextPath;
                            selectedDistance = result;
                            selectedEdge = edge_1;
                        }
                        else if (!context.longest && selectedDistance > result) {
                            if (selectedEdge) {
                                context.unusedEdges.push(selectedEdge);
                            }
                            selectedPath = nextPath;
                            selectedDistance = result;
                            selectedEdge = edge_1;
                        }
                        else {
                            context.unusedEdges.push(edge_1);
                        }
                    }
                    this.unremoveEdge(edge_1);
                }
            }
            if (selectedPath) {
                for (var i = 0; i < selectedPath.length; i++) {
                    path.push(selectedPath[i]);
                }
                return cost + selectedDistance;
            }
        }
        return Infinity;
    };
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
    Graph.prototype.pathBetween = function (startId, endId, each, options) {
        if (each === void 0) { each = null; }
        var path = [];
        var context = utils_1.objectAssign({}, {
            longest: true,
            costProvider: function (edge, vertex) { return 1.0; },
            unusedEdges: []
        }, options);
        context.unusedEdges.splice(0, context.unusedEdges.length);
        var cost = this.pathBetweenUtil({ id: -1, fromId: -1, toId: startId }, endId, 0, path, context);
        if (each) {
            path.forEach(each);
        }
        if (context.unusedVertices) {
            var visited = [];
            visited[startId] = true;
            for (var i = 0; i < path.length; i++) {
                visited[path[i].toId] = true;
            }
            for (var id = 0; id < this._vertices.length; id++) {
                if (!visited[id]) {
                    context.unusedVertices.push(this.getVertex(id));
                }
            }
        }
        return cost;
    };
    //mark all other edges in the vertex containing unused edges as removed
    Graph.prototype.markUnused = function (unused) {
        var _this = this;
        if (unused) {
            var cleared_1 = [];
            unused.forEach(function (unusedEdge) {
                var vertex = _this.getVertex(unusedEdge.fromId);
                if (!cleared_1[vertex.id]) {
                    if (vertex.adjacent) {
                        vertex.adjacent.forEach(function (edge) {
                            _this.removeEdge(edge);
                        });
                    }
                    cleared_1[vertex.id] = true;
                }
                _this.unremoveEdge(unusedEdge);
            });
        }
    };
    Graph.prototype.merge = function (graph, keyGenerator) {
        var vertices = []; //map incoming to new vertices
        var existingVertices = {}; //existing vertices by key
        this._vertices.forEach(function (vertex) {
            existingVertices[keyGenerator(vertex)] = vertex;
        });
        graph.vertices.forEach(function (vertex) {
            var key = keyGenerator(vertex);
            var existingVertex = existingVertices[key];
            if (existingVertex) {
                vertices[vertex.id] = existingVertex;
            }
            else {
                var newVertex = this.addVertex(vertex.payload);
                existingVertices[key] = vertices[vertex.id] = newVertex;
            }
        }, this);
        graph.edges.forEach(function (edge) {
            var from = vertices[edge.fromId];
            var to = vertices[edge.toId];
            var newEdge = this.addEdge(from.id, to.id, edge.payload, false);
        }, this);
    };
    ;
    Graph.prototype.filterVertices = function (filter) {
        var matching = [];
        this.forEachVertex(function (vertex) {
            if (filter(vertex)) {
                matching.push(vertex);
            }
        });
        return matching;
    };
    Graph.prototype.filterEdges = function (filter) {
        var matching = [];
        this.forEachEdge(function (edge) {
            if (filter(edge)) {
                matching.push(edge);
            }
        });
        return matching;
    };
    Graph.prototype.forEachVertex = function (each) {
        for (var i = 0; i < this._vertices.length; i++) {
            var result = each(this._vertices[i]);
            if (typeof result === 'boolean') {
                if (!result) {
                    return;
                }
            }
        }
    };
    Graph.prototype.forEachEdge = function (each, all) {
        var _this = this;
        if (all === void 0) { all = false; }
        this.forEachVertex(function (vertex) {
            if (vertex.adjacent) {
                vertex.adjacent.forEach(function (edge) {
                    if (all || !_this.isRemovedEdge(edge))
                        var result = each(edge);
                    if (typeof result === 'boolean') {
                        if (!result) {
                            return false;
                        }
                    }
                });
            }
        });
    };
    Graph.prototype.forEachVertexBreadthFirst = function (startId, each, all) {
        var _this = this;
        if (all === void 0) { all = false; }
        var vertex = this.getVertex(startId); //validate
        var visited = [];
        var travelledEdges = [];
        var index = 0;
        visited[startId] = true;
        travelledEdges.push({ id: -1, fromId: -1, toId: startId });
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
                adjacent.forEach(function (edge) {
                    if (all || !_this.isRemovedEdge(edge)) {
                        if (!visited[edge.toId]) {
                            visited[edge.toId] = true;
                            travelledEdges.push(edge);
                        }
                    }
                });
            }
        }
    };
    Graph.prototype._forEachVertexDF = function (travelled, each, all, visited) {
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
            for (var i = 0; i < adjacent.length; i++) {
                var edge = adjacent[i];
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
    };
    Graph.prototype.forEachVertexDepthFirst = function (startId, each, all) {
        if (all === void 0) { all = false; }
        this._forEachVertexDF({ id: -1, fromId: -1, toId: startId }, each, all, []);
    };
    Graph.prototype.dfsCount = function (vertexId) {
        var count = 0;
        this.forEachVertexDepthFirst(vertexId, function (vertex) {
            count++;
        });
        return count;
    };
    Graph.prototype.eulerTour = function (startId, each) {
        if (startId < 0) {
            // Find a vertex with odd degree
            var oddDegreeVertexId = -1;
            for (var id = 0; id < this._vertices.length; id++) {
                var vertex = this._vertices[id];
                if (vertex.adjacent && vertex.adjacent.length & 1) {
                    oddDegreeVertexId = id;
                    break;
                }
            }
            startId = oddDegreeVertexId;
        }
        this.eulerTourUtil(startId, each);
        this.unremoveAllEdges();
    };
    Graph.prototype.eulerTourUtil = function (startId, each) {
        var vertex = this.getVertex(startId);
        var result = each(vertex);
        if (typeof result === 'boolean') {
            if (!result) {
                return false;
            }
        }
        var adjacent = vertex.adjacent;
        if (adjacent) {
            for (var i = 0; i < adjacent.length; i++) {
                var edge = adjacent[i];
                if (!this.isRemovedEdge(edge) && this.isValidNextEulerTourEdge(edge)) {
                    var to = this.getVertex(edge.toId);
                    this.removeEdge(edge);
                    if (!this.eulerTourUtil(to.id, each)) {
                        return false;
                    }
                }
            }
        }
        return true;
    };
    // The edge is valid in one of the following two cases:
    // case 1: If edge is the only adjacent vertex 
    // case 2: If there are multiple adjacent vertices's, and edge is not a bridge
    Graph.prototype.isValidNextEulerTourEdge = function (edge) {
        var isThisOnlyOne = true;
        var adjacent = this.getVertex(edge.fromId).adjacent;
        if (adjacent) {
            for (var i = 0; i < adjacent.length; i++) {
                var edgeOther = adjacent[i];
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
    };
    Graph.prototype.isABridge = function (edge) {
        var reachableCount1 = this.dfsCount(edge.fromId);
        this.removeEdge(edge);
        var reachableCount2 = this.dfsCount(edge.fromId);
        this.unremoveEdge(edge);
        return (reachableCount1 > reachableCount2);
    };
    return Graph;
}());
exports.Graph = Graph;
//# sourceMappingURL=graph.js.map
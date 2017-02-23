"use strict";
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
    Vertex.prototype.addEdge = function (toId, payload) {
        if (this.adjacent == null) {
            this.adjacent = [];
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
    Object.defineProperty(Graph.prototype, "vertices", {
        get: function () {
            return this._vertices.length;
        },
        enumerable: true,
        configurable: true
    });
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
            edges.push(edge);
        });
        return edges;
    };
    Graph.prototype.addEdge = function (fromId, toId, payload) {
        var fromVertex = this.getVertex(fromId);
        var toVertex = this.getVertex(toId);
        var edge = fromVertex.addEdge(toId, payload);
        this.notify();
        return edge;
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
    Graph.prototype.forEachEdge = function (each) {
        this.forEachVertex(function (vertex) {
            if (vertex.adjacent) {
                vertex.adjacent.forEach(function (edge) {
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
    Graph.prototype.forEachVertexBreadthFirst = function (startId, each) {
        var vertex = this.getVertex(startId); //validate
        var visited = [];
        var vertices = [];
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
                adjacent.forEach(function (edge) {
                    if (!visited[edge.toId]) {
                        visited[edge.toId] = true;
                        vertices.push(edge.toId);
                    }
                });
            }
        }
    };
    Graph.prototype._forEachVertexDF = function (id, each, visited) {
        var _this = this;
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
            adjacent.forEach(function (edge) {
                if (!visited[edge.toId]) {
                    if (!_this._forEachVertexDF(edge.toId, each, visited)) {
                        return false;
                    }
                }
            });
        }
        return true;
    };
    Graph.prototype.forEachVertexDepthFirst = function (startId, each) {
        this._forEachVertexDF(startId, each, []);
    };
    return Graph;
}());
exports.Graph = Graph;
var Vector = (function () {
    function Vector(x, y) {
        this.x = x;
        this.y = y;
    }
    Vector.random = function () {
        return new Vector(10.0 * (Math.random() - 0.5), 10.0 * (Math.random() - 0.5));
    };
    Vector.prototype.add = function (v2) {
        return new Vector(this.x + v2.x, this.y + v2.y);
    };
    Vector.prototype.subtract = function (v2) {
        return new Vector(this.x - v2.x, this.y - v2.y);
    };
    Vector.prototype.multiply = function (n) {
        return new Vector(this.x * n, this.y * n);
    };
    Vector.prototype.divide = function (n) {
        return new Vector((this.x / n) || 0, (this.y / n) || 0); // Avoid divide by zero errors..
    };
    Vector.prototype.magnitude = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    Vector.prototype.normal = function () {
        return new Vector(-this.y, this.x);
    };
    Vector.prototype.normalise = function () {
        return this.divide(this.magnitude());
    };
    return Vector;
}());
var Point = (function () {
    function Point(position, mass) {
        this.position = position;
        this.mass = mass;
        this.velocity = new Vector(0, 0);
        this.acceleration = new Vector(0, 0);
    }
    ;
    Point.prototype.applyForce = function (force) {
        this.acceleration = this.acceleration.add(force.divide(this.mass));
    };
    ;
    return Point;
}());
var Spring = (function () {
    function Spring(point1, point2, length, k) {
        this.point1 = point1;
        this.point2 = point2;
        this.length = length;
        this.k = k;
    }
    return Spring;
}());
var ForceDirected = (function () {
    function ForceDirected(graph, stiffness, repulsion, damping, minEnergyThreshold, maxSpeed) {
        if (minEnergyThreshold === void 0) { minEnergyThreshold = 0.01; }
        if (maxSpeed === void 0) { maxSpeed = Infinity; }
        this.graph = graph;
        this.stiffness = stiffness;
        this.repulsion = repulsion;
        this.damping = damping;
        this.minEnergyThreshold = minEnergyThreshold;
        this.maxSpeed = maxSpeed;
        this._points = {};
        this._springs = {};
    }
    //return a spring for an edge
    ForceDirected.prototype.getSpring = function (edge) {
        if (!(edge.id in this._springs)) {
            var length = (edge.payload["length"] !== undefined) ? edge.payload["length"] : 1.0;
            var existingSpring = null;
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
            this._springs[edge.id] = new Spring(this.getPoint(this.graph.getVertex(edge.fromId)), this.getPoint(this.graph.getVertex(edge.toId)), length, this.stiffness);
        }
        return this._springs[edge.id];
    };
    //return the point for a vector
    ForceDirected.prototype.getPoint = function (vertex) {
        if (!(vertex.id in this._points)) {
            var mass = (vertex.payload["mass"] !== undefined) ? vertex.payload["mass"] : 1.0;
            this._points[vertex.id] = new Point(Vector.random(), mass);
        }
        return this._points[vertex.id];
    };
    ForceDirected.prototype.forEachVertexPoint = function (each) {
        var _this = this;
        this.graph.forEachVertex(function (vertex) {
            each(vertex, _this.getPoint(vertex));
        });
    };
    ForceDirected.prototype.forEachEdgeSpring = function (each) {
        var _this = this;
        this.graph.forEachEdge(function (edge) {
            each(edge, _this.getSpring(edge));
        });
    };
    ForceDirected.prototype.applyCoulombsLaw = function () {
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
    };
    ForceDirected.prototype.applyHookesLaw = function () {
        this.forEachEdgeSpring(function (edge, spring) {
            var d = spring.point2.position.subtract(spring.point1.position); // the direction of the spring
            var displacement = spring.length - d.magnitude();
            var direction = d.normalise();
            // apply force to each end point
            spring.point1.applyForce(direction.multiply(spring.k * displacement * -0.5));
            spring.point2.applyForce(direction.multiply(spring.k * displacement * 0.5));
        });
    };
    ForceDirected.prototype.attractToCentre = function () {
        this.forEachVertexPoint(function (vertex, point) {
            var direction = point.position.multiply(-1.0);
            point.applyForce(direction.multiply(this.repulsion / 50.0));
        });
    };
    ForceDirected.prototype.updateVelocity = function (timestep) {
        var _this = this;
        this.forEachVertexPoint(function (vertex, point) {
            point.velocity = point.velocity.add(point.acceleration.multiply(timestep)).multiply(_this.damping);
            if (point.velocity.magnitude() > _this.maxSpeed) {
                point.velocity = point.velocity.normalise().multiply(_this.maxSpeed);
            }
            point.acceleration = new Vector(0, 0);
        });
    };
    ForceDirected.prototype.updatePosition = function (timestep) {
        this.forEachVertexPoint(function (vertex, point) {
            point.position = point.position.add(point.velocity.multiply(timestep));
        });
    };
    ForceDirected.prototype.totalEnergy = function () {
        var energy = 0.0;
        this.forEachVertexPoint(function (vertex, point) {
            var speed = point.velocity.magnitude();
            energy += 0.5 * point.mass * speed * speed;
        });
        return energy;
    };
    ForceDirected.prototype.tick = function (timestep) {
        this.applyCoulombsLaw();
        this.applyHookesLaw();
        this.attractToCentre();
        this.updateVelocity(timestep);
        this.updatePosition(timestep);
    };
    ForceDirected.prototype.isReady = function () {
        return this.totalEnergy() > this.minEnergyThreshold;
    };
    ForceDirected.prototype.forEachVertex = function (each) {
        this.forEachVertexPoint(function (vertex, point) {
            each(vertex, point.position);
        });
    };
    ForceDirected.prototype.forEachEdge = function (each) {
        this.forEachEdgeSpring(function (edge, spring) {
            each(edge, spring.point1.position, spring.point2.position);
        });
    };
    ForceDirected.prototype.nearest = function (position) {
        var min = {};
        var t = this;
        this.forEachVertexPoint(function (vertex, point) {
            var distance = point.position.subtract(position).magnitude();
            if (min.distance === null || distance < min.distance) {
                min = { vertex: vertex, position: point.position, distance: distance };
            }
        });
        return min;
    };
    ForceDirected.prototype.getBoundingBox = function () {
        var bottomLeft = new Vector(-2, -2);
        var topRight = new Vector(2, 2);
        this.forEachVertexPoint(function (vector, point) {
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
    };
    return ForceDirected;
}());
exports.ForceDirected = ForceDirected;
(function (LayoutState) {
    LayoutState[LayoutState["Stopped"] = 0] = "Stopped";
    LayoutState[LayoutState["Starting"] = 1] = "Starting";
    LayoutState[LayoutState["Started"] = 2] = "Started";
    LayoutState[LayoutState["Stopping"] = 3] = "Stopping";
})(exports.LayoutState || (exports.LayoutState = {}));
var LayoutState = exports.LayoutState;
function __bind(fn, me) {
    return function () { return fn.apply(me, arguments); };
}
var Animate = (function () {
    function Animate(_element, _layout, _renderer) {
        this._element = _element;
        this._layout = _layout;
        this._renderer = _renderer;
        this._state = LayoutState.Stopped;
    }
    Object.defineProperty(Animate.prototype, "state", {
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    Animate.prototype.requestAnimationFrame = function (element, callback) {
        return callback.bind(element.requestAnimationFrame ||
            element.webkitRequestAnimationFrame ||
            element.mozRequestAnimationFrame ||
            element.oRequestAnimationFrame ||
            element.msRequestAnimationFrame ||
            (function (callback, element) {
                this.setTimeout(callback, 10);
            }), this);
    };
    Animate.prototype.step = function (render, onRenderStop, onRenderStart) {
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
            if (onRenderStop !== undefined) {
                onRenderStop();
            }
        }
        else {
            this.requestAnimationFrame(this._element, this.step.bind(this, render, onRenderStop, onRenderStart));
        }
    };
    Animate.prototype.start = function (onRenderStop, onRenderStart) {
        var t = this;
        if (this._state !== LayoutState.Stopped)
            return;
        this._state = LayoutState.Starting;
        if (typeof onRenderStart !== undefined) {
            onRenderStart();
        }
        this.requestAnimationFrame(this._element, this.step.bind(this, onRenderStop, onRenderStart));
    };
    return Animate;
}());
exports.Animate = Animate;
//# sourceMappingURL=GraphLib.js.map
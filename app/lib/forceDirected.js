"use strict";
var math_1 = require("./math");
var Body = (function () {
    function Body(position, mass) {
        this.position = position;
        this.mass = mass;
        this.velocity = new math_1.Vector(0, 0);
        this.acceleration = new math_1.Vector(0, 0);
    }
    ;
    Body.prototype.applyForce = function (force) {
        this.acceleration = this.acceleration.add(force.divide(this.mass));
    };
    ;
    return Body;
}());
exports.Body = Body;
var Spring = (function () {
    function Spring(body1, body2, length, k) {
        this.body1 = body1;
        this.body2 = body2;
        this.length = length;
        this.k = k;
    }
    return Spring;
}());
exports.Spring = Spring;
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
        var spring = this._springs[edge.id];
        if (!spring) {
            var length;
            if (edge.payload && typeof edge.payload["length"] === "number") {
                length = edge.payload["length"];
            }
            else {
                length = 1.0;
            }
            spring = this._springs[edge.id] = new Spring(this.getBody(this.graph.getVertex(edge.fromId)), this.getBody(this.graph.getVertex(edge.toId)), length, this.stiffness);
        }
        return spring;
    };
    //return the body for a vertex
    ForceDirected.prototype.getBody = function (vertex) {
        var body = this._points[vertex.id];
        if (!body) {
            var mass;
            if (vertex.payload && typeof vertex.payload["mass"] === "number") {
                mass = vertex.payload["mass"];
            }
            else {
                mass = 1.0;
            }
            body = this._points[vertex.id] = new Body(math_1.Vector.random(), mass);
        }
        return body;
    };
    ForceDirected.prototype.forEachVertexPoint = function (each) {
        var _this = this;
        this.graph.forEachVertex(function (vertex) {
            each(vertex, _this.getBody(vertex));
        });
    };
    ForceDirected.prototype.forEachEdgeSpring = function (each) {
        var _this = this;
        this.graph.forEachEdge(function (edge) {
            each(edge, _this.getSpring(edge));
        });
    };
    ForceDirected.prototype.applyCoulombsLaw = function () {
        var _this = this;
        this.forEachVertexPoint(function (v1, body1) {
            _this.forEachVertexPoint(function (v2, body2) {
                if (body1 !== body2) {
                    var d = body1.position.subtract(body2.position);
                    var distance = d.magnitude() + 0.1; // avoid massive forces at small distances (and divide by zero)
                    var direction = d.normalise();
                    // apply force to each end body
                    body1.applyForce(direction.multiply(_this.repulsion).divide(distance * distance * 0.5));
                    body2.applyForce(direction.multiply(_this.repulsion).divide(distance * distance * -0.5));
                }
            });
        });
    };
    ForceDirected.prototype.applyHookesLaw = function () {
        this.forEachEdgeSpring(function (edge, spring) {
            var d = spring.body2.position.subtract(spring.body1.position); // the direction of the spring
            var displacement = spring.length - d.magnitude();
            var direction = d.normalise();
            // apply force to each end body
            spring.body1.applyForce(direction.multiply(spring.k * displacement * -0.5));
            spring.body2.applyForce(direction.multiply(spring.k * displacement * 0.5));
        });
    };
    ForceDirected.prototype.attractToCentre = function () {
        var _this = this;
        this.forEachVertexPoint(function (vertex, body) {
            var direction = body.position.multiply(-1.0);
            body.applyForce(direction.multiply(_this.repulsion / 50.0));
        });
    };
    ForceDirected.prototype.updateVelocity = function (timestep) {
        var _this = this;
        this.forEachVertexPoint(function (vertex, body) {
            body.velocity = body.velocity.add(body.acceleration.multiply(timestep)).multiply(_this.damping);
            if (body.velocity.magnitude() > _this.maxSpeed) {
                body.velocity = body.velocity.normalise().multiply(_this.maxSpeed);
            }
            body.acceleration = new math_1.Vector(0, 0);
        });
    };
    ForceDirected.prototype.updatePosition = function (timestep) {
        this.forEachVertexPoint(function (vertex, body) {
            body.position = body.position.add(body.velocity.multiply(timestep));
        });
    };
    ForceDirected.prototype.totalEnergy = function () {
        var energy = 0.0;
        this.forEachVertexPoint(function (vertex, body) {
            var speed = body.velocity.magnitude();
            energy += 0.5 * body.mass * speed * speed;
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
        this.forEachVertexPoint(function (vertex, body) {
            each(vertex, body.position);
        });
    };
    ForceDirected.prototype.forEachEdge = function (each) {
        this.forEachEdgeSpring(function (edge, spring) {
            each(edge, spring.body1.position, spring.body2.position);
        });
    };
    ForceDirected.prototype.nearest = function (position) {
        var min = {};
        var t = this;
        this.forEachVertexPoint(function (vertex, body) {
            var distance = body.position.subtract(position).magnitude();
            if (min.distance === null || distance < min.distance) {
                min = { vertex: vertex, position: body.position, distance: distance };
            }
        });
        return min;
    };
    ForceDirected.prototype.getBoundingBox = function () {
        var bottomLeft = new math_1.Vector(-2, -2);
        var topRight = new math_1.Vector(2, 2);
        this.forEachVertexPoint(function (vector, body) {
            if (body.position.x < bottomLeft.x) {
                bottomLeft.x = body.position.x;
            }
            if (body.position.y < bottomLeft.y) {
                bottomLeft.y = body.position.y;
            }
            if (body.position.x > topRight.x) {
                topRight.x = body.position.x;
            }
            if (body.position.y > topRight.y) {
                topRight.y = body.position.y;
            }
        });
        var padding = topRight.subtract(bottomLeft).multiply(0.07); // ~5% padding
        return { bottomLeft: bottomLeft.subtract(padding), topRight: topRight.add(padding) };
    };
    return ForceDirected;
}());
exports.ForceDirected = ForceDirected;
//# sourceMappingURL=forceDirected.js.map
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var graph_1 = require("../lib/graph");
var animate_1 = require("../lib/animate");
var canvasRenderer_1 = require("../lib/canvasRenderer");
var forceDirected_1 = require("../lib/forceDirected");
var testHarness_1 = require("../test/testHarness");
var NodeTextStyle = "black";
var VisitedTextStyle = "blue";
var RootTextStyle = "green";
var LeafTextStyle = "red";
var FollowedEdgeTextStyle = "green";
var VertexType;
(function (VertexType) {
    VertexType[VertexType["Node"] = 0] = "Node";
    VertexType[VertexType["Visited"] = 1] = "Visited";
    VertexType[VertexType["Root"] = 2] = "Root";
    VertexType[VertexType["Leaf"] = 3] = "Leaf";
})(VertexType || (VertexType = {}));
var Word = (function () {
    function Word(label, type) {
        if (type === void 0) { type = VertexType.Node; }
        this.label = label;
        this.type = type;
    }
    return Word;
}());
exports.Word = Word;
var Edge = (function () {
    function Edge(followed) {
        if (followed === void 0) { followed = false; }
        this.followed = followed;
    }
    return Edge;
}());
exports.Edge = Edge;
// overrides the normal canvas renderer and provides coloring for the graph
var MyWordCanvasRenderer = (function (_super) {
    __extends(MyWordCanvasRenderer, _super);
    function MyWordCanvasRenderer(layout, canvasElement) {
        _super.call(this, layout, canvasElement);
    }
    MyWordCanvasRenderer.prototype.getVertexLabel = function (vertex) {
        return vertex.payload.label;
    };
    MyWordCanvasRenderer.prototype.getVertexStyle = function (vertex) {
        switch (vertex.payload.type) {
            case VertexType.Node:
                return {
                    textStyle: NodeTextStyle
                };
            case VertexType.Visited:
                return {
                    textStyle: VisitedTextStyle
                };
            case VertexType.Root:
                return {
                    textStyle: RootTextStyle
                };
            case VertexType.Leaf:
                return {
                    textStyle: LeafTextStyle
                };
        }
    };
    MyWordCanvasRenderer.prototype.getEdgeLabel = function (edge) {
        if (edge.payload.followed) {
            return "✔";
        }
        else {
            return "❌";
        }
    };
    MyWordCanvasRenderer.prototype.getEdgeStyle = function (edge) {
        if (edge.payload.followed) {
            return {
                lineStyle: FollowedEdgeTextStyle,
            };
        }
    };
    return MyWordCanvasRenderer;
}(canvasRenderer_1.CanvasRenderer));
var Detective = (function () {
    function Detective(contentElement) {
        this.contentElement = contentElement;
        this.testHarness = new testHarness_1.TestHarness(contentElement);
        this._timeline = new graph_1.Graph();
        this._statementCount = 0;
    }
    Detective.prototype.clear = function () {
        this._timeline.clear();
    };
    Detective.prototype.addStatement = function (words) {
        if (words) {
            var statement_1 = new graph_1.Graph();
            var lastWord;
            words.forEach(function (word, index) {
                var wordVertex = statement_1.addVertex(new Word(word));
                if (lastWord) {
                    statement_1.addEdge(lastWord.id, wordVertex.id, new Edge());
                }
                lastWord = wordVertex;
            });
            this._timeline.merge(statement_1, function (vertex) {
                return vertex.payload.label;
            });
        }
    };
    Object.defineProperty(Detective.prototype, "timeline", {
        get: function () {
            return this._timeline;
        },
        enumerable: true,
        configurable: true
    });
    Detective.prototype.getRenderer = function (layout, canvasElement) {
        return new MyWordCanvasRenderer(layout, canvasElement);
    };
    Detective.prototype.getTimelines = function () {
        var _this = this;
        var timelines = [];
        var roots = this._timeline.roots();
        var leafs = this._timeline.leafs();
        var unusedEdges;
        roots.forEach(function (vertex) {
            vertex.payload.type = VertexType.Root;
        });
        leafs.forEach(function (vertex) {
            vertex.payload.type = VertexType.Leaf;
        });
        for (var r = 0; r < roots.length; r++) {
            for (var l = 0; l < leafs.length; l++) {
                var unusedVertices = [];
                var counter = 0;
                var _loop_1 = function() {
                    var statement = [];
                    unusedEdges = [];
                    var distance = this_1._timeline.pathBetween(roots[r].id, leafs[l].id, true, Edge, function (edge) {
                        var vertex = _this._timeline.getVertex(edge.toId);
                        if (vertex.payload.type == VertexType.Node) {
                            vertex.payload.type = VertexType.Visited;
                        }
                        edge.payload.followed = true;
                        statement.push(vertex.payload.label);
                    }, unusedEdges, unusedVertices);
                    if (distance !== Infinity) {
                        timelines.push(statement);
                    }
                    if (unusedEdges.length > 0) {
                        this_1._timeline.markUnused(unusedEdges); //TBD: Need to only do this if < all vertices are visited
                    }
                };
                var this_1 = this;
                do {
                    _loop_1();
                } while (unusedEdges.length > 0 && unusedVertices.length > 0 && ++counter < 10);
                this._timeline.unremoveAllEdges();
            }
        }
        return timelines;
    };
    Detective.prototype.test = function (title, statements) {
        var _this = this;
        this.clear();
        this.testHarness.newTest(title);
        this.testHarness.writeLine();
        this.testHarness.writeLine("statements: ");
        this.testHarness.writeLine(JSON.stringify(statements, null, 2));
        statements.forEach(function (statement) {
            _this.addStatement(statement);
        });
        var layout = new forceDirected_1.ForceDirected(this.timeline, 400.0, 400.0, 0.5, 0.00001, Infinity);
        var renderer = this.getRenderer(layout, this.testHarness.canvas);
        var animate = new animate_1.Animate(layout, renderer);
        renderer.start();
        animate.start();
        this.testHarness.writeLine();
        this.testHarness.writeLine("timelines: ");
        this.testHarness.writeLine(JSON.stringify(this.getTimelines(), null, 2));
    };
    return Detective;
}());
exports.Detective = Detective;
//# sourceMappingURL=detective.js.map
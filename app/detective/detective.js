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
var NodeTextStyle = "black"; //The color of the text of a normal (unvisted) node 
var VisitedTextStyle = "blue"; //The color of a visited node
var RootTextStyle = "green"; //The color of a root node
var LeafTextStyle = "red"; //The color of a leaf node
var FollowedEdgeTextStyle = "green"; //The color of a traversed edge
/* VertexType
 *
 *  The types of vertices's (used for displaying distinct styles)
 *
 */
var VertexType;
(function (VertexType) {
    VertexType[VertexType["Node"] = 0] = "Node";
    VertexType[VertexType["Visited"] = 1] = "Visited";
    VertexType[VertexType["Root"] = 2] = "Root";
    VertexType[VertexType["Leaf"] = 3] = "Leaf";
})(VertexType || (VertexType = {}));
/*  a class representing an word payload
 *
 *     setting followed to true, causes the edge to be displayed in green
 *
 */
var Word = (function () {
    function Word(label, type) {
        if (type === void 0) { type = VertexType.Node; }
        this.label = label;
        this.type = type;
    }
    return Word;
}());
exports.Word = Word;
/*  a class representing an edge payload
 *
 *     setting followed to true, causes the edge to be displayed in green
 *
 */
var Edge = (function () {
    function Edge(followed) {
        if (followed === void 0) { followed = false; }
        this.followed = followed;
    }
    return Edge;
}());
exports.Edge = Edge;
/* TimelineCanvasRenderer
 *
 * overrides the normal canvas renderer and provides coloring for time line graph
 *
 */
var TimelineCanvasRenderer = (function (_super) {
    __extends(TimelineCanvasRenderer, _super);
    function TimelineCanvasRenderer(layout, canvasElement) {
        _super.call(this, layout, canvasElement);
    }
    TimelineCanvasRenderer.prototype.getVertexLabel = function (vertex) {
        return vertex.payload.label;
    };
    TimelineCanvasRenderer.prototype.getVertexStyle = function (vertex) {
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
    TimelineCanvasRenderer.prototype.getEdgeLabel = function (edge) {
        if (edge.payload.followed) {
            return "✔";
        }
        else {
            return "❌";
        }
    };
    TimelineCanvasRenderer.prototype.getEdgeStyle = function (edge) {
        if (edge.payload.followed) {
            return {
                lineStyle: FollowedEdgeTextStyle,
            };
        }
    };
    return TimelineCanvasRenderer;
}(canvasRenderer_1.CanvasRenderer));
/* The Detective algorithm
 *
 *   see /app/dectective/docs/Detective.doc
 *
 */
var Detective = (function () {
    /* construct a new Detective
     *
     *   parameters:
     *
     *       contentElement: an html div element that will contain the output of a test of the detective (see test)
     *
     */
    function Detective(contentElement) {
        this.contentElement = contentElement;
        this._testHarness = new testHarness_1.TestHarness(contentElement);
        this._timeline = new graph_1.Graph();
    }
    /*  clear
     *     clears the current timeline
     *
     */
    Detective.prototype.clear = function () {
        this._timeline.clear();
    };
    /* addStatement
     *
     *  parameters:
     *      words: an array of words making up one statement
     *
     */
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
        /* timeline
         *
         *     the graph representing all possible time lines
         *
         */
        get: function () {
            return this._timeline;
        },
        enumerable: true,
        configurable: true
    });
    /*
     * createRenderer
     *
     *   parameters:
     *
     *      layout:  the layout engine used to layout the time line
     *
     *      canvasElement:  an html canvas element in which the time line will be rendered
     *
     *  returns:
     *
     *     the time line renderer
     *
     */
    Detective.prototype.createRenderer = function (layout, canvasElement) {
        return new TimelineCanvasRenderer(layout, canvasElement);
    };
    /*
     * getTimelines
     *
     *   returns:
     *
     *      an array of potential timelines (string arrays)
     */
    Detective.prototype.getTimelines = function () {
        var _this = this;
        var timelines = [];
        var roots = this._timeline.roots();
        var leafs = this._timeline.leafs();
        var options = {
            longest: true,
            unusedVertices: [],
            unusedEdges: []
        };
        roots.forEach(function (vertex) {
            vertex.payload.type = VertexType.Root;
        });
        leafs.forEach(function (vertex) {
            vertex.payload.type = VertexType.Leaf;
        });
        for (var r = 0; r < roots.length; r++) {
            for (var l = 0; l < leafs.length; l++) {
                options.unusedVertices = []; //accumulate unused vertices for each root-leaf pair
                var counter = 0; //loop buster
                var _loop_1 = function() {
                    var statement = [];
                    options.unusedEdges = []; //clear unused edges for each statement
                    var distance = this_1._timeline.pathBetween(roots[r].id, leafs[l].id, function (edge) {
                        var vertex = _this._timeline.getVertex(edge.toId);
                        if (vertex.payload.type == VertexType.Node) {
                            vertex.payload.type = VertexType.Visited;
                        }
                        if (edge.payload) {
                            edge.payload.followed = true;
                        }
                        statement.push(vertex.payload.label);
                    }, options);
                    if (distance !== Infinity) {
                        //path found from root to leaf
                        timelines.push(statement);
                    }
                    if (options.unusedEdges.length > 0 && options.unusedVertices.length > 0) {
                        //this removes all other edge options on each vertex containing an edge unused in the last path
                        this_1._timeline.markUnused(options.unusedEdges);
                    }
                };
                var this_1 = this;
                do {
                    _loop_1();
                } while (options.unusedEdges.length > 0 && options.unusedVertices.length > 0 && ++counter < 10);
                this._timeline.unremoveAllEdges();
            }
        }
        return timelines;
    };
    /*  test
     *
     *     do one test of the detective algorithm
     *
     *  parameters:
     *
     *      title: the title of the test
     *
     *      statements: an array of statements (string arrays)
     *
     */
    Detective.prototype.test = function (title, statements) {
        var _this = this;
        this.clear();
        this._testHarness.newTest(title);
        this._testHarness.writeLine();
        this._testHarness.writeLine("statements: ");
        this._testHarness.writeLine(JSON.stringify(statements, null, 2));
        statements.forEach(function (statement) {
            _this.addStatement(statement);
        });
        var layout = new forceDirected_1.ForceDirected(this.timeline, 400.0, 400.0, 0.5, 0.00001, Infinity);
        var renderer = this.createRenderer(layout, this._testHarness.canvas);
        var animate = new animate_1.Animate(layout, renderer);
        renderer.start();
        animate.start();
        this._testHarness.writeLine();
        this._testHarness.writeLine("timelines: ");
        this._testHarness.writeLine(JSON.stringify(this.getTimelines(), null, 2));
    };
    return Detective;
}());
exports.Detective = Detective;
//# sourceMappingURL=detective.js.map
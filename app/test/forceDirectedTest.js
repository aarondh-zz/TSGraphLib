"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var graph_1 = require("../lib/graph");
var forceDirected_1 = require("../lib/forceDirected");
var animate_1 = require("../lib/animate");
var canvasRenderer_1 = require("../lib/canvasRenderer");
var testHarness_1 = require("../test/testHarness");
var MyCanvasRenderer = (function (_super) {
    __extends(MyCanvasRenderer, _super);
    function MyCanvasRenderer(layout, canvasElement) {
        _super.call(this, layout, canvasElement);
    }
    MyCanvasRenderer.prototype.getVertexLabel = function (vertext) {
        return vertext.payload.label;
    };
    return MyCanvasRenderer;
}(canvasRenderer_1.CanvasRenderer));
var ForceDirectedTest = (function () {
    function ForceDirectedTest(contentElement) {
        this.testHarness = new testHarness_1.TestHarness(contentElement);
        this.graph = new graph_1.Graph();
    }
    ForceDirectedTest.prototype.newTest = function (title) {
        this.testHarness.newTest(title);
    };
    ForceDirectedTest.prototype.loadGraph = function (graphSource) {
        var _this = this;
        this.graph.clear();
        var graphInput = JSON.parse(graphSource);
        if (Array.isArray(graphInput.vertices)) {
            graphInput.vertices.forEach(function (vertextData) {
                _this.graph.addVertex(vertextData);
            });
            graphInput.edges.forEach(function (edgeData) {
                _this.graph.addEdge(edgeData.from, edgeData.to, edgeData);
            });
        }
        this.layout = new forceDirected_1.ForceDirected(this.graph, graphInput.stiffness || 400.0, graphInput.repulsion || 400.0, graphInput.damping || 0.5, graphInput.minEnergyThreshold || 0.00001, graphInput.maxSpeed || Infinity);
        this.renderer = new MyCanvasRenderer(this.layout, this.testHarness.canvas);
        this.animate = new animate_1.Animate(this.layout, this.renderer);
        this.start();
    };
    ForceDirectedTest.prototype.start = function () {
        this.renderer.start();
        this.animate.start();
    };
    ForceDirectedTest.prototype.testDF = function () {
        var _this = this;
        this.testHarness.newTest("depth first test");
        this.testHarness.writeLine();
        this.testHarness.write("depth first: ");
        try {
            this.graph.forEachVertexDepthFirst(2, function (vertex) {
                _this.testHarness.write(vertex.payload.label + " ");
            });
        }
        catch (err) {
            this.testHarness.writeLine();
            this.testHarness.write(err);
        }
    };
    ForceDirectedTest.prototype.testBF = function () {
        var _this = this;
        this.testHarness.newTest("breadth first test");
        this.testHarness.writeLine();
        this.testHarness.write("breadth first: ");
        try {
            this.graph.forEachVertexBreadthFirst(2, function (vertex) {
                _this.testHarness.write(vertex.payload.label + " ");
            });
        }
        catch (err) {
            this.testHarness.writeLine();
            this.testHarness.write(err);
        }
    };
    return ForceDirectedTest;
}());
exports.ForceDirectedTest = ForceDirectedTest;
//# sourceMappingURL=forceDirectedTest.js.map
"use strict";
var graphLib_js_1 = require("./graphLib.js");
var Main = (function () {
    function Main(element) {
        this.element = element;
        this.createGraph();
    }
    Main.prototype.createGraph = function () {
        var graph = this.graph = new graphLib_js_1.Graph();
        graph.addVertex("0");
        graph.addVertex("1");
        graph.addVertex("2");
        graph.addVertex("3");
        graph.addEdge(0, 1, "a");
        graph.addEdge(0, 2, "b");
        graph.addEdge(1, 2, "c");
        graph.addEdge(2, 0, "d");
        graph.addEdge(2, 3, "e");
        graph.addEdge(3, 3, "f");
    };
    Main.prototype.testDF = function () {
        var _this = this;
        this.writeLine();
        this.write("depth first: ");
        this.graph.forEachVertexDepthFirst(2, function (vertex) {
            _this.write(vertex.payload + " ");
        });
    };
    Main.prototype.testBF = function () {
        var _this = this;
        this.writeLine();
        this.write("breadth first: ");
        this.graph.forEachVertexBreadthFirst(2, function (vertex) {
            _this.write(vertex.payload + " ");
        });
    };
    Main.prototype.write = function (text) {
        var span = document.createElement('span');
        span.innerHTML = text;
        this.element.appendChild(span);
    };
    Main.prototype.writeLine = function (text) {
        if (text === void 0) { text = ""; }
        this.write(text + "<br/>");
    };
    return Main;
}());
function boot() {
    var contentElement = document.getElementById('content');
    var main = new Main(contentElement);
    main.testDF();
    main.testBF();
}
;
boot();
//# sourceMappingURL=app.js.map
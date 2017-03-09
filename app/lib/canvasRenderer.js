"use strict";
var math_1 = require("./math");
var utils_1 = require("./utils");
var defaultVertexStyle = {
    font: "12px Verdana, sans-serif",
    backgroundStyle: "#FFFFE0",
    textStyle: "#000000",
    textHeight: 10,
    padding: { left: 5, right: 5, top: 5, bottom: 5 }
};
var defaultEdgeStyle = {
    font: "8px Verdana, sans-serif",
    lineStyle: "#000000",
    lineWidth: 1,
    textIsUpRight: true,
    textStyle: "#000000",
    arrowSize: { width: 2, height: 8 },
    arrowPadding: { x: 2, y: 2 }
};
var CanvasRenderer = (function () {
    function CanvasRenderer(layout, canvasElement) {
        this.layout = layout;
        this.canvasElement = canvasElement;
        this.defaultVertexStyle = defaultVertexStyle;
        this.defaultEdgeStyle = defaultEdgeStyle;
        this.padding = { left: 20, right: 20, top: 20, bottom: 20 };
        this._stopping = false;
        this._vertexSizes = [];
        this.drawingContext = canvasElement.getContext("2d");
    }
    CanvasRenderer.prototype.start = function () {
        this._stopping = false;
        this.boundingBox = this.layout.getBoundingBox();
        this.targetBoundingBox = { bottomLeft: new math_1.Vector(-2, -2), topRight: new math_1.Vector(2, 2) };
        // auto adjusting bounding box
        window.requestAnimationFrame(this.adjustBoundingBox.bind(this));
    };
    CanvasRenderer.prototype.end = function () {
        this._stopping = true;
    };
    CanvasRenderer.prototype.adjustBoundingBox = function () {
        this.targetBoundingBox = this.layout.getBoundingBox();
        // current gets 20% closer to target every iteration
        this.boundingBox = {
            bottomLeft: this.boundingBox.bottomLeft.add(this.targetBoundingBox.bottomLeft.subtract(this.boundingBox.bottomLeft)
                .divide(10)),
            topRight: this.boundingBox.topRight.add(this.targetBoundingBox.topRight.subtract(this.boundingBox.topRight)
                .divide(10))
        };
        if (!this._stopping) {
            window.requestAnimationFrame(this.adjustBoundingBox.bind(this));
        }
    };
    CanvasRenderer.prototype.getCanvasClientSize = function () {
        return { width: this.canvasElement.width - this.padding.left - this.padding.right, height: this.canvasElement.height - this.padding.top - this.padding.bottom };
    };
    CanvasRenderer.prototype.getCanvasClientOffset = function () {
        return { x: this.padding.left, y: this.padding.top };
    };
    CanvasRenderer.prototype.toScreen = function (p) {
        var size = this.boundingBox.topRight.subtract(this.boundingBox.bottomLeft);
        var drawingSize = this.getCanvasClientSize();
        var drawingOffset = this.getCanvasClientOffset();
        var sx = p.subtract(this.boundingBox.bottomLeft).divide(size.x).x * drawingSize.width + drawingOffset.x;
        var sy = p.subtract(this.boundingBox.bottomLeft).divide(size.y).y * drawingSize.height + drawingOffset.y;
        return new math_1.Vector(sx, sy);
    };
    CanvasRenderer.prototype.fromScreen = function (s) {
        var size = this.boundingBox.topRight.subtract(this.boundingBox.bottomLeft);
        var drawingSize = this.getCanvasClientSize();
        var drawingOffset = this.getCanvasClientOffset();
        var px = ((s.x - drawingOffset.x) / drawingSize.width) * size.x + this.boundingBox.bottomLeft.x;
        var py = ((s.y - drawingOffset.y) / drawingSize.height) * size.y + this.boundingBox.bottomLeft.y;
        return new math_1.Vector(px, py);
    };
    CanvasRenderer.prototype.clear = function () {
        this.drawingContext.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    };
    CanvasRenderer.prototype.frameStart = function () {
        this.clear();
    };
    CanvasRenderer.prototype.frameEnd = function () {
    };
    CanvasRenderer.prototype.getTextWidth = function (text, style) {
        var dc = this.drawingContext;
        dc.save();
        dc.font = style.font;
        var textMetrics = dc.measureText(text);
        dc.restore();
        return textMetrics.width;
    };
    CanvasRenderer.prototype.getTextHeight = function (text, style) {
        return style.textHeight;
    };
    CanvasRenderer.prototype.getVertexLabel = function (vertex) {
        return vertex.id.toString();
    };
    CanvasRenderer.prototype.getEdgeLabel = function (vertex) {
        return null;
    };
    CanvasRenderer.prototype.getVertexStyle = function (vertex) {
        return this.defaultVertexStyle;
    };
    CanvasRenderer.prototype.getEdgeStyle = function (edge) {
        return this.defaultEdgeStyle;
    };
    CanvasRenderer.prototype.drawVertex = function (vertex, position) {
        var s = this.toScreen(position);
        var dc = this.drawingContext;
        dc.save();
        var vertexStyle = utils_1.objectAssign({}, this.defaultVertexStyle, this.getVertexStyle(vertex));
        var contentWidth;
        var vertexLabel = this.getVertexLabel(vertex) || vertex.id.toString();
        if (vertex["_textWidth"]) {
            contentWidth = vertex["_textWidth"];
        }
        else {
            contentWidth = vertex["_textWidth"] = this.getTextWidth(vertexLabel, vertexStyle.font);
        }
        var contentHeight = this.getTextHeight(vertexLabel, vertexStyle);
        var boxWidth = contentWidth + vertexStyle.padding.left + vertexStyle.padding.right;
        var boxHeight = contentHeight + vertexStyle.padding.top + vertexStyle.padding.bottom;
        this._vertexSizes[vertex.id] = { width: boxWidth, height: boxHeight };
        // clear background
        dc.clearRect(s.x - boxWidth / 2, s.y - boxHeight / 2, boxWidth, boxHeight);
        // fill background
        dc.fillStyle = vertexStyle.backgroundStyle;
        dc.fillRect(s.x - boxWidth / 2, s.y - boxHeight / 2, boxWidth, boxHeight);
        dc.textAlign = "start";
        dc.textBaseline = "top";
        dc.font = vertexStyle.font;
        dc.fillStyle = vertexStyle.textStyle;
        dc.fillText(vertexLabel, s.x - contentWidth / 2, s.y - contentHeight / 2, contentWidth);
        dc.restore();
    };
    CanvasRenderer.prototype.drawEdge = function (edge, position1, position2) {
        var isDirectional = true;
        var p1 = this.toScreen(position1);
        var p2 = this.toScreen(position2);
        var direction = p2.subtract(p1);
        var normal = direction.normal().normalise();
        var edgeStyle = utils_1.objectAssign({}, this.defaultEdgeStyle, this.getEdgeStyle(edge));
        var intersection;
        var targetBox = this._vertexSizes[edge.toId];
        if (targetBox) {
            targetBox.width += edgeStyle.arrowPadding.x;
            targetBox.height += edgeStyle.arrowPadding.y;
            intersection = math_1.intersectLineBox(p1, p2, new math_1.Vector(p2.x - targetBox.width / 2.0, p2.y - targetBox.height / 2.0), targetBox.width, targetBox.height);
        }
        if (!intersection) {
            intersection = p2;
        }
        var lineEnd;
        if (isDirectional) {
            lineEnd = intersection.subtract(direction.normalise().multiply(edgeStyle.arrowSize.height * 0.5));
        }
        else {
            lineEnd = p2;
        }
        var dc = this.drawingContext;
        dc.save();
        dc.lineWidth = edgeStyle.lineWidth;
        dc.strokeStyle = edgeStyle.lineStyle;
        dc.beginPath();
        dc.moveTo(p1.x, p1.y);
        dc.lineTo(p2.x, p2.y);
        dc.stroke();
        dc.restore();
        if (isDirectional) {
            dc.save();
            dc.fillStyle = edgeStyle.lineStyle;
            dc.translate(intersection.x, intersection.y);
            dc.rotate(Math.atan2(p2.y - p1.y, p2.x - p1.x));
            dc.beginPath();
            dc.moveTo(-edgeStyle.arrowSize.height, edgeStyle.arrowSize.width);
            dc.lineTo(0, 0);
            dc.lineTo(-edgeStyle.arrowSize.height, -edgeStyle.arrowSize.width);
            dc.lineTo(-edgeStyle.arrowSize.height * 0.8, -0);
            dc.closePath();
            dc.fill();
            dc.restore();
        }
        var label = this.getEdgeLabel(edge);
        if (label) {
            dc.save();
            dc.textAlign = "center";
            dc.textBaseline = "top";
            dc.font = edgeStyle.font;
            dc.fillStyle = edgeStyle.textStyle;
            var angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            var displacement = -8;
            if (edgeStyle.textIsUpRight && (angle > Math.PI / 2 || angle < -Math.PI / 2)) {
                displacement = 8;
                angle += Math.PI;
            }
            var textPos = p1.add(p2).divide(2).add(normal.multiply(displacement));
            dc.translate(textPos.x, textPos.y);
            dc.rotate(angle);
            dc.fillText(label, 0, -2);
            dc.restore();
        }
    };
    return CanvasRenderer;
}());
exports.CanvasRenderer = CanvasRenderer;
//# sourceMappingURL=canvasRenderer.js.map
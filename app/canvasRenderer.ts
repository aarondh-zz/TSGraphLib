import { IVertex, IEdge } from "./graph";
import { Vector, Rectangle, intersectLineBox, Size } from "./math";
import { Renderer, Layout } from "./animate";
function objectAssign<T>(target: T, ...sources: T[]): T {
    if (sources) {
        sources.forEach((source) => {
            for (let key in source) {
                target[key] = source[key];
            }
        });
    }
    return target;
}
export interface Padding {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
}
export interface Point {
    x: number;
    y: number;
}
export interface VertexStyle {
    font?: string;
    backgroundStyle?: string;
    textStyle?: string;
    textHeight?: number;
    padding?: Padding;
}
export interface EdgeStyle {
    font?: string;
    lineStyle?: string;
    lineWidth?: number;
    textStyle?: string;
    textIsUpRight?: boolean;
    arrowSize?: Size;
    arrowPadding?: Point;
}
var defaultVertexStyle: VertexStyle = {
    font: "12px Verdana, sans-serif",
    backgroundStyle: "#FFFFE0",
    textStyle: "#000000",
    textHeight: 10,
    padding: { left: 5, right: 5, top: 5, bottom: 5 }
};
var defaultEdgeStyle: EdgeStyle = {
    font: "8px Verdana, sans-serif",
    lineStyle: "#000000",
    lineWidth: 1,
    textIsUpRight: true,
    textStyle: "#000000",
    arrowSize: { width: 2, height: 8 },
    arrowPadding: { x: 2, y: 2 }
};
export class CanvasRenderer<V, E> implements Renderer<V, E> {
    timerToken: number;
    drawingContext: CanvasRenderingContext2D;
    boundingBox: Rectangle;
    targetBoundingBox: Rectangle;
    public defaultVertexStyle: VertexStyle = defaultVertexStyle;
    public defaultEdgeStyle: EdgeStyle = defaultEdgeStyle;
    private _stopping: boolean = false;
    private _vertexSizes: Size[] = [];
    constructor(public layout: Layout<V, E>, public canvasElement: HTMLCanvasElement) {
        this.drawingContext = canvasElement.getContext("2d");
    }
    start(): void {
        this._stopping = false;
        this.boundingBox = this.layout.getBoundingBox();
        this.targetBoundingBox = { bottomLeft: new Vector(-2, -2), topRight: new Vector(2, 2) };

        // auto adjusting bounding box
        window.requestAnimationFrame(this.adjustBoundingBox.bind(this));
    }
    end(): void {
        this._stopping = true;
    }
    adjustBoundingBox(): void {
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
    }
    toScreen(p: Vector) {
        var size = this.boundingBox.topRight.subtract(this.boundingBox.bottomLeft);
        var sx = p.subtract(this.boundingBox.bottomLeft).divide(size.x).x * this.canvasElement.width;
        var sy = p.subtract(this.boundingBox.bottomLeft).divide(size.y).y * this.canvasElement.height;
        return new Vector(sx, sy);
    }
    fromScreen(s: Vector) {
        var size = this.boundingBox.topRight.subtract(this.boundingBox.bottomLeft);
        var px = (s.x / this.canvasElement.width) * size.x + this.boundingBox.bottomLeft.x;
        var py = (s.y / this.canvasElement.height) * size.y + this.boundingBox.bottomLeft.y;
        return new Vector(px, py);
    }
    clear(): void {
        this.drawingContext.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
    frameStart(): void {
        this.clear();
    }
    frameEnd(): void {
    }
    getTextWidth(text: string, style: VertexStyle): number {
        let dc = this.drawingContext;

        dc.save();
        dc.font = style.font;
        let textMetrics = dc.measureText(text);
        dc.restore();
        return textMetrics.width;
    }
    getTextHeight(text: string, style:VertexStyle) {
        return style.textHeight;
    }
    getVertexLabel(vertex: IVertex<V>): string {
        return vertex.id.toString();
    }
    getEdgeLabel(vertex: IEdge<E>): string {
        return null;
    }
    getVertexStyle(vertex: IVertex<V>): VertexStyle {
        return this.defaultVertexStyle;
    }
    getEdgeStyle(edge: IEdge<E>): EdgeStyle {
        return this.defaultEdgeStyle;
    }
    drawVertex(vertex: IVertex<V>, position: Vector): void {
        let s = this.toScreen(position);

        let dc = this.drawingContext;

        dc.save();

        var vertexStyle = objectAssign<VertexStyle>({}, this.defaultVertexStyle, this.getVertexStyle(vertex));

        var contentWidth: number;

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
    }
    drawEdge(edge: IEdge<E>, position1: Vector, position2: Vector): void {
        let isDirectional = true;

        let p1 = this.toScreen(position1);

        let p2 = this.toScreen(position2);

        let direction = p2.subtract(p1);

        let normal = direction.normal().normalise();

        let edgeStyle = objectAssign<EdgeStyle>({}, this.defaultEdgeStyle, this.getEdgeStyle(edge));

        let intersection: Vector;

        let targetBox = this._vertexSizes[edge.toId];

        if (targetBox) {
            targetBox.width += edgeStyle.arrowPadding.x;
            targetBox.height += edgeStyle.arrowPadding.y;
            intersection = intersectLineBox(p1, p2, new Vector(p2.x - targetBox.width / 2.0, p2.y - targetBox.height / 2.0), targetBox.width, targetBox.height);
        }

        if (!intersection) {

            intersection = p2;

        }

        var lineEnd;

        if (isDirectional) {

            lineEnd = intersection.subtract(direction.normalise().multiply(edgeStyle.arrowSize.height * 0.5));

        } else {

            lineEnd = p2;

        }

        let dc = this.drawingContext;

        dc.save();

        dc.lineWidth = edgeStyle.lineWidth;
        dc.strokeStyle = edgeStyle.lineStyle;
        dc.beginPath();
        dc.moveTo(p1.x, p1.y);
        dc.lineTo(p2.x, p2.y);
        dc.stroke();

        dc.restore();

        if ( isDirectional ) {

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
        let label = this.getEdgeLabel(edge);

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
    }
}

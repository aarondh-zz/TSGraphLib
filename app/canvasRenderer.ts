import { IVertex, IEdge } from "./graph";
import { Vector, Rectangle } from "./math";
import { Renderer, Layout } from "./animate";

export class CanvasRenderer<V, E> implements Renderer<V, E> {
    timerToken: number;
    drawingContext: CanvasRenderingContext2D;
    boundingBox: Rectangle;
    targetBoundingBox: Rectangle;
    defaultVertexFont: string = "12px Verdana, sans-serif";
    defaultVertexBackgroundStyle: string = "#FFFFE0";
    defaultVertexTextStyle: string = "#000000";
    defaultVertexTextHieght: number = 10;
    defaultEdgeFont: string = "8px Verdana, sans-serif";
    defaultEdgeLineStyle: string = "#000000";
    defaultEdgeLineWidth: number = 1;
    defaultEdgeTextStyle: string = "#000000";
    private _stopping: boolean = false;
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
    frameStart(): void {
        this.drawingContext.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
    frameEnd(): void {
    }
    getTextWidth(text: string, font: string): number {
        let dc = this.drawingContext;

        dc.save();
        dc.font = font;
        var width = dc.measureText(text).width;
        dc.restore();
        return width;
    }
    getTextHeight(text: string, font: string) {
        return this.defaultVertexTextHieght;
    }
    getVertexLabel(vertex: IVertex<V>): string {
        return vertex.id.toString();
    }
    getVertexFont(vertex: IVertex<V>): string {
        return this.defaultVertexFont;
    }
    getVertexTextStyle(vertex: IVertex<V>): string {
        return this.defaultVertexTextStyle;
    }
    getVertexBackgroundStyle(vertex: IVertex<V>): string {
        return this.defaultVertexBackgroundStyle;
    }
    getEdgeFont(edge: IEdge<E>): string {
        return this.defaultEdgeFont;
    }
    getEdgeTextStyle(edge: IEdge<E>): string {
        return this.defaultEdgeTextStyle;
    }
    getEdgeLineStyle(edge: IEdge<E>): string {
        return this.defaultEdgeLineStyle;
    }
    getEdgeLineWidth(edge: IEdge<E>): number {
        return this.defaultEdgeLineWidth;
    }
    drawVertex(vertex: IVertex<V>, position: Vector): void {
        let s = this.toScreen(position);

        let dc = this.drawingContext;

        dc.save();

        // Pulled out the padding aspect sso that the size functions could be used in multiple places
        // These should probably be settable by the user (and scoped higher) but this suffices for now
        var paddingX = 6;
        var paddingY = 6;
        var font = this.getVertexFont(vertex) || this.defaultVertexFont;
        var textStyle = this.getVertexTextStyle(vertex) || this.defaultVertexTextStyle;
        var backgroundStyle = this.getVertexBackgroundStyle(vertex) || this.defaultVertexBackgroundStyle;
        var contentWidth: number;
        var vertexLabel = this.getVertexLabel(vertex) || vertex.id.toString();
        if (vertex["_textWidth"]) {
            contentWidth = vertex["_textWidth"];
        }
        else {
            contentWidth = vertex["_textWidth"] = this.getTextWidth(vertexLabel, font);
        }
        var contentHeight = this.getTextHeight(vertexLabel, font);
        var boxWidth = contentWidth + paddingX;
        var boxHeight = contentHeight + paddingY;

        // clear background
        dc.clearRect(s.x - boxWidth / 2, s.y - boxHeight / 2, boxWidth, boxHeight);

        // fill background
        dc.fillStyle = backgroundStyle;
        dc.fillRect(s.x - boxWidth / 2, s.y - boxHeight / 2, boxWidth, boxHeight);

        dc.textAlign = "left";
        dc.textBaseline = "top";
        dc.font = this.defaultVertexFont;
        dc.fillStyle = textStyle;
        dc.fillText(vertexLabel, s.x - contentWidth / 2, s.y - contentHeight / 2);
        dc.restore();
    }
    drawEdge(edge: IEdge<E>, position1: Vector, position2: Vector): void {
        let p1 = this.toScreen(position1);
        let p2 = this.toScreen(position2);

        let font = this.getEdgeFont(edge) || this.defaultVertexFont;
        let textStyle = this.getEdgeTextStyle(edge) || this.defaultEdgeTextStyle;
        let lineStyle = this.getEdgeLineStyle(edge) || this.defaultEdgeLineStyle;
        let lineWidth = this.getEdgeLineWidth(edge) || this.defaultEdgeLineWidth;
        let dc = this.drawingContext;
        dc.lineWidth = lineWidth;
        dc.strokeStyle = lineStyle;
        dc.beginPath();
        dc.moveTo(p1.x, p1.y);
        dc.lineTo(p2.x, p2.y);
        dc.stroke();

    }
}

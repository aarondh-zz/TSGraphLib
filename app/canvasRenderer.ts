import { IVertex, IEdge } from "./graph";
import { Vector, Rectangle } from "./math";
import { Renderer, Layout } from "./animate";
function objectAssign<T>(target: T, ...sources: T[]): any {
    if (sources) {
        sources.forEach((source) => {
            for (let key in source) {
                target[key] = source[key];
            }
        });
    }
    return target;
}
export interface VertexStyle {
    font?: string;
    backgroundStyle?: string;
    textStyle?: string;
    textHieght?: number;

}
export interface EdgeStyle {
    font?: string;
    lineStyle?: string;
    lineWidth?: number;
    textStyle?: string;
}
var defaultVertexStyle: VertexStyle = {
    font: "12px Verdana, sans-serif",
    backgroundStyle: "#FFFFE0",
    textStyle: "#000000",
    textHieght: 10

};
var defaultEdgeStyle: EdgeStyle = {
    font: "8px Verdana, sans-serif",
    lineStyle: "#000000",
    lineWidth: 1,
    textStyle: "#000000"
};
export class CanvasRenderer<V, E> implements Renderer<V, E> {
    timerToken: number;
    drawingContext: CanvasRenderingContext2D;
    boundingBox: Rectangle;
    targetBoundingBox: Rectangle;
    public defaultVertexStyle: VertexStyle = defaultVertexStyle;
    public defaultEdgeStyle: EdgeStyle = defaultEdgeStyle;
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
        return this.defaultVertexStyle.textHieght;
    }
    getVertexLabel(vertex: IVertex<V>): string {
        return vertex.id.toString();
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

        // Pulled out the padding aspect sso that the size functions could be used in multiple places
        // These should probably be settable by the user (and scoped higher) but this suffices for now
        var paddingX = 6;
        var paddingY = 6;
        var vertexStyle = objectAssign<VertexStyle>({}, this.defaultVertexStyle, this.getVertexStyle(vertex));
        var contentWidth: number;
        var vertexLabel = this.getVertexLabel(vertex) || vertex.id.toString();
        if (vertex["_textWidth"]) {
            contentWidth = vertex["_textWidth"];
        }
        else {
            contentWidth = vertex["_textWidth"] = this.getTextWidth(vertexLabel, vertexStyle.font);
        }
        var contentHeight = this.getTextHeight(vertexLabel, vertexStyle.font);
        var boxWidth = contentWidth + paddingX;
        var boxHeight = contentHeight + paddingY;

        // clear background
        dc.clearRect(s.x - boxWidth / 2, s.y - boxHeight / 2, boxWidth, boxHeight);

        // fill background
        dc.fillStyle = vertexStyle.backgroundStyle;
        dc.fillRect(s.x - boxWidth / 2, s.y - boxHeight / 2, boxWidth, boxHeight);

        dc.textAlign = "left";
        dc.textBaseline = "top";
        dc.font = vertexStyle.font;
        dc.fillStyle = vertexStyle.textStyle;
        dc.fillText(vertexLabel, s.x - contentWidth / 2, s.y - contentHeight / 2);
        dc.restore();
    }
    drawEdge(edge: IEdge<E>, position1: Vector, position2: Vector): void {
        let p1 = this.toScreen(position1);
        let p2 = this.toScreen(position2);

        var edgeStyle = objectAssign<EdgeStyle>({}, this.defaultEdgeStyle, this.getEdgeStyle(edge));
        let dc = this.drawingContext;
        dc.lineWidth = edgeStyle.lineWidth;
        dc.strokeStyle = edgeStyle.lineStyle;
        dc.beginPath();
        dc.moveTo(p1.x, p1.y);
        dc.lineTo(p2.x, p2.y);
        dc.stroke();

    }
}

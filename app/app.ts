import { Graph, IVertex, IEdge } from "./graph";
import { Vector, Rectangle } from "./math";
import { ForceDirected } from "./forceDirected";
import { Animate, Renderer, } from "./animate";
interface VertexData {
    label: string;
    mass?: number;
    font?: string;
    backgroundStyle?: string;
    textStyle?: string
}
interface EdgeData {
    label?: string;
    length?: number;
    font?: string;
    lineStyle?: string;
    lineWidth?: number;
    textStyle?: string
}

export class Main implements Renderer<VertexData,EdgeData> {
    timerToken: number;
    graph: Graph<VertexData, EdgeData>;
    layout: ForceDirected<VertexData, EdgeData>;
    animate: Animate<VertexData, EdgeData>;
    drawingContext: CanvasRenderingContext2D;
    boundingBox: Rectangle;
    targetBoundingBox: Rectangle;
    defaultVertexFont: string = "16px Verdana, sans-serif";
    defaultVertexBackgroundStyle: string = "#FFFFE0";
    defaultVertexTextStyle: string = "#000000";
    defaultEdgeFont: string = "8px Verdana, sans-serif";
    defaultEdgeLineStyle: string = "#000000";
    defaultEdgeLineWidth: number = 1;
    defaultEdgeTextStyle: string = "#000000";
    constructor(public divElement: HTMLDivElement, public canvasElement: HTMLCanvasElement) {
        this.createGraph();
        this.drawingContext = canvasElement.getContext("2d");
    }
    createGraph(): void {
        var graph = this.graph = new Graph<VertexData, EdgeData>();
        graph.addVertex({ label: "0" });
        graph.addVertex({ label: "1" });
        graph.addVertex({ label: "2" });
        graph.addVertex({ label: "3" });
        graph.addVertex({ label: "4" });
        graph.addVertex({ label: "5555" });
        graph.addVertex({ label: "middle"});
        graph.addEdge(0, 1, "a");
        graph.addEdge(0, 2, "b");
        graph.addEdge(1, 2, "c");
        graph.addEdge(6, 1, "c");
        graph.addEdge(2, 0, "d");
        graph.addEdge(2, 3, "e");
        graph.addEdge(3, 2, "e");
        graph.addEdge(3, 4, "f");
        graph.addEdge(4, 5, "g");
        graph.addEdge(5, 3, "g");
        graph.addEdge(5, 6, "g");

        this.layout = new ForceDirected<VertexData, EdgeData>(graph, 400.0,400.0,0.5,0.00001);
        this.animate = new Animate<VertexData, EdgeData>(this.layout, this);

        this.boundingBox = this.layout.getBoundingBox();
        this.targetBoundingBox = { bottomLeft: new Vector(-2, -2), topRight: new Vector(2, 2) };

        // auto adjusting bounding box
        window.requestAnimationFrame(this.adjustBoundingBox.bind(this));

        this.animate.start();
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

        window.requestAnimationFrame(this.adjustBoundingBox.bind(this));
    }
    toScreen(p: Vector) {
        var size = this.boundingBox.topRight.subtract(this.boundingBox.bottomLeft);
        var sx = p.subtract(this.boundingBox.bottomLeft).divide(size.x).x * this.canvasElement.width;
        var sy = p.subtract(this.boundingBox.bottomLeft).divide(size.y).y * this.canvasElement.height;
        return new Vector(sx, sy);
    }
    fromScreen(s:Vector) {
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
    getTextWidth(text:string, font: string) {
        let dc = this.drawingContext;

        dc.save();
        dc.font = font;
        var width = dc.measureText(text).width;
        dc.restore();
        return width;
    }
    getTextHeight(text: string, font: string) {
        return 16;
    }
    drawVertex(vertex: IVertex<VertexData>, position: Vector): void {
        let s = this.toScreen(position);

        let dc = this.drawingContext;

        dc.save();

        // Pulled out the padding aspect sso that the size functions could be used in multiple places
        // These should probably be settable by the user (and scoped higher) but this suffices for now
        var paddingX = 6;
        var paddingY = 6;
        var font = vertex.payload.font || this.defaultVertexFont;
        var textStyle = vertex.payload.textStyle || this.defaultVertexTextStyle;
        var backgroundStyle = vertex.payload.backgroundStyle || this.defaultVertexBackgroundStyle;
        var contentWidth: number;
        if (vertex["_textWidth"]) {
            contentWidth = vertex["_textWidth"];
        }
        else {
            contentWidth = vertex["_textWidth"] = this.getTextWidth(vertex.payload.label, font);
        }
        var contentHeight = this.getTextHeight(vertex.payload.label, font);
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
        dc.fillText(vertex.payload.label, s.x - contentWidth / 2, s.y - contentHeight / 2);
        dc.restore();
    }
    drawEdge(edge: IEdge<EdgeData>, position1: Vector, position2: Vector): void {
        let p1 = this.toScreen(position1);
        let p2 = this.toScreen(position2);

        let font = edge.payload.font || this.defaultVertexFont;
        let textStyle = edge.payload.textStyle || this.defaultEdgeTextStyle;
        let lineStyle = edge.payload.lineStyle || this.defaultEdgeLineStyle;
        let lineWidth = edge.payload.lineWidth || this.defaultEdgeLineWidth;
        let dc = this.drawingContext;
        dc.lineWidth = lineWidth;
        dc.strokeStyle = lineStyle;
        dc.beginPath();
        dc.moveTo(p1.x, p1.y);
        dc.lineTo(p2.x, p2.y);
        dc.stroke();

       }
    testDF(): void {
        this.writeLine();
        this.write("depth first: ");
        this.graph.forEachVertexDepthFirst(2, (vertex) => {
            this.write(vertex.payload.label + " ");
        });
    }
    testBF(): void {
        this.writeLine();
        this.write("breadth first: ");
        this.graph.forEachVertexBreadthFirst(2, (vertex) => {
            this.write(vertex.payload.label + " ");
        });
    }
    write(text: string) {
        var span = document.createElement('span');
        span.innerHTML = text;
        this.divElement.appendChild(span);
    }
    writeLine(text: string= "") {
        this.write(text + "<br/>")
    }
}

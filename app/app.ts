import { Graph, IVertex, IEdge } from "./graph";
import { Vector, Rectangle } from "./math";
import { ForceDirected } from "./forceDirected";
import { Animate, Renderer, Layout } from "./animate";
import { CanvasRenderer } from "./canvasRenderer";
import { Detective } from "./detective";
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
interface EdgeDataWithFromTo extends EdgeData {
    from: number;
    to: number;
}
interface GraphInput {
    stiffness: number;
    repulsion: number;
    damping: number;
    minEnergyThreshold;
    maxSpeed: number;
    vertices: VertexData[];
    edges: EdgeDataWithFromTo[];
}
class MyCanvasRenderer extends CanvasRenderer<VertexData, EdgeData> {
    constructor(layout: Layout<VertexData, VertexData>, canvasElement: HTMLCanvasElement) {
        super(layout, canvasElement)
    }

    public getVertexLabel(vertext: IVertex<VertexData>) {
        return vertext.payload.label;
    }
}
export class Main {
    timerToken: number;
    graph: Graph<VertexData, EdgeData>;
    layout: ForceDirected<VertexData, EdgeData>;
    renderer: MyCanvasRenderer;
    animate: Animate<VertexData, EdgeData>;
    constructor(public divElement: HTMLDivElement, public canvasElement: HTMLCanvasElement) {
        var graph = this.graph = new Graph<VertexData, EdgeData>();
    }
    loadGraph(graphSource: string) {
        this.graph.clear();

        var graphInput: GraphInput = JSON.parse(graphSource);
        if (Array.isArray(graphInput.vertices)) {
            graphInput.vertices.forEach((vertextData) => {
                this.graph.addVertex(vertextData);
            });
            graphInput.edges.forEach((edgeData) => {
                this.graph.addEdge(edgeData.from, edgeData.to, edgeData);
            });
        }

        this.layout = new ForceDirected<VertexData, EdgeData>(this.graph,
            graphInput.stiffness || 400.0,
            graphInput.repulsion || 400.0,
            graphInput.damping || 0.5,
            graphInput.minEnergyThreshold || 0.00001,
            graphInput.maxSpeed || Infinity);
        this.renderer = new MyCanvasRenderer(this.layout, this.canvasElement)
        this.animate = new Animate<VertexData, EdgeData>(this.layout,this.renderer);
    }
    start(): void {

        this.renderer.start();

        this.animate.start();
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
    testDetective(statements: string[][]): void {
        var detective = new Detective();

        var layout = new ForceDirected<VertexData, EdgeData>(this.graph,
            400.0,
            400.0,
            0.5,
            0.00001,
            Infinity);
        var renderer = detective.getRenderer(layout, this.canvasElement);
        var animate = new Animate<VertexData, EdgeData>(layout, renderer);
        renderer.start();
        animate.start();
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

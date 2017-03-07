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
    textDiv: HTMLDivElement;
    canvasElement: HTMLCanvasElement;
    constructor(public contentElement: HTMLDivElement) {
        var graph = this.graph = new Graph<VertexData, EdgeData>();
    }
    newTest(title:string) {
        let testContainerDiv = document.createElement('div');
        testContainerDiv.setAttribute("class","test-container")
        this.contentElement.appendChild(testContainerDiv);

        let titleDiv = document.createElement('div');
        titleDiv.innerHTML = title;
        titleDiv.setAttribute("class", "title");
        testContainerDiv.appendChild(titleDiv);

        let textContainerDiv = document.createElement('div');
        textContainerDiv.setAttribute("class", "text-container")
        testContainerDiv.appendChild(textContainerDiv);
        this.textDiv = document.createElement('div');
        textContainerDiv.appendChild(this.textDiv);

        let cavnasContainerDiv = document.createElement('div');
        cavnasContainerDiv.setAttribute("class", "canvas-container");
        testContainerDiv.appendChild(cavnasContainerDiv);
        this.canvasElement = document.createElement('canvas');
        cavnasContainerDiv.appendChild(this.canvasElement);
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
        this.animate = new Animate<VertexData, EdgeData>(this.layout, this.renderer);

        this.start();
    }
    start(): void {

        this.renderer.start();

        this.animate.start();
    }

    testDF(): void {
        this.newTest("depth first test");
        this.writeLine();
        this.write("depth first: ");
        try {
            this.graph.forEachVertexDepthFirst(2, (vertex) => {
                this.write(vertex.payload.label + " ");
            });
        }
        catch (err) {
            this.writeLine();
            this.write(err);
        }
    }
    testBF(): void {
        this.newTest("breadth first test");
        this.writeLine();
        this.write("breadth first: ");
        try {
            this.graph.forEachVertexBreadthFirst(2, (vertex) => {
                this.write(vertex.payload.label + " ");
            });
        }
        catch (err) {
            this.writeLine();
            this.write(err);
        }
   }
    testDetective(title: string, statements: string[][]): void {
        this.newTest(title);
        this.writeLine();
        this.writeLine("statements: ");
        this.writeLine(JSON.stringify(statements, null, 2));
        var detective = new Detective();
        statements.forEach((statement) => {
            detective.addStatement(statement);
        });
        var layout = new ForceDirected<VertexData, EdgeData>(detective.timeline,
            400.0,
            400.0,
            0.5,
            0.00001,
            Infinity);
        var renderer = detective.getRenderer(layout, this.canvasElement);
        var animate = new Animate<VertexData, EdgeData>(layout, renderer);
        renderer.start();
        animate.start();
        this.writeLine();
        this.writeLine("timelines: ");
        this.writeLine(JSON.stringify(detective.getTimelines(),null,2));
    }
    write(text: string) {
        var span = document.createElement('span');
        span.innerHTML = text;
        this.textDiv.appendChild(span);
    }
    writeLine(text: string= "") {
        this.write(text + "<br/>")
    }
}

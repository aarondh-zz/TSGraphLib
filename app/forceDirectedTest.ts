import { Graph, IVertex, IEdge } from "./graph";
import { Vector, Rectangle } from "./math";
import { ForceDirected } from "./forceDirected";
import { Animate, Renderer, Layout } from "./animate";
import { CanvasRenderer } from "./canvasRenderer";
import { TestHarness } from "./testHarness";

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
export class ForceDirectedTest {
    testHarness: TestHarness;
    graph: Graph<VertexData, EdgeData>;
    layout: ForceDirected<VertexData, EdgeData>;
    renderer: MyCanvasRenderer;
    animate: Animate<VertexData, EdgeData>;
    constructor(contentElement: HTMLDivElement) {
        this.testHarness = new TestHarness(contentElement);
        this.graph = new Graph<VertexData, EdgeData>();
    }
    public newTest(title: string) {
        this.testHarness.newTest(title);
    }
    public loadGraph(graphSource: string) {
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

        this.renderer = new MyCanvasRenderer(this.layout, this.testHarness.canvas);

        this.animate = new Animate<VertexData, EdgeData>(this.layout, this.renderer);

        this.start();
    }
    start(): void {

        this.renderer.start();

        this.animate.start();
    }

    testDF(): void {
        this.testHarness.newTest("depth first test");
        this.testHarness.writeLine();
        this.testHarness.write("depth first: ");
        try {
            this.graph.forEachVertexDepthFirst(2, (vertex) => {
                this.testHarness.write(vertex.payload.label + " ");
            });
        }
        catch (err) {
            this.testHarness.writeLine();
            this.testHarness.write(err);
        }
    }
    testBF(): void {
        this.testHarness.newTest("breadth first test");
        this.testHarness.writeLine();
        this.testHarness.write("breadth first: ");
        try {
            this.graph.forEachVertexBreadthFirst(2, (vertex) => {
                this.testHarness.write(vertex.payload.label + " ");
            });
        }
        catch (err) {
            this.testHarness.writeLine();
            this.testHarness.write(err);
        }
   }
}

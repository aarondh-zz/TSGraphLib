import { Graph, IVertex, IEdge } from "../lib/graph";
import { Animate, Layout, Renderer } from "../lib/animate";
import { CanvasRenderer, VertexStyle, EdgeStyle } from "../lib/canvasRenderer";
import { ForceDirected } from "../lib/forceDirected";
import { TestHarness } from "../test/testHarness";
const NodeTextStyle = "black";
const VisitedTextStyle = "blue";
const RootTextStyle = "green";
const LeafTextStyle = "red";
const FollowedEdgeTextStyle = "green";
enum VertexType {
    Node,
    Visited,
    Root,
    Leaf
}
export class Word {
    constructor(public label: string, public type: VertexType = VertexType.Node) {
    }
}
export class Edge {
    constructor(public followed:boolean = false) {
    }
}
// overrides the normal canvas renderer and provides coloring for the graph
class MyWordCanvasRenderer extends CanvasRenderer<Word, Edge> {
    constructor(layout: Layout<Word, any>, canvasElement: HTMLCanvasElement) {
        super(layout, canvasElement)
    }

    public getVertexLabel(vertex: IVertex<Word>) {
        return vertex.payload.label;
    }
    public getVertexStyle(vertex: IVertex<Word>): VertexStyle {
        switch (vertex.payload.type) {
            case VertexType.Node:
                return {
                    textStyle: NodeTextStyle
                }
            case VertexType.Visited:
                return {
                    textStyle: VisitedTextStyle
                }
            case VertexType.Root:
                return {
                    textStyle: RootTextStyle
                }
            case VertexType.Leaf:
                return {
                    textStyle: LeafTextStyle
                }
        }
    }
    public getEdgeLabel(edge: IEdge<Edge>): string {
        if (edge.payload.followed) {
            return "✔";
        }
        else {
            return "❌";
        }
    }
    public getEdgeStyle(edge: IEdge<Edge>): EdgeStyle {
        if (edge.payload.followed) {
            return {
                lineStyle: FollowedEdgeTextStyle,
            }
        }
    }
}

export class Detective {
    private _timeline: Graph<Word, Edge>;
    private _statementCount: number;
    private testHarness: TestHarness;
    constructor(public contentElement: HTMLDivElement) {
        this.testHarness = new TestHarness(contentElement);
        this._timeline = new Graph<Word, Edge>();
        this._statementCount = 0;
    }
    public clear(): void {
        this._timeline.clear();
    }
    public addStatement(words: string[]) {
        if (words) {
            let statement = new Graph<Word, Edge>();
            var lastWord: IVertex<Word>;
            words.forEach((word, index) => {
                let wordVertex = statement.addVertex(new Word(word));
                if (lastWord) {
                    statement.addEdge(lastWord.id, wordVertex.id, new Edge());
                }
                lastWord = wordVertex;
            });
            this._timeline.merge(statement, (vertex) => {
                return vertex.payload.label;
            });

        }
    }
    public get timeline():
        Graph<Word, any> {
        return this._timeline
    }
    public getRenderer(layout: Layout<Word, Edge>, canvasElement: HTMLCanvasElement): Renderer<Word, Edge> {
        return new MyWordCanvasRenderer(layout, canvasElement);
    }
    public getTimelines(): string[][] {
        let timelines: string[][] = [];
        let roots = this._timeline.roots();
        let leafs = this._timeline.leafs();
        let unusedEdges: IEdge<Edge>[];

        roots.forEach((vertex) => {
            vertex.payload.type = VertexType.Root;
        });

        leafs.forEach((vertex) => {
            vertex.payload.type = VertexType.Leaf;
        });

        for (let r = 0; r < roots.length; r++) {
            for (let l = 0; l < leafs.length; l++) {
                let unusedVertices: IVertex<Word>[] = [];
                let counter = 0;
                do {
                    let statement: string[] = [];
                    unusedEdges = [];
                    let distance = this._timeline.pathBetween(roots[r].id, leafs[l].id, true, Edge, (edge) => {
                        let vertex = this._timeline.getVertex(edge.toId);
                        if (vertex.payload.type == VertexType.Node) {
                            vertex.payload.type = VertexType.Visited;
                        }
                        edge.payload.followed = true;
                        statement.push(vertex.payload.label);
                    }, unusedEdges, unusedVertices);
                    if (distance !== Infinity) {
                        timelines.push(statement);
                    }
                    if (unusedEdges.length > 0) {
                        this._timeline.markUnused(unusedEdges); //TBD: Need to only do this if < all vertices are visited
                    }
                } while (unusedEdges.length > 0 && unusedVertices.length > 0 && ++counter < 10);
                this._timeline.unremoveAllEdges();
            }
        }
        return timelines;
    }
    test(title: string, statements: string[][]): void {
        this.clear();
        this.testHarness.newTest(title);
        this.testHarness.writeLine();
        this.testHarness.writeLine("statements: ");
        this.testHarness.writeLine(JSON.stringify(statements, null, 2));
        statements.forEach((statement) => {
            this.addStatement(statement);
        });
        var layout = new ForceDirected<Word, Edge>(this.timeline,
            400.0,
            400.0,
            0.5,
            0.00001,
            Infinity);
        var renderer = this.getRenderer(layout, this.testHarness.canvas);
        var animate = new Animate<Word, Edge>(layout, renderer);
        renderer.start();
        animate.start();
        this.testHarness.writeLine();
        this.testHarness.writeLine("timelines: ");
        this.testHarness.writeLine(JSON.stringify(this.getTimelines(), null, 2));
    }
}
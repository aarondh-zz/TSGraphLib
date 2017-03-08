import { Graph, IVertex, IEdge } from "./graph";
import { Layout, Renderer } from "./animate";
import { CanvasRenderer, VertexStyle, EdgeStyle } from "./canvasRenderer";
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
    constructor() {
        this._timeline = new Graph<Word, Edge>();
        this._statementCount = 0;
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
        roots.forEach((vertex) => {
            vertex.payload.type = VertexType.Root;
        });
        leafs.forEach((vertex) => {
            vertex.payload.type = VertexType.Leaf;
        });
        for (let r = 0; r < roots.length; r++) {
            for (let l = 0; l < leafs.length; l++) {
                let statement: string[] = [];
                let distance = this._timeline.pathBetween(roots[r].id, leafs[l].id, true, Edge, (edge) => {
                    let vertex = this._timeline.getVertex(edge.toId);
                    if (vertex.payload.type == VertexType.Node) {
                        vertex.payload.type = VertexType.Visited;
                    }
                    edge.payload.followed = true;
                    statement.push(vertex.payload.label);
                });
                if (distance !== Infinity) {
                    timelines.push(statement);
                }
            }
        }
        return timelines;
    }
}
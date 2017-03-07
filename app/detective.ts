import { Graph, IVertex, IEdge } from "./graph";
import { Layout, Renderer } from "./animate";
import { CanvasRenderer, VertexStyle, EdgeStyle } from "./canvasRenderer";
export class Word {
    constructor(public label: string, public start:boolean) {
    }
}
class MyWordCanvasRenderer extends CanvasRenderer<Word, any> {
    constructor(layout: Layout<Word, any>, canvasElement: HTMLCanvasElement) {
        super(layout, canvasElement)
    }

    public getVertexLabel(vertex: IVertex<Word>) {
        return vertex.payload.label;
    }
    public getVertexStyle(vertex: IVertex<Word>): VertexStyle {
        if (vertex.payload.start) {
            return {
                textStyle: "green"
            }
        }
    }
    public getEdgeStyle(edge: IEdge<boolean>): EdgeStyle {
        if (edge.payload) {
            return {
                lineStyle: "green"
            }
        }
    }
}

export class Detective {
    private _timeline: Graph<Word, boolean>;
    private _statementCount: number;
    constructor() {
        this._timeline = new Graph<Word, boolean>();
        this._statementCount = 0;
    }
    
    public addStatement(words: string[]) {
        if (words) {
            let statement = new Graph<Word, boolean>();
            var lastWord: IVertex<Word>;
            words.forEach((word, index) => {
                let wordVertex = statement.addVertex(new Word(word, index === 0));
                if (lastWord) {
                    statement.addEdge(lastWord.id, wordVertex.id);
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
    public getRenderer(layout: Layout<Word, boolean>, canvasElement: HTMLCanvasElement): Renderer<Word, boolean> {
        return new MyWordCanvasRenderer(layout, canvasElement);
    }
    public getTimelines(): string[][] {
        let timelines: string[][] = [];
        let roots = this._timeline.roots();
        let leafs = this._timeline.leafs();
        for (let r = 0; r < roots.length; r++) {
            for (let l = 0; l < leafs.length; l++) {
                let statement: string[] = [];
                let distance = this._timeline.pathBetween(roots[r].id, leafs[l].id, true, (edge) => {
                    let vertex = this._timeline.getVertex(edge.toId);
                    edge.payload = true;
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
import { Graph, IVertex } from "./graph";
import { Layout, Renderer } from "./animate";
import { CanvasRenderer } from "./canvasRenderer";
export class Word {
    constructor(public label: string) {
    }
}
class MyWordCanvasRenderer extends CanvasRenderer<Word, any> {
    constructor(layout: Layout<Word, any>, canvasElement: HTMLCanvasElement) {
        super(layout, canvasElement)
    }

    public getVertexLabel(vertext: IVertex<Word>) {
        return vertext.payload.label;
    }
}

export class Detective {
    private _timeline: Graph<Word, any>;
    constructor() {
        this._timeline = new Graph<Word, any>();
    }
    public addStatement(words: string[]) {
        if (words) {
            let statement = new Graph<Word, any>();
            var lastWord: IVertex<Word>;
            words.forEach((word) => {
                let wordVertex = statement.addVertex(new Word(word));
                if (lastWord) {
                    statement.addEdge(lastWord.id, wordVertex.id);
                }
                lastWord = wordVertex;
            });
            this._timeline.merge(statement, (a,b) => {
                return a.payload.label === b.payload.label;
            });

        }
    }
    public get timeline():
        Graph<Word, any> {
        return this._timeline
    }
    public getRenderer(layout: Layout<Word, any>, canvasElement: HTMLCanvasElement): Renderer<Word, any> {
        return new MyWordCanvasRenderer(layout, canvasElement);
    }
}
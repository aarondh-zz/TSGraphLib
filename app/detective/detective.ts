import { Graph, IVertex, IEdge, PathBetweenOptions } from "../lib/graph";
import { Animate, Layout, Renderer } from "../lib/animate";
import { CanvasRenderer, VertexStyle, EdgeStyle } from "../lib/canvasRenderer";
import { ForceDirected } from "../lib/forceDirected";
import { TestHarness } from "../test/testHarness";

const NodeTextStyle = "black"; //The color of the text of a normal (unvisted) node 

const VisitedTextStyle = "blue"; //The color of a visited node

const RootTextStyle = "green"; //The color of a root node

const LeafTextStyle = "red"; //The color of a leaf node

const FollowedEdgeTextStyle = "green"; //The color of a traversed edge

/* VertexType
 *
 *  The types of vertices's (used for displaying distinct styles)
 *
 */
enum VertexType {
    Node,
    Visited,
    Root,
    Leaf
}
/*  a class representing an word payload
 *
 *     setting followed to true, causes the edge to be displayed in green
 *
 */
export class Word {
    constructor(public label: string, public type: VertexType = VertexType.Node) {
    }
}
/*  a class representing an edge payload
 *
 *     setting followed to true, causes the edge to be displayed in green
 *
 */
export class Edge {
    constructor(public followed:boolean = false) {
    }
}
/* TimelineCanvasRenderer
 *
 * overrides the normal canvas renderer and provides coloring for time line graph
 *
 */
class TimelineCanvasRenderer extends CanvasRenderer<Word, Edge> {
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
/* The Detective algorithm
 *
 *   see /app/dectective/docs/Detective.doc
 *
 */
export class Detective {
    private _timeline: Graph<Word, Edge>; //holds a graph representing all possible time lines
    private _testHarness: TestHarness; //used to display the results of a test
    /* construct a new Detective
     *
     *   parameters:
     *
     *       contentElement: an html div element that will contain the output of a test of the detective (see test)
     *
     */
    constructor(public contentElement: HTMLDivElement) {
        this._testHarness = new TestHarness(contentElement);
        this._timeline = new Graph<Word, Edge>();
    }
    /*  clear
     *     clears the current timeline
     *
     */
    public clear(): void {
        this._timeline.clear();
    }
    /* addStatement
     *
     *  parameters:
     *      words: an array of words making up one statement
     *
     */
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
    /* timeline
     *
     *     the graph representing all possible time lines
     *
     */
    public get timeline():
        Graph<Word, any> {
        return this._timeline
    }
    /*
     * createRenderer
     *
     *   parameters:
     *
     *      layout:  the layout engine used to layout the time line
     *
     *      canvasElement:  an html canvas element in which the time line will be rendered
     *
     *  returns:
     *
     *     the time line renderer
     *
     */
    public createRenderer(layout: Layout<Word, Edge>, canvasElement: HTMLCanvasElement): Renderer<Word, Edge> {
        return new TimelineCanvasRenderer(layout, canvasElement);
    }
    /*
     * getTimelines
     *
     *   returns:
     *
     *      an array of potential timelines (string arrays)
     */
    public getTimelines(): string[][] {
        let timelines: string[][] = [];
        let roots = this._timeline.roots();
        let leafs = this._timeline.leafs();

        var options: PathBetweenOptions<Word, Edge> = {
            longest: true,
            unusedVertices: [],
            unusedEdges: []
        }

        roots.forEach((vertex) => {
            vertex.payload.type = VertexType.Root;
        });

        leafs.forEach((vertex) => {
            vertex.payload.type = VertexType.Leaf;
        });
        for (let r = 0; r < roots.length; r++) {
            for (let l = 0; l < leafs.length; l++) {
                options.unusedVertices = []; //accumulate unused vertices for each root-leaf pair
                let counter = 0; //loop buster
                do {
                    let statement: string[] = [];
                    options.unusedEdges = []; //clear unused edges for each statement
                    let distance = this._timeline.pathBetween(roots[r].id, leafs[l].id, (edge) => {
                        let vertex = this._timeline.getVertex(edge.toId);
                        if (vertex.payload.type == VertexType.Node) {
                            vertex.payload.type = VertexType.Visited;
                        }
                        if (edge.payload) {
                            edge.payload.followed = true;
                        }
                        statement.push(vertex.payload.label);
                    }, options);

                    if (distance !== Infinity) {
                        //path found from root to leaf
                        timelines.push(statement);
                    }

                    if (options.unusedEdges.length > 0 && options.unusedVertices.length > 0) {
                        //this removes all other edge options on each vertex containing an edge unused in the last path
                        this._timeline.markUnused(options.unusedEdges);
                    }
                } while (options.unusedEdges.length > 0 && options.unusedVertices.length > 0 && ++counter < 10);
                this._timeline.unremoveAllEdges();
            }
        }
        return timelines;
    }
    /*  test
     *
     *     do one test of the detective algorithm
     *
     *  parameters:
     *
     *      title: the title of the test
     *
     *      statements: an array of statements (string arrays)
     *
     */
    test(title: string, statements: string[][]): void {
        this.clear();
        this._testHarness.newTest(title);
        this._testHarness.writeLine();
        this._testHarness.writeLine("statements: ");
        this._testHarness.writeLine(JSON.stringify(statements, null, 2));
        statements.forEach((statement) => {
            this.addStatement(statement);
        });
        var layout = new ForceDirected<Word, Edge>(this.timeline,
            400.0,
            400.0,
            0.5,
            0.00001,
            Infinity);
        var renderer = this.createRenderer(layout, this._testHarness.canvas);
        var animate = new Animate<Word, Edge>(layout, renderer);
        renderer.start();
        animate.start();
        this._testHarness.writeLine();
        this._testHarness.writeLine("timelines: ");
        this._testHarness.writeLine(JSON.stringify(this.getTimelines(), null, 2));
    }
}
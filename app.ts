import { Graph } from "./graphLib.js";
class Main {
    element: HTMLElement;
    timerToken: number;
    graph: Graph<string, string>;

    constructor(element: HTMLElement) {
        this.element = element;
        this.createGraph();
    }
    createGraph(): void {
        var graph = this.graph = new Graph<string, string>();
        graph.addVertex("0");
        graph.addVertex("1");
        graph.addVertex("2");
        graph.addVertex("3");
        graph.addEdge(0, 1, "a");
        graph.addEdge(0, 2, "b");
        graph.addEdge(1, 2, "c");
        graph.addEdge(2, 0, "d");
        graph.addEdge(2, 3, "e");
        graph.addEdge(3, 3, "f");
    }
    testDF(): void {
        this.writeLine();
        this.write("depth first: ");
        this.graph.forEachVertexDepthFirst(2, (vertex) => {
            this.write(vertex.payload + " ");
        });
    }
    testBF(): void {
        this.writeLine();
        this.write("breadth first: ");
        this.graph.forEachVertexBreadthFirst(2, (vertex) => {
            this.write(vertex.payload + " ");
        });
    }
    write(text: string) {
        var span = document.createElement('span');
        span.innerHTML = text;
        this.element.appendChild(span);
    }
    writeLine(text: string= "") {
        this.write(text + "<br/>")
    }
}

function boot():void {
    var contentElement = document.getElementById('content');
    var main = new Main(contentElement);
    main.testDF();
    main.testBF();
};

boot();
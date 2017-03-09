import { Graph, IVertex, IEdge } from "./graph";
import { Vector, Rectangle } from "./math";
import { ForceDirected } from "./forceDirected";
import { Animate, Renderer, Layout } from "./animate";
import { CanvasRenderer } from "./canvasRenderer";
import { Detective } from "./detective";
export class TestHarness {
    private _textDiv: HTMLDivElement;
    private _canvasElement: HTMLCanvasElement;
    constructor(public contentElement: HTMLDivElement) {
    }
    public get canvas(): HTMLCanvasElement {
        return this._canvasElement
    }
    public newTest(title:string) {
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
        this._textDiv = document.createElement('div');
        textContainerDiv.appendChild(this._textDiv);

        let cavnasContainerDiv = document.createElement('div');
        cavnasContainerDiv.setAttribute("class", "canvas-container");
        testContainerDiv.appendChild(cavnasContainerDiv);
        this._canvasElement = document.createElement('canvas');
        cavnasContainerDiv.appendChild(this._canvasElement);
    }
    public write(text: string) {
        var span = document.createElement('span');
        span.innerHTML = text;
        this._textDiv.appendChild(span);
    }
    public writeLine(text: string= "") {
        this.write(text + "<br/>")
    }
}

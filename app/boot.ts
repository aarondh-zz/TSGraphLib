import { Main } from "./app";
function boot(): void {
    var jsonScriptElement = document.getElementById('graphInput') as HTMLDivElement;
    var divElement = document.getElementById('content') as HTMLDivElement;
    var canvasElement = document.getElementById('canvas') as HTMLCanvasElement;
    var main = new Main(divElement, canvasElement);
    main.loadGraph(jsonScriptElement.innerText);
    main.testDF();
    main.testBF();
    main.start();
};

boot();
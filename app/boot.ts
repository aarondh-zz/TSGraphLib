import { Main } from "./app";
function boot(): void {
    var divElement = document.getElementById('content') as HTMLDivElement;
    var canvasElement = document.getElementById('canvas') as HTMLCanvasElement;
    var main = new Main(divElement, canvasElement);
    main.testDF();
    main.testBF();
};

boot();
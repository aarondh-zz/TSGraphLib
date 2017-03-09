import { ForceDirectedTest } from "./forceDirectedTest";
function boot(): void {
    var jsonScriptElement = document.getElementById('graphInput') as HTMLDivElement;
    var contentDiv = document.getElementById('content') as HTMLDivElement;
    var forceDirectedTest = new ForceDirectedTest(contentDiv);
    forceDirectedTest.newTest("Bedrock")
    forceDirectedTest.loadGraph(jsonScriptElement.innerText);
    forceDirectedTest.testDF();
    forceDirectedTest.testBF();
};

boot();
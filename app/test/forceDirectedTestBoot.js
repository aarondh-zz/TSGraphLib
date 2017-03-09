"use strict";
var forceDirectedTest_1 = require("./forceDirectedTest");
function boot() {
    var jsonScriptElement = document.getElementById('graphInput');
    var contentDiv = document.getElementById('content');
    var forceDirectedTest = new forceDirectedTest_1.ForceDirectedTest(contentDiv);
    forceDirectedTest.newTest("Bedrock");
    forceDirectedTest.loadGraph(jsonScriptElement.innerText);
    forceDirectedTest.testDF();
    forceDirectedTest.testBF();
}
;
boot();
//# sourceMappingURL=forceDirectedTestBoot.js.map
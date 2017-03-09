"use strict";
var TestHarness = (function () {
    function TestHarness(contentElement) {
        this.contentElement = contentElement;
    }
    Object.defineProperty(TestHarness.prototype, "canvas", {
        get: function () {
            return this._canvasElement;
        },
        enumerable: true,
        configurable: true
    });
    TestHarness.prototype.newTest = function (title) {
        var testContainerDiv = document.createElement('div');
        testContainerDiv.setAttribute("class", "test-container");
        this.contentElement.appendChild(testContainerDiv);
        var titleDiv = document.createElement('div');
        titleDiv.innerHTML = title;
        titleDiv.setAttribute("class", "title");
        testContainerDiv.appendChild(titleDiv);
        var textContainerDiv = document.createElement('div');
        textContainerDiv.setAttribute("class", "text-container");
        testContainerDiv.appendChild(textContainerDiv);
        this._textDiv = document.createElement('div');
        textContainerDiv.appendChild(this._textDiv);
        var cavnasContainerDiv = document.createElement('div');
        cavnasContainerDiv.setAttribute("class", "canvas-container");
        testContainerDiv.appendChild(cavnasContainerDiv);
        this._canvasElement = document.createElement('canvas');
        cavnasContainerDiv.appendChild(this._canvasElement);
    };
    TestHarness.prototype.write = function (text) {
        var span = document.createElement('span');
        span.innerHTML = text;
        this._textDiv.appendChild(span);
    };
    TestHarness.prototype.writeLine = function (text) {
        if (text === void 0) { text = ""; }
        this.write(text + "<br/>");
    };
    return TestHarness;
}());
exports.TestHarness = TestHarness;
//# sourceMappingURL=testHarness.js.map
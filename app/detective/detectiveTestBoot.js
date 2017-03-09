"use strict";
var detective_1 = require("./detective");
function boot() {
    var contentDiv = document.getElementById('content');
    var detective = new detective_1.Detective(contentDiv);
    detective.test("gunfight 1", [
        ["shouting", "fight", "fleeing"],
        ["fight", "gunshot", "panic", "fleeing"],
        ["anger", "shouting"]
    ]);
    detective = new detective_1.Detective(contentDiv);
    detective.test("arson", [
        ["pouring gas", "laughing", "lighting match", "fire"],
        ["buying gas", "pouring gas", "crying", "fire", "smoke"],
    ]);
    detective = new detective_1.Detective(contentDiv);
    detective.test("gunfight 2 (example 1)", [
        ["fight", "gunshot", "fleeing"],
        ["gunshot", "falling", "fleeing"]
    ]);
    detective = new detective_1.Detective(contentDiv);
    detective.test("mugging (example 2)", [
        ["shadowy figure", "demands", "scream", "siren"],
        ["shadowy figure", "pointed gun", "scream"]
    ]);
    detective = new detective_1.Detective(contentDiv);
    detective.test("scandle (example 3)", [
        ["argument", "stuff", "pointing"],
        ["press brief", "scandal", "pointing"],
        ["bribe", "coverup"]
    ]);
    detective = new detective_1.Detective(contentDiv);
    detective.test("numbers (example 4)", [
        ["0"],
        ["1"],
        ["2"],
        ["3"],
        ["0", "1"],
        ["0", "2"],
        ["0", "3"],
        ["1", "2"],
        ["1", "3"],
        ["2", "3"],
        ["0", "1", "2"],
        ["0", "1", "3"],
        ["0", "2", "3"],
        ["1", "2", "3"]
    ]);
}
;
boot();
//# sourceMappingURL=detectiveTestBoot.js.map
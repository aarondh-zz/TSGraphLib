import { Detective } from "./detective";
function boot(): void {
    var contentDiv = document.getElementById('content') as HTMLDivElement;

    var detective = new Detective(contentDiv);

    detective.test("gunfight 1", [
        ["shouting", "fight", "fleeing"],
        ["fight", "gunshot", "panic", "fleeing"],
        ["anger", "shouting"]
    ]
    );

    detective = new Detective(contentDiv);
    detective.test("gunfight 2", [
        ["fight", "gunshot", "fleeing"],
        ["gunshot", "falling", "fleeing"]
    ]
    );

    detective = new Detective(contentDiv);
    detective.test("mugging", [
        ["shadowy figure", "demands", "scream", "siren"],
        ["shadowy figure", "pointed gun", "scream"]
    ]
    );

    detective = new Detective(contentDiv);
    detective.test("scandle", [
        ["argument", "stuff", "pointing"],
        ["press brief", "scandal", "pointing"],
        ["bribe", "coverup"]
    ]
    );

    detective = new Detective(contentDiv);
    detective.test("arson", [
        ["pouring gas", "laughing", "lighting match", "fire"] ,
        ["buying gas", "pouring gas", "crying", "fire", "smoke"] ,
    ]

    );

    detective = new Detective(contentDiv);
    detective.test("numbers", [
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
    ]

    );
};

boot();
import { Main } from "./app";
function boot(): void {
    var jsonScriptElement = document.getElementById('graphInput') as HTMLDivElement;
    var contentDiv = document.getElementById('content') as HTMLDivElement;
    var main = new Main(contentDiv);
    //main.loadGraph(jsonScriptElement.innerText);
    main.testDetective("gunfight",[
        ["fight", "gunshot", "fleeing"],
        ["gunshot", "falling", "fleeing"]
    ]
    );
    main.testDetective("mugging", [
        ["shadowy figure", "demands", "scream", "siren"],
        ["shadowy figure", "pointed gun", "scream"]
    ]
    );
   main.testDetective("scandle", [
        ["argument", "stuff", "pointing"],
        ["press brief", "scandal", "pointing"],
        ["bribe", "coverup"]
    ]
    );
    main.testDetective("arson", [
        ["pouring gas", "laughing", "lighting match", "fire"] ,
        ["buying gas", "pouring gas", "crying", "fire", "smoke"] ,
    ]

    );

    main.testDetective("numbers", [
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
    /*main.testDF();
    main.testBF();*/
};

boot();
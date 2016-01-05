/**
 * XadillaX created at 2014-09-24 12:33
 *
 * Copyright (c) 2015 Souche.com, all rights
 * reserved.
 */
"use strict";

/* istanbul ignore next */
(function() {
    var clipboard = require("cliparoo");
    var text = "";
    
    function genCall(count) {
        var text = "callback(";
        for(var i = 0; i < count; i++) {
            if(i !== 0) {
                text += ", ";
            }

            text += "args[" + i + "]";
        }
        text += ");";
        return text;
    }
    
    for(var i = 0; i <= 100; i++) {
        if(i !== 0) {
            text += " else ";
        } else {
            text += "    ";
        }

        text += "if(args.length === " + i + ") {\n";
        text += "        if(async) {\n";
        text += "            process.nextTick(function(){\n";
        text += "                " + genCall(i) + "\n";
        text += "            });\n";
        text += "        } else {\n";
        text += "            " + genCall(i) + "\n";
        text += "        }\n";
        text += "    }";
    }
    
    text += " else {\n";
    text += "        throw(new Error(\"Arguments number limit exceeded.\"));\n";
    text += "    }";
    
    console.log(text);
    console.log("\nGenerated.");
    
    clipboard(text, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("Use your clipboard to paste code.");
    });
})();

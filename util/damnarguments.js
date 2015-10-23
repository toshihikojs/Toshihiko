/**
 * XadillaX created at 2014-09-24 12:30
 *
 * Copyright (c) 2015 Souche.com, all rights
 * reserved.
 */
"use strict";

/**
 * 该死的根据不同参数个数，并且在不修改 callback 上下文（如果有的话）的情况下去调用 callback！
 * TODO: 有更好的解决办法一定要告诉我！
 * @param arguments
 * @param callback
 * @param [async]
 */
/* istanbul ignore next */
exports.call = function(args, callback, async) {
    if(args.length === 0) {
        if(async) {
            process.nextTick(function(){
                callback();
            });
        } else {
            callback();
        }
    } else if(args.length === 1) {
        if(async) {
            process.nextTick(function(){
                callback(args[0]);
            });
        } else {
            callback(args[0]);
        }
    } else if(args.length === 2) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1]);
            });
        } else {
            callback(args[0], args[1]);
        }
    } else if(args.length === 3) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2]);
            });
        } else {
            callback(args[0], args[1], args[2]);
        }
    } else if(args.length === 4) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3]);
        }
    } else if(args.length === 5) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4]);
        }
    } else if(args.length === 6) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5]);
        }
    } else if(args.length === 7) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        }
    } else if(args.length === 8) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
        }
    } else if(args.length === 9) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
        }
    } else if(args.length === 10) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
        }
    } else if(args.length === 11) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10]);
        }
    } else if(args.length === 12) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11]);
        }
    } else if(args.length === 13) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12]);
        }
    } else if(args.length === 14) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13]);
        }
    } else if(args.length === 15) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14]);
        }
    } else if(args.length === 16) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15]);
        }
    } else if(args.length === 17) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16]);
        }
    } else if(args.length === 18) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17]);
        }
    } else if(args.length === 19) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18]);
        }
    } else if(args.length === 20) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19]);
        }
    } else if(args.length === 21) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20]);
        }
    } else if(args.length === 22) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21]);
        }
    } else if(args.length === 23) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22]);
        }
    } else if(args.length === 24) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23]);
        }
    } else if(args.length === 25) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24]);
        }
    } else if(args.length === 26) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25]);
        }
    } else if(args.length === 27) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26]);
        }
    } else if(args.length === 28) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27]);
        }
    } else if(args.length === 29) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28]);
        }
    } else if(args.length === 30) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29]);
        }
    } else if(args.length === 31) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30]);
        }
    } else if(args.length === 32) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31]);
        }
    } else if(args.length === 33) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32]);
        }
    } else if(args.length === 34) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33]);
        }
    } else if(args.length === 35) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34]);
        }
    } else if(args.length === 36) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35]);
        }
    } else if(args.length === 37) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36]);
        }
    } else if(args.length === 38) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37]);
        }
    } else if(args.length === 39) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38]);
        }
    } else if(args.length === 40) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39]);
        }
    } else if(args.length === 41) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40]);
        }
    } else if(args.length === 42) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41]);
        }
    } else if(args.length === 43) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42]);
        }
    } else if(args.length === 44) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43]);
        }
    } else if(args.length === 45) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44]);
        }
    } else if(args.length === 46) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45]);
        }
    } else if(args.length === 47) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46]);
        }
    } else if(args.length === 48) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47]);
        }
    } else if(args.length === 49) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48]);
        }
    } else if(args.length === 50) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49]);
        }
    } else if(args.length === 51) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50]);
        }
    } else if(args.length === 52) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51]);
        }
    } else if(args.length === 53) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52]);
        }
    } else if(args.length === 54) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53]);
        }
    } else if(args.length === 55) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54]);
        }
    } else if(args.length === 56) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55]);
        }
    } else if(args.length === 57) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56]);
        }
    } else if(args.length === 58) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57]);
        }
    } else if(args.length === 59) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58]);
        }
    } else if(args.length === 60) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59]);
        }
    } else if(args.length === 61) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60]);
        }
    } else if(args.length === 62) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61]);
        }
    } else if(args.length === 63) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62]);
        }
    } else if(args.length === 64) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63]);
        }
    } else if(args.length === 65) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64]);
        }
    } else if(args.length === 66) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65]);
        }
    } else if(args.length === 67) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66]);
        }
    } else if(args.length === 68) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67]);
        }
    } else if(args.length === 69) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68]);
        }
    } else if(args.length === 70) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69]);
        }
    } else if(args.length === 71) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70]);
        }
    } else if(args.length === 72) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71]);
        }
    } else if(args.length === 73) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72]);
        }
    } else if(args.length === 74) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73]);
        }
    } else if(args.length === 75) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74]);
        }
    } else if(args.length === 76) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75]);
        }
    } else if(args.length === 77) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76]);
        }
    } else if(args.length === 78) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77]);
        }
    } else if(args.length === 79) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78]);
        }
    } else if(args.length === 80) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79]);
        }
    } else if(args.length === 81) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80]);
        }
    } else if(args.length === 82) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81]);
        }
    } else if(args.length === 83) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82]);
        }
    } else if(args.length === 84) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83]);
        }
    } else if(args.length === 85) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84]);
        }
    } else if(args.length === 86) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85]);
        }
    } else if(args.length === 87) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86]);
        }
    } else if(args.length === 88) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87]);
        }
    } else if(args.length === 89) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88]);
        }
    } else if(args.length === 90) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89]);
        }
    } else if(args.length === 91) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90]);
        }
    } else if(args.length === 92) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91]);
        }
    } else if(args.length === 93) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91], args[92]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91], args[92]);
        }
    } else if(args.length === 94) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91], args[92], args[93]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91], args[92], args[93]);
        }
    } else if(args.length === 95) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91], args[92], args[93], args[94]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91], args[92], args[93], args[94]);
        }
    } else if(args.length === 96) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91], args[92], args[93], args[94], args[95]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91], args[92], args[93], args[94], args[95]);
        }
    } else if(args.length === 97) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91], args[92], args[93], args[94], args[95], args[96]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91], args[92], args[93], args[94], args[95], args[96]);
        }
    } else if(args.length === 98) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91], args[92], args[93], args[94], args[95], args[96], args[97]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91], args[92], args[93], args[94], args[95], args[96], args[97]);
        }
    } else if(args.length === 99) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91], args[92], args[93], args[94], args[95], args[96], args[97], args[98]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91], args[92], args[93], args[94], args[95], args[96], args[97], args[98]);
        }
    } else if(args.length === 100) {
        if(async) {
            process.nextTick(function(){
                callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91], args[92], args[93], args[94], args[95], args[96], args[97], args[98], args[99]);
            });
        } else {
            callback(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15], args[16], args[17], args[18], args[19], args[20], args[21], args[22], args[23], args[24], args[25], args[26], args[27], args[28], args[29], args[30], args[31], args[32], args[33], args[34], args[35], args[36], args[37], args[38], args[39], args[40], args[41], args[42], args[43], args[44], args[45], args[46], args[47], args[48], args[49], args[50], args[51], args[52], args[53], args[54], args[55], args[56], args[57], args[58], args[59], args[60], args[61], args[62], args[63], args[64], args[65], args[66], args[67], args[68], args[69], args[70], args[71], args[72], args[73], args[74], args[75], args[76], args[77], args[78], args[79], args[80], args[81], args[82], args[83], args[84], args[85], args[86], args[87], args[88], args[89], args[90], args[91], args[92], args[93], args[94], args[95], args[96], args[97], args[98], args[99]);
        }
    } else {
        throw(new Error("Arguments number limit exceeded."));
    }
};

/**
 * XadillaX created at 2015-03-19 13:45:03
 *
 * Copyright (c) 2015 Huaban.com, all rights
 * reserved
 */
/**
 * create an engine
 * @param {String} type engine type
 * @param {Object} options the options object
 * @return {Engine} the database engine instance
 */
exports.createEngine = function(type, options) {
    var Engine;
    try {
        Engine = require("./" + type);
    } catch(e) {
        throw e;
    }

    var engine = new Engine(options);
    return engine;
};


/**
 * XadillaX created at 2016-08-31 15:39:25 With ♥
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

require("should");

const debug = require("debug")("toshihiko:test:hack");

exports.whereOnce = function(parent, assume) {
    const $where = parent.where.bind(parent);
    const called = { called: 0 };

    parent.where = function(where) {
        where.should.deepEqual(assume);
        parent.where = $where;
        called.called++;
        return $where(where);
    };

    return called;
};

exports.connOnce = function(parent, assume) {
    const $conn = parent.conn.bind(parent);
    const called = { called: 0 };

    parent.conn = function(conn) {
        conn.should.equal(assume);
        parent.conn = $conn;
        called.called++;
        return $conn(conn);
    };

    return called;
};

exports.hackOnce = function(obj, name) {
    const old = obj[name];
    const called = { called: 0 };
    obj[name] = function() {
        called.called++;
        obj[name] = old;
        return obj[name].apply(null, arguments);
    };
};

exports.hackSyncErr = function(obj, name, whichCall) {
    whichCall = whichCall || 1;
    const old = obj[name];
    let called = 0;

    obj[name] = function() {
        called++;

        debug(`sync err: ${name} ${called} ${whichCall}`);
        if(called === whichCall) {
            obj[name] = old;
            throw new Error(`${name} predefinition ${called}`);
        }

        return old.apply(obj, arguments);
    };
};

exports.hackSyncReturn = function(obj, name, result, whichCall) {
    whichCall = whichCall || 1;
    const old = obj[name];
    let called = 0;

    obj[name] = function() {
        called++;

        debug(`sync err: ${name} ${called} ${whichCall}`);
        if(called === whichCall) {
            obj[name] = old;
            return result;
        }

        return old.apply(obj, arguments);
    };
};

exports.hackAsyncErr = function(obj, name, whichCall) {
    whichCall = whichCall || 1;
    const old = obj[name];
    let called = 0;

    obj[name] = function() {
        called++;

        let callback;
        for(let i = 0; i < arguments.length; i++) {
            if(typeof arguments[i] === "function") callback = arguments[i];
        }

        debug(`async err: ${name} ${called} ${whichCall}`);
        if(called === whichCall) {
            obj[name] = old;
            if(callback) {
                callback(new Error(`${name} predefinition ${called}`));
            }
            return;
        }

        return old.apply(obj, arguments);
    };
};

exports.hackAsyncReturn = function(obj, name, results, whichCall) {
    whichCall = whichCall || 1;
    const old = obj[name];
    let called = 0;

    obj[name] = function() {
        called++;

        let callback;
        for(let i = 0; i < arguments.length; i++) {
            if(typeof arguments[i] === "function") callback = arguments[i];
        }

        debug(`async ret: ${name} ${called} ${whichCall}`);
        if(called === whichCall) {
            obj[name] = old;
            if(callback) {
                callback.apply(null, results);
            }
            return;
        }

        return old.apply(obj, arguments);
    };
};

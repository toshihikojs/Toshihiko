/**
 * XadillaX created at 2014-09-25 11:54
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var keywords = require("./sqlkeyword");

function processQuote(sql, startIdx) {
    var start = sql[startIdx];
    for(var i = startIdx + 1; i < sql.length; i++) {
        if(sql[i] === '\\') {
            i++;
            continue;
        }

        if(sql[i] === start) {
            return i;
        }
    }

    return sql.length;
}

/**
 * process fragment
 * @param fragment
 * @param map
 * @param forceChange
 * @returns {*}
 */
function processFragment(fragment, map, forceChange) {
    if(forceChange) {
        if(map[fragment]) {
            return map[fragment];
        } else {
            return fragment;
        }
    } else {
        // see if it's a keyword
        if(keywords.indexOf(fragment.toUpperCase()) !== -1) {
            return fragment;
        } else {
            if(map[fragment]) {
                return map[fragment];
            } else {
                return fragment;
            }
        }
    }
}

/**
 * sql parse: name to column
 * @param sql
 * @param map
 * @returns {string}
 */
exports.sqlNameToColumn = function(sql, map) {
    var final = "";
    var current = "";

    for(var i = 0; i < sql.length; i++) {
        if(sql[i] === '"' || sql[i] === '\'') {
            if(current) {
                final += processFragment(current, map);
                current = "";
            }

            var end = processQuote(sql, i);
            var wrap = sql.substring(i, end + 1);

            final += wrap;
            i = end;
        } else if(sql[i] === ',') {
            if(current) {
                final += processFragment(current, map);
                current = "";
            }
            final += ',';
        } else if(sql[i] === ' ') {
            if(current) {
                final += processFragment(current, map);
                current = "";
            }
            final += " ";
        } else if(sql[i] === '(') {
            if(current) {
                // current + '(',
                //   eg: xxx(...
                // we assume it's a function
                final += current;
                current = "";
            }

            final += '(';
        } else if(sql[i] === ')') {
            if(current) {
                final += processFragment(current, map);
                current = "";
            }

            final += ')';
        } else if(sql[i] === '`') {
            if(current) {
                final += processFragment(current, map);
                current = "";
            }

            // the inner sql is certainly
            // a key or column name!
            var next = sql.indexOf('`', i + 1);
            if(-1 === next) {
                var rest = sql.substr(i + 1);
                final += '`' + processFragment(rest, map, true);
                break;
            }

            var fragment = sql.substring(i + 1, next);
            final += '`' + processFragment(fragment, map, true) + '`';
            i = next;
        } else {
            current += sql[i];
        }
    }

    if(current) {
        final += processFragment(fragment, map);
    }

    return final;
};


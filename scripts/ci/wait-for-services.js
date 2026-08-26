/**
 * Wait for GitHub Actions service containers to accept TCP connections.
 */
"use strict";

const net = require("net");

const RETRY_DELAY = 500;
const TIMEOUT = 60000;
const services = [
    { name: "MySQL", port: 3306 },
    { name: "Redis", port: 6379 },
    { name: "Memcached", port: 11211 }
];

function waitForService(service) {
    const startedAt = Date.now();

    return new Promise(function(resolve, reject) {
        function connect() {
            const socket = net.createConnection({
                host: "127.0.0.1",
                port: service.port
            });

            socket.once("connect", function() {
                socket.destroy();
                console.log(`${service.name} is accepting connections on port ${service.port}.`);
                resolve();
            });

            socket.once("error", function(err) {
                socket.destroy();
                if(Date.now() - startedAt >= TIMEOUT) {
                    reject(new Error(`Timed out waiting for ${service.name}: ${err.message}`));
                    return;
                }

                setTimeout(connect, RETRY_DELAY);
            });
        }

        connect();
    });
}

Promise.all(services.map(waitForService)).catch(function(err) {
    console.error(err.stack || err.message);
    process.exitCode = 1;
});

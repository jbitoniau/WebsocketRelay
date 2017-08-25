'use strict';

var http = require('http');
var https = require('https');
var url = require('url');
//var querystring = require('querystring');
var fs = require('fs');
var websocket = require('websocket'); // don't forget to run "npm install websocket"

/*
    WebsocketRelayServer
*/
function WebsocketRelayServer(port) {

    this._websocketConnections = [];

    // Create HTTP server
    this._httpServer = http.createServer(function(req, res) {
        var path = url.parse(req.url).pathname;
        var query = url.parse(req.url).query;
        if (path.indexOf('/') === 0) {
            var filename = path.substr(1);
            if (filename.length === 0) {
                filename = 'WebsocketRelay.html';
            }
            WebsocketRelayServer._serveFile(filename, res);
        } else {
            WebsocketRelayServer._createHTMLErrorResponse(res, 404, 'Page not found');
        }
    });

    this._httpServer.listen(port, function() {
        console.log('HTTP server started on port ' + port);
    });

    // Create Websocket server
    this._websocketServer = new websocket.server({
        httpServer: this._httpServer
    });

    this._websocketServer.on(
        'request',
        function(request) {
            var websocketConnection = request.accept(null, request.origin);
            this._websocketConnections.push( websocketConnection );

            console.log('WebsocketRelayServer: websocket connection established (' + this._websocketConnections.length + ')');

            var websocketRelayServer = this;

            websocketConnection.on(
                'message', 
                function(message) {
                    var index = websocketRelayServer._websocketConnections.indexOf(this);
                    if ( index===-1 ) {
                        console.error("WebsocketRelayServer: message received on unknown websocket connection");
                        return;
                    }

                    console.log("WebsocketRelayServer: received '"+ message.utf8Data + " on connection #" + index );

                    for ( var i=0; i<websocketRelayServer._websocketConnections.length; i++ ) {
                        if ( i!==index ) {
                            var connection = websocketRelayServer._websocketConnections[i];
                            connection.sendUTF( message.utf8Data );
                        }
                    }
                }
            );

            websocketConnection.on(
                'close',
                function(reasonCode, description) {

                    var index = websocketRelayServer._websocketConnections.indexOf(this);
                    if ( index===-1 ) {
                        console.error("WebsocketRelayServer: closing websocket connection is unknown");
                        return;
                    }
                    websocketRelayServer._websocketConnections.splice( index, 1 );

                    console.log('WebsocketRelayServer: websocket connection closed (' + websocketRelayServer._websocketConnections.length + ')');
                }
            );
        }.bind(this)
    );

    console.log('Websocket server created');
}

WebsocketRelayServer.prototype.dispose = function() {
    // Stop things here!
    console.log('dispose to implement here...');
};

WebsocketRelayServer._getFilenameExtension = function(filename) {
    var parts = filename.split('.');
    if (parts.length > 1) {
        return parts[parts.length - 1];
    }
    return '';
};

WebsocketRelayServer._getFileContentType = function(filename) {
    var contentType = null;
    var extension = WebsocketRelayServer._getFilenameExtension(filename).toLowerCase();
    switch (extension) {
        case 'html':
            return 'text/html';
        case 'js':
            return 'application/javascript';
    }
    return null;
};

WebsocketRelayServer._serveFile = function(filename, res) {
    var contentType = WebsocketRelayServer._getFileContentType(filename);
    if (!contentType) {
        console.warn('Serving file: ' + filename + '. Unsupported file/content type');
        res.end();
        return;
    }
    console.log('Serving file: ' + filename + ' as ' + contentType);

    //filename = 'Client/' + filename;

    fs.readFile(filename, 'utf8', function(err, data) {
        if (err) {
            WebsocketRelayServer._createHTMLErrorResponse(res, 500, err);
        } else {
            res.writeHead(200, { 'content-type': contentType });
            res.write(data);
            res.end();
        }
    });
};

WebsocketRelayServer._createHTMLErrorResponse = function(res, code, message) {
    res.writeHead(code, { 'content-type': 'text/html' });
    res.write(
        '<!DOCTYPE html>' +
            '<html>' +
            '    <head>' +
            '        <meta charset="utf-8" />' +
            '        <title>Error</title>' +
            '    </head>' +
            '    <body>' +
            '       <p>' +
            message +
            '</p>' +
            '    </body>' +
            '</html>'
    );
    res.end();
};

/*
    Main
*/
function Main() {
    var websocketRelayServer = new WebsocketRelayServer(8000);

    //http://stackoverflow.com/questions/10021373/what-is-the-windows-equivalent-of-process-onsigint-in-node-js/14861513#14861513
    //http://stackoverflow.com/questions/6958780/quitting-node-js-gracefully
    if (process.platform === 'win32') {
        var rl = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.on('SIGINT', function() {
            process.emit('SIGINT');
        });
    }
    process.on('SIGINT', function() {
        console.log('Stopping server...');
        websocketRelayServer.dispose();
        process.exit();
    });
}

Main();

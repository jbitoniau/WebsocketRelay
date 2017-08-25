'use strict';

var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');


var WebSocket = require('ws');

function WebsocketConnector(address) {

    var websocket = new WebSocket(address);
        
    var i = 0;
    websocket.on(
        'open', 
        function open() {
            setInterval( 
                function() {           
                    websocket.send('something #' + i );
                    i++;
                },
                500
            );
        }
    );

    websocket.on(
        'message', 
        function incoming(data) {
          console.log(data);
        }
    );
};

var websocketConnector = new WebsocketConnector("ws://localhost:8000");


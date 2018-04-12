'use strict';

function WebsocketRelayClient() {
    this._isConnected = false;
    this._onSocketOpenHandler = this._onSocketOpen.bind(this);
    this._onSocketMessageHandler = this._onSocketMessage.bind(this);
    this._onSocketErrorHandler = this._onSocketError.bind(this);
    this._onSocketCloseHandler = this._onSocketClose.bind(this);
    this._openWebsocket();

    this._senderID = Math.floor(Math.random()*100000);

    this.onTextMessageReceived = null;
    this.onPingResultReceived = null;
    this.onBinaryMessageReceived = null;
}

WebsocketRelayClient.prototype.dispose = function() {
    this._closeWebsocket();
};

WebsocketRelayClient.prototype.sendTextMessage = function( text ) {
    var jsonObject = {
        type:'text',
        text:text
    }
    var jsonString = JSON.stringify(jsonObject);
    this._websocket.send(jsonString);
};

WebsocketRelayClient.prototype.ping = function() {
    var jsonObject = {
        type:'ping',
        senderID: this._senderID,
        receiverID: null,
        timestamp: performance.now()
    };
    var jsonString = JSON.stringify(jsonObject);
    this._websocket.send(jsonString);
};

WebsocketRelayClient.prototype.sendArrayBuffer = function( arrayBuffer ) {
    this._websocket.send(arrayBuffer);
};

WebsocketRelayClient.prototype._openWebsocket = function() {
    if (this._websocket) {
        throw new Error('Invalid state');
    }
    var host = window.location.host;
    this._websocket = new WebSocket('ws://' + host);
    this._websocket.binaryType = "arraybuffer";     // or "blob" which seems to be the default
    this._websocket.addEventListener('open', this._onSocketOpenHandler);
    this._websocket.addEventListener('message', this._onSocketMessageHandler);
    this._websocket.addEventListener('error', this._onSocketErrorHandler);
    this._websocket.addEventListener('close', this._onSocketCloseHandler);
};

WebsocketRelayClient.prototype._closeWebsocket = function() {
    if (this._websocket === null) {
        throw new Error('Invalid state');
    }
    this._websocket.removeEventListener('open', this._onSocketOpenHandler);
    this._websocket.removeEventListener('message', this._onSocketMessageHandler);
    this._websocket.removeEventListener('error', this._onSocketErrorHandler);
    this._websocket.removeEventListener('close', this._onSocketCloseHandler);
    this._websocket.close();
    this._websocket = null;
};

WebsocketRelayClient.prototype._onSocketOpen = function() {
    this._isConnected = true;
  	// setinterval!
  	console.log("Websocket opened");
};

WebsocketRelayClient.prototype._onSocketMessage = function( message ) {
    if ( message.data instanceof ArrayBuffer ) {
        if ( this.onBinaryMessageReceived ) { 
            this.onBinaryMessageReceived(message.data);
        }
    } else {
        var jsonString = message.data;
        var jsonObject = JSON.parse(jsonString);
        if ( jsonObject.type==='text') {
            if ( this.onTextMessageReceived ) {
                this.onTextMessageReceived(jsonObject.text);
            }
        } else if ( jsonObject.type==='ping') {
            if ( jsonObject.senderID===this._senderID && jsonObject.receiverID!==null ) {
                var ping = performance.now() - jsonObject.timestamp;
                if ( this.onPingResultReceived ) {
                    this.onPingResultReceived( {receiverID:jsonObject.receiverID, ping:ping} );
                }
            } else {
                jsonObject.receiverID = this._senderID;
                var jsonStringOut = JSON.stringify(jsonObject);
                this._websocket.send( jsonStringOut );
            }
        }
    	console.log(jsonString);
    }
};

WebsocketRelayClient.prototype._onSocketError = function(error) {
    alert('WebSocket error: ' + error);
};

WebsocketRelayClient.prototype._onSocketClose = function(/*??*/) {
    this._isConnected = false;
    console.log("Websocket closed");
};

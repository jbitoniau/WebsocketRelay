'use strict';

function WebsocketRelayClient() {
    this._isConnected = false;
    this._onSocketOpenHandler = this._onSocketOpen.bind(this);
    this._onSocketMessageHandler = this._onSocketMessage.bind(this);
    this._onSocketErrorHandler = this._onSocketError.bind(this);
    this._onSocketCloseHandler = this._onSocketClose.bind(this);
    this._openWebsocket();

    this.onMessageReceived = null;
}

WebsocketRelayClient.prototype.dispose = function() {
    this._closeWebsocket();
};

WebsocketRelayClient.prototype.send = function( data ) {
    if (this._websocket.readyState !== 1) {
        console.warn('WebsocketRelayClient.send: websocket not ready for sending');
        return;
    }
    this._websocket.send(data);
};

WebsocketRelayClient.prototype._openWebsocket = function() {
    if (this._websocket) {
        throw new Error('Invalid state');
    }
    var host = window.location.host;
    this._websocket = new WebSocket('ws://' + host);
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
	var data = message.data;
	console.log(data);
	if ( this.onMessageReceived ) {
		this.onMessageReceived(data);
	}
};

WebsocketRelayClient.prototype._onSocketError = function(error) {
    alert('WebSocket error: ' + error);
};

WebsocketRelayClient.prototype._onSocketClose = function(/*??*/) {
    this._isConnected = false;
    console.log("Websocket closed");
};

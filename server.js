/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {"use strict";
	var SocketIO = __webpack_require__(2);
	var express = __webpack_require__(3);
	var os = __webpack_require__(4);
	var basicAuth = __webpack_require__(5);
	var Protocol_1 = __webpack_require__(6);
	var Auth_1 = __webpack_require__(7);
	var Signaler = (function () {
	    function Signaler() {
	        this.app = express();
	        this.useDebug = false;
	        this.useLog = true;
	        this.numSockets = 0;
	        this.numPadsMemo = null; // memoized
	    }
	    Signaler.prototype.start = function (port, host) {
	        var _this = this;
	        this.port = port;
	        this.host = host;
	        this.server = this.app.listen(port, function () {
	            console.log("Signaler listening on " + host + ":" + port); // tslint:disable-line
	        });
	        this.app.set('json spaces', 2);
	        this.app.use('/bpstatus', auth(Auth_1.STATUS_USERNAME, Auth_1.STATUS_PASSWORD));
	        this.app.get('/bpstatus', function (req, res) { return res.json(_this.getStatus()); });
	        this.io = SocketIO(this.server);
	        this.io.of('/bp').on('connection', function (socket) {
	            _this.log(socket, 'connected');
	            _this.numSockets++;
	            socket.on(Protocol_1.PeersRequest.messageType, function (data) {
	                _this.log(socket, Protocol_1.PeersRequest.messageType, data);
	                _this.broadcastToPad(socket, data.padId, Protocol_1.PeersRequest.messageType, data);
	            });
	            socket.on(Protocol_1.PeersUpdate.messageType, function (data) {
	                _this.log(socket, Protocol_1.PeersUpdate.messageType, data);
	                _this.broadcastToPad(socket, data.padId, Protocol_1.PeersUpdate.messageType, data);
	            });
	            socket.on(Protocol_1.PadDisconnect.messageType, function (data) {
	                _this.log(socket, Protocol_1.PadDisconnect.messageType, data);
	                _this.broadcastToPad(socket, data.padId, Protocol_1.PadDisconnect.messageType, data);
	            });
	            socket.on(Protocol_1.ConnectionRequest.messageType, function (data) {
	                _this.log(socket, Protocol_1.ConnectionRequest.messageType, data);
	                _this.broadcastToPad(socket, data.padId, Protocol_1.ConnectionRequest.messageType, data);
	            });
	            socket.on(Protocol_1.ConnectionResponse.messageType, function (data) {
	                _this.log(socket, Protocol_1.ConnectionResponse.messageType, data);
	                _this.broadcastToPad(socket, data.padId, Protocol_1.ConnectionResponse.messageType, data);
	            });
	            socket.on('disconnect', function () {
	                _this.log(socket, ' disconnected');
	                _this.numSockets--;
	            });
	        });
	    };
	    Signaler.prototype.broadcastToPad = function (socket, padId, msgType, data) {
	        if (!padId) {
	            this.log(socket, 'Invalid padId: ', padId);
	        }
	        var roomId = padId.substr(0, 50); // don't let clients take up arbitrary amounts of persistent server memory
	        socket.join(roomId); // use this opportunity to ensure this client is in the channel
	        this.numPadsMemo = null; // blow away memoized stat (could have made a new room)
	        // IDEA: maybe just forward to one (or a few) than everyone in the pad (if we know we can)
	        socket.broadcast.to(roomId).emit(msgType, data);
	        this.debug(socket, msgType, ' forwarded');
	    };
	    Signaler.prototype.getStatus = function () {
	        var load = os.loadavg()[0];
	        var totalMemory = os.totalmem();
	        var freeMemory = os.freemem();
	        if (this.numPadsMemo === null) {
	            var numPads = 0;
	            var rooms = this.io.sockets.adapter.rooms;
	            for (var roomId in rooms) {
	                if (rooms.hasOwnProperty(roomId))
	                    numPads++;
	            }
	            this.numPadsMemo = numPads;
	        }
	        return {
	            app: {
	                numClients: this.numSockets,
	                numPads: this.numPadsMemo
	            },
	            sys: {
	                load: load,
	                totalMemory: totalMemory,
	                totalMemoryMB: asMB(totalMemory),
	                freeMemory: freeMemory,
	                freeMemoryMB: asMB(freeMemory),
	                usedMemory: totalMemory - freeMemory,
	                usedMemoryMB: asMB(totalMemory - freeMemory)
	            }
	        };
	    };
	    Signaler.prototype.debug = function (socket) {
	        var msg = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            msg[_i - 1] = arguments[_i];
	        }
	        this.log.apply(this, [socket, 'sent DEBUG: '].concat(msg));
	        if (!this.useDebug) {
	            return;
	        }
	        socket.emit('DEBUG', msg ? msg.join('') : '');
	    };
	    Signaler.prototype.log = function (socket) {
	        var msg = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            msg[_i - 1] = arguments[_i];
	        }
	        if (!this.useLog)
	            return;
	        console.log.apply(console, [socket.id].concat(msg)); // tslint:disable-line
	    };
	    return Signaler;
	}());
	function asMB(bytes) {
	    if (bytes === null)
	        return 'null';
	    if (bytes === undefined)
	        return 'undefined';
	    return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
	}
	function auth(username, password) {
	    return function (req, res, next) {
	        var user = basicAuth(req);
	        if (!user || user.name !== username || user.pass !== password) {
	            res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
	            return res.sendStatus(401);
	        }
	        next();
	    };
	}
	;
	if (__webpack_require__.c[0] === module) {
	    var port = Protocol_1.getSignalerPort();
	    var host = Protocol_1.getSignalerHost();
	    console.log("Attempting to start bp-signaler on \"" + host + "\" port " + port); // tslint:disable-line
	    new Signaler().start(port, host);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)(module)))

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("socket.io");

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = require("express");

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = require("os");

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = require("basic-auth");

/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";
	exports.USE_LOCAL_SIGNALER = false;
	exports.REMOTE_SIGNALER_HOST = 'node-server-executor.herokuapp.com';
	exports.REMOTE_SIGNALER_PORT = 80;
	/*
	 * Phase 1: Peer Discovery
	 *
	 * Discover who's in our pad, either by asking a central signaller or
	 * (eventually) asking other peers that are known to us.
	 */
	/**
	 * Sent by a client at any time when they suspect there might be more
	 * peers to discover on the pad.
	 */
	var PeersRequest = (function () {
	    function PeersRequest() {
	    }
	    PeersRequest.messageType = 'PeersRequest';
	    return PeersRequest;
	}());
	exports.PeersRequest = PeersRequest;
	/**
	 * Sent by any peer who receives a `PeersRequest`
	 */
	var PeersUpdate = (function () {
	    function PeersUpdate() {
	    }
	    PeersUpdate.messageType = 'PeersUpdate';
	    return PeersUpdate;
	}());
	exports.PeersUpdate = PeersUpdate;
	/*
	 * Phase 2: Connection negotation.
	 *
	 * Try to connect to specific peers in the pad by sending out our connection
	 * blob (to either the signaler or other peers) and waiting for responses with
	 * other peers' connection blob.
	 */
	// IDEA: make connection requests / responses plural by default
	/**
	 * Sent by a client who's trying to connect to the supplied peer.
	 */
	var ConnectionRequest = (function () {
	    function ConnectionRequest() {
	    }
	    ConnectionRequest.messageType = 'ConnectionRequest';
	    return ConnectionRequest;
	}());
	exports.ConnectionRequest = ConnectionRequest;
	/**
	 * Sent by a peer who's responding to a connection request.
	 */
	var ConnectionResponse = (function () {
	    function ConnectionResponse() {
	    }
	    ConnectionResponse.messageType = 'ConnectionResponse';
	    return ConnectionResponse;
	}());
	exports.ConnectionResponse = ConnectionResponse;
	/*
	 * Phase 3: Pad syncing
	 * TODO: explain how it works
	 */
	var PadUpdate = (function () {
	    function PadUpdate() {
	    }
	    PadUpdate.messageType = 'PadUpdate';
	    return PadUpdate;
	}());
	exports.PadUpdate = PadUpdate;
	var PadDisconnect = (function () {
	    function PadDisconnect() {
	    }
	    PadDisconnect.messageType = 'PadDisconnect';
	    return PadDisconnect;
	}());
	exports.PadDisconnect = PadDisconnect;
	var UserStatusRequest = (function () {
	    function UserStatusRequest() {
	    }
	    UserStatusRequest.messageType = 'UserStatusRequest';
	    return UserStatusRequest;
	}());
	exports.UserStatusRequest = UserStatusRequest;
	var UserStatusResponse = (function () {
	    function UserStatusResponse() {
	    }
	    UserStatusResponse.messageType = 'UserStatusResponse';
	    return UserStatusResponse;
	}());
	exports.UserStatusResponse = UserStatusResponse;
	var PadEdit = (function () {
	    function PadEdit() {
	    }
	    return PadEdit;
	}());
	exports.PadEdit = PadEdit;
	var Cursor = (function () {
	    function Cursor() {
	    }
	    return Cursor;
	}());
	exports.Cursor = Cursor;
	/**
	 * Returns null if we should use the same domain as we're being served on.
	 */
	function getSignalerURI() {
	    return getSignalerProtocol() + "://" + getSignalerHost() + "/bp";
	    //   return 'https://node-server-executor.herokuapp.com/bp';
	}
	exports.getSignalerURI = getSignalerURI;
	function getSignalerHost() {
	    if (process.env.NODE_IP)
	        return process.env.NODE_IP;
	    return exports.USE_LOCAL_SIGNALER ? '127.0.0.1' : exports.REMOTE_SIGNALER_HOST;
	}
	exports.getSignalerHost = getSignalerHost;
	function getSignalerPort() {
	    if (process.env.NODE_PORT)
	        return process.env.NODE_PORT;
	    return exports.USE_LOCAL_SIGNALER ? 3000 : exports.REMOTE_SIGNALER_PORT;
	}
	exports.getSignalerPort = getSignalerPort;
	function getSignalerProtocol() {
	    return exports.USE_LOCAL_SIGNALER ? 'http' : 'https';
	}
	exports.getSignalerProtocol = getSignalerProtocol;


/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";
	exports.STATUS_USERNAME = 'admin';
	exports.STATUS_PASSWORD = 'bpstatus';


/***/ }
/******/ ]);
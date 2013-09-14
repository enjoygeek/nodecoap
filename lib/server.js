// FIXME, later, need to split out the bearer

var endpoints = {};
var dgram = require('dgram');
var coap = require('./coap');

function routeAddGet(path, handler) {
    endpoints[path] = handler;
}

function appStart(port) {
    var udpServer = this.udpServer = dgram.createSocket("udp4");

    udpServer.on("error", function (err) {
        console.log("udpServer error:\n" + err.stack);
        udpServer.close();
    });

    function hello_get(req, res) {
        console.log(req.path);
        res.addOption(coap.COAP_OPTION_CONTENT_FORMAT, coap.COAP_CONTENTTYPE_TEXT_PLAIN);
        res.send(coap.COAP_RSPCODE_CONTENT, "hello");
    }

    var endpoints = {
        '/hello': {get: hello_get}
    };

    function handle(inpkt) {
        var outpkt;
        var ep;
        var f;

        var req = {
            path: '/' + coap.findOptions(inpkt, coap.COAP_OPTION_URI_PATH).map(function(e) {
                return e.toString();
            }).join('/'),
            method: coap.methodToString(inpkt.hdr.code),
            payload: inpkt.payload
        };

        console.log("REQ %j", req); 

        // routing

        if (undefined === (ep = endpoints[req.path]))
            outpkt = coap.make_response(null, inpkt.hdr.id, coap.COAP_RSPCODE_NOT_FOUND, null);
        else
        if (undefined === (f = ep[req.method]))
            outpkt = coap.make_response(null, inpkt.hdr.id, coap.COAP_RSPCODE_METHOD_NOT_ALLOWED, null);
        else {
            outpkt = coap.make_response(null, inpkt.hdr.id, null, null);    // bare
            var res = {
                addOption: function(num, val) {
                    console.log("addOption ",num,val);  // FIXME, need to translate
                    switch(num) {
                        case coap.COAP_OPTION_CONTENT_FORMAT:
                            outpkt.opts.push({
                                num: num,
                                buf: new Buffer([(val & 0xFF00) >> 8, (val & 0x00FF)])
                            });
                        break;
                        default:
                            // FIXME
                            console.log("UNHANDLED OPTION!!!");
                        break;
                    }
                },
                send: function(code, payload) {
                    console.log("send ", code, payload);
                    outpkt.hdr.code = code;
                    outpkt.payload = new Buffer(payload);
                }
            };
            f(req, res);
        }

        return outpkt;
    }

    udpServer.on("message", function (msg, rinfo) {
        //console.log("udpServer got: " + msg.toString('hex') + " from " + rinfo.address + ":" + rinfo.port);
        var inpkt = coap.parse(msg);
        //console.log(inpkt);

        var outpkt = handle(inpkt);

        coap.build(outpkt);
        //console.log(outpkt);
        udpServer.send(outpkt.raw, 0, outpkt.raw.length, rinfo.port, rinfo.address, function() {
            console.log("sent");
        });
    });

    udpServer.on("listening", function () {
        var address = udpServer.address();
        console.log("udpServer listening " +
        address.address + ":" + address.port);
    });

    udpServer.bind(port);
}

function createApplication() {
    return {
        get: routeAddGet,
        start: appStart,
        udpServer: undefined
    };
}

exports = module.exports = createApplication;


/*

var udpServer = dgram.createSocket("udp4");

udpServer.on("error", function (err) {
    console.log("udpServer error:\n" + err.stack);
    udpServer.close();
});

function hello_get(req, res) {
    console.log(req.path);
    res.addOption(coap.COAP_OPTION_CONTENT_FORMAT, coap.COAP_CONTENTTYPE_TEXT_PLAIN);
    res.send(coap.COAP_RSPCODE_CONTENT, "hello");
}

var endpoints = {
    '/hello': {get: hello_get}
};

function handle(inpkt) {
    var outpkt;
    var ep;
    var f;

    var req = {
        path: '/' + coap.findOptions(inpkt, coap.COAP_OPTION_URI_PATH).map(function(e) {
            return e.toString();
        }).join('/'),
        method: coap.methodToString(inpkt.hdr.code),
        payload: inpkt.payload
    };

    console.log("REQ %j", req); 

    // routing

    if (undefined === (ep = endpoints[req.path]))
        outpkt = coap.make_response(null, inpkt.hdr.id, coap.COAP_RSPCODE_NOT_FOUND, null);
    else
    if (undefined === (f = ep[req.method]))
        outpkt = coap.make_response(null, inpkt.hdr.id, coap.COAP_RSPCODE_METHOD_NOT_ALLOWED, null);
    else {
        outpkt = coap.make_response(null, inpkt.hdr.id, null, null);    // bare
        var res = {
            addOption: function(num, val) {
                console.log("addOption ",num,val);  // FIXME, need to translate
                switch(num) {
                    case coap.COAP_OPTION_CONTENT_FORMAT:
                        outpkt.opts.push({
                            num: num,
                            buf: new Buffer([(val & 0xFF00) >> 8, (val & 0x00FF)])
                        });
                    break;
                    default:
                        // FIXME
                        console.log("UNHANDLED OPTION!!!");
                    break;
                }
            },
            send: function(code, payload) {
                console.log("send ", code, payload);
                outpkt.hdr.code = code;
                outpkt.payload = new Buffer(payload);
            }
        };
        f(req, res);
    }

    return outpkt;
}

udpServer.on("message", function (msg, rinfo) {
    //console.log("udpServer got: " + msg.toString('hex') + " from " + rinfo.address + ":" + rinfo.port);
    var inpkt = coap.parse(msg);
    //console.log(inpkt);

    var outpkt = handle(inpkt);

    coap.build(outpkt);
    //console.log(outpkt);
    udpServer.send(outpkt.raw, 0, outpkt.raw.length, rinfo.port, rinfo.address, function() {
        console.log("sent");
    });
});

udpServer.on("listening", function () {
    var address = udpServer.address();
    console.log("udpServer listening " +
    address.address + ":" + address.port);
});

udpServer.bind(PORT);
*/
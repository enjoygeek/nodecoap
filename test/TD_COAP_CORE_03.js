/*
    TD_COAP_CORE_03 Perform PUT transaction (CON mode)
*/

var common = require('./common.js');
erbium = require('node-erbium');
udpApp = common.udpBearer();
coapServerApp = common.server();
coapClientApp = common.client();

function check1(raw) {
    console.log('2');
    var pkt = new erbium.Erbium(raw);
    if (pkt.getHeaderType() != 0)
        throw new Error('Wrong type');
    if (pkt.getHeaderStatusCode() != 3)
        throw new Error('Wrong code');
}

function check2(raw) {
    console.log('4');
    var pkt = new erbium.Erbium(raw);
    if (pkt.getHeaderStatusCode() != 68)
        throw new Error('Wrong code '+pkt.getHeaderStatusCode());
    if (pkt.getHeaderContentType() != erbium.TEXT_PLAIN)
        throw new Error('Wrong type');
    if (pkt.getHeaderMID() != 0x1234)
        throw new Error('Wrong MID '+pkt.getHeaderMID());
}

coapServerApp.put(common.TEST_ENDPOINT, function(req, res) {
    console.log('3 ' + req.payload);
    res.setContentType('text/plain');
    res.send(erbium.CHANGED_2_04, req.payload);
});

function stimulus1() {
    console.log('1');
    coapClientApp.put(erbium.COAP_TYPE_CON, common.TEST_URL_BASE + common.TEST_ENDPOINT, {
        mid: 0x1234,
        payload: "Hello world",
        contentType: "text/plain",
        beforeSend: check1,
        beforeReceive: check2,
        success: function(inpkt, payload) {
            console.log('5 '+payload.toString());
            process.exit(0);
        }
    });
}

udpApp.start(5683, coapClientApp, coapServerApp, function(err) {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    coapServerApp.start();
    stimulus1();
});



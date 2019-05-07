// include the NEM-sdk package in your package.json first.
// nem-sdk: npmjs.com/package/nem-sdk

let nem_ = require("nem-sdk").default;
let connectedNode = nem_.model.objects.create("endpoint")("http://bigalice2.nem.ninja", "7890");

nem_.com.requests.chain.lastBlock(connectedNode)
    .then(function(err, block)
    {
        if (! err && block) {
            console.log("NEM Testnet blockchain last block: " + JSON.stringify(block));
        } else {
            console.log(err)
        }
    });

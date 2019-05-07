// nem-sdk: npmjs.com/package/nem-sdk
// class OutgoingTransactionStream from gist: https://gist.github.com/evias/aea14ff6bea618239ca21a7f3802773e.js

let sdk = require("nem-sdk").default;

/**
 * The Transaction class defines some utilities methods to keep
 * reading data from NEM Transactions organized a little bit.
 *
 * @param   {Object}    transactionMetaDataPair     Transaction object received in NIS response
 **/
let Transaction = function(transactionMetaDataPair) {
    this.data = transactionMetaDataPair;

    this.isMultisig = function() {
        return this.data.transaction.type == sdk.model.transactionTypes.multisigTransaction;
    };
    
    this.isMosaic = function() {
        if (!this.getContent().hasOwnProperty(mosaics)) return false;
        return this.getContent().mosaics.length > 0;
    };

    this.isType = function(sdkTransactionType) {
        // return INNER transaction type
        return this.getContent().type == sdkTransactionType;
    };
    
    this.getContent = function() {
        // in case of multisig, get `real content`
        if (this.isMultisig())
            return this.data.transaction.otherTrans;

        return this.data.transaction;
    };

    this.extractMosaic = function(mosaicFQN) {
        // extract namespace and mosaic name from fully qualified name
        var lookupNS = mosaicFQN.replace(/:[^:]+$/, "");
        var lookupMos = mosaicFQN.replace(/^[^:]+:/, "");

        // now read mosaic data from transaction content
        var mosData = this.getContent().mosaics;
        if (!mosData.length) return 0;

        for (let i in mosData) {
            let mosaic = mosData[i];
            let isLookupMosaic = mosaic.mosaicId.namespaceId == lookupNS && mosaic.mosaicId.name == lookupMos;
            if (!isLookupMosaic)
                continue; // we are interested only in our Mosaic

            // mosaic `mosaicFQN` found in transaction
            let quantity = mosaic.quantity;
            return quantity;
        }
    };
};

// function used to sort an array of scores
var sortScores = function(scores) {
    var sorted = scores.getOwnPropertyNames();
    sorted.sort(function(a, b) {
        if (parseInt(a) < parseInt(b)) return -1;
        if (parseInt(a) > parseInt(b)) return 1;
        return 0;
    }).reverse();
    
    return sorted;
};

// display scores entries
var printScores = function(sortedKeys, scores) {

    console.log("Latest Blockchain High Score:" );
    console.log("-----------------------------" );

    for (let s = 0; s < sortedKeys.length; s++) {
        let currentScores = scores[s];

        for (let i = 0; i < currentScores.length; i++) {
            // each transaction per Score is a separate High Score on the Blockchain
            let score = currentScores[i].score;
            let trx   = new Transaction(currentScores[i].trx);
            let player = trx.getContent().recipient;

            console.log("Score: " + score + " for Player: " + player);
        }
    }

    console.log("-----------------------------" );
};

(function() {

    let connectedNode = sdk.model.objects.create("endpoint")("http://bigalice2.nem.ninja", "7890");
    let applicationWallet = "TCTIMURL5LPKNJYF3OB3ACQVAXO3GK5IU2BJMPSU";
    let lastTrxId = null;
    let scores = {};
    
    let stream = new OutgoingTransactionStream(sdk, connectedNode);
    
    stream.read(applicationWallet, null, function(allTrx) {
        for (let trxId in allTrx) {
            let trx = new Transaction(allTrx[trxId]);

            // filter relevant transactions (only Mosaic Transfers)
            if (!trx.isType(sdk.model.transactionTypes.transfer)) continue;
            if (!trx.isMosaic()) continue;

            // relevant transaction: save this transaction content
            let quantity = trx.extractMosaic("pacnem:cheese");
            if (!scores.hasOwnProperty(quantity))
                scores[quantity] = [];

            // scores are indexed by Score to facilitate sorting
            scores[quantity].push({score: quantity, trx: trx});
        }

        // sort our high scores keys and print
        let sorted = sortScores(scores);
        printScores(sorted, scores);
    });
}());

/**
 * Class OutgoingTransactionStream can be used to read 
 * outgoing transactions of a given NEM Account.
 *
 * This class is kept quite simple and only defines a
 * function to read *all* outgoing transactions of an
 * account.
 *
 * @param   {Object}    sdk     use `require('nem-sdk').default`
 * @param   {Object}    endpoint
 **/
let OutgoingTransactionStream = function(sdk, endpoint) {
    this.sdk = sdk;
    this.node = endpoint;

    let trxesByAddr = {};

    /**
     * The read() method can be used to *recursively* read all outgoing
     * transactions of a given `address` XEM address.
     *
     * When reading is done, the `successCallback` callable will be executed
     * and in case any error happens you can plug to those with the 
     * `failureCallback` parameter.
     *
     * Pass `null` to the `startTrxId` in order to start fetching the last 
     * recent outgoing transaction of the given `address`.
     *
     * @param   {String}    address     XEM wallet address
     * @param   {Integer}   startTrxId  Set to `null` the first time
     * @param   {Function}  successCallback
     * @param   {Function}  failureCallback
     **/
    this.read = function(address, startTrxId, successCallback, failureCallback) {
        let self = this;
        
        if (!trxesByAddr.hasOwnProperty(address) || startTrxId === null) {
            trxesByAddr[address] = {};
        }

        // 3rd argument is the transaction hash (always empty)
        // 4th argument is the transaction ID to begin with 
        self.sdk.com.requests.account.transactions
            .outgoing(self.node, address, null, startTrxId)
            .then(function(response)
        {
            let transactions = response.data;
            let isDone = false;
            let lastId = startTrxId;
            for (let i = 0; i < transactions.length; i++) {
                let trx = transactions[i];
                let tid = trx.meta.id;

                // if the transaction has been reported before (transaction ID already read)
                // we should stop requesting for new transactions.
                if (trxesByAddr[address].hasOwnProperty(tid)) {
                    isDone = true;
                    break;
                }

                // transaction not reported before, save the transaction for later usage.
                trxesByAddr[address][tid] = trx;
                lastId = tid; // parameter used for NIS request
            }

            if (transactions.length < 25 || isDone) {
                // done reading all outgoing transactions for this account
                if (typeof successCallback == "function") {
                    return successCallback(trxesByAddr[address]);
                }
            }

            // recursion until we read all outgoing transactions for this account.
            return self.read(address, lastId, successCallback, failureCallback);

        }, function(error) {
            console.log("NIS Error: " + JSON.stringify(error));
            if (typeof failureCallback == "function") {
                return failureCallback(error);
            }
        });
    };
};

(function() {

    let sdk = require("nem-sdk").default;
    let connectedNode = sdk.model.objects.create("endpoint")("http://bigalice2.nem.ninja", "7890");
    let applicationWallet = "TCTIMURL5LPKNJYF3OB3ACQVAXO3GK5IU2BJMPSU";

    let stream = new OutgoingTransactionStream(sdk, endpoint);
    
    // provide `null` as the last transaction id to get the most recent transactions
    stream.read(applicationWallet, null, function(transactions) {
        let cnt = Object.getOwnPropertyNames(allTrx).length;
        console.log("Total of " + cnt + " outgoing transactions read for " + applicationWallet);
    });
}());


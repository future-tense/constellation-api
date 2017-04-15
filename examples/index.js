'use strict';

const stellar       = require('stellar-sdk');
const constellation = require('../constellation');

const horizon = new stellar.Server('https://horizon-testnet.stellar.org');
stellar.Network.useTestNetwork();

const issuerKeys    = stellar.Keypair.random();
const clientKeys    = stellar.Keypair.random();
const issuerId      = issuerKeys.publicKey();
const clientId      = clientKeys.publicKey();
const issuerAsset   = new stellar.Asset('TEST', issuerId);

//---------------------------------------------------------------------------//

const clientServer = constellation.Server();
clientServer.subscribe(clientId, onRequest);

function onRequest(payload) {
    const tx = new stellar.Transaction(payload.txenv);
    tx.sign(clientKeys);

    clientServer.submitSignatures(
        tx.hash().toString('hex'),
        tx.signatures
    )
    .then(function () {
        console.log('Client submitted signature');
    })
    .catch(function (err) {
        console.log(err);
    });
}

//---------------------------------------------------------------------------//

const issuerServer = constellation.Server();
issuerServer.subscribe(issuerId, null, onProgress);

createIssuer()
.then(createTransaction)
.then(submitTransaction)
.then(function () {
    console.log('Issuer submitted signing request');
})
.catch(function () {
    console.log('Something went wrong');
});

function onProgress(payload) {
    const isDone = Object.keys(payload.progress)
    .map(key => payload.progress[key])
    .every(account => account.weight >= account.threshold);

    if (isDone) {
        console.log('Transaction submitted to network');
    }
}

//---------------------------------------------------------------------------//

function createIssuer() {
    return horizon.friendbot(issuerId).call();
}

function createTransaction() {
    return horizon.loadAccount(issuerId)
    .then(function (account) {
        return new stellar.TransactionBuilder(account)
        .addOperation(stellar.Operation.createAccount({
            destination: clientId,
            startingBalance: '31'
        }))
        .addOperation(stellar.Operation.changeTrust({
            source: clientId,
            asset: issuerAsset
        }))
        .addOperation(stellar.Operation.payment({
            destination: clientId,
            amount: '1000',
            asset: issuerAsset
        }))
        .build();
    });
}

function submitTransaction(tx) {
    tx.sign(issuerKeys);
    return issuerServer.submitTransaction(tx, constellation.Network.testnet);
}

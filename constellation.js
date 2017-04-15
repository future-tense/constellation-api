/* global require, module */

(function () {
	'use strict';

	const axios       = require('axios');
	const EventSource = require('eventsource');

    const network = {
        live:       '7ac33997',
        testnet:    'cee0302d'
    };

    /**
     *
     * @module constellation
     * @type {{Server: Server}}
     */

    module.exports = {

        Network: network,

        /**
         *
         * @param {String} [url] - url to a constellation server
         * @returns {{submitSignatures: submitSignatures, submitTransaction: submitTransaction, subscribe: subscribe}}
         * @constructor
         */
        Server: function (url) {

            const baseUrl = url || 'https://constellation.futuretense.io/api/v1';

            return {
                submitSignatures:   submitSignatures,
                submitTransaction:  submitTransaction,
                subscribe:          subscribe
            };

            /**
             * Submit signatures to the signature server
             *
             * @param {String}                  hash - transaction hash for the transaction to sign
             * @param {DecoratedSignature[]}    sigs - an array of DecoratedSignatures
             * @returns {Promise}
             */
            function submitSignatures(hash, sigs) {
                const data = {
                    sig: sigs.map(encodeSignature)
                };

                return axios.put(`${baseUrl}/transaction/${hash}`, data);
            }

            /**
             * Submit a transaction to the signature server
             *
             * @param {Transaction} tx - transaction
             * @param {String}      [networkId] - network
             * @returns {Promise}
             */
            function submitTransaction(tx, networkId) {
                const data = {
                    txenv:      encodeTransaction(tx),
                    network:    networkId || network.live
                };

                return axios.post(`${baseUrl}/transaction`, data);
            }

            /**
             * Subscribe to push notifications for a list of public keys.
             *
             * @param {String[]}           pubkeys - an array of public keys
             * @param {requestFunc}        requestFunc - handler of request events
             * @param {progressFunc}       progressFunc - handler of progress events
             * @param {addSignerFunc}      addSignerFunc - handler of add account events
             * @param {removeSignerFunc}   removeSignerFunc - handler of remove account events

             * @returns {EventSource}
             */
            function subscribe(pubkeys, requestFunc, progressFunc, addSignerFunc, removeSignerFunc) {

                const eventSource = new EventSource(`${baseUrl}/events/${pubkeys}`);
                eventSource.addEventListener('request', handler(requestFunc), false);
                eventSource.addEventListener('progress', handler(progressFunc), false);
                eventSource.addEventListener('add_signer', handler(addSignerFunc), false);
                eventSource.addEventListener('remove_signer', handler(removeSignerFunc), false);
                return eventSource;

                function handler(func) {
                    if (func) {
                        return event => func(JSON.parse(event.data));
                    } else {
                        return event => {};
                    }
                }
            }

            /**
             * @callback requestFunc
             * @param {Object} payload
             * @param {String[]} payload.id - a list of recipient pubkeys for this request
             * @param {String} payload.txenv - the transaction to be signed
             * @param {String} payload.network - the Stellar network that the transaction is on
             * @param {Object} payload.progress - signing progress
             */

            /**
             * @callback progressFunc
             * @param {Object} payload
             * @paran {String} payload.hash - the transaction hash of the transaction being signed
             * @param {Object} payload.progress - signing progress
             */

            /**
             * @callback addSignerFunc
             * @param {Object} payload
             * @param {String} payload.id - the recipient pubkey for this request
             * @param {String} payload.account - the account that recipient has been added as a signer to
             * @param {String} payload.network - the Stellar network that the account is on
             */

            /**
             * @callback removeSignerFunc
             * @param {Object} payload
             * @param {String} payload.id - the recipient pubkey for this request
             * @param {String} payload.account - the account that recipient has been removed as a signer from
             * @param {String} payload.network - the Stellar network that the account is on
             */
        }
    };

    function encodeSignature(sig) {
        return sig.toXDR().toString('base64');
    }

    function encodeTransaction(tx) {
        return tx.toEnvelope().toXDR().toString('base64');
    }
})();

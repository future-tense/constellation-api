Constellation is a signature aggregation hub for Stellar, with an open API.

It opens up new possibilities by taking the pain out of the process of passing around signatures, and synchronising transaction signing.

The obvious use case would be to sign transactions for shared, *multi-signature*, accounts, but thanks to the sophistication of transaction envelopes in Stellar, it can be used for much more than that.

Some examples are:

- Off-exchange swaps between two parties, 
	* Alice sends 1,000,000 XLM to Bob
	* Bob sends 2.64 BTC to Alice

- Setting up new anchor accounts
	* Anchor creates new user account
	* User trusts anchor asset
	* Anchor sends asset to User

Since transactions in Stellar are atomic, the operations within a transaction envelope either *all* pass, or they *all* fail, taking a lot of risk out of the equation.

Now you can remove the *headaches* too, by using the Constellation API to coordinate the signing process for you.
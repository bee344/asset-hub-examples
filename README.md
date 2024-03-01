
The Polkadot Relay Chain does not natively support assets beyond DOT. This functionality exists in a parachain called Asset Hub.

The Asset Hub provides a first-class interface for creating, managing, and using fungible and non-fungible assets. The fungible interface is similar to Ethereum's ERC-20 standard. However, the data structures and stateful operations are encoded directly into the chain's runtime, making operations fast and fee-efficient.

Beyond merely supporting assets, integrating an Asset Hub into your systems has several benefits for infrastructure providers and users:
- Support for on-chain assets.
- Significantly lower transaction fees (about 1/10) than the Polkadot Relay Chain.
- Significantly lower deposits (0.01 DOT) than the Polkadot Relay Chain.
- Ability to pay transaction fees in certain assets. As in, accounts would **not** need DOT to exist on-chain or pay fees.

The Asset Hub will use DOT as its native currency. Users can transfer DOT from the Relay Chain into the Asset Hub and use it natively, and to the Relay Chain Asset Hub back to the Relay Chain for staking, governance, or any other activity.

Using the Asset Hub for DOT balance transfers will be much more efficient than the Relay Chain and is highly recommended.
## Assets Basics

Assets are stored as a map from an ID to information about the asset, including a management team, total supply, total number of accounts, its sufficiency for account existence, and more. Additionally, the asset owner can register metadata like the name, symbol, and number of decimals for representation.

Some assets, as determined by on-chain governance, are regarded as “sufficient”.  Sufficiency means that the asset balance is enough to create the account on-chain, with no need for the DOT existential deposit. Likewise, you cannot send a non-sufficient asset to an account that does not exist. Sufficient assets can be used to pay transaction fees (i.e. there is no need to hold DOT on the account). Currentl

Assets do have a minimum balance (set by the creator), and if an account drops below that balance, the dust is lost.

### Asset Operations

The Assets pallet has its interface for dealing with assets. See the [Integration](#integration)
section below for how to fetch information and construct transactions.

The main functions you will probably interact with are `transfer_allow_death` and `transfer_keep_alive`. These functions transfer some `amount` (balance) of an `AssetId` (a `u32`, not a contract address) to another account.

The Assets pallet also provides an `approve_transfer`, `cancel_approval`, and `transfer_approved` interface for non-custodial operations.

Asset transfers will result in an `assets.transferred` event. The same instructions for
[monitoring events and **not** transactions](build-protocol-info.md#events) applies to asset transfers.

Note that you can use the same addresses (except [pure proxies](../learn/learn-proxies-pure.md#anonymous-proxy-pure-proxy)!) on the Asset Hub that
you use on the Relay Chain. The SS58 encodings are the same; only the chain information (genesis hash, etc.) will change on transaction construction.

## Integration

The Asset Hub will come with the same tooling suite that Parity Technologies provides for the Relay Chain, namely [API Sidecar](https://github.com/paritytech/substrate-api-sidecar), [TxWrapper Polkadot](https://github.com/paritytech/txwrapper-core/tree/main/packages/txwrapper-polkadot), and the [Asset Transfer API](https://github.com/paritytech/asset-transfer-api). If you have a technical question or issue about how to use one of the integration tools, please file a GitHub issue so a developer can help.

#### Asset Transfer API

`Asset-transfer-api` is a library focused on simplifying the construction of asset transfers for Substrate-based chains that involve system parachains like Asset Hub. It exposes a reduced set of methods that facilitate users to send transfers to other (para) chains or locally. You can refer to [this table](https://github.com/paritytech/asset-transfer-api/tree/main#current-cross-chain-support) for the current cross-chain support and [here](https://paritytech.github.io/asset-transfer-api/) for
the complete documentation, including installation guide and usage examples.

#### Sidecar

`API Sidecar` is a REST service for Relay Chain and parachain nodes. It comes with endpoints to query information about assets and asset balances on the Asset Hub.
- Asset lookups always use the `AssetId` to refer to an asset class. On-chain metadata is subject to change and thus unsuitable as a canonical index.
- Please refer to [docs](https://paritytech.github.io/substrate-api-sidecar/dist/) for full usage information. Details on options like how to make a historical query are not included here.

This is the available public instance of sidecar for the Polkadot Asset Hub:

- [Sidecar connected to Polkadot Asset Hub](https://polkadot-asset-hub-public-sidecar.parity-chains.parity.io)

The purpose of these instances is to allow anyone to check and get a quick overview of the info that the asset-related endpoints provide.

**NOTE: This instance should only be used for ad-hoc checks or tests and not for production, heavy testing or any other critical purpose.**

#### Tx Wrapper Polkadot

TxWrapper Polkadot is a library designed to facilitate transaction construction and signing in
offline environments. It comes with asset-specific functions to use on the Asset Hub. When
constructing parachain transactions, you can use `txwrapper-polkadot` exactly as on the Relay Chain, but construct transactions with the appropriate parachain metadata like  genesis hash, spec version, and type registry.

#### XCM Transfer Monitoring

##### Monitoring of XCM deposits

Thanks to XCM and a growing number of parachains, DOT can exist across several blockchains, which means the providers need to monitor cross-chain transfers on top of local transfers and corresponding `balances.transfer_*` events.

Currently DOT can be sent and received in the Relay Chain either with a [Teleport](https://wiki.polkadot.network/docs/learn-teleport) from
[system parachains](https://wiki.polkadot.network/docs/learn-system-chains) or with a [Reserve Backed Transfer](https://wiki.polkadot.network/docs/learn-xcm-pallet#transfer-reserve-vs-teleport) from any other parachain. In both cases, the event emitted when processing the transfer is the `balances.deposit` event. Hence, providers should listen to these events, pointing to an address in their system. For this, the service provider must query every new block created, loop through the events array, filter for any `balances.deposit` event, and apply the appropriate business logic.

##### Tracking back XCM information

What has been mentioned earlier should be sufficient to confirm that DOT has arrived in a given account via XCM.
However, in some cases, it may be interesting to identify the cross-chain message that emitted the relevant `balances.deposit` event. This can be done as follows:

1. Query the Relay Chain `at` the block the `balances.deposit` event was emitted.
2. Filter for a `messageQueue(Processed)` event, also emitted during block initialization. This
   event has a parameter `Id`. The value of `Id` identifies the cross-chain message received in the Relay Chain. It can be used to track back the message in the origin parachain if needed. Note that a block may contain several `messageQueue(Processed)` events corresponding to several cross-chain messages processed for this block.

##### Additional Examples of Monitoring XCM Transfers

The two previous sections outline the process of monitoring XCM deposits to specific account(s) and then tracing back the origin of these deposits. However, the process of tracking an XCM transfer (hence the events to look for) may vary based on the direction of the XCM message. Here are some examples to showcase the slight differences:

1. For an XCM transfer from a Parachain to a Relay chain _([example](https://polkadot.subscan.io/xcm_message/polkadot-2f4138e73affe763bebbefa82ee2eb2633425541))_:

   - The [event](https://moonbeam.subscan.io/extrinsic/4531955-6?event=4531955-29) to look for in the Parachain side is called `parachainsystem (UpwardMessageSent)`, and the parameter `message_hash` in this event identifies the XCM transfer.
   - The [event](https://polkadot.subscan.io/extrinsic/17487547-0?event=17487547-3) to track in the Relay chain side is called `messagequeue (Processed)`, and the parameter `id` of the event should be the same as the `message_hash` found in the Parachain event.

2. For an XCM transfer from a Relay chain to a Parachain _([example](https://polkadot.subscan.io/xcm_message/polkadot-9b01c2916c4d3c5ad01ee350bdda13059358981f))_:

   - The [XCM Transfer Hash](https://polkadot.subscan.io/extrinsic/17487930-2?tab=xcm_transfer) is what we need to check on the Relay chain side.
   - The [event](https://acala.subscan.io/extrinsic/4553422-1?event=4553422-5) to look for in the Parachain side is called `dmpqueue (ExecutedDownward)`, and the parameter that identifies the XCM message is either called `message_hash` or `message_id`.

3. For an XCM transfer from a System Parachain to a Parachain _([example](https://polkadot.subscan.io/xcm_message/polkadot-7a1c6fd86e290680f8ee48cee8a64df8e75f7040))_:

   - The [event](https://assethub-polkadot.subscan.io/extrinsic/4677169-2?event=4677169-4) to look for in the System Parachain side is called `xcmpqueue (XcmpMessageSent)`, and again the `message_hash` is one of the parameters of the event.
   - The corresponding [event](https://astar.subscan.io/extrinsic/4540721-1?event=4540721-7) in the Parachain side is the `xcmpqueue (Success)` and the `message_hash` found in that event should have the same value as the one in the System parachain.

More examples with different directions and their corresponding events, can be found in this
["How to trace XCM Transfers"](https://hackmd.io/@LwMsxe3-SFmNXxugAXOKgg/SJrREymlp) page.

##### Monitoring of Failed XCM Transfers

In case that an XCM transfer fails to complete successfully, then we will notice some different parameters in the events emitted or different events. Below are some examples:

1. From a Relay chain to a System Parachain _([example](https://polkadot.subscan.io/xcm_message/polkadot-c8d7186edb43a592d65b3b5a87c4ecaac38c5aa2))_:

   - We will see the [event](https://assethub-polkadot.subscan.io/extrinsic/4671081-0?event=4671081-1) **`dmpqueue (ExecutedDownward)`** in the System Parachain side with the following parameters:
     - **`outcome`** with value **`Incomplete`** and with the type of error which in this example is
       [UntrustedReserveLocation](https://github.com/paritytech/polkadot-sdk/blob/c54ea64af43b522d23bfabb8d917a490c0f23217/polkadot/xcm/src/v2/traits.rs#L43).
     - **`message_id`** which shows the hash of the XCM Transfer.

2. From a Parachain to another Parachain _([example](https://polkadot.subscan.io/xcm_message/polkadot-3e74e95204faa6ecf3c81f5129b85f498b89cff2))_:

   - We will see the [event](https://interlay.subscan.io/extrinsic/3627057-1?event=3627057-8) **`xcmpqueue (Fail)`** in the destination Parachain with the following parameters:
     - **`error`** which in this example is [TooExpensive](https://github.com/paritytech/polkadot-sdk/blob/c54ea64af43b522d23bfabb8d917a490c0f23217/polkadot/xcm/src/v2/traits.rs#L98).
     - **`message_hash`** which identifies the XCM Transfer.
   - **Note** : there might be another [event](https://interlay.subscan.io/extrinsic/3627057-1?event=3627057-7) called **`polkadotxcm (AssetsTrapped)`** which indicates that some assets have been trapped (and hence can be claimed).

A great resource to learn more about Error Management in XCM is the Polkadot blog post from Dr. Gavin Wood, [XCM Part III: Execution and Error Management](https://www.polkadot.network/blog/xcm-part-three-execution-and-error-management).

### Running a Polkadot Asset Hub node

Using the Asset Hub will require running a parachain node to sync the chain. This is very similar to running a Polkadot node, with the addition of some extra flags. You can download the latest release of the [`polkadot-parachain` binary](https://github.com/paritytech/polkadot-sdk/releases/latest/) or build it from [source](https://github.com/paritytech/polkadot-sdk/) with the following commands:
```bash
$ cargo build --release --locked --bin polkadot-parachain
```

Another alternative is using Docker, this is more advanced, so it's best left up to those already familiar with docker or who have completed the other set-up instructions:
```bash
$ docker run -p 9944:9944 -p 9615:9615 parity/polkadot:latest \
\ --chain asset-hub-westend
\ --rpc-external
\ --prometheus-external
```
And then run the node with:
```bash
$ ./target/release/polkadot-parachain --chain asset-hub-westend
```

#### Types of Nodes

There are several node types, each with it's use case, but generally the most relevant are either an `archive` node or a `full` node:

- An **archive node** (`--pruning archive`) keeps all the past blocks and their states. An archive node makes it convenient to query the past state of the chain at any point in time.
- A **full node** prunes historical states: all finalized blocks' states older than a configurable number except the genesis block's state. This is 256 blocks from the last finalized one by default. A pruned node this way requires much less space than an archive node.

An **archive node** can become a **full node**, but for a **full node** to become an **archive node**, you must first purge your database and resync your node, starting in archive mode.

#### Hardware requirements

Currently there are no hardware requirements specific for the collator nodes, since they don't perform time-critical tasks. The only requirement is to have enough storage for the type of node intended, which can be retrieved from [here](https://stakeworld.io/docs/dbsize). Other than that, any relatively performant equipement or any cloud provider will suffice. You can also look into the [reference hardware](https://wiki.polkadot.network/docs/maintain-guides-how-to-validate-polkadot#reference-hardware) for validators, but be aware that these will probably be overkill for a non-validator node.

#### Maintenance

It's good practice to keep your node up to date with the latest version, which you can download from [here](https://github.com/paritytech/polkadot-sdk/releases). It's also recommended to keep the tools you are using up to date. Lastly, we recommend keeping track of the Polkadot Fellowship's [runtime upgrades](https://github.com/polkadot-fellows/runtimes/releases/latest) to be aware of critical logic changes. These runtime upgrades are voted on and executed via OpenGov, and the proposals with their enactment dates and other details can be found [here](https://polkadot.polkassembly.io/whitelisted-caller?trackStatus=all&page=1).
#### NOS

NoS stands for Node + (API) Sidecar and consists of a simple script to launch a full node of [Asset Hub](https://wiki.polkadot.network/docs/learn-system-chains#asset-hub) together with an instance of [Sidecar](https://github.com/paritytech/substrate-api-sidecar) on a machine (using Docker).

With NoS, you are able to spin up the nodes you want and quickly be able to communicate with them through an instance of Sidecar. All that is required is a configuration file that contains the desired settings for the network. When you provide this config file to NoS, it will do some heavy lifting for you, which includes updating versions.

To start using NoS you can follow this [guide](https://github.com/paritytech/nos?tab=readme-ov-file#using-nos). For generating an instance of Polkadot Asset Hub you can follow this [example `.env` file](https://github.com/paritytech/nos/blob/main/.env.statemint.example), just updating `POLKADOT_VERSION` and `POLKADOT_PARACHAIN_VERSION`.

NoS downloads and maintains archive nodes for at least one Relay Chain and one parachain, in this case Polkadot Relay Chain and the Polkadot Asset Hub respectively, so this will affect the amount of storage needed. At time of writing, the database sizes are 1.7 TiB for the Polkadot Relay Chain node and 133 GiB for the Polkadot Asset Hub node, both running with `pruning=archive`. Sidecar is stateless, so the amount of storage it requires is marginal. You can check the current db size for each type of node [here](https://stakeworld.io/docs/dbsize).

## Foreign Assets in Polkadot Asset Hub

Foreign assets are those assets in Asset Hub whose native blockchain is not Asset Hub. These are mainly native tokens from other parachains or bridged tokens from other consensus systems (such as Ethereum). Once a foreign asset has been registered in Asset Hub (by its root origin), users are enabled to send this token from its native blockchain to Asset Hub and operate with it as if it was any other asset.

Practically speaking, foreign assets are handled by the `foreign-assets` pallet in Asset Hub, which is an instance of the previously mentioned `assets` pallet. Hence, this pallet exposes the same interface to users and other pallets as `assets` pallet. For example, to transfer a certain amount of a foreign asset (id) to an account (target), this pallet exposes the following call: 

``` ts
foreignAssets.transferKeepAlive(id, target, amount)
```

The main difference to take into account for foreign assets is their identifier. Unlike using integers as identifiers in the `assets` pallet, assets stored in the `foreign-assets` pallet are identified by [their XCM multilocation](https://wiki.polkadot.network/docs/learn/xcm/fundamentals/multilocation-summary). Taking the example below, the id input parameter of the call above will be a multilocation type as `{parents: 1, interior: {X1: {Parachain: 2,123}}}`.

#### Monitoring XCM Transfers of Foreign Assets

For a guide and examples on how to monitor cross-chain foreign assets transfers, you can refer to [the guide posted on the Polkadot Wiki](https://wiki.polkadot.network/docs/build-integrate-assets#xcm-transfer-monitoring). The relevant events to track are the same, since they depend on the `polkadot-xcm` pallet. The only difference is that instead of the `balances.deposit`, the event we have to query for is `foreignAssets.transferred`.

#### Relevant tooling

##### Substrate API Sidecar

Parity maintains an RPC client, written in TypeScript, that exposes a limited set of endpoints. It handles the metadata and codec logic so that the user is always dealing with decoded information. It also aggregates information that an infrastructure business may need for accounting and auditing, e.g. transaction fees.

For the case of `foreign-assets`, the sidecar can fetch information associated with every foreign asset, which includes the assets `AssetDetails` and `AssetMetadata` through the endpoint `/pallets/foreign-assets`:

```json
{
  "at": {
    "hash": "string",
    "height": "string"
  },
  "items": [
    {
      "foreignAssetInfo": {
        "owner": "string",
        "issuer": "string",
        "admin": "string",
        "freezer": "string",
        "supply": "string",
        "deposit": "string",
        "minBalance": "string",
        "isSufficient": true,
        "accounts": "string",
        "sufficients": "string",
        "approvals": "string",
        "status": "string"
      },
      "foreignAssetMetadata": {
        "deposit": "string",
        "name": "string",
        "symbol": "string",
        "decimals": "string",
        "isFrozen": true
      }
    }
  ]
}
```

Using the generic endpoints for the pallets, ssidecar can also retrieve values specific to the configuration of the pallet, such as `constants`, `dispatchables`, `errors`, `events` and `storage`.

We also have the option to use have the sidecar submit transactions to the node it's connected to. For this we would have to first build the tx, sign it, and submit it as a hex string.

For example, for submitting a `foreignAssets.mint` tx, we would have to do something in the likes of:

```ts
const wsProvider = new WsProvider(RPC_ENDPOINT);

const api = await ApiPromise.create({
    provider: wsProvider,
},
);

await api.isReady;
await cryptoWaitReady();

const keyring = new Keyring({ type: "sr25519" });
const alice: KeyringPair = keyring.addFromUri("//Alice");
const bob: KeyringPair = keyring.addFromUri("//Bob");

const FOREIGN_ASSET = {
    parents: 2,
    interior: {
        X1: {
            globalConsensus: 'Kusama'
        }
    }
}


const foreignAssetInfo = await api.query.foreignAssets.asset(FOREIGN_ASSET);

console.log(foreignAssetInfo.toHuman());

const mockTx = await api.tx.foreignAssets.transfer(FOREIGN_ASSET, bob.address, 100000000).signAsync(alice);

const hex = mockTx.toHex();

const url = 'http://127.0.0.1:8080/transaction/'
const tx_headers = {'Content-type' : 'application/json', 'Accept' : 'text/plain'}
const response = requests.post(
    url,
    data=`{"tx": ${hex}}`,
    headers=tx_headers
)
const tx_response = json.loads(response.text);
``` 
Then, if the submission was successful, we would receive a JSON with the hash of the tx:

```json
{
  "hash": "txHash"
}
```
You can find more information about Sidecar in its [documentation](https://paritytech.github.io/substrate-api-sidecar/dist/).

##### Asset Transfer API

Asset-transfer-api is a library focused on simplifying the construction of asset transfers for Substrate based chains that involves system parachains like Polkadot Asset Hub. 
It exposes a reduced set of methods which facilitates users to send transfers to other (para) chains or locally.
It covers the pallet `assets` and its instances `pool-assets` and `foreign-assets`, as well as local transactions.

### Examples

Examples on how to manage foreign assets can be located in their corresponding directories:
* [Polkadot-JS](/polkadot-js-example/README.md)
* [Subxt](/subxt-example/README.md)
* [Asset Transfer API](/asset-transfer-api-example/README.md)

The instructions on how to run each example are located in it's respective `README` files.

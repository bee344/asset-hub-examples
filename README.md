# Polkadot Asset Hub

## Overview

The Polkadot Relay Chain does not natively support assets beyond DOT. This functionality exists in a parachain called Asset Hub.

Asset Hub provides a first-class interface for creating, managing, and using fungible and non-fungible assets. The fungible interface is similar to Ethereum's ERC-20 standard. However, the data structures and stateful operations are encoded directly into the chain's runtime, making operations fast and fee-efficient.

Beyond merely supporting assets, integrating an Asset Hub into your systems has several benefits for infrastructure providers and users:

- Support for on-chain assets.
- Significantly lower transaction fees (about 1/10) than the Polkadot Relay Chain.
- Significantly lower deposits (0.01 DOT) than the Polkadot Relay Chain.
- Ability to pay transaction fees in certain assets. As in, accounts would **not** need DOT to exist on-chain or pay fees.

Asset Hub will use DOT as its native currency. Users can transfer DOT from the Relay Chain into Asset Hub and use it natively, and to the Relay Chain Asset Hub back to the Relay Chain for staking, governance, or any other activity.

Note that you can use the same addresses (except [pure proxies](https://wiki.polkadot.network/docs/learn-proxies-pure#anonymous-proxy-pure-proxy)!) on Asset Hub that
you use on the Relay Chain. The [SS58 encodings](https://wiki.polkadot.network/docs/learn-account-advanced#address-format) are the same; only the chain information (genesis hash, etc.) will change on transaction construction.

### Running a Polkadot Asset Hub node

Using Asset Hub will require running a parachain node to sync the chain. This is very similar to running a Polkadot node, with the addition of some extra flags. You can download the latest release of the [`polkadot-parachain` binary](https://github.com/paritytech/polkadot-sdk/releases/latest/) or build it from [source](https://github.com/paritytech/polkadot-sdk/) with the following commands:

```bash
cargo build --release --locked --bin polkadot-parachain
```

Another alternative is using Docker, this is more advanced, so it's best left up to those already familiar with docker or who have completed the other set-up instructions:

```bash
$ docker run -p 9944:9944 -p 9615:9615 parity/polkadot:latest \
\ --chain asset-hub-polkadot
\ --rpc-external
\ --prometheus-external
```

And then run the node with:

```bash
./target/release/polkadot-parachain --chain asset-hub-polkadot
```

#### Types of Nodes

There are several node types, each with it's use case, but generally the most relevant are either an `archive` node or a `full` node:

- An **archive node** (`--pruning archive`) keeps all the past blocks and their states. An archive node makes it convenient to query the past state of the chain at any point in time.
- A **full node** prunes historical states: all finalized blocks' states older than a configurable number except the genesis block's state. This is 256 blocks from the last finalized one by default. A pruned node this way requires much less space than an archive node.

An **archive node** can become a **full node**, but for a **full node** to become an **archive node**, you must first purge your database and resync your node, starting in archive mode.

You can run the Polkadot Relay Chain with specifying `--pruning` other than `archive`, but the Polkadot Asset Hub should be run as an `archive` node.

#### Hardware requirements

Currently there are no hardware requirements specific for running a node, since they do not perform time-critical tasks. The only requirement is to have enough storage for the type of node intended, which can be retrieved from [here](https://stakeworld.io/docs/dbsize). Other than that, any relatively performant equipement or any cloud provider will suffice. You can also look into the [reference hardware](https://wiki.polkadot.network/docs/maintain-guides-how-to-validate-polkadot#reference-hardware) for validators, but be aware that these will probably be overkill for a non-validator node.

#### NOS

NoS stands for Node + (API) Sidecar and consists of a simple script to launch a full node of Asset Hub together with an instance of [Sidecar](https://github.com/paritytech/substrate-api-sidecar) on a machine (using Docker).

With NoS, you are able to spin up the nodes you want and quickly be able to communicate with them through an instance of Sidecar. All that is required is a configuration file that contains the desired settings for the network. When you provide this config file to NoS, it will do some heavy lifting for you, which includes updating versions.

To start using NoS you can follow this [guide](https://github.com/paritytech/nos?tab=readme-ov-file#using-nos). For generating an instance of Polkadot Asset Hub you can follow this [example `.env` file](https://github.com/paritytech/nos/blob/main/.env.statemint.example), just updating `POLKADOT_VERSION` and `POLKADOT_PARACHAIN_VERSION`.

NoS downloads and maintains archive nodes for at least one Relay Chain and one parachain, in this case Polkadot Relay Chain and the Polkadot Asset Hub respectively, so this will affect the amount of storage needed. At time of writing, the database sizes are 1.7 TiB for the Polkadot Relay Chain node and 133 GiB for the Polkadot Asset Hub node, both running with `pruning=archive`. Sidecar is stateless, so the amount of storage it requires is marginal. You can check the current db size for each type of node [here](https://stakeworld.io/docs/dbsize). You can reduce the storage requirement for the Polkadot Relay Chain by adding the line `RELAYCHAIN_PRUNING=1000` in the `.env` file, in order to have the Relay Chain node keep only the last `1000` blocks.

### Maintenance

It's good practice to keep your node up to date with the latest version, which you can download from [here](https://github.com/paritytech/polkadot-sdk/releases). It's also recommended to keep the tools you are using up to date.

#### Runtime Upgrades

[Runtime upgrades](https://wiki.polkadot.network/docs/learn-runtime-upgrades) allow the Polkadot Asset Hub to change the logic of the chain without the need for a hard fork. You can monitor the Relay Chain for upcoming upgrades. We recommend keeping track of the Polkadot Fellowship's [runtime upgrades](https://github.com/polkadot-fellows/runtimes/releases/latest) to be aware of changes in the runtime logic of Asset Hub. These runtime upgrades are voted on and executed via [OpenGov](https://wiki.polkadot.network/docs/learn-polkadot-opengov). You should monitor the Relay chain as follows to know when the next runtime upgrade will be enacted:

1. Check each block for `referenda (Submitted)` events and check if `track` is `1`, which means it's `whitelistedCaller` - this is the only track that can enact runtime upgrdes - and log its `index` and `proposal`, this will help you keep track of the proposal's evolution. With the index you can lookup the details of the proposal in [Polkassembly.io](https://polkadot.polkassembly.io/whitelisted-caller?trackStatus=all&page=1) to see if it corresponds with a runtime upgrade.
2. In the same block, look for the extrinsic `referenda.submit`, which has the `enactment_moment` for the proposal in blocks.
3. Check also for `referenda (DecisionDepositPlaced)` events where `index` matches the one previously found. This means that the required deposit has been placed.
4. `referenda (DecisionStarted)` indicates that the decision period has started for the referenda of that `index`.
5. `referenda (ConfirmStarted)` indicates that `index`'s referenda has entered the confirmation period.
   1. `referenda (Confirmed)` indicates that `index`'s referenda has been confirmed and will enter the enactment period. With this and `enactment_moment`, you can estimate when the proposal will be enacted.
   2. `referenda (Rejected)` indicates that `index`'s referenda has been rejected and will not be enacted.
6. Once the enactment period is over, there will be a `system(CodeUpdated)` event confirming the execution of the runtime upgrade.

## Foreign Assets in Polkadot Asset Hub

Assets, both native and foreign, are stored as a map from an ID to information about the asset, including a management team, total supply, total number of accounts, its sufficiency for account existence, and more. Additionally, the asset owner can register metadata like the name, symbol, and number of decimals for representation.

Some assets, as determined by on-chain governance, are regarded as “sufficient”. Sufficiency means that the asset balance is enough to create the account on-chain, with no need for the DOT existential deposit. Likewise, you cannot send a non-sufficient asset to an account that does not exist. Assets do have a minimum balance, and if an account drops below that balance, the dust is lost.

For an more details on general asset management in Asset Hub, refer to the [assets documentation](https://wiki.polkadot.network/docs/build-integrate-assets#assets-basics) of the Polkadot Wiki.

Foreign assets are those assets in Asset Hub whose native blockchain is not Asset Hub. These are mainly native tokens from other parachains or bridged tokens from other consensus systems (such as Ethereum). Once a foreign asset has been registered in Asset Hub (by its root origin), users are enabled to send this token from its native blockchain to Asset Hub and operate with it as if it was any other asset.

Practically speaking, foreign assets are handled by the `foreign-assets` pallet in Asset Hub, which is an instance of [the `assets` pallet](https://marketplace.substrate.io/pallets/pallet-assets/). Hence, this pallet exposes the same interface to users and other pallets as `assets` pallet. For example, to transfer a certain amount of a foreign asset (id) to an account (target), this pallet exposes the following call:

``` ts
foreignAssets.transferKeepAlive(id, target, amount)
```

The main difference to take into account for foreign assets is their identifier. Unlike using integers as identifiers in the `assets` pallet, assets stored in the `foreign-assets` pallet are identified by [their XCM multilocation](https://wiki.polkadot.network/docs/learn/xcm/fundamentals/multilocation-summary). Taking the example below, the id input parameter of the call above will be a multilocation type as `{parents: 1, interior: {X1: {Parachain: 2,123}}}`.

``` ts
    [
      {
        parents: 1
        interior: {
          X1: {
            Parachain: 2,123
          }
        }
      }
    ]
    {
      owner: FBeL7DhzrCPmjxvXCkC9Kzu59XFLvA5rGtQnr8FvFLubfBh
      issuer: FBeL7DhzrCPmjxvXCkC9Kzu59XFLvA5rGtQnr8FvFLubfBh
      admin: FBeL7DhzrCPmjxvXCkC9Kzu59XFLvA5rGtQnr8FvFLubfBh
      freezer: FBeL7DhzrCPmjxvXCkC9Kzu59XFLvA5rGtQnr8FvFLubfBh
      supply: 0
      deposit: 100,000,000,000
      minBalance: 1,000,000,000
      isSufficient: false
      accounts: 1
      sufficients: 0
      approvals: 0
      status: Live
    }
  ]
```

Example of a decoded storage entry of a foreign asset with Polkadot-JS. The key of the storage entry is the XCM Location of the asset, in this case, the parachain GM in the Kusama ecosystem (para ID 2123).

### Foreign Asset Operations

The main functions you will probably interact with are `foreignAssets.transfer_allow_death` and `foreignAssets.transfer_keep_alive`. The `foreign-assets` also provides an `approve_transfer`, `cancel_approval`, and `transfer_approved` interface for non-custodial operations.

#### XCM Transfer Monitoring

##### Monitoring of XCM deposits

Assets can exist across several blockchains, which means the service providers need to monitor cross-chain transfers on top of local transfers and corresponding `foreignAssets.transfer_*` events.

Currently, foreign assets can be sent and received in Asset Hub either with a [Reserve Backed Transfer or Teleporting](https://wiki.polkadot.network/docs/learn-xcm-pallet#transfer-reserve-vs-teleport) from other parachains. In both cases, the event emitted when processing the transfer is the `foreignAssets.issued` event. Hence, you should listen to these events, pointing to an address in their system. For this, you should query every new block created, loop through the events array, filter for any `foreignAssets.issued` event, and apply the appropriate business logic.

##### Tracking back XCM information

What has been mentioned earlier should be sufficient to confirm that a foreign asset has arrived in a given account via XCM.
However, in some cases, it may be interesting to identify the cross-chain message that emitted the relevant `foreignAssets.issued` event. This can be done as follows:

1. Query Asset Hub `at` the block the `foreignAssets.issued` event was emitted.
2. Filter for a `messageQueue(Success)` event, also emitted during block initialization. This
   event has a parameter `Id`. The value of `Id` identifies the cross-chain message received in the Relay Chain. It can be used to track back the message in the origin parachain if needed. Note that a block may contain several `messageQueue(Success)` events corresponding to several cross-chain messages processed for this block.

##### Additional Examples of Monitoring XCM Transfers

The two previous sections outline the process of monitoring XCM deposits to specific account(s) and then tracing back the origin of these deposits. However, the process of tracking an XCM transfer (hence the events to look for) may vary based on the direction of the XCM message. Here are some examples to showcase the slight differences:

1. For an XCM transfer of a foreing asset from Asset Hub to the native Parachain:

   - The event to look for in Asset Hub side is called `xcmpqueue(XcmpMessageSent)`, and again the `message_hash` is one of the parameters of the event.
   - The corresponding event in the Parachain side is the `xcmpqueue(Success)` and the `message_hash` found in that event should have the same value as the one in Asset Hub.
   - In Asset Hub we will also see the event `foreignAssets(Burned)` which indicates that the foreign assets transferred have been burnt on Asset Hub.

2. For an XCM transfer of a foreing asset from the native Parachain to Asset Hub:

   - The event to look for in the Parachain side is called `xcmpqueue(XcmpMessageSent)`, and again the `message_hash` is one of the parameters of the event.
   - The corresponding even in Asset Hub side is the `xcmpqueue(Success)` and the `message_hash` found in that event should have the same value as the one in Asset Hub.
   - In Asset Hub we will also see the event `foreignAssets(Issued)` which indicates that the foreign assets transferred have been minted on Asset Hub.

##### Monitoring of Failed XCM Transfers

In case that an XCM transfer fails to complete successfully, then we will notice some different parameters in the events emitted or different events. Below are some examples:

1. From a Parachain to Asset Hub:

   - We will see the event `xcmpqueue(Fail)` in Asset Hub with the following parameters:
     - `error` which may be one of these in [this list](https://github.com/paritytech/polkadot-sdk/blob/cdc8d197e6d487ef54f7e16767b5c1ab041c8b10/polkadot/xcm/src/v3/traits.rs#L34).
     - `message_hash` which identifies the XCM Transfer.
   - **Note** : there might be another event called `polkadotxcm(AssetsTrapped)` which indicates that some assets have been trapped (and hence can be claimed by the sender).

A great resource to learn more about Error Management in XCM is the Polkadot blog post from Dr. Gavin Wood, [XCM Part III: Execution and Error Management](https://www.polkadot.network/blog/xcm-part-three-execution-and-error-management).

#### Relevant tooling

Asset Hub will come with the same tooling suite [provided for the Relay Chain](https://wiki.polkadot.network/docs/build-integration#recommendation), namely [API Sidecar](https://github.com/paritytech/substrate-api-sidecar), [Polkadot-JS](https://wiki.polkadot.network/docs/learn-polkadotjs-index), [subxt](https://github.com/paritytech/subxt), [TxWrapper Polkadot](https://github.com/paritytech/txwrapper-core/tree/main/packages/txwrapper-polkadot), and the [Asset Transfer API](https://github.com/paritytech/asset-transfer-api). If you have a technical question or issue about how to use one of the integration tools, please file a GitHub issue so a developer can help.

##### For node interaction: Substrate API Sidecar

Parity maintains an RPC client, written in TypeScript, that exposes a limited set of endpoints. It handles the metadata and codec logic so that the user is always dealing with decoded information. It also aggregates information that an infrastructure business may need for accounting and auditing, e.g. transaction fees.

For the case of `foreign-assets`, Sidecar can fetch information associated with every foreign asset, which includes the assets `AssetDetails` and `AssetMetadata` through the endpoint `/pallets/foreign-assets`:

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

Using the generic endpoints for the pallets, sidecar can also retrieve values specific to the configuration of the pallet, such as `constants`, `dispatchables`, `errors`, `events` and `storage`.

Sidecar can also submit transactions to the node it's connected to. For this we would have to first build the transaction, sign it, and submit it as a hex string. Then, if the submission was successful, we would receive a JSON with the hash of the transaction, `txHash`:

```json
{
  "hash": "txHash"
}
```

You can find more information about Sidecar in its [documentation](https://paritytech.github.io/substrate-api-sidecar/dist/).

##### For transaction construction 

Several tools are available to construct transactions for Polkadot Asset Hub. For example, subxt provides libraries in Rust with great flexibility for transaction construction, whereas Asset Transfer API is focused on offering a simplified interface to build of asset transfers. 

- **Examples**

Examples on how to build transactions to manage foreign assets can be located in their following directories:

- [Polkadot-JS](/polkadot-js-example/)
- [Subxt](/subxt-example/)
- [Asset Transfer API](/asset-transfer-api-example/)
- [txwrapper](/txwrapper-example/)

The instructions on how to run each example are located in it's respective `README` files.

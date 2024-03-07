"use strict";
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * @ignore Don't show this file in documentation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@polkadot/api");
const util_crypto_1 = require("@polkadot/util-crypto");
const txwrapper_polkadot_1 = require("@substrate/txwrapper-polkadot");
const txwrapper_substrate_1 = require("@substrate/txwrapper-substrate");
const util_1 = require("../common/util");
/**
 * Entry point of the script. This script assumes a substrate node is running
 * locally. Refer to the README.md file for instructions on which port to provide for the rpc call.
 */
async function main() {
    var _a, _b, _c;
    // Wait for the promise to resolve async WASM
    await (0, util_crypto_1.cryptoWaitReady)();
    // Create a new keyring, and add an "Alice" account
    const keyring = new api_1.Keyring();
    const alice = keyring.addFromUri('//Alice', { name: 'Alice' }, 'sr25519');
    console.log("Alice's SS58-Encoded Address:", (0, txwrapper_polkadot_1.deriveAddress)(alice.publicKey, txwrapper_polkadot_1.PolkadotSS58Format.westend));
    // Construct a balance transfer transaction offline.
    // To construct the tx, we need some up-to-date information from the node.
    // `txwrapper` is offline-only, so does not care how you retrieve this info.
    // In this tutorial, we simply send RPC requests to the node.
    const { block } = await (0, util_1.rpcToLocalNode)('chain_getBlock');
    const blockHash = await (0, util_1.rpcToLocalNode)('chain_getBlockHash');
    const genesisHash = await (0, util_1.rpcToLocalNode)('chain_getBlockHash', [0]);
    const metadataRpc = await (0, util_1.rpcToLocalNode)('state_getMetadata');
    const { specVersion, transactionVersion, specName } = await (0, util_1.rpcToLocalNode)('state_getRuntimeVersion');
    /**
     * Create Polkadot's type registry.
     *
     * When creating a type registry, it accepts a `asCallsOnlyArg` option which
     * defaults to false. When true this will minimize the size of the metadata
     * to only include the calls. This removes storage, events, etc.
     * This will ultimately decrease the size of the metadata stored in the registry.
     *
     * Example:
     *
     * ```
     * const registry = getRegistry({
     *  chainName: 'Polkadot',
     *  specName,
     *  specVersion,
     *  metadataRpc,
     *  asCallsOnlyArg: true,
     * });
     * ```
     */
    const registry = (0, txwrapper_polkadot_1.getRegistry)({
        chainName: 'Polkadot Asset Hub',
        specName,
        specVersion,
        metadataRpc,
    });
    /**
     * Now we can create our `balances.transferKeepAlive` unsigned tx. The following
     * function takes the above data as arguments, so it can be performed offline
     * if desired.
     *
     * In order to decrease the size of the metadata returned in the unsigned transaction,
     * be sure to include `asCallsOnlyArg` field in the options.
     * Ex:
     * {
     *   metadataRpc,
     *   registry,
     *   asCallsOnlyArg: true
     * }
     */
    const nonce = await (0, util_1.rpcToLocalNode)('account_nextIndex', [alice.address]);
    const unsigned = txwrapper_substrate_1.methods.foreignAssets.transferKeepAlive({
        id: { parents: 2, interior: { X1: { GlobalConsensus: 'Kusama' } } },
        target: '14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3', // seed "//Bob"
        amount: 1234,
    }, {
        address: (0, txwrapper_polkadot_1.deriveAddress)(alice.publicKey, txwrapper_polkadot_1.PolkadotSS58Format.westend),
        blockHash,
        blockNumber: registry
            .createType('BlockNumber', block.header.number)
            .toNumber(),
        genesisHash,
        metadataRpc,
        nonce,
        specVersion,
        tip: 0,
        transactionVersion,
    }, {
        metadataRpc,
        registry,
    });
    // Decode an unsigned transaction.
    const decodedUnsigned = (0, txwrapper_polkadot_1.decode)(unsigned, {
        metadataRpc,
        registry,
    });
    console.log(`\nDecoded Transaction\n  To: ${(_a = decodedUnsigned.method.args.dest) === null || _a === void 0 ? void 0 : _a.id}\n` + `  Amount: ${decodedUnsigned.method.args.value}`);
    // Construct the signing payload from an unsigned transaction.
    const signingPayload = txwrapper_polkadot_1.construct.signingPayload(unsigned, { registry });
    console.log(`\nPayload to Sign: ${signingPayload}`);
    // Decode the information from a signing payload.
    const payloadInfo = (0, txwrapper_polkadot_1.decode)(signingPayload, {
        metadataRpc,
        registry,
    });
    console.log(`\nDecoded Transaction\n  To: ${(_b = payloadInfo.method.args.dest) === null || _b === void 0 ? void 0 : _b.id}\n` +
        `  Amount: ${payloadInfo.method.args.value}\n` +
        `  AssetId: ${payloadInfo.assetId}`);
    // Sign a payload. This operation should be performed on an offline device.
    const signature = (0, util_1.signWith)(alice, signingPayload, {
        metadataRpc,
        registry,
    });
    console.log(`\nSignature: ${signature}`);
    // Serialize a signed transaction.
    const tx = txwrapper_polkadot_1.construct.signedTx(unsigned, signature, {
        metadataRpc,
        registry,
    });
    console.log(`\nTransaction to Submit: ${tx}`);
    // Derive the tx hash of a signed transaction offline.
    const expectedTxHash = txwrapper_polkadot_1.construct.txHash(tx);
    console.log(`\nExpected Tx Hash: ${expectedTxHash}`);
    // Decode a signed payload.
    const txInfo = (0, txwrapper_polkadot_1.decode)(tx, {
        metadataRpc,
        registry,
    });
    console.log(`\nDecoded Transaction\n  To: ${(_c = txInfo.method.args.dest) === null || _c === void 0 ? void 0 : _c.id}\n` + `  Amount: ${txInfo.method.args.value}\n`);
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=foreignAssetTransfer.js.map
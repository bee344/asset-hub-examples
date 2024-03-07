"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keyring_1 = require("@polkadot/keyring");
const api_1 = require("@polkadot/api");
const util_crypto_1 = require("@polkadot/util-crypto");
async function main() {
    const RPC_ENDPOINT = 'wss://polkadot-asset-hub-rpc.parity.com';
    const wsProvider = new api_1.WsProvider(RPC_ENDPOINT);
    const api = await api_1.ApiPromise.create({
        provider: wsProvider,
    });
    await api.isReady;
    await (0, util_crypto_1.cryptoWaitReady)();
    const keyring = new keyring_1.Keyring({ type: "sr25519" });
    const alice = keyring.addFromUri("//Alice");
    const bob = keyring.addFromUri("//Bob");
    const FOREIGN_ASSET = {
        parents: 2,
        interior: {
            X1: {
                globalConsensus: 'Kusama'
            }
        }
    };
    const mockTx = await api.tx.foreignAssets.transfer(FOREIGN_ASSET, bob.address, 100000000).signAsync(alice);
    console.log(mockTx.toHuman());
}
main()
    .catch(console.error)
    .finally(() => process.exit());
//# sourceMappingURL=foreignAssetsTransfer.js.map
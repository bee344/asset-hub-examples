"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keyring_1 = require("@polkadot/keyring");
const api_1 = require("@polkadot/api");
const util_crypto_1 = require("@polkadot/util-crypto");
async function main() {
    const RPC_ENDPOINT = 'wss://statemint-rpc.dwellir.com';
    const wsProvider = new api_1.WsProvider(RPC_ENDPOINT);
    const api = await api_1.ApiPromise.create({
        provider: wsProvider,
    });
    await api.isReady;
    await (0, util_crypto_1.cryptoWaitReady)();
    const keyring = new keyring_1.Keyring({ type: "sr25519" });
    const alice = keyring.addFromUri("//Alice");
    const ID = {
        parents: 2,
        interior: {
            X1: {
                globalConsensus: 'Kusama'
            }
        }
    };
    const mint = await api.tx.foreignAssets.burn(ID, alice.address, 100000000).signAsync(alice);
    console.log(mint.toHuman());
}
main()
    .catch(console.error)
    .finally(() => process.exit());
//# sourceMappingURL=foreignAssetsBurn.js.map
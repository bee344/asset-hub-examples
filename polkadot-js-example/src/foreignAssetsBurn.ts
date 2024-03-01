import { Keyring } from "@polkadot/keyring";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { KeyringPair } from "@polkadot/keyring/types";

async function main() {
    const RPC_ENDPOINT = 'wss://statemint-rpc.dwellir.com';

    const wsProvider = new WsProvider(RPC_ENDPOINT);

    const api = await ApiPromise.create({
        provider: wsProvider,
    },
    );

    await api.isReady;
    await cryptoWaitReady();

    const keyring = new Keyring({ type: "sr25519" });
    const alice: KeyringPair = keyring.addFromUri("//Alice");

    const ID: object = {
        parents: 2,
        interior: {
            X1: {
                globalConsensus: 'Kusama'
            }
        }
    }

    const mint = await api.tx.foreignAssets.burn(ID, alice.address, 100000000).signAsync(alice);


    console.log(mint.toHuman());

}

main()
    .catch(console.error)
    .finally(() => process.exit());

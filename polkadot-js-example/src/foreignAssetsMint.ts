import { Keyring } from "@polkadot/keyring";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { KeyringPair } from "@polkadot/keyring/types";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";

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

    const ASSET_NAME = 'Kusama';
    const TICKER = 'KSM';
    const DECIMALS = 12;

    const ASSET_MIN = 1_000_000_000;

    const setupTxs: SubmittableExtrinsic<"promise", ISubmittableResult>[] = [];
    const create = api.tx.foreignAssets.create(ID, alice.address, ASSET_MIN);
    const setMetadata = api.tx.foreignAssets.setMetadata(ID, ASSET_NAME, TICKER, DECIMALS);
    const mint = api.tx.foreignAssets.mint(ID, alice.address, 100000000);

    setupTxs.push(create);
    setupTxs.push(setMetadata);
    setupTxs.push(mint);

    const batch = await api.tx.utility.batchAll(setupTxs).signAsync(alice);

    console.log(batch.toHuman());

}

main()
    .catch(console.error)
    .finally(() => process.exit());

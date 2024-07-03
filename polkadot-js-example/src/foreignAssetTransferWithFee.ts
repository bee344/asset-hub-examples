import { Keyring } from "@polkadot/keyring";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { KeyringPair } from "@polkadot/keyring/types";

/**
 * In this example we are creating a transaction with a foreignAssets.transferKeepAlive call to send foreign asset
 * to another acount inside Polkadot Asset Hub. In this case we are paying transactions fees with the asset `1984`
 * which corresponds to USDT in Polkadot Asset Hub.
 */

async function main() {
    const RPC_ENDPOINT = 'wss://statemint.api.onfinality.io/public-ws';

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

    const assetForFees = {
        parents: 0,
        interior: {
            X2: [{
                palletInstance: 50
            },
            {
                generalIndex: 1984
            }]
        }
    };

    const mockTx = await api.tx.foreignAssets.transfer(FOREIGN_ASSET, bob.address, 100000000).signAsync(alice, { assetId: assetForFees });

    console.log(mockTx.toHuman());

}

main()
    .catch(console.error)
    .finally(() => process.exit());

import { Keyring } from "@polkadot/keyring";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { KeyringPair } from "@polkadot/keyring/types";

/**
 * In this example we are creating a transaction with a foreignAssets.transferKeepAlive call to send foreign asset
 * to another acount inside Polkadot Asset Hub,
 */

async function main() {
    const RPC_ENDPOINT = 'wss://polkadot-asset-hub-rpc.dwellir.com';

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

// Define the id of the foreign asset, in this case an XCM multilocation
    const FOREIGN_ASSET = {
        parents: 2,
        interior: {
            X1: {
                globalConsensus: 'Kusama'
            }
        }
    }

// create transaction, sign it and send it
    const mockTx = await api.tx.foreignAssets.transferKeepAlive(FOREIGN_ASSET, bob.address, 100000000).signAsync(alice);

    console.log(mockTx.toHuman());

}

main()
    .catch(console.error)
    .finally(() => process.exit());

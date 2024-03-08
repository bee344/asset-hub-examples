import { Keyring } from "@polkadot/keyring";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { KeyringPair } from "@polkadot/keyring/types";

/**
 * In this example we are creating a transaction with a foreignAssets.transferKeepAlive call to send foreign asset
 * to another acount inside Polkadot Asset Hub. Then we subscribe to the transaction status and exit when the block 
 * in which the transaction was included is finalized.
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

    const FOREIGN_ASSET = {
        parents: 2,
        interior: {
            X1: {
                globalConsensus: 'Kusama'
            }
        }
    }

    api.tx.foreignAssets.transferKeepAlive(FOREIGN_ASSET, bob.address, 100000000).signAndSend(alice, ({ events = [], status }) => {
        console.log('Transaction status:', status.type);

        if (status.isInBlock) {
            console.log('Included at block hash', status.asInBlock.toHex());
            console.log('Events:');

            events.forEach(({ event: { data, method, section }, phase }) => {
                console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
            });
        } else if (status.isFinalized) {
            console.log('Finalized block hash', status.asFinalized.toHex());

            process.exit(0);
        }
    });;

}

main()
    .catch(console.error)
    .finally(() => process.exit());

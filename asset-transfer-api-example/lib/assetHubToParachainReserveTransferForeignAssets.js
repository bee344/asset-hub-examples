"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * When importing from @substrate/asset-transfer-api it would look like the following
 *
 * import { AssetTransferApi, constructApiPromise } from '@substrate/asset-transfer-api'
 */
const asset_transfer_api_1 = require("@substrate/asset-transfer-api");
const colors_1 = require("./colors");
/**
 * In this example we are creating a reserve call to send foreign asset '{"parents":"1","interior":{"X2":[{"Parachain":"2125"},{"GeneralIndex":"0"}]}}'
 * from a Kusama Asset Hub (System Parachain) account
 * to a Moonriver (ParaChain) account, where the `xcmVersion` is set to 3, and the `isLimited` declaring that
 * it will be `unlimited` since there is no `weightLimit` option as well.
 *
 * NOTE: When `isLimited` is true it will use the `limited` version of the either `reserveAssetTransfer`, or `teleportAssets`.
 */
const main = async () => {
    const { api, specName, safeXcmVersion } = await (0, asset_transfer_api_1.constructApiPromise)('wss://polkadot-asset-hub-rpc.polkadot.io');
    const assetApi = new asset_transfer_api_1.AssetTransferApi(api, specName, safeXcmVersion);
    let callInfo;
    try {
        callInfo = await assetApi.createTransferTransaction('2000', // Note: Parachain ID 2000(Acala) is different than MultiLocations 'Parachain' ID, making this a reserveTransfer
        '5EWNeodpcQ6iYibJ3jmWVe85nsok1EDG8Kk3aFg8ZzpfY1qX', ['{"parents":"1","interior":{"x2":[{"parachain":"2011"},{"generalKey":{"length":"3","data":"0x6571640000000000000000000000000000000000000000000000000000000000"}}]}}'], ['1000000000000'], {
            format: 'payload',
            isLimited: true,
            xcmVersion: 2,
            sendersAddr: 'GxshYjshWQkCLtCWwtW5os6tM3qvo6ozziDXG9KbqpHNVfZ'
        });
        console.log(callInfo.tx);
    }
    catch (e) {
        console.error(e);
        throw Error(e);
    }
    const decoded = assetApi.decodeExtrinsic(callInfo.tx, 'payload');
    console.log(`\n${colors_1.PURPLE}The following decoded tx:\n${colors_1.GREEN} ${JSON.stringify(JSON.parse(decoded), null, 4)}${colors_1.RESET}`);
};
main()
    .catch((err) => console.error(err))
    .finally(() => process.exit());
//# sourceMappingURL=assetHubToParachainReserveTransferForeignAssets.js.map
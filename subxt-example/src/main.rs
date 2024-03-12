use subxt::{
    OnlineClient,
    config::{
        DefaultExtrinsicParamsBuilder, PolkadotConfig,
        },
        utils::{
            AccountId32, MultiAddress
        }
    };
use subxt_signer::sr25519::dev::{self};

// Metadata that we'll use for our example
#[subxt::subxt(
    runtime_metadata_path = "./metadata/metadata.scale",
    derive_for_type(
        path = "staging_xcm::v3::multilocation::MultiLocation",
        derive = "Clone",
        recursive
    )
)]
pub mod local {}

// Types that we retrieve from the Metadata for our example
type MultiLocation = local::runtime_types::staging_xcm::v3::multilocation::MultiLocation;

use local::runtime_types::xcm::v3::junction::{
    NetworkId::Kusama,
    Junction::{GlobalConsensus},
};
use local::runtime_types::xcm::v3::junctions::Junctions::X1;

// Foreign asset details
const ASSET_ID: MultiLocation = MultiLocation {
    parents: 2,
    interior: X1(GlobalConsensus(Kusama))
};

const URI: &str = "wss://polkadot-asset-hub-rpc.polkadot.io";

// Here we make a Native asset transfer while paying the tx fees with USDt
async fn mock_transfer_keep_alive(
    api: OnlineClient<PolkadotConfig>,
    id: MultiLocation,
    dest: MultiAddress<AccountId32, ()>,
    amount: u128,
) -> Result<(), subxt::Error> {
    let alice_pair_signer = dev::alice();

    // We config the tx to pay the fees with USDt
    let tx_config = DefaultExtrinsicParamsBuilder::<PolkadotConfig>::new().tip_of(0, 1984).build();

    let balance_transfer_tx = local::tx().foreign_assets().transfer_keep_alive(id, dest, amount);

    // Here we send the Native asset transfer and wait for it to be finalized.
    let signed_tx = api
    .tx()
    .create_signed(&balance_transfer_tx, &alice_pair_signer, tx_config)
    .await?;

    // If we wanted to listen to the events to keep track of our tx
    // listening for the `AssetTxFeePaid` event that confirms we succesfully paid
    // the fees with our custom asset
    // let mut balance_transfer_progress = api
    // .tx()
    // .sign_and_submit_then_watch_default(&balance_transfer_tx, &alice_pair_signer, tx_config)
    // .await?;
    //
    // while let Some(status) = balance_transfer_progress.next().await {
    //     match status? {
    //         // It's finalized in a block!
    //         TxStatus::InFinalizedBlock(in_block) => {
    //             println!(
    //                 "Transaction {:?} is finalized in block {:?}",
    //                 in_block.extrinsic_hash(),
    //                 in_block.block_hash()
    //             );
    //
    //             // grab the events and fail if no ExtrinsicSuccess event seen:
    //             let events = in_block.wait_for_success().await?;
    //             // We can look for events (this uses the static interface; we can also iterate
    //             // over them and dynamically decode them):
    //             let transfer_event = events.find_first::<polkadot::balances::events::Transfer>()?;
    //
    //             if let Some(event) = transfer_event {
    //                 println!("Balance transfer success: {event:?}");
    //             } else {
    //                 println!("Failed to find Balances::Transfer Event");
    //             }
    //         }
    //         // Just log any other status we encounter:
    //         other => {
    //             println!("Status: {other:?}");
    //         }
    //     }
    // }

    println!("Encoded extrinsic: 0x{}", hex::encode(signed_tx.encoded()));

    Ok(())
}

#[tokio::main]
async fn main() {
    let api = OnlineClient::<PolkadotConfig>::from_url(URI).await.unwrap();

    let dest: MultiAddress<AccountId32, ()> = dev::bob().public_key().into();

    let _result = mock_transfer_keep_alive(api.clone(), ASSET_ID, dest, 100000).await;
}

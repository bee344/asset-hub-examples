use subxt::{
    OnlineClient,
    config::{
        Config, DefaultExtrinsicParams, DefaultExtrinsicParamsBuilder, PolkadotConfig, SubstrateConfig, 
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

pub enum AssetHubConfig {}

impl Config for AssetHubConfig {
    type Hash = <SubstrateConfig as Config>::Hash;
    type AccountId = <SubstrateConfig as Config>::AccountId;
    type Address = <PolkadotConfig as Config>::Address;
    type Signature = <SubstrateConfig as Config>::Signature;
    type Hasher = <SubstrateConfig as Config>::Hasher;
    type Header = <SubstrateConfig as Config>::Header;
    type ExtrinsicParams = DefaultExtrinsicParams<AssetHubConfig>;
    // Here we use the MultiLocation from the metadata as a part of the config:
    // The `ChargeAssetTxPayment` signed extension that is part of the ExtrinsicParams above, now uses the type:
    type AssetId = MultiLocation;
}

// Types that we retrieve from the Metadata for our example
type MultiLocation = local::runtime_types::staging_xcm::v3::multilocation::MultiLocation;

use local::runtime_types::xcm::v3::junction::{
    NetworkId::Kusama,
    Junction::GlobalConsensus
};
use local::runtime_types::xcm::v3::junctions::Junctions::X1;

// Asset details
const ASSET_ID: MultiLocation = MultiLocation { 
    parents: 2,
    interior: X1(GlobalConsensus(Kusama))
}; 

const URI: &str = "wss://polkadot-asset-hub-rpc.polkadot.io";

// Here we make a Native asset transfer while paying the tx fees with our custom
// asset, using the `AssetConversionTxPayment` signed extension that we configured
// as `ChargeAssetTxPayment`
async fn mock_transfer_keep_alive(
    api: OnlineClient<AssetHubConfig>,
    id: MultiLocation,
    dest: MultiAddress<AccountId32, ()>,
    amount: u128,
) -> Result<(), subxt::Error> {
    let alice_pair_signer = dev::alice();

    let tx_config = DefaultExtrinsicParamsBuilder::<AssetHubConfig>::new()
        .build();

    let balance_transfer_tx = local::tx().foreign_assets().transfer_keep_alive(id, dest, amount);
        
    // Here we send the Native asset transfer and wait for it to be finalized, while
    // listening for the `AssetTxFeePaid` event that confirms we succesfully paid
    // the fees with our custom asset
    let signed_tx = api
    .tx()
    .create_signed(&balance_transfer_tx, &alice_pair_signer, tx_config)
    .await?;

    let dry_res = signed_tx.validate().await?;
     
    println!("Encoded extrinsic: 0x{}", hex::encode(signed_tx.encoded()));

    println!("{:?}", dry_res);

    Ok(())
}

#[tokio::main]
async fn main() {
    // Establish the uri of the local asset hub westend node to which we are 
    // connecting to and instantiate the api
    let api = OnlineClient::<AssetHubConfig>::from_url(URI).await.unwrap();

    let dest: MultiAddress<AccountId32, ()> = dev::bob().public_key().into();

    // Here we create and submit the native asset transfer passing the custom 
    // asset's MultiLocation to pay the fees
    let _result = mock_transfer_keep_alive(api.clone(), ASSET_ID, dest, 100000).await;
}

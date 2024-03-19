# txwrapper-examples

Examples on how to handle foreign assets with [txwrapper](https://github.com/paritytech/txwrapper-core/).

To run these examples, you must have a `Asset Hub Rococo Local` node running. To do this,
download the `polkado-parachain` binary from the [`polkadot-sdk` repo](https://github.com/paritytech/polkadot-sdk/releases/latest)
or clone it and run `cargo build --release -p polkadot-parachain-bin` and then run
`./target/release/polkadot-parachain --chain asset-hub-rococo-local`.

Once the node is running, simply cd into this directory and run `yarn build && yarn <fee|transfer>`.

# polkadot-js-examples

Examples on how to handle foreign assets with [Polkadot-JS](https://polkadot.js.org/docs/).

To run these examples, simply cd into this directory and run `yarn build && yarn <mint|burn|transfer>`.


```
[
    [
      {
        parents: 1
        interior: {
          X1: {
            Parachain: 2,123
          }
        }
      }
    ]
    {
      owner: FBeL7DhzrCPmjxvXCkC9Kzu59XFLvA5rGtQnr8FvFLubfBh
      issuer: FBeL7DhzrCPmjxvXCkC9Kzu59XFLvA5rGtQnr8FvFLubfBh
      admin: FBeL7DhzrCPmjxvXCkC9Kzu59XFLvA5rGtQnr8FvFLubfBh
      freezer: FBeL7DhzrCPmjxvXCkC9Kzu59XFLvA5rGtQnr8FvFLubfBh
      supply: 0
      deposit: 100,000,000,000
      minBalance: 1,000,000,000
      isSufficient: false
      accounts: 1
      sufficients: 0
      approvals: 0
      status: Live
    }
  ]
```
*Example of a decoded storage entry of a foreign asset with Polkadot.JS. The key of the storage entry is the XCM Location of the asset, in this case, the parachain GM in the Kusama ecosystem (para ID 2123).*

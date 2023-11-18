export const TOKENS = // process.env.NEXT_PUBLIC_NODE_ENV !== "production" ? {
//     "CELO":"0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9",
//     "WETH":"0xe07e18e1DB637B292bB07B934C9E943aB91373F3",
//     "CEUR":"0x8369B70746C39F5707d9d60ca264b6C0Deefc8aD",
//     "cUSD":"0x874069fa1eb16d44d622f2e0ca25eea172369bc1",
//     "USDC":"0x27258d7C77ccCBD988779a3Cd5BFA133dC639121",
// } : process.env.NEXT_PUBLIC_NODE_ENV == "ethereum" ? {
//     "WBTC":"0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
//     "USDC":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
//     "UNI": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
//     "SHIB": "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE"
// } :  
{
    "CELO": "0x471EcE3750Da237f93B8E339c536989b8978a438",
    "WETH": "0x66803FB87aBd4aaC3cbB3fAd7C3aa01f6F3FB207",
    "cEUR": "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73",
    "cUSD": "0x765de816845861e75a25fca122bb6898b8b1282a",
    "USDC": "0x37f750B7cC259A2f741AF45294f6a16572CF5cAd",
    "0x471EcE3750Da237f93B8E339c536989b8978a438":"CELO",
    "0x66803FB87aBd4aaC3cbB3fAd7C3aa01f6F3FB207":"WETH",
    "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73":"cEUR",
    "0x765de816845861e75a25fca122bb6898b8b1282a":"cUSD",
    "0x37f750B7cC259A2f741AF45294f6a16572CF5cAd":"USDC",
}

export const TokenIcons = {
    "WETH": "https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cETH.svg",
    "cEUR": "https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cEUR.png",
    "cUSD": "https://s2.coinmarketcap.com/static/img/coins/64x64/7236.png",
    "USDC": "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png",
    "CELO": "https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_CELO.png",
    "0x471EcE3750Da237f93B8E339c536989b8978a438": "https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_CELO.png",
    "0x66803FB87aBd4aaC3cbB3fAd7C3aa01f6F3FB207": "https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cETH.svg",
    "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73": "https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cEUR.png",
    "0x765de816845861e75a25fca122bb6898b8b1282a": "https://s2.coinmarketcap.com/static/img/coins/64x64/7236.png",
    "0x37f750B7cC259A2f741AF45294f6a16572CF5cAd": "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png",
}

export const DEFAULT_ASSETS = ["CELO", "cUSD", "cEUR", "WETH", "USDC"];
export const DEFAULT_ASSETS_DATA = [
    {
        asset: 'CELO',
        address: '',
        decimals: 18,
        balance: '0',
        type: 'native',
    },
    {
        asset: 'cUSD',
        address: '',
        decimals: 18,
        balance: '0',
        type: 'fungible',
    },
    {
        asset: 'cEUR',
        address: '',
        decimals: 18,
        balance: '0',
        type: 'fungible',
    },
    {
        asset: 'USDC',
        address: '',
        decimals: 18,
        balance: '0',
        type: 'fungible',
    }
]

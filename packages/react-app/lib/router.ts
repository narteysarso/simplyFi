import { AlphaRouter, SwapType } from '@uniswap/smart-order-router'
import { Token, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core'
import { ethers, hexlify, parseUnits} from 'ethers'
import ERC20ABI from '../constants/erc20abi.json'
import JSBI from 'jsbi'
import { DEFAULT_ASSETS_DATA, TOKENS } from '@/constants/tokens'

const V3_SWAP_ROUTER_ADDRESS = '0x5615CDAb10dc425a742d643d949a7F474C01abc4'
// const V3_SWAP_ROUTER_ADDRESS = '0x5615CDAb10dc425a742d643d949a7F474C01abc4'
// const NEXT_PUBLIC_INFURA_URL_TESTNET = process.env.NEXT_PUBLIC_INFURA_URL_TESTNET

// const chainId = 42220

// const web3Provider = new ethers.providers.JsonRpcProvider(NEXT_PUBLIC_INFURA_URL_TESTNET)
// const router = new AlphaRouter({ chainId: chainId, provider: web3Provider })

// export const getUniContract = () => new ethers.Contract(address1, ERC20ABI, web3Provider)


export const getPrice = async (params: { inToken: string, outToken: string, inputAmount: number, slippageAmount: number, deadline: number, walletAddress, provider }) => {
  const {inToken, outToken,  inputAmount, slippageAmount, deadline, walletAddress, provider } = params;
  // console.log(inputAmount, slippageAmount, deadline, walletAddress, provider);
  const chainId = (await provider.getNetwork()).chainId
  const tokenIn = new Token(chainId, TOKENS[inToken], DEFAULT_ASSETS_DATA[inToken]?.decimals || 18, inToken)
  const tokenOut = new Token(chainId, TOKENS[outToken], DEFAULT_ASSETS_DATA[outToken]?.decimals || 18, outToken)

  const router = new AlphaRouter({ chainId, provider })
  const percentSlippage = new Percent(slippageAmount, 100)

  const amountIn = parseUnits(inputAmount.toString(), tokenIn.decimals)
  const currencyAmount = CurrencyAmount.fromRawAmount(tokenIn, JSBI.BigInt(amountIn))

  // console.log(tokenIn, tokenOut);
  // console.log(router)

  const route = await router.route(
    currencyAmount,
    tokenOut,
    TradeType.EXACT_INPUT,
    {
      type: SwapType.SWAP_ROUTER_02,
      recipient: walletAddress,
      slippageTolerance: percentSlippage,
      deadline: deadline,
    }
  )

  if (!route) throw `Error: No pool ${params.tokenIn.symbol}-${params.tokenOut.symbol}`;

  // console.log('Qoute Exact In: ' + route.quote.toFixed(6));
  // console.log(route);

  const transaction = {
    data: route.methodParameters?.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: BigInt(route.methodParameters?.value),
    from: walletAddress,
    gasPrice: BigInt(route.gasPriceWei),
    gasLimit: hexlify(1000000)
  }


  const quoteAmountOut = route.quote.toFixed(6);
  const ratio = (inputAmount / quoteAmountOut).toFixed(6)

  return [
    transaction,
    quoteAmountOut,
    ratio,
    route.estimatedGasUsedUSD.toFixed(6),
  ]
}
export const getTokenBalance = async (tokenAddress, account, provider, parse = false)=> {
  const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);

  const [balance, decimals] = await Promise.all([contract.balanceOf(account), contract.decimals()]);
  return parse ? ethers.utils.formatUnits(balance, decimals) : balance;
}

export const runSwap = async (transaction, signer, tokenAddress) => {
  const approvalAmount = ethers.utils.parseUnits('10', 18).toString()
  const contract0 = new ethers.Contract(tokenAddress, ERC20ABI, signer)
  await contract0.approve(
    V3_SWAP_ROUTER_ADDRESS,
    approvalAmount
  )

  signer.sendTransaction(transaction)
}

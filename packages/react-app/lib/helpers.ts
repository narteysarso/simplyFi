import { erc20ABI } from "wagmi";
import SPLITABI from "../constants/splitabi.json";
import { ethers, Signer } from "ethers";

export function getSplitterContract(signer: Signer): ethers.Contract {
    return new ethers.Contract(process.env.NEXT_PUBLIC_SPLITTER_ADDRESS as string, SPLITABI, signer);
     
}

export function getERC20Contract (tokenAddress: string,signer: ethers.Signer): ethers.Contract{
    return new ethers.Contract(tokenAddress, erc20ABI, signer);
}

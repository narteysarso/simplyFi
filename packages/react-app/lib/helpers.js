import SPLITABI from "../constants/splitabi.json";

export function getSplitterContract(signer) {
    return new ethers.Contract(process.env.NEXT_PUBLIC_SPLITTER_ADDRESS, SPLITABI, signer);
}

import { v4 as uuidv4 } from "uuid";
import { getERC20Contract, getSplitterContract } from "../lib/helpers";
import { ethers } from "ethers";

export const createBill = async ({
    tokenAddress,
    amountDue,
    recipient,
    creator,
    items,
    tags,
    payers,
    memo,
    category,
    payToken,
    paymentDue,
    signer
}) => {

    try {
        // TODO: 
        // create txn
        const splitContract = getSplitterContract(signer)

        // send txn
        const txn = await splitContract.createBill(amount_due, tokenAddress, paymentDue, recipient, creator, payers);

        // store on db
        const txnHash = uuidv4();
        const result = await fetch("/api/store", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                tokenAddress,
                amountDue,
                recipient,
                creator,
                items,
                tags,
                payers,
                memo,
                category,
                payToken,
                txnHash,
                paymentDue,
            })
        });

        if (!result.ok) {
            throw Error("request failed");
        }

        const res = await result.json();

        return res;

    } catch (error) {

        console.log(error);
    }

}


export const getPays = async ({ debtorAddress }) => {
    // TODO:
    // read bills from db
    const response = await fetch(`/api/store?payer=${debtorAddress}`);

    if (!response.ok) {
        throw Error("request failed");
    }

    const res = await response.json();

    return res;

}

export const payBill = async (params: { billId: number , amount: string, payTokenAddress: string, payerAddress: string, signer: ethers.Signer }) => {
    const {billId, amount, payTokenAddress, payerAddress, signer} = params;
    // TODO:
    // approve amount
    const splitContract = getSplitterContract(signer);
    const tokenContract =  getERC20Contract(payTokenAddress, signer);
    const decimals = await tokenContract.decimals();
    const approveTxn = await tokenContract.approve(process.env.NEXT_PUBLIC_SPLITTER_ADDRESS, ethers.utils.parseUnits(amount, decimals));
    await approveTxn.wait();
    // estimate pool fee
    const fee = 0;
    // transfer to smart contract
    const payTxn = await splitContract.payDebt(payTokenAddress, payerAddress, fee, amount, billId )

    await payTxn.wait();

    // update bill record on db.payer
    
}

export const getBills = async ({ creatorAddress }) => {
    //TODO:
    // read created bills from db.bills
    const response = await fetch(`/api/store?bills=${creatorAddress}`);
    // console.log(response);
    if (!response.ok) {
        throw Error("request failed");
    }

    const res = await response.json();

    return res;
}

export const getBillsWithTxnhash = async({txnHash}) =>{
    const response = await fetch(`/api/store?billHash=${txnHash}`);

    if (response.status != 200) {
        throw Error("request failed");
    }

    const res = await response.json();

    return res;
}
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
    paymentDue = Math.floor(Date.now()/1000),
    signer
}) => {
        // TODO: 
        // create txn
        const splitContract = getSplitterContract(signer);
        
        const tokenContract = getERC20Contract(tokenAddress, signer);
        const decimals = 18 //await tokenContract.decimals();

        const _amountDue = ethers.utils.parseUnits(amountDue.toString(), decimals ).toString();

        const _payers = payers.reduce((prev, payer, idx) => {
            const amount = ethers.utils.parseUnits(payer.amount.toString(), decimals).toString();
            return [[...prev[0],{...payer, amount }], [...prev[1],[payer.account, amount]]];
        }, [[],[]])

        const _items = items.map(item => ({...item, amount: ethers.utils.parseUnits(item.amount, decimals).toString()}))

        // send txn
        const txn = await splitContract.createBill(_amountDue, tokenAddress, paymentDue.toString(), recipient, creator, _payers[1]);

        const txnd = await txn.wait();

        const billId = ((await splitContract._billIndex()) - 3).toString();
        // store on db
        const txnHash = txnd.transactionHash;
        const result = await fetch("/api/store", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                tokenAddress,
                billId,
                amountDue: _amountDue,
                recipient,
                creator,
                items: _items,
                tags,
                payers: _payers[0],
                memo,
                category,
                payToken,
                txnHash,
                paymentDue,
                tokenDecimal: decimals
            })
        });

        if (!result.ok) {
            throw Error("request failed");
        }

        const res = await result.json();

        return res;

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

    if (!response.ok) {
        throw Error("request failed");
    }

    const res = await response.json();

    return (res);
}

export const swap = async(params = {fromToken: string, amount: string,  signer: ethers.Signer, txnData: Object}) => {
    const {amount, fromToken, signer, txnData} = params;
    const tokenContract = getERC20Contract(fromToken, signer);
    const decimals = await tokenContract.decimals();

    const approve = await tokenContract.approve(txnData.to, ethers.utils.parseUnits(amount, decimals));
    
    await approve.wait();

    const txn = await signer.sendTransaction(txnData)

    const result = await txn.wait();
}
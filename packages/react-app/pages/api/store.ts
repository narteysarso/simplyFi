import { polybase } from "@/lib/db"
import type { NextApiRequest, NextApiResponse } from "next"


const db = polybase();

// type ItemData = {
//     id: string;
//     description: string;
//     quantity: number;
//     cost: string;
//     amount: string;
//     txnHash: string;
//     createdAt: number;
// }

// type PayerData = {
//     id: string;
//     account: string;
//     amount: string;
//     amountPaid: string;
//     tokenAddress: string;
//     status: number;
//     txnHash: string;
//     createdAt: number;
// }

// type CreateBillData = {
//     id: string;
//     txnHash: string;
//     recipient: string;
//     tokenAddress: string;
//     category: string;
//     tags: string[];
//     items: ItemData[];
//     amountDue: string;
//     amountPaid: string;
//     payers: PayerData[];
//     memo: string;
//     creator: string;
//     createdAt?: number;
//     paymentDue?: number;
// }

type ResponseObject  = {status: number, data: any}

async function createBill(reqData: any): Promise<ResponseObject> {
    const {
        tokenAddress,
        amountDue,
        recipient,
        creator,
        items,
        tags,
        payers,
        memo,
        category,
        txnHash,
        paymentDue,
    } = reqData;

    const resp = await db.createBill({ items, payers, tokenAddress, amountDue, memo, category, creator, tags, recipient, txnHash, paymentDue });

    return Object.freeze({
        status: 200,
        data: resp
    })
}

async function getPayers(payerAddress: string): Promise<ResponseObject> {
    if (!payerAddress) return Object.freeze({
        status: 201,
        data: []
    })

    const resp = await db.findPayer({ field: "account", value: payerAddress });

    return Object.freeze({
        status: 200,
        data: resp
    })
}

async function getBills(creatorAddress: string): Promise<ResponseObject> {
    if (!creatorAddress) return Object.freeze({
        status: 201,
        data: []
    })

    const resp = await db.findBill({ field: "creator", value: creatorAddress });

    return Object.freeze({
        status: 200,
        data: resp
    })
}
async function getBillByHash(txnHash: string): Promise<ResponseObject> {
    if (!txnHash) return Object.freeze({
        status: 201,
        data: []
    })

    const resp = await db.findBill({ field: "txnHash", value: txnHash });

    return Object.freeze({
        status: 200,
        data: resp
    })
}

export default async function handler(req: NextApiRequest,
    res: NextApiResponse) {
    try {
        switch (req.method) {
            case "POST":
                const billResult = await createBill(req.body);
                res.status(billResult.status).json(billResult.data);
                break;
            case "GET":
                const { query: {payer, bills, billHash} } = req;
                const result = (payer) ? await getPayers(payer as string)
                     : (bills) ? await getBills(bills as string)
                     :  await getBillByHash(billHash as string);
                res.status(result.status).json(result.data);
            default:
                res.status(500).json({data: [], message: "Unkown request"});
                break;
        }
    } catch (error: any) {
        res.status(400).send(error.message);
    }

}
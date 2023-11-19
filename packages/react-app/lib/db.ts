import { Polybase } from "@polybase/client";
import { v4 as uuidv4 } from "uuid";

export const polybase = () => {

    const tablename = process.env.NEXT_PUBLIC_POLYBASE_NAMESPACE;

    // TODO: make db private
    const db = new Polybase({
        defaultNamespace: tablename,
    });

    const createBill = async ({
        collection = "Bills",
        id,
        txnHash,
        recipient,
        payToken,
        tokenAddress,
        category,
        creator,
        tags,
        items,
        amountDue,
        payers,
        memo,
        paymentDue = Date.now(),
        createdAt = Date.now()
    }) => {

        
        // needs to be replaced with real txn Hash
        const {itemIds, itemData} = items.reduce((prev, { description, quantity, unitcost, amount }, idx ) => {

            const itemId = uuidv4();
            const itemData = db.collection("Item").create([
                itemId,
                description,
                quantity,
                unitcost,
                amount,
                txnHash,
                createdAt
            ]);
            return ({itemIds: [...prev.itemIds, itemId], itemData: [...prev.itemData, itemData]})
        }, {itemIds: [], itemData: []})
        
        // await Promise.all([]);

        const {payerIds, payerData} = payers.reduce((prev, { account, amount }, idx) => {

            const payerId = uuidv4();
            const payerData =  db.collection("Payer").create([
                payerId,
                account,
                amount,
                tokenAddress,
                txnHash,
                createdAt,
                paymentDue
            ])

            return ({payerIds: [...prev.payerIds, payerId], payerData: [...prev.payerData, payerData]});

        }, {payerIds: [], payerData: []})

        await Promise.all([...itemData, ...payerData]);

        // console.log(payerIds,itemIds);

        const billRecord = await db.collection(collection).create([
            uuidv4(),
            txnHash,
            recipient,
            creator,
            tokenAddress,
            category,
            memo,
            amountDue,
            payerIds.map((payerId) => db.collection("Payer").record(payerId)),
            tags,
            itemIds.map((itemId) => db.collection("Item").record(itemId)),
            createdAt,
            paymentDue
        ]);

        return billRecord;
    }



    const find = async ({ collection = "Bills", field = "", value = "", op = "==" }) => {
        const results = await db.collection(collection).where(field, op, value).get();
        return results;
    }

    const findAll = async ({ collection = "Bills" }) => {
        const results = await db.collection(collection).get();
        return results;
    }

    const findById = async ({ collection = "Bills", id }) => {
        const results = await db.collection(collection).record(id).get();
        return results;
    }

    const findPayer = async ({ collection = "Payer", field = "", value = "", op = "==" }) => {
        const {data}= await db.collection(collection).where(field, op, value).sort("createdAt", "desc").get();
        
        return data.map(({data}) => data);
    }

    const findBill = async ({ collection = "Bills", field = "", value = "", op = "==" }) => {
        const {data}= await db.collection(collection).where(field, op, value)
        // .sort("createdAt", "desc")
        .get();
        
        return data.map(({data}) => data);
    } 

    const updatePayer = async ({ collection = "Payer", id, ...updateInfo }) => {
        const {
            txnHash,
            account,
            amount,
            amountPaid,
            tokenAddress,
            status,
            createdAt
        } = updateInfo;

        const recordData = await db.collection(collection)
            .record(id)
            .call("update", [
                account,
                amount,
                amountPaid,
                tokenAddress,
                status,
                txnHash,
                createdAt
            ]);

        return recordData;
    }

    const updateBill = async ({ collection = "Bills", id, ...updateInfo }) => {
        const {
            txnHash,
            publicKey,
            recipient,
            payToken,
            category,
            tags,
            itemData,
            amountDue,
            payerData,
            memo,
            createdAt
        } = updateInfo;

        const recordData = await db.collection(collection)
            .record(id)
            .call("update", [
                txnHash,
                publicKey,
                recipient,
                payToken,
                category,
                tags,
                itemData,
                amountDue,
                payerData,
                memo,
                createdAt
            ]);

        return recordData;
    }

    return Object.freeze({
        getTablename: () => tablename,
        createBill,
        findById,
        find,
        findAll,
        findPayer,
        findBill,
        updatePayer,
        updateBill
    });


}

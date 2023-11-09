const { Polybase } = require("@polybase/client");

const polybase = () => {

    const tablename = process.env.NEXT_PUBLIC_POLYBASE_NAMESPACE;

    // TODO: make db private
    const db = new Polybase({
        defaultNamespace: tablename
    });

    const insert = async ({
        collection = "Bills",
        id,
        txnHash,
        publicKey,
        recipient,
        payToken,
        category,
        tags,
        items,
        amountDue,
        payers,
        memo,
        createdAt
    }) => {
        const { data: itemData } = await db.collection("Item").create(txnHash).set(items);

        const { data: payerData } = await db.collection("Payer").create(txnHash).set(payers);

        const { data } = await db.collection(collection).create(id).set({
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
        });

        return data;
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

    const updatePayer = async ({ collection = "Payer", id, ...updateInfo }) => {
        const {
            txnHash,
            account,
            amount,
            amountPaid,
            status,
            createdAt
        } = updateInfo;

        const recordData = await db.collection(collection)
            .record(id)
            .call("update", [
                txnHash,
                account,
                amount,
                amountPaid,
                status,
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
        insert,
        findById,
        find,
        findAll,
        update
    });


}

module.exports = polybase;
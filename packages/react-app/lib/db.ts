const { Polybase } = require("@polybase/client");
require("dotenv").config({ path: ".env" });

const polybase = () => {

    const tablename = process.env.POLYBASE_NAMESPACE;

    // TODO: make db private
    const db = new Polybase({
        defaultNamespace: tablename
    });

    const insert = async ({
        collection = "Bill",
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
        const { data: itemData } = await db.collection("Item").create(items);

        const { data: payerData } = await db.collection("Payer").create(payers);

        const { data } = await db.collection(collection).create([
            id,
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

        return data;
    }


    const find = async ({ collection = "Bill", field = "", value = "", op = "==" }) => {
        const results = await db.collection(collection).where(field, op, value).get();
        return results;
    }

    const findAll = async ({ collection = "Bill" }) => {
        const results = await db.collection(collection).get();
        return results;
    }

    const findById = async ({ collection = "Bill", id }) => {
        const results = await db.collection(collection).record(id).get();
        return results;
    }

    const findByPhonenumber = async ({ collection = "Bill", phonenumber }) => {
        const result = (await find({ collection, field: "phonenumber", value: phonenumber, op: "==" })).data[0];
        return result?.data;
    }

    const findLangByPhonenumber = async ({ collection = "Bill", phonenumber }) => {
        const { data } = (await find({ collection, field: "phonenumber", value: phonenumber, op: "==" })).data[0];

        return data["lang"];
    }

    const update = async ({ collection = "Bill", id, ...updateInfo }) => {
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
        findByPhonenumber,
        findLangByPhonenumber,
        find,
        findAll,
        update
    });


}

module.exports = polybase;
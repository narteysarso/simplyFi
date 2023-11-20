import React, { useEffect, useMemo, useState } from "react";
import {
    Avatar,
    Button,
    Descriptions,
    Divider,
    List,
    Modal,
    Space,
    Tabs,
    Select,
    Tag,
    Form,
    Input,
    Typography,
    Tooltip,
    message,
} from "antd";
import { useAccount } from "wagmi";
import { getBills, getBillsWithTxnhash, getPays } from "../lib/transactions";
import { FormModal } from "../components/Invoice";
import { DEFAULT_ASSETS, TOKENS, TokenIcons } from "@/constants/tokens";
import { getPrice, getTokenBalance } from "@/lib/router";
import { getSigner, useEthersProvider } from "@/lib/ethers";
import { ethers } from "ethers";

const { Option } = Select;

const BillList = ({ bills = [], loadingBills = false, error = null }) => {
    const [billDetails, setBillDetails] = useState(null);

    return (
        <>
            <BillDetails
                show={billDetails}
                data={billDetails}
                onClose={() => setBillDetails(null)}
            />
            <List
                loading={loadingBills}
                dataSource={bills}
                renderItem={(item, idx) => (
                    <List.Item key={idx}>
                        <List.Item.Meta
                            avatar={
                                <Avatar src={TokenIcons[item?.tokenAddress]} />
                            }
                            title={
                                <Space>
                                    <b>{`${item?.memo[0]?.toUpperCase()}${item?.memo?.substr(
                                        1
                                    )}`}</b>
                                    <Space size={"small"}>
                                        {item?.tags.map((tag, idx) => (
                                            <Tag key={idx}>#{tag}</Tag>
                                        ))}
                                    </Space>
                                </Space>
                            }
                            description={
                                <Space>
                                    <>
                                        Amount Due:
                                        {item?.tokenDecimal ? ethers.utils.formatUnits(item?.amountDue, item.tokenDecimal).toString() : item?.amountDue}
                                    </>
                                    <Divider type="vertical" />
                                    <b>Amount Paid: {item?.amountPaid ? ethers.utils.formatUnits(item?.amountPaid, item.tokenDecimal).toString() : item?.amountPaid}</b>
                                </Space>
                            }
                        />
                        <div>
                            <Button
                                type="link"
                                onClick={() => setBillDetails(item)}
                            >
                                View Details
                            </Button>
                        </div>
                    </List.Item>
                )}
            />
        </>
    );
};

const PayList = ({ loadingPays = false, data = [], error = null }) => {
    const [payDetails, setPayDetails] = useState(null);
    return (
        <>
            {payDetails && (
                <PayBill
                    show={payDetails}
                    data={payDetails}
                    onClose={() => setPayDetails(null)}
                />
            )}
            <List
                dataSource={data}
                loading={loadingPays}
                renderItem={(item, idx) => (
                    <List.Item key={idx}>
                        <List.Item.Meta
                            avatar={
                                <Avatar src={TokenIcons[item?.tokenAddress]} />
                            }
                            title={
                                <Space>
                                    <b>{`${item?.memo[0]?.toUpperCase()}${item?.memo?.substr(
                                        1
                                    )}`}</b>
                                    <Space size={"small"}>
                                        {item?.tags.map((tag, idx) => (
                                            <Tag key={idx}>#{tag}</Tag>
                                        ))}
                                    </Space>
                                </Space>
                            }
                            description={
                                <Space>
                                    <>
                                    Amount Due:
                                        {item?.tokenDecimal ? ethers.utils.formatUnits(item?.amountDue, item.tokenDecimal).toString() : item?.amountDue}
                                    </>
                                    <Divider type="vertical" />
                                    <b>Amount Paid: {item?.amountPaid ? ethers.utils.formatUnits(item?.amountPaid, item.tokenDecimal).toString() : item?.amountPaid}</b>
                                </Space>
                            }
                        />
                        <div>
                            {parseFloat(item?.amountPaid) <
                            parseFloat(item?.amount) ? (
                                <Button
                                    type="link"
                                    onClick={() => setPayDetails(item)}
                                >
                                    Pay
                                </Button>
                            ) : (
                                <Tag color="green">Paid</Tag>
                            )}
                        </div>
                    </List.Item>
                )}
            />
        </>
    );
};

const BillDetails = ({ show = false, data, onClose = () => {} }) => {
    const items = useMemo(() => {
        if (!data) return [];
        const {
            amountDue,
            amountPaid,
            category,
            createdAt,
            recipient,
            paymentDue,
            creator,
            txnHash,
            tokenAddress,
            tokenDecimal,
            tags,
            memo,
        } = data;
        return [
            {
                key: 9,
                label: "Pay Token",
                children: (
                    <Space>
                        <Avatar src={TokenIcons[tokenAddress]} />
                        {TOKENS[tokenAddress]}{" "}
                    </Space>
                ),
            },
            { key: 1, label: "Amount Due", children: tokenDecimal ? ethers.utils.formatUnits(amountDue, tokenDecimal).toString() : amountDue },
            { key: 2, label: "Amount Paid", children: tokenDecimal ? ethers.utils.formatUnits(amountPaid, tokenDecimal).toString() : amountPaid },
            { key: 3, label: "Category", children: category },
            {
                key: 4,
                label: "Created At",
                children: new Date(createdAt).toLocaleDateString(),
            },
            {
                key: 5,
                label: "Recipient",
                children: (
                    <a
                        target="_blank"
                        href={`https://celoscan.io/address/${recipient}`}
                    >
                        {recipient.substr(1, 4)}...{recipient.substr(36)}
                    </a>
                ),
            },
            // {key: 6, label: "Payment Due", children: (new Date(paymentDue)).toLocaleDateString()},
            {
                key: 7,
                label: "Creator",
                children: (
                    <a
                        target="_blank"
                        href={`https://celoscan.io/address/${recipient}`}
                    >
                        {creator.substr(1, 4)}...{creator.substr(36)}
                    </a>
                ),
            },
            {
                key: 8,
                label: "Txn Hash",
                children: (
                    <a
                        target="_blank"
                        href={`https://celoscan.io/address/${recipient}`}
                    >
                        {txnHash.substr(1, 4)}...{txnHash.substr(30)}
                    </a>
                ),
            },
            {
                key: 10,
                label: "Tags",
                children: <Space size={"small"} wrap>{tags.map((tag, idx) => <Tag key={idx}>{tag}</Tag>)}</Space>,
            },
            { key: 11, label: "Memo", children: memo },
        ];
    }, [data]);

    return (
        <Modal open={show} onCancel={() => onClose()}>
            <Descriptions
                title={`${data?.memo[0]?.toUpperCase()}${data?.memo?.substr(
                    1
                )}`}
                layout="vertical"
                items={items}
            />
        </Modal>
    );
};

const FromSelector = ({ allTokens, defaultValue, onChange }) => (
    <Select
        showSearch
        defaultValue={defaultValue}
        // style={{ minWidth: "50vw" }}
        onChange={onChange}
    >
        {allTokens?.map((tk, idx) => (
            <Option key={idx} value={tk}>
                <Avatar
                    size={24}
                    style={{ backgroundColor: "whitesmoke" }}
                    src={TokenIcons[tk]}
                />
                {tk}
            </Option>
        ))}
    </Select>
);

const ToSelector = ({ allTokens, defaultValue, value, onChange }) => (
    <Select
        showSearch
        defaultValue={defaultValue}
        // style={{ minWidth: "50vw" }}
        disabled={true}
        onChange={onChange}
        value={value}
    >
        {allTokens?.map((tk, idx) => (
            <Option key={idx} value={tk}>
                <Avatar
                    size={24}
                    style={{ backgroundColor: "whitesmoke" }}
                    src={TokenIcons[tk]}
                />
                {tk}
            </Option>
        ))}
    </Select>
);

const PayBill = ({ show = false, data = {}, onClose = () => {} }) => {
    const tokens = Object.keys(TOKENS);
    const [tokenBalances, setTokenBalances] = useState([0, 0]);
    const [autoSpillage, setAutoSpillage] = useState(true);
    const [txnData, setTxnData] = useState();
    const [form] = Form.useForm();
    const [loadingQoute, setLoadingQoute] = useState(false);
    const [qoute, setQoute] = useState(0);
    const [ratio, setRatio] = useState(0);
    const [spillage, setSpillage] = useState(0.5);
    const [swapFee, setSwapFee] = useState(0);
    const { isConnected, address } = useAccount();
    const signer = useMemo(async() => await getSigner(address as string), [address])
    const {
        amountDue,
        amountPaid,
        category,
        createdAt,
        recipient,
        paymentDue,
        creator,
        txnHash,
        tokenAddress,
        tokenDecimal,
        tags,
        memo,
    } = useMemo(() => data || {}, [data]);

    const [selectedTokens, setSelectedToken] = useState([
        DEFAULT_ASSETS[0],
        TOKENS[tokenAddress],
    ]);

    const onFromTokenChange = (newtoken) => {
        setSelectedToken((prev) => [newtoken, newtoken]);
    };

    const onToTokenChange = (newtoken) => {
        setSelectedToken((prev) => [prev.at(0), newtoken]);
    };

    const getQoute = async (
        tokenA: string,
        tokenB: string,
        amountIn: number
    ) => {
        try {
            // console.log(tokenA, tokenB, amountIn);
            setLoadingQoute(true);
            if (!amountIn) return;
            if (tokenA === tokenB) {
                setQoute(amountIn);
                form.setFieldValue("output", amountIn);
                setRatio(1);
                // setNetworkCost(0);
                setTxnData(null);
                return;
            }
            const [transaction, quoteAmountOut, ratio, networkCost] =
                await getPrice({
                    inToken: tokenA,
                    outToken: tokenB,
                    inputAmount: amountIn,
                    slippageAmount: 5,
                    deadline: Math.floor(Date.now() / 1000 + 5 * 60),
                    walletAddress: address,
                    signer,
                });

            setQoute(quoteAmountOut);
            form.setFieldValue("output", quoteAmountOut);
            setRatio(ratio);
            // setNetworkCost(networkCost);
            setTxnData(transaction);
        } catch (error) {
            message.error(error.message)
            //console.log(error);
        } finally {
            setLoadingQoute(false);
        }
    };

    const getCurrentBalances = async () => {
        return await Promise.all([
            getTokenBalance(TOKENS[selectedTokens[0]], address, signer, true),
            getTokenBalance(TOKENS[selectedTokens[1]], address, signer, true),
        ]);
    };

    useEffect(() => {
        if (!address || !isConnected) return;
        getCurrentBalances().then(([balance1, balance2]) => {
            setTokenBalances([balance1.toString(), balance2.toString()]);
        });
        getQoute(
            selectedTokens[0],
            selectedTokens[1],
            form.getFieldValue("input")
        )
            .then(() => {})
            .catch((err) => message.error(err.message));
        // console.log("ccall");
    }, [selectedTokens, isConnected, address]);

    return (
        <Modal
            title={`Bill Payment: ${memo}`}
            open={show}
            confirmLoading={loadingQoute}
            okText={"Approve Payment"}
            okType="default"
            onCancel={() => onClose()}
            onOk={() => {}}
        >
            <Form
                form={form}
                name="pay-bill-form"
                fields={[{ name: "recipient", value: recipient }]}
                onValuesChange={async (val) => {
                    await getQoute(
                        selectedTokens[0],
                        selectedTokens[1],
                        parseFloat(val?.input || 0)
                    );
                }}
            >
                <Form.Item label="Recipient" name="recipient">
                    <Input size="large" disabled />
                </Form.Item>
                <Form.Item
                    label="Sent Token"
                    name="input"
                    initialValue={0}
                    hasFeedback
                    validateStatus={loadingQoute ? "validating" : "success"}
                >
                    <Input
                        type="number"
                        size="large"
                        addonBefore={
                            <FromSelector
                                allTokens={tokens}
                                defaultValue={selectedTokens[0]}
                                onChange={onFromTokenChange}
                            />
                        }
                    />
                </Form.Item>
                <Typography.Paragraph style={{ textAlign: "end" }}>
                    Balance: {tokenBalances[0]} {selectedTokens[0]}
                </Typography.Paragraph>

                <Form.Item
                    label="Recieving Token"
                    name="output"
                    initialValue={0}
                    hasFeedback
                    validateStatus={
                        loadingQoute
                            ? "validating"
                            : parseFloat(amountDue) >=
                              parseFloat(form.getFieldValue("output"))
                            ? "warning"
                            : "success"
                    }
                >
                    <Tooltip
                        title={
                            parseFloat(amountDue) >=
                            parseFloat(form.getFieldValue("output"))
                                ? "Unsufficient amount"
                                : ""
                        }
                    >
                        <Input
                            type="number"
                            size="large"
                            value={qoute}
                            disabled={true}
                            addonBefore={
                                <ToSelector
                                    allTokens={tokens}
                                    defaultValue={selectedTokens[1]}
                                    onChange={onToTokenChange}
                                />
                            }
                        />
                    </Tooltip>
                </Form.Item>
                <Space size={"large"} align="baseline">
                   
                       <b> Amount Due: {tokenDecimal ? ethers.utils.formatUnits(amountDue, tokenDecimal).toString() : amountDue} {selectedTokens[1]}</b>
                    
                    <Typography.Paragraph>
                        1 {selectedTokens[1]} = {ratio} {selectedTokens[0]}
                    </Typography.Paragraph>
                </Space>
            </Form>
        </Modal>
    );
};

const Bills: React.FC = () => {
    const [bills, setBills] = useState([]);
    const [loadingBills, setLoadingBills] = useState(false);
    const [billError, setBillError] = useState(null);
    const [payers, setPayers] = useState([]);
    const [loadingPays, setLoadingPays] = useState(false);
    const [error, setError] = useState(null);
    const { address } = useAccount();

    useEffect(() => {
        // get invoices
        (async () => {
            try {
                setLoadingBills(true);
                setBillError(null);
                if (!address) return;
                const bills = await getBills({ creatorAddress: address });
                // console.log(bills);
                setBills(bills);
            } catch (error) {
                // console.log(error);
                setBillError(error.message);
            } finally {
                setLoadingBills(false);
            }
        })();

        // get bills
        (async () => {
            try {
                setLoadingPays(true);
                if (!address) return;
                const payers = await getPays({ debtorAddress: address });
                // console.log(payers);
                // const bills = await Promise.all(payers.map(payer => getBillsWithTxnhash({txnHash: payer?.txnHash})));
                const payerBills = await payers.reduce(
                    async (prev, payer, idx: number) => {
                        
                        const [bill] = await getBillsWithTxnhash({txnHash: payer?.txnHash});

                        if (!bill) return prev;

                        return [...await prev, { ...bill, ...payer }];
                    },
                    []
                );

                // setBills(payerBills);
                // console.log(payerBills);
                setPayers(payerBills);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoadingPays(false);
            }
        })();
    }, [address]);

    const items = [
        {
            key: "1",
            label: "Bills",
            children: <PayList data={payers} loadingPays={loadingPays} />,
        },
        {
            key: "2",
            label: "Invoices",
            children: (
                <BillList
                    bills={bills}
                    loadingBills={loadingBills}
                    error={billError}
                />
            ),
        },
    ];

    return (
        <Tabs
            tabBarExtraContent={<FormModal />}
            defaultActiveKey="1"
            items={items}
        />
    );
};

export default Bills;

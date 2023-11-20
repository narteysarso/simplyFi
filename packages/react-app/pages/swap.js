import { useEffect, useMemo, useState } from "react";
import {
    Form,
    Cascader,
    Input,
    Select,
    Space,
    Image,
    Avatar,
    Divider,
    Button,
    Card,
    Switch,
    Collapse,
    Row,
    Col,
    Tag,
    Typography,
} from "antd";
import { DEFAULT_ASSETS, TOKENS, TokenIcons } from "../constants/tokens";
import { LoadingOutlined, SwapOutlined } from "@ant-design/icons";
import { useAccount } from "wagmi";
import { getPrice, getTokenBalance } from "@/lib/router";
import { swap } from "@/lib/transactions";

const { Option } = Select;

const FromSelector = ({
    allTokens,
    defaultValue,
    selectedToken = [],
    onChange,
}) => (
    <Select
        showSearch
        defaultValue={defaultValue}
        style={{ minWidth: "50vw" }}
        onChange={onChange}
    >
        {allTokens?.map((tk, idx) => (
            <Option key={idx} disabled={selectedToken.includes(tk)} value={tk}>
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

const ToSelector = ({
    allTokens,
    defaultValue,
    selectedToken = [],
    onChange,
}) => (
    <Select
        showSearch
        defaultValue={defaultValue}
        style={{ minWidth: "50vw" }}
        onChange={onChange}
    >
        {allTokens?.map((tk, idx) => (
            <Option key={idx} disabled={selectedToken.includes(tk)} value={tk}>
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

const tokens = Object.keys(TOKENS);

export default function Swap() {
    const [selectedTokens, setSelectedToken] = useState([
        DEFAULT_ASSETS[0],
        DEFAULT_ASSETS[1],
    ]);
    const [tokenBalances, setTokenBalances] = useState([0, 0]);
    const [autoSpillage, setAutoSpillage] = useState(true);
    const [qouteData, setQouteData] = useState();
    const [loadingQoute, setLoadingQoute] = useState(false);
    const [qoute, setQoute] = useState(0);
    const [ratio, setRatio] = useState(0);
    const [spillage, setSpillage] = useState(0.5);
    const [swapFee, setSwapFee] = useState(0);
    const [networkCost, setNetworkCost] = useState(0);
    const { isConnected, address } = useAccount();
    const [form] = Form.useForm();
    const signer = useMemo(async () => {
        if (!window.ethereum) return null;

        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner(address);

        return signer;
    }, [address]);

    // const onFromTokenChange = (newtoken) => {
    //     setSelectedToken((prev) => [newtoken, prev.at(1)]);
    // };

    // const onToTokenChange = (newtoken) => {
    //     setSelectedToken((prev) => [prev.at(0), newtoken]);
    // };

    // const getQoute = async (
    //     tokenA,
    //     tokenB,
    //     amountIn,
    // ) => {
    //     try {

    //         setLoadingQoute(true);
    //         const [transaction, quoteAmountOut, ratio, networkCost] =
    //             await getPrice({
    //                 inToken: tokenA,
    //                 outToken: tokenB,
    //                 inputAmount: amountIn,
    //                 slippageAmount: 5,
    //                 deadline: Math.floor(Date.now() / 1000 + 5 * 60),
    //                 walletAddress: address,
    //                 signer,
    //             });
    //         setQoute(quoteAmountOut);
    //         form.setFieldValue("output", quoteAmountOut);
    //         setRatio(ratio);
    //         setNetworkCost(networkCost);
    //         setTxnData(transaction);
    //     } catch (error) {
    //     } finally {
    //         setLoadingQoute(false);
    //     }
    // };

    // const getCurrentBalances = async () => {
    //     return await Promise.all([
    //         getTokenBalance(TOKENS[selectedTokens[0]], address, signer, true),
    //         getTokenBalance(TOKENS[selectedTokens[1]], address, signer, true),
    //     ]);
    // };

    // useEffect(() => {
    //     if (!address || !isConnected) return;
    //     getCurrentBalances().then(([balance1, balance2]) => {
    //         setTokenBalances([balance1.toString(), balance2.toString()]);
    //     });

    //     if(form.getFieldValue("input") > 0)
    //     getQoute(selectedTokens[0], selectedTokens[1], form.getFieldValue("input"))
    // }, [selectedTokens, address]);


    return ("hi there1");

    return (
        <Card title="Swap">
            <Form
                form={form}
                name="swap-tokens-form"
                onFinish={async (values) => {
                    // await swap({txnData, signer,  amount: values?.input || 0, fromToken: TOKENS[selectedTokens[0]]})
                }}
                onValuesChange={async (val) => {
                    // await getQoute(
                    //     selectedTokens[0],
                    //     selectedTokens[1],
                    //     parseFloat(val?.input || 0)
                    // )
                }
                }
            >
                <Form.Item name="input" initialValue={0}>
                    <Input
                        type="number"
                        size="large"
                        addonBefore={
                            <FromSelector
                                allTokens={tokens.slice(0, 5)}
                                defaultValue={selectedTokens[0]}
                                selectedToken={selectedTokens}
                                onChange={onFromTokenChange}
                            />
                        }
                    />
                </Form.Item>
                <Typography.Paragraph style={{ textAlign: "end" }}>
                    Balance: {tokenBalances[0]} {selectedTokens[0]}
                </Typography.Paragraph>
                {/* <Divider>
                    <Button
                        shape="circle"
                        size="large"
                        icon={<SwapOutlined style={{ rotate: "90deg" }} />}
                    />
                </Divider>
                <Form.Item name="output" initialValue={0}>
                    <Input
                        type="number"
                        size="large"
                        value={qoute}
                        addonBefore={
                            <ToSelector
                                allTokens={tokens.slice(0,5)}
                                defaultValue={selectedTokens[1]}
                                selectedToken={selectedTokens}
                                onChange={onToTokenChange}
                            />
                        }
                    />
                </Form.Item>
                <Typography.Paragraph style={{ textAlign: "end" }}>
                    Balance: {tokenBalances[1]} {selectedTokens[1]}
                </Typography.Paragraph>
                {(ratio > 0 || loadingQoute) && (
                    <Collapse>
                        <Collapse.Panel
                            header={
                                loadingQoute ? (
                                    <LoadingOutlined />
                                ) : (
                                    <Typography.Title level={5}>
                                        1 {selectedTokens[1]} = {ratio}{" "}
                                        {selectedTokens[0]}
                                    </Typography.Title>
                                )
                            }
                        >
                            <Row>
                                <Col span={12}>Price impact</Col>
                                <Col
                                    span={12}
                                    style={{
                                        textAlign: "end",
                                        fontWeight: "bold",
                                    }}
                                >
                                    0.06%
                                </Col>
                            </Row>
                            <Row>
                                <Col span={12}>Max. Spillage</Col>
                                <Col
                                    span={12}
                                    style={{
                                        textAlign: "end",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {autoSpillage && <Tag>auto</Tag>} {spillage}
                                    %
                                </Col>
                            </Row>
                            <Row>
                                <Col span={12}>Fee</Col>
                                <Col
                                    span={12}
                                    style={{
                                        textAlign: "end",
                                        fontWeight: "bold",
                                    }}
                                >
                                    ${swapFee}
                                </Col>
                            </Row>
                            <Row>
                                <Col span={12}>Network cost</Col>
                                <Col
                                    span={12}
                                    style={{
                                        textAlign: "end",
                                        fontWeight: "bold",
                                    }}
                                >
                                    <Avatar src={TokenIcons["cUSD"]} />{" "}
                                    {networkCost < 0.01
                                        ? "<$0.01"
                                        : "$" + networkCost.toFixed(3)}
                                </Col>
                            </Row>
                            <Divider />
                            <Row>
                                <Col span={12}>Order routing</Col>
                                <Col
                                    span={12}
                                    style={{
                                        textAlign: "end",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Uniswap API
                                </Col>
                            </Row>
                        </Collapse.Panel>
                    </Collapse>
                )}
                <Divider>Transaction Settings</Divider>
                <Form.Item label="Spillage Tolerance">
                    <Space align="baseline">
                        <Form.Item name="spillage" initialValue={spillage}>
                            <Input disabled addonAfter="%" />
                        </Form.Item>
                        <Switch checked={autoSpillage} /> Auto
                    </Space>
                </Form.Item>
                <Form.Item
                    label="Transaction Deadline"
                    name="txn_deadline"
                    initialValue={20}
                >
                    <Input addonAfter="minutes" />
                </Form.Item>
                <Form.Item
                    style={{ justifyContent: "flex-end", display: "flex" }}
                >
                    <Button htmlType="submit" disabled={!isConnected}>
                        Swap
                    </Button>
                </Form.Item> */}
            </Form>
        </Card>
    );
}

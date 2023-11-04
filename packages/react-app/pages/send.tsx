import { useEffect, useState } from "react";
import {
    Form,
    Input,
    Select,
    Space,
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
import { useEthersProvider, useEthersSigner } from "@/lib/ethers";
import { getPrice, getTokenBalance } from "@/lib/router";

const { Option } = Select;

const FromSelector = ({
    allTokens,
    defaultValue,
    onChange,
}) => (
    <Select
        showSearch
        defaultValue={defaultValue}
        style={{ minWidth: "50vw" }}
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

const ToSelector = ({
    allTokens,
    defaultValue,
    value,
    onChange,
}) => (
    <Select
        showSearch
        defaultValue={defaultValue}
        style={{ minWidth: "50vw" }}
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

export default function Send() {
    const tokens = Object.keys(TOKENS);
    const [selectedTokens, setSelectedToken] = useState([
        DEFAULT_ASSETS[0],
        DEFAULT_ASSETS[0],
    ]);
    const [tokenBalances, setTokenBalances] = useState([0, 0]);
    const [autoSpillage, setAutoSpillage] = useState(true);
    const [txnData, setTxnData] = useState();
    const [form] = Form.useForm();
    const [loadingQoute, setLoadingQoute] = useState(false);
    const [qoute, setQoute] = useState(0);
    const [ratio, setRatio] = useState(0);
    const [spillage, setSpillage] = useState(0.5);
    const [swapFee, setSwapFee] = useState(0);
    const [networkCost, setNetworkCost] = useState(0);
    const { isConnected, address } = useAccount();
    const provider = useEthersProvider();

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
            console.log(tokenA, tokenB, amountIn)
            setLoadingQoute(true);
            if(!amountIn) return;
            if (tokenA === tokenB) {
                setQoute(amountIn);
                form.setFieldValue("output", amountIn);
                setRatio(1);
                setNetworkCost(0);
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
                    provider,
                });

            setQoute(quoteAmountOut);
            form.setFieldValue("output", quoteAmountOut);
            setRatio(ratio);
            setNetworkCost(networkCost);
            setTxnData(transaction);
        } catch (error) {
            console.log(error)
        } finally {
            setLoadingQoute(false);
        }
    };

    const getCurrentBalances = async () => {
        return await Promise.all([
            getTokenBalance(TOKENS[selectedTokens[0]], address, provider),
            getTokenBalance(TOKENS[selectedTokens[1]], address, provider),
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
        ).then(()=>{}).catch(console.log);
        console.log('ccall')
    }, [selectedTokens, isConnected, address]);

    return (
        <Card title="Send Token">
            <Form
                form={form}
                name="swap-tokens-form"
                onFinish={console.log}
                onValuesChange={async (val) =>
                    await getQoute(
                        selectedTokens[0],
                        selectedTokens[1],
                        parseFloat(val?.input || 0)
                    )
                }
               
            >
                <Form.Item label="Recipient" name="recipient">
                    <Input size="large" />
                </Form.Item>
                <Form.Item label="Send Token" name="input" initialValue={0}>
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
                    label="Recieved Token"
                    name="output"
                    initialValue={0}
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
                                value={selectedTokens[1]}
                                onChange={(val) => onToTokenChange(val)}
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
                <Divider />

                <Form.Item
                    style={{ justifyContent: "flex-end", display: "flex" }}
                >
                    <Button htmlType="submit" disabled={!isConnected}>
                        Send
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
}

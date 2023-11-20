import { useEffect, useState } from "react";
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
import { useEthersSigner } from "@/lib/ethers";
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
    // const [qoute, setQoute] = useState(0);
    // const [ratio, setRatio] = useState(0);
    // const [spillage, setSpillage] = useState(0.5);
    // const [swapFee, setSwapFee] = useState(0);
    // const [networkCost, setNetworkCost] = useState(0);
    const { isConnected, address } = useAccount();
    const [form] = Form.useForm();
    const signer = useEthersSigner();

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


    return ("hi there");
}

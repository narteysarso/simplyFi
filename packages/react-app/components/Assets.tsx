import React, { useEffect, useState } from "react";
import { Avatar, List, Space, Tabs, Typography, message } from "antd";
import { useAccount } from "wagmi";
import { TatumSDK, Network, Celo } from "@tatumio/tatum";
import { DEFAULT_ASSETS, DEFAULT_ASSETS_DATA } from "@/constants/tokens";
import { TokenIcons } from "@/constants/invoicedata";

function TokenAssets({ data = [], rates = [], isLoading = true }) {
    return (
        <List
            itemLayout="horizontal"
            dataSource={data}
            loading={isLoading}
            renderItem={(item, index) => (
                <List.Item>
                    <List.Item.Meta
                        avatar={<Avatar src={TokenIcons[item.asset]} />}
                        title={
                            <Space direction="vertical">
                                <Typography.Title level={5}>
                                    {item.asset}
                                </Typography.Title>
                                <Typography.Text>
                                    {rates[index]?.value
                                        ? parseFloat(
                                              rates[index]?.value
                                          )?.toFixed(2)
                                        : 0}{" "}
                                    {rates[index]?.basePair}
                                </Typography.Text>
                            </Space>
                        }
                        description=""
                    />
                    <Space direction="vertical">
                        <Typography.Title level={5}>
                            {item.balance}
                        </Typography.Title>
                        <Typography.Text>
                            {rates[item.asset] * item.balance || 0}
                        </Typography.Text>
                    </Space>
                </List.Item>
            )}
        />
    );
}
function NFTAssets({ data, isLoading = false }) {
    return (
        <List
            itemLayout="horizontal"
            dataSource={data}
            loading={isLoading}
            renderItem={(item, index) => (
                <List.Item>
                    <List.Item.Meta
                        avatar={
                            <Avatar
                                src={`https://xsgames.co/randomusers/avatar.php?g=pixel&key=${index}`}
                            />
                        }
                        title={item.asset}
                        description=""
                    />
                    <Space>{item.balance}</Space>
                </List.Item>
            )}
        />
    );
}

const Assets: React.FC = () => {
    const { address, isConnected } = useAccount();
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [loadingBalances, setLoadingBalances] = useState(false);
    const [collectibles, setCollectibles] = useState([]);
    const [funds, setFunds] = useState([...DEFAULT_ASSETS_DATA]);
    const [rates, setRates] = useState([]);
    const [basePair, setBasePair] = useState("USD");

    const items: TabsProps["items"] = [
        {
            key: "1",
            label: "Funds",
            children: (
                <TokenAssets
                    data={funds}
                    isLoading={loadingAssets || loadingBalances}
                    rates={rates}
                />
            ),
        },
        {
            key: "2",
            label: "Collectibles",
            children: (
                <NFTAssets
                    data={collectibles}
                    isLoading={loadingAssets}
                    rates={rates}
                />
            ),
        },
    ];

    // useEffect(() => {
    //     const getBalance = setTimeout(async () => {
    //         try {
    //             setLoadingBalances(true);
    //             const tatum = await TatumSDK.init<Celo>({
    //                 network: Network.CELO,
    //             });

    //             const batch = [...funds].map((tk, idx) => ({
    //                 currency: tk.asset.toLocaleUpperCase(),
    //                 basePair: basePair,
    //                 batchId: idx,
    //             }));

    //             // console.log(batch)

    //             const rates = await tatum.rates.getCurrentRateBatch(batch);

    //             // console.log(rates);
    //             setRates(rates?.data || []);
    //         } catch (error) {
    //             console.log(error);
    //         } finally {
    //             setLoadingBalances(false);
    //         }
    //     }, 0);
    //     return () => clearTimeout(getBalance);
    // }, [collectibles]);

    // useEffect(() => {
    //     if (!isConnected || !address) return;
    //     const getBalance = setTimeout(async () => {
    //         try {
    //             setLoadingAssets(true);

    //             const tatum = await TatumSDK.init<Celo>({
    //                 network: Network.CELO,
    //                 apiKey: process.env.NEXT_PUBLIC_TATUM_API_KEY,
    //             });

    //             // console.log(tatum);

    //             const balances = await tatum.address.getBalance({
    //                 addresses: [address],
    //             });

    //             // console.log(balances);

    //             if (balances?.data?.length < 1) return;
    //             const tempFunds = Object.assign(funds);
    //             const [fungible, nft] = balances?.data?.reduce(
    //                 (acc, val) => {
    //                     if (val.type === "nft")
    //                         return [acc[0], [val, ...acc[1]]];
    //                     const idx = DEFAULT_ASSETS.indexOf(val.asset);
    //                     if (idx > -1) {
    //                         tempFunds[idx] = val;
    //                         return acc;
    //                     }
    //                     return [[val, ...acc[0]], acc[1]];
    //                 },
    //                 [[], []]
    //             );

    //             setCollectibles(nft);
    //             setFunds(
    //                 [...tempFunds, ...fungible].sort(
    //                     (a, b) => b.balance - a.balance
    //                 )
    //             );
    //         } catch (error) {
    //             message.error(error.message);
    //             console.log(error);
    //         } finally {
    //             setLoadingAssets(false);
    //         }
    //     }, 5000);

    //     return () => clearTimeout(getBalance);
    // }, [address, isConnected, funds]);

    return <Tabs defaultActiveKey="1" items={items} />;
};

export default Assets;

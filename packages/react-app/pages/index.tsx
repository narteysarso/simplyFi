import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Button, Col, Row, Tabs } from "antd";
import Assets from "@/components/Assets";
import Bills from "@/components/Bills";
import Swap from "@/components/Swap";

export default function Home() {
    const [userAddress, setUserAddress] = useState("");
    const { address, isConnected } = useAccount();

    useEffect(() => {
        if (isConnected && address) {
            setUserAddress(address);
        }
    }, [address, isConnected]);

    const pages = [
        {
            label: `Wallet`,
            children: <Assets />,
        },
        {
            label: "Swap",
            children: <Swap />,
        },
        {
            label: "Split",
            children: <Bills />,
        },
    ];

    return (
        <Tabs
            tabPosition={"bottom"}
            tabBarStyle={{position: "fixed", bottom: "0px", zIndex: "100", background: "white", width: "100%"}}
            items={pages.map((page, i) => {
                return { ...page, key: i };
            })}
        />
    );

    return (
        <Row>
            <Col span={24}>
                There you go... a canvas for your next Celo project!
            </Col>
            <Col span={24}>
                {isConnected && (
                    <div className="h2 text-center">
                        Your address: {userAddress}
                    </div>
                )}
            </Col>
            <Col span={24}>
                <Assets />
            </Col>
        </Row>
    );
}

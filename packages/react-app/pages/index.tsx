import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Button, Col, Row } from "antd";
import Assets from "@/components/Assets";

export default function Home() {
    const [userAddress, setUserAddress] = useState("");
    const { address, isConnected } = useAccount();

    useEffect(() => {
        if (isConnected && address) {
            setUserAddress(address);
        }
    }, [address, isConnected]);

    return (
        <Row>
            <Col span={24}>There you go... a canvas for your next Celo project!</Col>
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

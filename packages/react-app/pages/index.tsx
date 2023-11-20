import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Button, Col, Row, Tabs } from "antd";
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
        <Assets />
    );
}

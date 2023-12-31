import { FC, ReactNode, useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Layout, Space, Tag } from "antd";
import Image from "next/image";
import { useAccount, useBalance, useConnect, } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { celoAlfajores, celo, polygonMumbai} from "viem/chains";
import ActionButtons from "./ActionButtons";
import { TOKENS } from "@/constants/tokens";

const { Content } = Layout;
// import Footer from "./Footer";
// import Header from "./Header";

interface Props {
    children: ReactNode;
}

const MainLayout: FC<Props> = ({ children }) => {
    const [hideConnectBtn, setHideConnectBtn] = useState(false);
    const { address, isConnected,  } = useAccount();
    const { connect} = useConnect({
        connector: new InjectedConnector(),
        chainId: celo.id
    });

    const {data: balance, isLoading: balanceLoading} = useBalance({
      address,
      token: TOKENS["CELO"]
    })

    useEffect(() => {
        if (window.ethereum && window.ethereum.isMiniPay) {
          
            setHideConnectBtn(true);
            connect();
        }
    }, [connect]);

    return (
        <Layout className="layout">
            <Layout.Header
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "yellow",
                }}
            >
                <Image
                    className="block h-3 w-auto sm:block lg:block"
                    src="/logo.svg"
                    width="16"
                    height="16"
                    alt="Celo Logo"
                />
                {!hideConnectBtn ? (
                    <ConnectButton showBalance={true} />
                ) : (
                    <Space>
                      <Tag>{address?.substring(0,6)}...{address?.substring(38)}</Tag>
                      <Tag>{balance?.formatted} {balance?.symbol}</Tag>
                    </Space>
                )}
            </Layout.Header>
            <Content style={{ padding: "0 2vw", height: "auto", minHeight: "80vh", backgroundColor: "white"}}>
                {children}
                
            </Content>
            <Layout.Footer style={{ textAlign: "center", background: "white" }}>
            <ActionButtons />
                Ant Design ©2023 Created by Ant UED
            </Layout.Footer>
        </Layout>
    );
};

export default MainLayout;

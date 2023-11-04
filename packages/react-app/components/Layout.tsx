import { FC, ReactNode, useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Layout, Space, Tag } from "antd";
import Image from "next/image";
import { useAccount, useBalance, useConnect, } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { celoAlfajores } from "viem/chains";
import ActionButtons from "./ActionButtons";

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
        chainId: celoAlfajores.id
    });
    const {data: balance, isLoading: balanceLoading} = useBalance({
      address,
      token: "0x765DE816845861e75A25fCA122bb6898B8B1282a"
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
            <Content style={{ padding: "0 2vw", height: "auto", minHeight: "80vh"}}>
                {children}
                
            </Content>
            <Layout.Footer style={{ textAlign: "center" }}>
            <ActionButtons />
                Ant Design ©2023 Created by Ant UED
            </Layout.Footer>
        </Layout>
    );
};

export default MainLayout;

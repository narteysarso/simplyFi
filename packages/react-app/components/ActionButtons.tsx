import { CommentOutlined, DeploymentUnitOutlined, HomeOutlined, MenuOutlined, SendOutlined, SwapOutlined } from "@ant-design/icons";
import React from "react";
import { FloatButton } from "antd";

const ActionButtons: React.FC = () => (
    <FloatButton.Group
        trigger="click"
        type="primary"
        style={{ right: 24, bottom: 24 }}
        icon={<MenuOutlined />}
    >
        <FloatButton href="/split" icon={<DeploymentUnitOutlined />}/>
        <FloatButton href="/send" icon={<SendOutlined />}/>
        <FloatButton href="/swap" icon={<SwapOutlined />} />
        <FloatButton href="/chat" icon={<CommentOutlined />} />
        <FloatButton href="/" icon={<HomeOutlined/>} />
    </FloatButton.Group>
);

export default ActionButtons;

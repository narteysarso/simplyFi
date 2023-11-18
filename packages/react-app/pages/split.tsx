import {
    Space,
    Select,
    Typography,
    Card,
} from "antd";
import Bills from "../components/Bills";


const Split = () => {
    return (
        <Card
            title={
                <Space
                    size={"large"}
                    style={{ width: "100%" }}
                    align="baseline"
                >
                    <Typography.Title level={5}>Create Bill</Typography.Title>
                </Space>
            }
        >
            <Bills />
        </Card>
    );
};

export default Split;

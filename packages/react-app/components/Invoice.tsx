import {
    Form,
    Input,
    Space,
    Button,
    Divider,
    Avatar,
    Select,
    Modal,
    Typography,
    Radio,
    message,
} from "antd";
import { DEFAULT_ASSETS, TOKENS, TokenIcons } from "@/constants/tokens";
import { createBill } from "../lib/transactions";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useAccount } from "wagmi";
import { useState, useMemo } from "react";
import { BrowserProvider } from "ethers";

const { TextArea } = Input;

const SplitForm = ({ form, onfinish = (j) => {} }) => {
    const tokens = Object.keys(TOKENS);
    const [selectedToken, setSelectedToken] = useState(DEFAULT_ASSETS[0]);
    const [loading, setLoading] = useState(false);
    const { address } = useAccount();
    const signer = useMemo(async () => {
        if (!window.ethereum) return null;

        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner(address);

        return signer;
    }, [address]);
    const [fields, setFields] = useState([
        {
            name: "payToken",
            value: "cUSD",
        },
        {
            name: "items",
            value: [{}],
        },
        {
            name: "payers",
            value: [{}],
        },
        {
            name: "amountDue",
            value: 0,
        },
    ]);
    // const [totalAmountWithoutTax, setTotalAmountWithoutTax] = useState(0);
    // const [totalTax, setTotalTax] = useState(0);
    const [totalAmountDue, setTotalAmountDue] = useState(0);
    // const [] = useState(0);

    return (
        <Form
            form={form}
            fields={[
                ...fields,
                {
                    name: "recipient",
                    value: address,
                },
            ]}
            onFieldsChange={(fieldData, allFieldData) => {
                let totalAmount = 0;

                allFieldData.forEach(
                    ({ name, value, validated }, index, allValues) => {
                        if (name?.includes("items") && validated) {
                            const qtyFieldName = [name[0], name[1], "quantity"];
                            const costFieldName = [
                                name[0],
                                name[1],
                                "unitcost",
                            ];
                            const amtFieldName = [name[0], name[1], "amount"];

                            const qty = parseFloat(
                                form.getFieldValue(qtyFieldName) || 0
                            );
                            const cost = parseFloat(
                                form.getFieldValue(costFieldName) || 0
                            );

                            const amount = cost * qty;

                            totalAmount += amount;

                            // console.log(totalAmount);

                            form.setFieldValue(amtFieldName, amount.toFixed(2));
                        }
                    }
                );
                // console.log(totalAmount/3);
                // setTotalAmountDue(totalAmount / 3);
                if (totalAmount > 0) {
                    form.setFieldValue("amountDue", totalAmount / 3);
                }
                // console.log(fieldData, allFieldData);
                setFields(allFieldData);
            }}
            onFinish={async (values) => {
                try {
                    setLoading(true);

                    const data = await createBill({
                        ...values,
                        tokenAddress: TOKENS[values?.payToken || "CELO"],
                        creator: address,
                        signer,
                    });
                    onfinish(data);
                    message.success("Bill Created");
                } catch (error) {
                    message.warning("Bill failed");
                    // console.log(error);
                } finally {
                    setLoading(false);
                }
            }}
        >
            <Form.Item
                label={<b>Recipient</b>}
                name="recipient"
                rules={[
                    {
                        required: false,
                        message: "Recipient address/phone number missing",
                    },
                ]}
            >
                <Input size="large" />
            </Form.Item>
            <Form.Item label={<b>Choose your currency</b>} name="payToken">
                <Radio.Group size="large" buttonStyle="solid">
                    {tokens.slice(0, 5).map((tk, idx) => (
                        <Radio.Button value={tk} key={idx}>
                            <Avatar
                                size={24}
                                style={{ backgroundColor: "whitesmoke" }}
                                src={TokenIcons[tk]}
                            />
                            {tk}
                        </Radio.Button>
                    ))}
                </Radio.Group>
            </Form.Item>
            <Form.Item name="category" label={<b>Bill category</b>}>
                <Input placeholder="Category associated to your invoice" />
            </Form.Item>
            <Form.Item
                name={"tags"}
                label={<b>Tags associated with bill</b>}
                rules={[
                    {
                        required: false,
                    },
                ]}
            >
                <Select
                    mode="tags"
                    style={{ width: "100%" }}
                    tokenSeparators={[","]}
                    options={[]}
                />
            </Form.Item>
            <Divider>
                <Typography.Title level={5}>Cost Descriptions</Typography.Title>
            </Divider>
            <Form.List name="items" key={1}>
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }, idx) => (
                            <div key={key}>
                                <Space key={idx} align="baseline" wrap>
                                    <Form.Item
                                        {...restField}
                                        name={[name, "description"]}
                                        rules={[
                                            {
                                                required: true,
                                                message: "Missing description",
                                            },
                                        ]}
                                    >
                                        <Input placeholder="Item description" />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, "quantity"]}
                                        rules={[
                                            {
                                                required: true,
                                                message: "Missing quantity",
                                            },
                                        ]}
                                    >
                                        <Input
                                            placeholder="Quantity"
                                            type="number"
                                            min={0}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, "unitcost"]}
                                        rules={[
                                            {
                                                required: true,
                                                message: "Missing unit const",
                                            },
                                        ]}
                                    >
                                        <Input
                                            placeholder="Unit Cost"
                                            type="number"
                                            min={0}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        {...restField}
                                        name={[name, "amount"]}
                                    >
                                        <Input
                                            disabled
                                            placeholder="Amount"
                                            min={0}
                                        />
                                    </Form.Item>

                                    <MinusCircleOutlined
                                        onClick={() => remove(name)}
                                    />
                                </Space>
                                <Divider
                                    style={{ padding: 0, marginTop: 0.5 }}
                                />
                            </div>
                        ))}
                        <Form.Item>
                            <Button
                                type="dashed"
                                onClick={() => add()}
                                block
                                icon={<PlusOutlined />}
                            >
                                Add Item
                            </Button>
                        </Form.Item>
                    </>
                )}
            </Form.List>
            <Divider />
            <Form.Item name="amountDue" label="Due">
                <Input
                    type="number"
                    bordered={false}
                    contentEditable={false}
                    addonBefore={"$"}
                />
            </Form.Item>
            {/* <Space direction="vertical">
                <Typography.Text>
                    Total without Tax: ${totalAmountWithoutTax}
                </Typography.Text>
                <Typography.Text>Total Tax Amount: ${totalTax}</Typography.Text>
                <Typography.Text>
                    Total Amount: ${totalAmountWithoutTax - totalTax}
                </Typography.Text> 
                <Typography.Title level={5}>
                    Due: ${totalAmountDue}
                </Typography.Title>
            </Space> */}
            <Divider>
                <Typography.Title level={5}>Split Details</Typography.Title>
            </Divider>
            <Form.List name="payers" key={2}>
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }, idx) => (
                            <Space key={idx} align="baseline">
                                <Form.Item
                                    {...restField}
                                    name={[name, "account"]}
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Missing account address(or phone number)",
                                        },
                                    ]}
                                >
                                    <Input placeholder="Account (address/phone number)" />
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    name={[name, "amount"]}
                                    rules={[
                                        {
                                            required: true,
                                            message: "Missing amount",
                                        },
                                    ]}
                                >
                                    <Input placeholder="Amount" type="number" />
                                </Form.Item>
                                <MinusCircleOutlined
                                    onClick={() => {
                                        remove(name);
                                    }}
                                />
                            </Space>
                        ))}
                        <Form.Item>
                            <Button
                                type="dashed"
                                onClick={() => add()}
                                block
                                icon={<PlusOutlined />}
                            >
                                Add Payer(s)
                            </Button>
                        </Form.Item>
                    </>
                )}
            </Form.List>
            <Form.Item label="memo" name="memo">
                <TextArea rows={4} />
            </Form.Item>
            <Form.Item>
                <Space>
                    <Button htmlType="reset">Cancel</Button>
                    <Button htmlType="submit" loading={loading}>
                        Create Bill
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export const FormModal = () => {
    const [form] = Form.useForm();
    const [open, setOpen] = useState(false);
    const onCreate = (values) => {
        setOpen(false);
    };
    const onCancel = () => {
        setOpen(false);
        form.resetFields();
    };
    return (
        <>
            <Modal
                open={open}
                title="Create a bill"
                footer={null}
                onCancel={onCancel}
                onOk={() => {
                    form.validateFields()
                        .then((values) => {
                            form.resetFields();
                            onCreate(values);
                        })
                        .catch((info) => {
                            message.error("Validate Failed:", info);
                        });
                }}
            >
                <SplitForm form={form} onfinish={() => onCancel()} />
            </Modal>

            <Button
                onClick={() => {
                    setOpen(true);
                }}
            >
                New Invoice
            </Button>
        </>
    );
};

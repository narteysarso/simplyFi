import React, { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { Avatar, Divider, List, Skeleton, Space, Tag } from "antd";
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
} from "@ant-design/icons";

interface DataType {
    gender: string;
    name: {
        title: string;
        first: string;
        last: string;
    };
    email: string;
    picture: {
        large: string;
        medium: string;
        thumbnail: string;
    };
    nat: string;
}

const ListItems: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<DataType[]>([]);

    const loadMoreData = () => {
        if (loading) {
            return;
        }
        setLoading(true);
        fetch(
            "https://randomuser.me/api/?results=10&inc=name,gender,email,nat,picture&noinfo"
        )
            .then((res) => res.json())
            .then((body) => {
                setData([...data, ...body.results]);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        loadMoreData();
    }, []);

    return (
        <div
            id="scrollableDiv"
            style={{
                height: "80vh",
                width: "100%",
                overflow: "auto",
                border: "1px solid rgba(140, 140, 140, 0.35)",
            }}
        >
            <InfiniteScroll
                dataLength={data.length}
                next={loadMoreData}
                hasMore={data.length < 50}
                loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
                endMessage={<Divider plain>It is all, nothing more 🤐</Divider>}
                scrollableTarget="scrollableDiv"
            >
                <List
                    dataSource={data}
                    renderItem={(item, idx) => (
                        <List.Item key={item.email} className={(idx%2)? "bg-whitesmoke":"bg-mutted"} style={{paddingRight: "5px", paddingLeft: "5px"}}>
                            <List.Item.Meta
                                avatar={<Avatar src={item.picture.large} />}
                                title={
                                    <a href="https://ant.design">
                                        {item.name.last}
                                    </a>
                                }
                                description={
                                    <>
                                        <Space wrap size={"small"}>
                                            <Tag
                                                icon={<CheckCircleOutlined />}
                                                color="success"
                                            >
                                                Done
                                            </Tag>
                                            <Tag
                                                icon={<SyncOutlined spin />}
                                                color="processing"
                                            >
                                                Processing
                                            </Tag>
                                            <Tag
                                                icon={<CloseCircleOutlined />}
                                                color="error"
                                            >
                                                Failed
                                            </Tag>
                                           
                                            <Tag
                                                icon={<ClockCircleOutlined />}
                                                color="default"
                                            >
                                                waiting
                                            </Tag>
                                            <Tag>Amount: 0002 Unit</Tag>
                                        </Space>
                                    </>
                                }
                            />
                            <div>Details</div>
                        </List.Item>
                    )}
                />
            </InfiniteScroll>
        </div>
    );
};

export default ListItems;

import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Table, message } from 'antd';
import { api, getUser } from '../api';

const LIMIT = 10;

export default function Posts() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [author, setAuthor] = useState(null); 
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    try {
      const path = author
        ? `/posts/user/${author._id}?page=${page}&limit=${LIMIT}` 
        : `/posts?page=${page}&limit=${LIMIT}`;
      const res = await api(path);
      setData(res.data);
      setTotal(res.total);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, author]);

  async function create(values) {
    try {
      await api('/posts', { method: 'POST', body: values });
      message.success('Posted');
      form.resetFields();
      setAuthor(null);
      setPage(1);
      load();
    } catch (e) {
      message.error(e.message);
    }
  }

  function showUser(user) {
    setPage(1);
    setAuthor(user);
  }

  const columns = [
    { title: 'Title', dataIndex: 'title' },
    { title: 'Content', dataIndex: 'content', ellipsis: true },
    ...(author
      ? []
      : [{
          title: 'Author',
          dataIndex: 'author',
          render: (a) => a && <a onClick={() => showUser(a)}>{a.name}</a>,
        }]),
    { title: 'Created', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleString() },
  ];

  return (
    <>
      <Card title="Write a post" size="small" style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={create}>
          <Form.Item name="title" rules={[{ required: true }]}>
            <Input placeholder="Title" />
          </Form.Item>
          <Form.Item name="content" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="What's on your mind?" />
          </Form.Item>
          <Button type="primary" htmlType="submit">Post</Button>
        </Form>
      </Card>

      <h2>
        {author ? `Posts by ${author.name}` : 'All Posts'}{' '}
        {author && <Button size="small" onClick={() => showUser(null)}>Show all</Button>}
        {!author && (
          <Button size="small" onClick={() => showUser({ _id: getUser().sub, name: 'me' })}>My posts</Button>
        )}
      </h2>

      <Table
        rowKey="_id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{ current: page, pageSize: LIMIT, total, onChange: setPage }}
      />
    </>
  );
}

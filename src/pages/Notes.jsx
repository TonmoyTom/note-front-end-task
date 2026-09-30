import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Space, Table, message } from 'antd';
import { api } from '../api';

const LIMIT = 10;

export default function Notes() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); 
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    try {
      const res = await api(`/notes?page=${page}&limit=${LIMIT}&q=${encodeURIComponent(q)}`);
      setData(res.data);
      setTotal(res.total);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, q]);

  function openModal(note = {}) {
    setEditing(note);
    form.setFieldsValue({ title: note.title || '', content: note.content || '' });
  }

  async function save() {
    const values = await form.validateFields();
    try {
      if (editing._id) await api(`/notes/${editing._id}`, { method: 'PATCH', body: values });
      else await api('/notes', { method: 'POST', body: values });
      message.success('Saved');
      setEditing(null);
      load();
    } catch (e) {
      message.error(e.message);
    }
  }

  async function remove(id) {
    try {
      await api(`/notes/${id}`, { method: 'DELETE' });
      message.success('Deleted');
      load();
    } catch (e) {
      message.error(e.message);
    }
  }

  const columns = [
    { title: 'Title', dataIndex: 'title' },
    { title: 'Content', dataIndex: 'content', ellipsis: true },
    { title: 'Created', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleString() },
    {
      title: 'Actions',
      render: (_, note) => (
        <Space>
          <Button size="small" onClick={() => openModal(note)}>Edit</Button>
          <Popconfirm title="Delete this note?" onConfirm={() => remove(note._id)}>
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <h2>My Notes</h2>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search placeholder="Search notes" allowClear onSearch={(v) => { setPage(1); setQ(v); }} />
        <Button type="primary" onClick={() => openModal()}>New Note</Button>
      </Space>

      <Table
        rowKey="_id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{ current: page, pageSize: LIMIT, total, onChange: setPage }}
      />

      <Modal title={editing?._id ? 'Edit Note' : 'New Note'} open={!!editing} onOk={save} onCancel={() => setEditing(null)}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="content" label="Content">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tabs, Tag, message } from 'antd';
import { api } from '../api';

const LIMIT = 10;

// Reusable: paginated list load kora
function usePaged(buildPath, deps = []) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api(buildPath(page));
      setData(res.data);
      setTotal(res.total);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, ...deps]);

  const pagination = { current: page, pageSize: LIMIT, total, onChange: setPage };
  return { data, loading, pagination, load, setPage };
}

// ---------- Users: list, add, edit, delete ----------
function Users() {
  const users = usePaged((p) => `/users?page=${p}&limit=${LIMIT}`);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  function openModal(user = {}) {
    setEditing(user);
    form.resetFields();
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      interests: user.interests || [],
    });
  }

  async function save() {
    const values = await form.validateFields();
    if (!values.password) delete values.password; // edit-e password faka thakle bodlabo na
    try {
      if (editing._id) await api(`/users/${editing._id}`, { method: 'PATCH', body: values });
      else await api('/users', { method: 'POST', body: values });
      message.success('Saved');
      setEditing(null);
      users.load();
    } catch (e) {
      message.error(e.message);
    }
  }

  async function remove(id) {
    try {
      await api(`/users/${id}`, { method: 'DELETE' });
      message.success('User deleted (with their notes and posts)');
      users.load();
    } catch (e) {
      message.error(e.message);
    }
  }

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Role', dataIndex: 'role', render: (r) => <Tag color={r === 'admin' ? 'red' : 'blue'}>{r}</Tag> },
    { title: 'Interests', dataIndex: 'interests', render: (i = []) => i.map((x) => <Tag key={x}>{x}</Tag>) },
    {
      title: 'Actions',
      render: (_, u) => (
        <Space>
          <Button size="small" onClick={() => openModal(u)}>Edit</Button>
          <Popconfirm title="Delete user and all their notes/posts?" onConfirm={() => remove(u._id)}>
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Button type="primary" onClick={() => openModal()} style={{ marginBottom: 16 }}>Add User</Button>
      <Table rowKey="_id" loading={users.loading} dataSource={users.data} columns={columns} pagination={users.pagination} />

      <Modal title={editing?._id ? 'Edit User' : 'Add User'} open={!!editing} onOk={save} onCancel={() => setEditing(null)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label={editing?._id ? 'New password (leave empty to keep)' : 'Password'}
            rules={[{ required: !editing?._id, min: 6 }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Role">
            <Select options={[{ value: 'user' }, { value: 'admin' }]} />
          </Form.Item>
          <Form.Item name="interests" label="Interests">
            <Select mode="tags" placeholder="Type and press Enter" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ---------- All notes (admin) ----------
function AllNotes() {
  const [q, setQ] = useState('');
  const notes = usePaged((p) => `/notes/all?page=${p}&limit=${LIMIT}&q=${encodeURIComponent(q)}`, [q]);

  const columns = [
    { title: 'Title', dataIndex: 'title' },
    { title: 'Content', dataIndex: 'content', ellipsis: true },
    { title: 'Owner', dataIndex: 'owner', render: (o) => (o ? `${o.name} (${o.email})` : 'deleted user') },
    { title: 'Created', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleString() },
  ];

  return (
    <>
      <Input.Search
        placeholder="Search all notes"
        allowClear
        style={{ maxWidth: 300, marginBottom: 16 }}
        onSearch={(v) => { notes.setPage(1); setQ(v); }}
      />
      <Table rowKey="_id" loading={notes.loading} dataSource={notes.data} columns={columns} pagination={notes.pagination} />
    </>
  );
}

// ---------- Scenario 1: users grouped by interests ----------
function Interests() {
  const [interest, setInterest] = useState('');
  const groups = usePaged(
    (p) => `/users/interests?page=${p}&limit=${LIMIT}${interest ? `&interest=${encodeURIComponent(interest)}` : ''}`,
    [interest],
  );

  const columns = [
    { title: 'Interest', dataIndex: 'interest', render: (i) => <Tag color="green">{i}</Tag> },
    { title: 'Users', dataIndex: 'count' },
    { title: 'Who', dataIndex: 'users', render: (us) => us.map((u) => u.name).join(', ') },
  ];

  return (
    <>
      <Input.Search
        placeholder="Filter by interest (e.g. chess)"
        allowClear
        style={{ maxWidth: 300, marginBottom: 16 }}
        onSearch={(v) => { groups.setPage(1); setInterest(v.trim()); }}
      />
      <Table rowKey="interest" loading={groups.loading} dataSource={groups.data} columns={columns} pagination={groups.pagination} />
    </>
  );
}

export default function Admin() {
  return (
    <>
      <h2>Admin</h2>
      <Tabs
        items={[
          { key: 'users', label: 'Users', children: <Users /> },
          { key: 'notes', label: 'All Notes', children: <AllNotes /> },
          { key: 'interests', label: 'Users by Interest', children: <Interests /> },
        ]}
      />
    </>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Form, Input, Select, message } from 'antd';
import { api } from '../api';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(values) {
    setLoading(true);
    try {
      const body =
        mode === 'login'
          ? { email: values.email, password: values.password }
          : { ...values, interests: values.interests || [] };
      const { accessToken } = await api(`/auth/${mode}`, { method: 'POST', body });
      localStorage.setItem('token', accessToken);
      navigate('/notes');
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title={mode === 'login' ? 'Login' : 'Register'} style={{ maxWidth: 400, margin: '60px auto' }}>
      <Form layout="vertical" onFinish={submit} key={mode}>
        {mode === 'register' && (
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        )}
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
          <Input.Password />
        </Form.Item>
        {mode === 'register' && (
          <Form.Item name="interests" label="Interests">
            <Select mode="tags" placeholder="chess, reading... (type and press Enter)" />
          </Form.Item>
        )}
        <Button type="primary" htmlType="submit" loading={loading} block>
          {mode === 'login' ? 'Login' : 'Register'}
        </Button>
      </Form>
      <Button type="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ marginTop: 8 }}>
        {mode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
      </Button>
      <p style={{ color: '#999', fontSize: 12 }}>First request may take ~50s (free server waking up).</p>
    </Card>
  );
}

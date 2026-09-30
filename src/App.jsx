import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Button, Space, Tag } from 'antd';
import { getUser } from './api';
import Login from './pages/Login';
import Notes from './pages/Notes';
import Posts from './pages/Posts';
import Admin from './pages/Admin';

function Nav() {
  const user = getUser();
  const navigate = useNavigate();
  if (!user) return null;

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 24px', borderBottom: '1px solid #eee' }}>
      <Link to="/notes">My Notes</Link>
      <Link to="/posts">Posts</Link>
      {user.role === 'admin' && <Link to="/admin">Admin</Link>}
      <Space style={{ marginLeft: 'auto' }}>
        <Tag color={user.role === 'admin' ? 'red' : 'blue'}>{user.role}</Tag>
        <Button size="small" onClick={logout}>Logout</Button>
      </Space>
    </nav>
  );
}

// Login na thakle /login e pathay, admin page-e user dhukle /notes e
function Private({ children, admin }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/notes" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/notes" element={<Private><Notes /></Private>} />
          <Route path="/posts" element={<Private><Posts /></Private>} />
          <Route path="/admin" element={<Private admin><Admin /></Private>} />
          <Route path="*" element={<Navigate to="/notes" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

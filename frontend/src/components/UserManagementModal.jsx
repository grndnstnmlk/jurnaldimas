import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  X, 
  Check, 
  AlertCircle, 
  Mail, 
  Calendar,
  Lock,
  UserCheck,
  UserX
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

export default function UserManagementModal({ onClose }) {
  const { user: currentUser } = useAuth();
  const { eventCounter } = useRealtime();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // New User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('sales');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [eventCounter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Lengkapi semua formulir pengguna baru.');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');
      setSuccess('');
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Pengguna baru berhasil ditambahkan.');
        setName('');
        setEmail('');
        setPassword('');
        setShowAddForm(false);
        fetchUsers();
      } else {
        setError(data.error || 'Gagal menambahkan pengguna.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || 'Gagal mengubah role.');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || 'Gagal mengubah status akun.');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteUser = async (u) => {
    if (window.confirm(`Hapus akun pengguna "${u.name}" (${u.email})?`)) {
      try {
        const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          fetchUsers();
        } else {
          alert(data.error || 'Gagal menghapus pengguna.');
        }
      } catch (e) {
        alert(e.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg">Manajemen Akun & Hak Akses</h2>
              <p className="text-xs text-purple-200">Kelola akun Sales dan Administrator sistem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Action Header */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 font-semibold">
              Total Pengguna: <span className="font-bold text-slate-800">{users.length} Akun</span>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>{showAddForm ? 'Tutup Form' : '+ Tambah Pengguna'}</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Add User Form */}
          {showAddForm && (
            <form onSubmit={handleAddUser} className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
              <h3 className="font-extrabold text-xs text-purple-900 uppercase tracking-wider">
                Tambah Akun Pengguna Baru
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white px-3 py-2 rounded-xl border border-purple-200 text-xs focus:outline-none focus:border-purple-600"
                />
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white px-3 py-2 rounded-xl border border-purple-200 text-xs focus:outline-none focus:border-purple-600"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Password (min 6 kar)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white px-3 py-2 rounded-xl border border-purple-200 text-xs focus:outline-none focus:border-purple-600"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="bg-white px-3 py-2 rounded-xl border border-purple-200 text-xs font-bold focus:outline-none focus:border-purple-600"
                >
                  <option value="sales">💼 Sales (Kasir, Stok & Harga)</option>
                  <option value="admin">👑 Administrator (Akses Penuh)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  {isProcessing ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          )}

          {/* User List */}
          <div className="space-y-2.5">
            {users.map((u) => {
              const isMe = Number(u.id) === Number(currentUser?.id);
              const isAdmin = u.role === 'admin';

              return (
                <div 
                  key={u.id}
                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isMe ? 'bg-purple-50/50 border-purple-200' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm ${
                      isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.name} className="w-10 h-10 rounded-2xl object-cover" />
                      ) : (
                        u.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {u.name}
                        </span>
                        {isMe && (
                          <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full">
                            Anda (Host)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{u.email}</span>
                        <span>•</span>
                        <span className="capitalize">{u.auth_provider || 'email'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Role Controls */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    
                    {/* Role selector */}
                    <select
                      value={u.role}
                      disabled={isMe}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className={`text-xs font-bold py-1.5 px-2.5 rounded-xl border transition ${
                        isAdmin 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      <option value="sales">💼 Sales</option>
                      <option value="admin">👑 Admin</option>
                    </select>

                    {/* Toggle Active Status */}
                    {!isMe && (
                      <button
                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                        className={`p-1.5 rounded-xl border text-xs font-bold transition ${
                          u.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700' 
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                        title={u.is_active ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
                      >
                        {u.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </button>
                    )}

                    {/* Delete Button */}
                    {!isMe && (
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                        title="Hapus Pengguna"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}

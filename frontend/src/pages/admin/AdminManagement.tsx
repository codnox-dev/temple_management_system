import React, { useState } from 'react';
import { Users, Mail, Phone, Shield, Save, Eye, EyeOff, CheckCircle, Edit, Trash2 } from 'lucide-react';

interface Admin {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'Admin';
  permissions: string[];
  status: 'Active' | 'Inactive';
  createdOn: string;
  lastLogin?: string;
}

const CreateAdmin = () => {
  const [admins, setAdmins] = useState<Admin[]>([
    {
      id: 1,
      name: 'Rajesh Kumar',
      email: 'rajesh.admin@temple.com',
      phone: '+91 98765 43210',
      role: 'Admin',
      permissions: ['Manage Bookings', 'View Analytics', 'Manage Stock'],
      status: 'Active',
      createdOn: '2024-12-15',
      lastLogin: '2025-01-15'
    },
    {
      id: 2,
      name: 'Priya Sharma',
      email: 'priya.admin@temple.com',
      phone: '+91 87654 32109',
      role: 'Admin',
      permissions: ['Manage Events', 'Gallery Management', 'Ritual Management'],
      status: 'Active',
      createdOn: '2024-12-20'
    }
  ]);

  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    permissions: [] as string[]
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const availablePermissions = [
    'Manage Bookings',
    'View Analytics',
    'Manage Stock',
    'Manage Events',
    'Gallery Management',
    'Ritual Management',
    'View Reports',
    'User Management'
  ];

  const handlePermissionChange = (permission: string) => {
    const updatedPermissions = newAdmin.permissions.includes(permission)
      ? newAdmin.permissions.filter(p => p !== permission)
      : [...newAdmin.permissions, permission];
    setNewAdmin({ ...newAdmin, permissions: updatedPermissions });
  };

  const handleCreateAdmin = () => {
    if (newAdmin.name && newAdmin.email && newAdmin.phone && newAdmin.password && newAdmin.password === newAdmin.confirmPassword && newAdmin.permissions.length > 0) {
      const admin: Admin = {
        id: admins.length + 1,
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        role: 'Admin',
        permissions: newAdmin.permissions,
        status: 'Active',
        createdOn: new Date().toISOString().split('T')[0]
      };
      setAdmins([...admins, admin]);
      setNewAdmin({
        name: '', email: '', phone: '', password: '', confirmPassword: '', permissions: []
      });
      setShowAddForm(false);
    }
  };
  
  const toggleAdminStatus = (id: number) => {
    setAdmins(admins.map(admin =>
      admin.id === id
        ? { ...admin, status: admin.status === 'Active' ? 'Inactive' : 'Active' }
        : admin
    ));
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Admin Management</h1>
          <p className="text-purple-300 mt-2">Create and manage temple administrators</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30 flex items-center space-x-2"
        >
          <Users className="h-5 w-5" />
          <span>Create Admin</span>
        </button>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-blue-500/30 p-6 rounded-xl shadow-lg shadow-blue-500/10"><div className="flex items-center justify-between"><div><p className="text-blue-300 text-sm">Total Admins</p><p className="text-3xl font-bold">{admins.length}</p></div><Users className="h-12 w-12 text-blue-400" /></div></div>
        <div className="bg-slate-900/80 backdrop-blur-sm border border-green-500/30 p-6 rounded-xl shadow-lg shadow-green-500/10"><div className="flex items-center justify-between"><div><p className="text-green-300 text-sm">Active Admins</p><p className="text-3xl font-bold">{admins.filter(a => a.status === 'Active').length}</p></div><CheckCircle className="h-12 w-12 text-green-400" /></div></div>
        <div className="bg-slate-900/80 backdrop-blur-sm border border-purple-500/30 p-6 rounded-xl shadow-lg shadow-purple-500/10"><div className="flex items-center justify-between"><div><p className="text-purple-300 text-sm">Avg Permissions</p><p className="text-3xl font-bold">{Math.round(admins.reduce((sum, admin) => sum + admin.permissions.length, 0) / admins.length)}</p></div><Shield className="h-12 w-12 text-purple-400" /></div></div>
      </div>

      {/* Create Admin Form */}
      {showAddForm && (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-500/30">
          <h2 className="text-xl font-bold text-purple-400 mb-6">Create New Administrator</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-sm font-medium text-purple-300 mb-2">Full Name *</label><input type="text" value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Enter full name" /></div>
            <div><label className="block text-sm font-medium text-purple-300 mb-2">Email Address *</label><div className="relative"><Mail className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" /><input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="admin@temple.com" /></div></div>
            <div><label className="block text-sm font-medium text-purple-300 mb-2">Phone Number *</label><div className="relative"><Phone className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" /><input type="tel" value={newAdmin.phone} onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="+91 98765 43210" /></div></div>
            <div><label className="block text-sm font-medium text-purple-300 mb-2">Password *</label><div className="relative"><input type={showPassword ? "text" : "password"} value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} className="w-full px-4 py-3 pr-10 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Enter secure password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
            <div><label className="block text-sm font-medium text-purple-300 mb-2">Confirm Password *</label><input type="password" value={newAdmin.confirmPassword} onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Confirm password" /></div>
          </div>
          <div className="mt-6"><label className="block text-sm font-medium text-purple-300 mb-3">Admin Permissions *</label><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{availablePermissions.map((permission) => (<label key={permission} className="flex items-center space-x-2 p-3 border border-gray-700 rounded-lg hover:bg-slate-800/50 cursor-pointer"><input type="checkbox" checked={newAdmin.permissions.includes(permission)} onChange={() => handlePermissionChange(permission)} className="rounded border-gray-600 text-purple-500 focus:ring-purple-500 bg-gray-800" /><span className="text-sm text-purple-200">{permission}</span></label>))}</div></div>
          <div className="flex justify-end space-x-4 mt-6"><button onClick={() => setShowAddForm(false)} className="px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">Cancel</button><button onClick={handleCreateAdmin} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center space-x-2"><Save className="h-5 w-5" /><span>Create Admin</span></button></div>
        </div>
      )}

      {/* Admin List */}
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-500/30">
        <div className="p-6 border-b border-purple-500/30"><h2 className="text-xl font-bold text-purple-400">Current Administrators</h2></div>
        <div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-purple-300 uppercase bg-slate-800/50"><tr><th scope="col" className="px-6 py-3">Admin Details</th><th scope="col" className="px-6 py-3">Contact</th><th scope="col" className="px-6 py-3">Permissions</th><th scope="col" className="px-6 py-3">Status</th><th scope="col" className="px-6 py-3">Actions</th></tr></thead>
            <tbody>{admins.map((admin) => (<tr key={admin.id} className="bg-slate-900/50 border-b border-slate-800 hover:bg-slate-800/50">
                <td className="px-6 py-4 font-medium text-white whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center"><Users className="h-5 w-5 text-white" /></div><div className="ml-4"><div className="text-base font-medium text-white">{admin.name}</div><div className="text-sm text-purple-300">Created: {new Date(admin.createdOn).toLocaleDateString('en-IN')}</div>{admin.lastLogin && (<div className="text-sm text-purple-300">Last login: {new Date(admin.lastLogin).toLocaleDateString('en-IN')}</div>)}</div></div></td>
                <td className="px-6 py-4"><div className="text-white flex items-center"><Mail className="h-4 w-4 mr-2 text-purple-400" />{admin.email}</div><div className="text-purple-300 flex items-center"><Phone className="h-4 w-4 mr-2 text-purple-400" />{admin.phone}</div></td>
                <td className="px-6 py-4"><div className="flex flex-wrap gap-1">{admin.permissions.slice(0, 2).map((p, i) => (<span key={i} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300 border border-purple-500/30">{p}</span>))}{admin.permissions.length > 2 && (<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">+{admin.permissions.length - 2} more</span>)}</div></td>
                <td className="px-6 py-4"><button onClick={() => toggleAdminStatus(admin.id)} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${admin.status === 'Active' ? 'bg-green-900/50 text-green-300 hover:bg-green-900/80 border border-green-500/30' : 'bg-red-900/50 text-red-300 hover:bg-red-900/80 border border-red-500/30'}`}>{admin.status}</button></td>
                <td className="px-6 py-4"><div className="flex items-center space-x-2"><button className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-900/50"><Edit className="h-4 w-4" /></button><button className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/50"><Trash2 className="h-4 w-4" /></button></div></td>
            </tr>))}</tbody>
        </table></div>
      </div>
    </div>
  );
};

export default CreateAdmin;

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { get, post, put, del, API_BASE_URL } from '../../api/api';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
// Removed unused Select components; using native select for simplicity
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  CheckCircle,
  Shield,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Pencil,
  Check,
  X
} from 'lucide-react';
// import { AxiosError } from 'axios';
import { useAuth } from '@/contexts/AuthContext';

// --- Type Definitions ---
interface Admin {
  _id: string;
  name: string;
  email: string;
  username: string;
  mobile_prefix: string;
  mobile_number: number;
  role: string;
  role_id: number;
  permissions: string[];
  isRestricted: boolean;
  created_at: string;
  last_login?: string;
  profile_picture?: string | null;
  dob?: string | null;
  updated_at?: string;
  updated_by?: string;
  created_by?: string;
  notification_preference?: string[];
  notification_list?: string[];
  last_profile_update?: string;
}

interface AdminCreationPayload extends Omit<Admin, '_id' | 'created_at' | 'last_login'> {
    hashed_password?: string;
    password?: string;
}

interface AdminUpdatePayload {
  name?: string;
  email?: string;
  username?: string;
  role?: string;
  role_id?: number;
  mobile_prefix?: string;
  mobile_number?: number;
  permissions?: string[];
  isRestricted?: boolean;
  profile_picture?: string;
  dob?: string;
  notification_preference?: string[];
  notification_list?: string[];
  hashed_password?: string; // plain password placed here; backend will hash
}

// --- API Fetching ---
const fetchAdmins = (): Promise<Admin[]> => get<Admin[]>('/admin/users/');

type Role = { _id: string; role_id: number; role_name: string; basic_permissions: string[] };

const AdminManagement = () => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const { user } = useAuth() as any;
  const myRoleId: number = user?.role_id ?? 99;

  useEffect(() => {
    (async () => {
      try {
        const data = await get<Role[]>('/roles/');
        setRoles(data);
      } catch (e) {
        console.error('Failed to fetch roles', e);
      }
    })();
  }, []);

  const { data: admins = [], isLoading, isError }: UseQueryResult<Admin[], Error> = useQuery<Admin[], Error>({
    queryKey: ['admins'],
    queryFn: fetchAdmins,
  });

  if (myRoleId > 2) {
      return <div className="text-red-400">You are not authorized to access this page.</div>;
  }

  if (isError) {
      toast.error('Failed to fetch admins. You may not have permission.');
  }

  // Stats
  const totalAdmins = admins.length;
  const activeAdmins = admins.filter(a => !a.isRestricted).length;
  const permissionCount = new Set(admins.flatMap(a => a.permissions)).size;

  return (
    <div className="space-y-6 text-white w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Admin Management
          </h1>
          <p className="text-purple-300 mt-2">
            Create and manage temple administrators and users
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          disabled={myRoleId > 2}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30 flex items-center space-x-2"
        >
          <Users className="h-5 w-5" />
          <span>Create Admins</span>
        </Button>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Users} title="Total Admins" value={totalAdmins} color="blue" />
        <StatCard icon={CheckCircle} title="Active Admins" value={activeAdmins} color="green" />
        <StatCard icon={Shield} title="Permission Types" value={permissionCount} color="purple" />
      </div>

      {/* Create Admin Form */}
      {showAddForm && (
        <AdminForm
          roles={roles}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            setShowAddForm(false);
          }}
        />
      )}

      {/* Admin List */}
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-500/30">
        <div className="p-6 border-b border-purple-500/30">
          <h2 className="text-xl font-bold text-purple-400">
            Current Administrators
          </h2>
        </div>
        <div className="overflow-x-auto w-full">
          <Table className="w-full min-w-full table-fixed text-sm text-left text-gray-400">
            <TableHeader>
              <TableRow className="border-b border-purple-500/30">
                <TableHead className="px-6 py-3 text-purple-300 w-1/4">Admin</TableHead>
                <TableHead className="px-6 py-3 text-purple-300 w-1/4">Contact</TableHead>
                <TableHead className="px-6 py-3 text-purple-300 w-1/6">Status</TableHead>
                <TableHead className="px-6 py-3 text-purple-300 w-1/6">Role</TableHead>
                <TableHead className="px-6 py-3 text-purple-300 w-1/4">Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : (
                admins.map(admin => (
                  <AdminRow key={admin._id} admin={admin} roles={roles} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

// Helper components to keep the main component clean

const StatCard = ({ icon: Icon, title, value, color }: { icon: React.ElementType, title: string, value: number, color: string }) => (
  <div className={`bg-slate-900/80 backdrop-blur-sm border border-${color}-500/30 p-6 rounded-xl shadow-lg shadow-${color}-500/10`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-sm font-medium text-${color}-300`}>{title}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
      </div>
      <Icon className={`h-12 w-12 text-${color}-400`} />
    </div>
  </div>
);

const AdminRow = ({ admin, roles }: { admin: Admin, roles: Role[] }) => {
  const queryClient = useQueryClient();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  // inline edit states
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingDob, setEditingDob] = useState(false);
  const [emailValue, setEmailValue] = useState(admin.email);
  const [prefixValue, setPrefixValue] = useState(admin.mobile_prefix);
  const [mobileValue, setMobileValue] = useState(String(admin.mobile_number ?? ''));
  const [dobValue, setDobValue] = useState(admin.dob || '');
  const { user } = useAuth() as any;
  const myRoleId: number = user?.role_id ?? 99;
  const myId: string | undefined = user?._id;
  const isSuperAdmin = admin.role_id === 0;
  const canModify = !isSuperAdmin && myRoleId < admin.role_id && !(myRoleId >= 2 && myId && admin._id === myId);

  const resolveProfileUrl = (p?: string | null) => {
    if (!p) return 'https://placehold.co/150x150/1E293B/FFFFFF?text=👤';
    if (p.startsWith('/static') || p.startsWith('/api/')) return `${API_BASE_URL}${p}`;
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    // fallback treat as relative to API
    return `${API_BASE_URL}${p.startsWith('/') ? p : '/' + p}`;
  };

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => del(`/admin/users/${id}/`),
    onSuccess: () => {
      toast.success('Admin deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
    onError: () => {
      toast.error('Failed to delete admin.');
    }
  });

  const restrictMutation = useMutation<void, Error, { id: string; payload: AdminUpdatePayload }>({
    mutationFn: ({ id, payload }) => put(`/admin/users/${id}/`, payload),
    onSuccess: () => {
      toast.success('Admin status updated.');
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
    onError: () => {
      toast.error('Failed to update admin status.');
    }
  });

  const updateMutation = useMutation<void, Error, { id: string; payload: Partial<Admin> }>({
    mutationFn: ({ id, payload }) => put(`/admin/users/${id}/`, payload),
    onSuccess: () => {
      toast.success('Profile updated');
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setEditingEmail(false);
      setEditingPhone(false);
      setEditingDob(false);
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.detail || e?.message || 'Failed to update profile';
      toast.error(String(msg));
    }
  });

  const saveEmail = () => {
    if (!canModify) return;
    updateMutation.mutate({ id: admin._id, payload: { email: emailValue } });
  };
  const savePhone = () => {
    if (!canModify) return;
    const num = Number(mobileValue);
    if (!Number.isFinite(num)) {
      toast.error('Phone must be a number');
      return;
    }
    updateMutation.mutate({ id: admin._id, payload: { mobile_prefix: prefixValue, mobile_number: num } });
  };
  const saveDob = () => {
    if (!canModify) return;
    updateMutation.mutate({ id: admin._id, payload: { dob: dobValue } });
  };

  return (
    <TableRow className="border-b border-purple-500/30 hover:bg-purple-900/20">
      <TableCell className="px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsProfileDialogOpen(true)} className="shrink-0 focus:outline-none">
            <img
              src={resolveProfileUrl(admin.profile_picture).replace('150x150', '48x48')}
              alt={admin.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/40 hover:border-purple-400 transition"
            />
          </button>
          <div>
            <div className="font-semibold text-white">{admin.name}</div>
            <div className="text-xs text-gray-400">{admin.username}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-6 py-4">
        <div>{admin.email}</div>
        <div>{`${admin.mobile_prefix} ${admin.mobile_number}`}</div>
      </TableCell>
      <TableCell className="px-6 py-4">
        <Badge variant={admin.isRestricted ? 'destructive' : 'secondary'} className={admin.isRestricted ? 'bg-red-600/20 text-red-300 border-red-500/30' : 'bg-green-600/20 text-green-300 border-green-500/30'}>
          {admin.isRestricted ? 'Restricted' : 'Active'}
        </Badge>
      </TableCell>
      <TableCell className="px-6 py-4">{admin.role}</TableCell>
      <TableCell className="px-6 py-4">
        <div className="flex flex-wrap gap-2">
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white" onClick={() => setIsProfileDialogOpen(true)}>Open Profile</Button>
          <Button className="bg-red-600 text-white" disabled={!canModify} onClick={() => deleteMutation.mutate(admin._id)}>Delete</Button>
          <Button className="bg-amber-600 text-white" disabled={!canModify} onClick={() => restrictMutation.mutate({ id: admin._id, payload: { isRestricted: !admin.isRestricted } })}>
            {admin.isRestricted ? 'Unrestrict' : 'Restrict'}
          </Button>
        </div>
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="max-w-2xl bg-slate-900 border-purple-500/50 text-white">
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 flex flex-col items-center">
                <img
                  src={resolveProfileUrl(admin.profile_picture)}
                  alt={admin.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-purple-500/50"
                />
                <div className="mt-4 text-center">
                  <div className="text-lg font-semibold">{admin.name}</div>
                  <div className="text-sm text-gray-400">{admin.username}</div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/40 border border-purple-500/20 rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-wide text-purple-300/80">Email</div>
                      {canModify && (
                        editingEmail ? (
                          <div className="flex items-center gap-1">
                            <button className="text-green-400" onClick={saveEmail} title="Save"><Check className="w-4 h-4" /></button>
                            <button className="text-red-400" onClick={() => { setEditingEmail(false); setEmailValue(admin.email); }} title="Cancel"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button className="text-purple-300" onClick={() => setEditingEmail(true)} title="Edit"><Pencil className="w-4 h-4" /></button>
                        )
                      )}
                    </div>
                    {editingEmail ? (
                      <Input type="email" value={emailValue} onChange={(e) => setEmailValue(e.target.value)} className="bg-slate-900/60 border-purple-500/30 mt-1" />
                    ) : (
                      <div className="text-sm text-white mt-0.5 break-words">{emailValue}</div>
                    )}
                  </div>
                  <div className="bg-slate-800/40 border border-purple-500/20 rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-wide text-purple-300/80">Phone</div>
                      {canModify && (
                        editingPhone ? (
                          <div className="flex items-center gap-1">
                            <button className="text-green-400" onClick={savePhone} title="Save"><Check className="w-4 h-4" /></button>
                            <button className="text-red-400" onClick={() => { setEditingPhone(false); setPrefixValue(admin.mobile_prefix); setMobileValue(String(admin.mobile_number ?? '')); }} title="Cancel"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button className="text-purple-300" onClick={() => setEditingPhone(true)} title="Edit"><Pencil className="w-4 h-4" /></button>
                        )
                      )}
                    </div>
                    {editingPhone ? (
                      <div className="flex gap-2 mt-1">
                        <Input value={prefixValue} onChange={(e) => setPrefixValue(e.target.value)} className="bg-slate-900/60 border-purple-500/30 w-20" />
                        <Input type="tel" value={mobileValue} onChange={(e) => setMobileValue(e.target.value)} className="bg-slate-900/60 border-purple-500/30 flex-1" />
                      </div>
                    ) : (
                      <div className="text-sm text-white mt-0.5 break-words">{`${prefixValue} ${mobileValue}`}</div>
                    )}
                  </div>
                  <Info label="Role" value={`${admin.role} (ID ${admin.role_id})`} />
                  <Info label="Status" value={admin.isRestricted ? 'Restricted' : 'Active'} />
                  <div className="bg-slate-800/40 border border-purple-500/20 rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-wide text-purple-300/80">DOB</div>
                      {canModify && (
                        editingDob ? (
                          <div className="flex items-center gap-1">
                            <button className="text-green-400" onClick={saveDob} title="Save"><Check className="w-4 h-4" /></button>
                            <button className="text-red-400" onClick={() => { setEditingDob(false); setDobValue(admin.dob || ''); }} title="Cancel"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button className="text-purple-300" onClick={() => setEditingDob(true)} title="Edit"><Pencil className="w-4 h-4" /></button>
                        )
                      )}
                    </div>
                    {editingDob ? (
                      <Input type="date" value={dobValue} onChange={(e) => setDobValue(e.target.value)} className="bg-slate-900/60 border-purple-500/30 mt-1" />
                    ) : (
                      <div className="text-sm text-white mt-0.5 break-words">{dobValue || '—'}</div>
                    )}
                  </div>
                  <Info label="Last Login" value={admin.last_login ? new Date(admin.last_login).toLocaleString() : '—'} />
                  <Info label="Created By" value={admin.created_by || '—'} />
                  <Info label="Created At" value={admin.created_at ? new Date(admin.created_at).toLocaleString() : '—'} />
                  <Info label="Updated By" value={admin.updated_by || '—'} />
                  <Info label="Updated At" value={admin.updated_at ? new Date(admin.updated_at).toLocaleString() : '—'} />
                  <Info label="Last Profile Update" value={admin.last_profile_update ? new Date(admin.last_profile_update).toLocaleDateString() : '—'} />
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Permissions</div>
                  <div className="flex flex-wrap gap-2">
                    {(admin.permissions || []).length > 0 ? admin.permissions.map((p, idx) => (
                      <Badge key={idx} className="bg-slate-800 border border-purple-500/30 text-purple-200">{p}</Badge>
                    )) : <span className="text-gray-500">None</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Notification Preference</div>
                    <div className="flex flex-wrap gap-2">
                      {(admin.notification_preference || []).length > 0 ? admin.notification_preference.map((p, idx) => (
                        <Badge key={idx} className="bg-slate-800 border border-purple-500/30 text-purple-200">{p}</Badge>
                      )) : <span className="text-gray-500">None</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Notification List</div>
                    <div className="flex flex-wrap gap-2">
                      {(admin.notification_list || []).length > 0 ? admin.notification_list.map((p, idx) => (
                        <Badge key={idx} className="bg-slate-800 border border-purple-500/30 text-purple-200">{p}</Badge>
                      )) : <span className="text-gray-500">None</span>}
                    </div>
                  </div>
                </div>
                {/* no actions here; actions are visible in the table row */}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
};

const AdminForm = ({ roles, adminToEdit, onSuccess, onClose }: { roles: Role[]; adminToEdit?: Admin; onSuccess: () => void; onClose?: () => void; }) => {
  const auth = useAuth() as any;
  const myRoleId: number = auth?.user?.role_id ?? 99;
  type FormState = {
    name: string;
    email: string;
    username: string;
    mobile_prefix: string;
    mobile_number: number | string;
    password: string;
    role: string;
    role_id?: number;
    permissions: string[];
    isRestricted: boolean;
  };
  const [formData, setFormData] = useState<FormState>({
    name: adminToEdit?.name || '',
    email: adminToEdit?.email || '',
    username: adminToEdit?.username || '',
    mobile_prefix: adminToEdit?.mobile_prefix || '+91',
    mobile_number: adminToEdit?.mobile_number || '',
    password: '',
    role: adminToEdit?.role || '',
    role_id: adminToEdit?.role_id,
    permissions: adminToEdit?.permissions || [],
    isRestricted: adminToEdit?.isRestricted || false,
  });
  const [showPassword, setShowPassword] = useState(false);
  // Allowed roles: hide super admin always; only roles with role_id strictly greater than myRoleId
  const allowedRoles = roles.filter(r => r.role_id !== 0 && r.role_id > myRoleId);

  const mutation: UseMutationResult<void, Error, AdminCreationPayload | Partial<AdminUpdatePayload>> = useMutation<void, Error, AdminCreationPayload | Partial<AdminUpdatePayload>>({
    mutationFn: (payload) => {
      console.log('Payload being sent:', payload);
      return adminToEdit ? put(`/admin/users/${adminToEdit._id}/`, payload) : post('/admin/users/', payload);
    },
    onSuccess: () => {
      toast.success(`Admin ${adminToEdit ? 'updated' : 'created'} successfully.`);
      onSuccess();
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d: any) => d?.msg ?? JSON.stringify(d)).join('; ')
        : (detail || error?.message || 'An unexpected error occurred');
      toast.error(String(msg));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToEdit) {
      if (formData.role_id == null) {
        toast.error('Please select a role');
        return;
      }
      // CREATE: must satisfy AdminCreate requirements
      const payload: AdminCreationPayload = {
        ...formData,
        mobile_number: Number(formData.mobile_number),
      } as AdminCreationPayload;
      payload.hashed_password = payload.password;
      delete (payload as any).password;
      mutation.mutate(payload);
    } else {
      // UPDATE: send only changed fields
      const diff: Partial<AdminUpdatePayload> = {};
      if (formData.name !== adminToEdit.name) diff.name = formData.name;
      if (formData.email !== adminToEdit.email) diff.email = formData.email;
      // Username cannot be edited after creation
      if (formData.mobile_prefix !== adminToEdit.mobile_prefix) diff.mobile_prefix = formData.mobile_prefix;
      const mobileNum = Number(formData.mobile_number);
      if (mobileNum !== adminToEdit.mobile_number) diff.mobile_number = mobileNum;
      if (formData.isRestricted !== adminToEdit.isRestricted) diff.isRestricted = formData.isRestricted;
      if (formData.role_id !== adminToEdit.role_id) diff.role_id = formData.role_id;
      if (formData.role && formData.role !== adminToEdit.role) diff.role = formData.role;
      if (formData.password && String(formData.password).trim().length > 0) {
        diff.hashed_password = String(formData.password);
      }
      // role/permissions only if you actually surface editable controls for them
      // if changed: diff.role = formData.role; diff.permissions = formData.permissions;

      // If no changes, do nothing
      if (Object.keys(diff).length === 0) {
        toast.info('No changes to save.');
        return;
      }
      // Do NOT include created_by/created_at on update; backend will set updated metadata
      mutation.mutate(diff);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="role" className="text-purple-300">Role</Label>
          <select
            id="role"
            className="w-full bg-slate-800/50 border-purple-500/30 mt-1 rounded-md p-2"
            value={formData.role_id != null ? String(formData.role_id) : ''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                setFormData({ ...formData, role_id: undefined, role: '' });
                return;
              }
              const selected = allowedRoles.find(r => String(r.role_id) === val);
              if (selected) {
                setFormData({ ...formData, role_id: selected.role_id, role: selected.role_name });
              }
            }}
          >
            <option value="">Select role</option>
            {allowedRoles.map(r => (
              <option key={r._id} value={String(r.role_id)}>{r.role_name}</option>
            ))}
          </select>
        </div>
        <FormField label="Name" id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        <FormField label="Email" id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        {adminToEdit ? (
          <div>
            <Label htmlFor="username" className="text-purple-300">Username</Label>
            <Input id="username" className="bg-slate-800/50 border-purple-500/30 mt-1 opacity-70" value={formData.username} disabled />
            <div className="text-xs text-gray-400 mt-1">Username is permanent and cannot be changed.</div>
          </div>
        ) : (
          <FormField label="Username" id="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
        )}
        <div className="flex gap-2">
          <div className="w-1/3">
            <FormField label="Prefix" id="mobile_prefix" value={formData.mobile_prefix} onChange={(e) => setFormData({ ...formData, mobile_prefix: e.target.value })} />
          </div>
          <div className="w-2/3">
            <FormField label="Mobile" id="mobile_number" type="number" value={formData.mobile_number} onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value as unknown as number })} />
          </div>
        </div>
        {!adminToEdit && (
          <div className="relative">
            <FormField label="Password" id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="isRestricted" checked={formData.isRestricted} onCheckedChange={(checked) => setFormData({ ...formData, isRestricted: !!checked })} />
        <Label htmlFor="isRestricted">Restrict this admin</Label>
      </div>
      <div className="flex justify-end gap-4">
        {onClose && <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>}
        <Button type="submit" disabled={mutation.isPending || (!adminToEdit && allowedRoles.length === 0)}>{mutation.isPending ? 'Saving...' : 'Save Admin'}</Button>
      </div>
    </form>
  );
};

const FormField = ({ label, id, ...props }: { label: string, id: string, [key: string]: any }) => (
  <div>
    <Label htmlFor={id} className="text-purple-300">{label}</Label>
    <Input id={id} className="bg-slate-800/50 border-purple-500/30 mt-1" {...props} />
  </div>
);

export default AdminManagement;

// Small labeled value helper used in the profile dialog
function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-800/40 border border-purple-500/20 rounded-md p-2">
      <div className="text-xs uppercase tracking-wide text-purple-300/80">{label}</div>
      <div className="text-sm text-white mt-0.5 break-words">{String(value)}</div>
    </div>
  );
}

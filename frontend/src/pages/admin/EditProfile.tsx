import React, { useState, useEffect, useRef } from 'react';
import { Upload, User, Phone, Save, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { get, put, API_BASE_URL } from '../../api/api'; // Corrected relative import path
import { UserProfile } from '../../components/Profile'; // Corrected relative import path
import { toast } from 'sonner';

// This interface matches the ProfileUpdate Pydantic model from your FastAPI backend
export interface ProfileUpdatePayload {
  name?: string;
  mobile_number?: number;
  profile_picture?: string;
}

const EditProfile: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', mobile_number: '' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState('');
  const [lastProfileUpdate, setLastProfileUpdate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setInitialLoading(true);
        const userData = await get<UserProfile>('/profile/me');
        setFormData({
          name: userData.name,
          mobile_number: userData.mobile_number.toString(),
        });
        setRole(userData.role);
        // cache last_profile_update locally to avoid repeated API calls on every click
        setLastProfileUpdate((userData as any)?.last_profile_update || null);
        const pic = userData.profile_picture || null;
        setImagePreview(pic ? (pic.startsWith('/static') || pic.startsWith('/api/') ? `${API_BASE_URL}${pic}` : pic) : null);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError("Could not load your profile data. Please try again later.");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Client-side checks: size <= 2MB & image type
      const maxBytes = 2 * 1024 * 1024;
      if (file.size > maxBytes) {
        setError('File too large. Max 2 MB allowed.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Unsupported file type. Please upload an image.');
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  const preCheckAndOpenPicker = () => {
    if (lastProfileUpdate) {
      const lastDt = new Date(lastProfileUpdate);
      const nextAllowed = new Date(lastDt.getTime() + 30 * 24 * 60 * 60 * 1000);
      const now = new Date();
      if (now < nextAllowed) {
        const ms = nextAllowed.getTime() - now.getTime();
        const days = Math.floor(ms / (24 * 60 * 60 * 1000));
        const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        toast.error(`You can change your profile picture on ${nextAllowed.toLocaleString()} (in ${days} day(s) ${hours} hour(s)).`);
        return;
      }
    }
    fileInputRef.current?.click();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    const payload: ProfileUpdatePayload = {
      name: formData.name,
      mobile_number: parseInt(formData.mobile_number, 10),
      // profile_picture: newImageUrl // from your upload service
    };

    if (isNaN(payload.mobile_number!)) {
        setError("Phone number must be a valid number.");
        setIsSaving(false);
        return;
    }

    try {
      // If a new file is selected, upload it first
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        // Use fetch here to send multipart since our api.ts defaults JSON
        // Use API_BASE_URL to ensure calls go to backend origin
        const res = await fetch(`${API_BASE_URL}/api/profile/me/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
          body: formData,
        });
        if (!res.ok) {
          // Try to parse structured error with next_allowed
          let msg = 'Upload failed';
          try {
            const errJson = await res.json();
            const detail = (errJson && errJson.detail) || errJson;
            if (detail?.next_allowed) {
              const na = new Date(detail.next_allowed);
              const now = new Date();
              const ms = na.getTime() - now.getTime();
              const days = Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
              const hours = Math.max(0, Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)));
              toast.error(`Cooldown active. You can change your profile picture on ${na.toLocaleString()} (in ${days} day(s) ${hours} hour(s)).`);
              return;
            }
            if (typeof detail === 'string') msg = detail;
            else if (detail?.message) msg = detail.message;
          } catch (_) {
            const errText = await res.text();
            msg = errText || msg;
          }
          throw new Error(msg);
        }
        const updated = await res.json();
        // Update preview with server path
        const p = updated?.profile_picture || null;
        setImagePreview(p ? (String(p).startsWith('/static') || String(p).startsWith('/api/') ? `${API_BASE_URL}${p}` : p) : null);
      }
      // Using the 'put' helper directly from api.ts
      await put<UserProfile, ProfileUpdatePayload>('/profile/me', payload);
      navigate(-1); // Navigate back after a successful save
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Failed to save changes. Please check your input and try again. If uploading a new photo, ensure it's an image under 2 MB and you haven't changed it in the last 30 days.");
    } finally {
      setIsSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-8 max-w-4xl mx-auto my-10 border border-neutral-200 shadow-sm">
      <h1 className="text-3xl font-bold text-neutral-900 mb-2">Edit Profile</h1>
      <p className="text-sm text-neutral-500 mb-8">Update your personal details and profile picture.</p>
      
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Picture Section */}
        <div className="md:col-span-1 flex flex-col items-center">
          <div className="relative group w-40 h-40">
            <img
              src={imagePreview || 'https://placehold.co/160x160/f3f4f6/666?text=?'}
              alt="Profile Preview"
              className="w-full h-full rounded-full object-cover border-4 border-orange-200 bg-neutral-100"
            />
            <button
              type="button"
              onClick={preCheckAndOpenPicker}
              aria-label="Upload profile picture"
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Upload className="w-7 h-7" />
            </button>
          </div>
          <input ref={fileInputRef} type="file" id="profile-upload" className="hidden" accept="image/*" onChange={handleImageChange} />
          <p className="mt-4 text-center text-neutral-500 text-xs leading-relaxed">
            JPG / PNG / GIF / WEBP &lt; 2 MB.
            <br />Profile picture can be changed every 30 days.
          </p>
        </div>

        {/* User Details Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-white border border-neutral-300 rounded-md py-3 pl-12 pr-4 text-neutral-800 placeholder:text-neutral-400 focus:ring-2 focus:ring-orange-400/40 focus:border-orange-500 outline-none transition"
              placeholder="Full Name"
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
            <input
              type="tel"
              name="mobile_number"
              value={formData.mobile_number}
              onChange={handleInputChange}
              className="w-full bg-white border border-neutral-300 rounded-md py-3 pl-12 pr-4 text-neutral-800 placeholder:text-neutral-400 focus:ring-2 focus:ring-orange-400/40 focus:border-orange-500 outline-none transition"
              placeholder="Phone Number"
            />
          </div>

          <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-md p-4 text-sm">
            <span className="font-semibold text-orange-600 tracking-wide uppercase">Role</span>
            <span className="text-neutral-700 font-medium">{role}</span>
          </div>
          
          <div className="flex justify-end items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-neutral-600 py-2 px-5 rounded-md font-medium border border-neutral-300 hover:bg-neutral-100 transition-colors disabled:opacity-50"
              disabled={isSaving}
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 px-6 rounded-md font-semibold shadow hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;


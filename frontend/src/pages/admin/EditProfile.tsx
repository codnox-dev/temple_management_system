import React, { useState, useEffect } from 'react';
import { Upload, User, Phone, Save, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { get, put } from '../../api/api'; // Corrected relative import path
import { UserProfile } from '../../components/Profile'; // Corrected relative import path

// This interface matches the ProfileUpdate Pydantic model from your FastAPI backend
export interface ProfileUpdatePayload {
  name?: string;
  mobile_number?: number;
  profile_picture?: string;
}

const EditProfile: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', mobile_number: '' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState('');
  
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
        setImagePreview(userData.profile_picture || null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagePreview(URL.createObjectURL(file));
      // In a real app, you would handle file upload to a service (e.g., S3),
      // get a URL, and include that URL in the 'profile_picture' field of the payload.
    }
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
      // Using the 'put' helper directly from api.ts
      await put<UserProfile, ProfileUpdatePayload>('/profile/me', payload);
      navigate(-1); // Navigate back after a successful save
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Failed to save changes. Please check your input and try again.");
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
    <div className="bg-slate-900/80 backdrop-blur-lg rounded-2xl p-8 max-w-4xl mx-auto my-10 border border-purple-800/50 shadow-[0_0_30px_-10px_rgba(192,132,252,0.4)]">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">
        Edit Profile
      </h1>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Picture Section */}
        <div className="md:col-span-1 flex flex-col items-center">
          <div className="relative group w-48 h-48">
            <img 
              src={imagePreview || 'https://placehold.co/150x150/1E293B/FFFFFF?text=?'} 
              alt="Profile Preview" 
              className="w-full h-full rounded-full object-cover border-4 border-purple-500/50"
            />
            <label htmlFor="profile-upload" className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Upload className="w-8 h-8" />
              <input type="file" id="profile-upload" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
          <p className="mt-4 text-center text-gray-400 text-sm">
            Upload a new photo. <br /> We recommend a 1:1 aspect ratio.
          </p>
        </div>

        {/* User Details Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-slate-800/50 border border-purple-700/50 rounded-full py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all"
              placeholder="Full Name"
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input 
              type="tel" 
              name="mobile_number"
              value={formData.mobile_number}
              onChange={handleInputChange}
              className="w-full bg-slate-800/50 border border-purple-700/50 rounded-full py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all"
              placeholder="Phone Number"
            />
          </div>

          <div className="flex items-center gap-4 bg-slate-800/50 border border-purple-700/50 rounded-full p-4">
            <span className="text-sm font-semibold uppercase tracking-wider text-pink-300">Role:</span>
            <span className="text-white font-medium">{role}</span>
          </div>
          
          <div className="flex justify-end items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-300 py-2.5 px-6 rounded-full font-semibold hover:bg-slate-700/50 transition-colors"
              disabled={isSaving}
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-40 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 px-6 rounded-full font-semibold shadow-md hover:from-purple-500 hover:to-pink-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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


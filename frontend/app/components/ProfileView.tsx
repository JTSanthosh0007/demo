import { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRef } from 'react';
// import { getProfile, updateProfile, uploadProfilePhoto, type Profile } from '../lib/supabase';

interface ProfileViewProps {
  onBack: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comment out useEffect for fetching profile as Supabase is removed
  // useEffect(() => {
  //   const fetchProfile = async () => {
  //     // if (!initialProfile?.id) return; // Check if initialProfile has an ID
  //     try {
  //       setLoading(true);
  //       // Replace with your new profile fetching logic
  //       // const fetchedProfile = await getProfile(initialProfile.id); // Use Supabase function
  //       // setProfile(fetchedProfile);
  //     } catch (error) {
  //       console.error('Error fetching profile:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   // fetchProfile();
  // }, [initialProfile]); // Depend on initialProfile

  const handleSaveChanges = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      // Replace with your new profile update logic

      // Comment out profile photo upload as Supabase is removed
      // if (selectedFile) {
      //   const publicUrl = await uploadProfilePhoto(profile.id, selectedFile);
      //   setProfile(prev => (prev ? { ...prev, profile_photo_url: publicUrl } : null));
      // }

      // onProfileUpdate(profile); // Call the update handler
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-900" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
        </div>
      </div>

      {/* Profile Form */}
      <div className="max-w-3xl mx-auto w-full px-4 py-8">
        <form onSubmit={handleSaveChanges} className="space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-2xl text-gray-600">{profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="photo-upload"
                ref={fileInputRef}
              />
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full cursor-pointer hover:bg-gray-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </label>
            </div>
            <p className="text-sm text-gray-500">Click to change profile photo</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                id="full_name"
                required
                value={profile?.full_name || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                id="email"
                required
                value={profile?.email || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone_number"
                value={profile?.phone_number || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                type="date"
                id="date_of_birth"
                value={profile?.date_of_birth || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <div className="mt-2 flex gap-4">
                {['male', 'female', 'other'].map((option) => (
                  <label key={option} className="inline-flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value={option}
                      checked={profile?.gender === option}
                      onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value as any }))}
                      className="form-radio h-4 w-4 text-black border-gray-300 focus:ring-black"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 rounded-md text-white bg-black hover:bg-gray-800 transition-colors ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileView; 
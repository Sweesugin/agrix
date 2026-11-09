import React, { useState } from 'react';
import {
  User as UserIcon,
  MapPin,
  Sprout,
  Layers,
  Award,
  CheckCircle2,
  Save,
  Shield,
  Phone,
  Mail,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SoilType, FarmingMethod, ExperienceLevel } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, badges } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [state, setState] = useState(user?.state || '');
  const [farmSize, setFarmSize] = useState(String(user?.farmSize || '3.5'));
  const [soilType, setSoilType] = useState<SoilType>(user?.soilType || 'Loamy');
  const [mainCrop, setMainCrop] = useState(user?.mainCrop || 'Tomato');
  const [farmingMethod, setFarmingMethod] = useState<FarmingMethod>(user?.farmingMethod || 'Organic');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    user?.experienceLevel || 'Intermediate'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.updateProfile({
        name,
        phone,
        location,
        state,
        farmSize: parseFloat(farmSize) || 1,
        soilType,
        mainCrop,
        farmingMethod,
        experienceLevel,
      });
      await refreshUser();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Could not update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center gap-6 shadow-md">
        <img
          src={
            user?.avatarUrl ||
            'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=150&auto=format&fit=crop&q=80'
          }
          alt={user?.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-lg"
        />

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
            <span>{user?.role === 'admin' ? '🛡️ Administrator' : '🌾 Registered Farmer'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{user?.name}</h1>
          <p className="text-emerald-100 text-xs sm:text-sm">
            {user?.email} • {user?.location}, {user?.state}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <span className="px-3 py-1 bg-white/10 rounded-xl text-xs font-bold">
              Level {user?.level} ({user?.levelTitle})
            </span>
            <span className="px-3 py-1 bg-white/10 rounded-xl text-xs font-bold text-amber-300">
              {user?.points} Points
            </span>
            <span className="px-3 py-1 bg-white/10 rounded-xl text-xs font-bold text-orange-300">
              {user?.streak} Days Streak
            </span>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE FORM */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-stone-100 pb-4">
          <h2 className="text-lg font-bold text-stone-900">Farm & Agronomic Details</h2>
          <p className="text-xs text-stone-500">
            Updating your farm parameters automatically adapts the recommendation engine calculations.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Profile and agronomic settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Location / District</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Farm Size (Acres)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Primary Crop</label>
              <select
                value={mainCrop}
                onChange={(e) => setMainCrop(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Tomato">Tomato</option>
                <option value="Rice">Rice / Paddy</option>
                <option value="Banana">Banana</option>
                <option value="Sugarcane">Sugarcane</option>
                <option value="Groundnut">Groundnut</option>
                <option value="Wheat">Wheat</option>
                <option value="Vegetables">Mixed Vegetables</option>
                <option value="Millets">Millets</option>
                <option value="Cotton">Cotton</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Soil Texture</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value as SoilType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Loamy">Loamy</option>
                <option value="Clay">Clay</option>
                <option value="Sandy">Sandy</option>
                <option value="Silty">Silty</option>
                <option value="Black soil">Black soil</option>
                <option value="Red soil">Red soil</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Farming Method</label>
              <select
                value={farmingMethod}
                onChange={(e) => setFarmingMethod(e.target.value as FarmingMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Organic">Organic</option>
                <option value="Natural farming">Natural farming</option>
                <option value="Mixed">Mixed</option>
                <option value="Conventional">Conventional</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Experience Level</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Beginner">Beginner (&lt; 2 yrs)</option>
              <option value="Intermediate">Intermediate (2–7 yrs)</option>
              <option value="Experienced">Experienced (7+ yrs)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Farm Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* UNLOCKED BADGES PREVIEW */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">Your Badges</h2>
          <span className="text-xs text-stone-500 font-semibold">{badges.length} Unlocked</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {badges.map((b) => (
            <div key={b.id} className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center space-y-1">
              <div className="text-3xl mb-1">{b.icon}</div>
              <div className="text-xs font-bold text-stone-900">{b.name}</div>
              <div className="text-[10px] text-stone-500">{b.criteria}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

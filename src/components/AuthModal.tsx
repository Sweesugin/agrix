import React, { useState } from 'react';
import { X, Sprout, Lock, Mail, User as UserIcon, Phone, MapPin, Layers, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SoilType, FarmingMethod, ExperienceLevel } from '../types';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, authModalMode, setAuthModalMode, login, register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Anand');
  const [state, setState] = useState('Gujarat');
  const [farmSize, setFarmSize] = useState('3.5');
  const [soilType, setSoilType] = useState<SoilType>('Loamy');
  const [mainCrop, setMainCrop] = useState('Tomato');
  const [farmingMethod, setFarmingMethod] = useState<FarmingMethod>('Organic');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Intermediate');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (authModalMode === 'login') {
        await login(email, password);
      } else {
        await register({
          name,
          email,
          password,
          phone,
          location,
          state,
          farmSize: parseFloat(farmSize) || 1,
          soilType,
          mainCrop,
          farmingMethod,
          experienceLevel,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-y-auto border border-emerald-100 p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-stone-900">
              {authModalMode === 'login' ? 'Welcome Back to AgriX' : 'Farmer Registration'}
            </h2>
            <p className="text-xs text-stone-500">
              {authModalMode === 'login'
                ? 'Sign in to access your farm challenges, streaks & points'
                : 'Create your farm profile to receive tailored sustainable guidance'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Farm Size (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    placeholder="e.g. 3.5"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Location / District</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Anand"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Gujarat"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Main Crop</label>
                  <select
                    value={mainCrop}
                    onChange={(e) => setMainCrop(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
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
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Soil Type</label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value as SoilType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Farming Method</label>
                  <select
                    value={farmingMethod}
                    onChange={(e) => setFarmingMethod(e.target.value as FarmingMethod)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                  >
                    <option value="Organic">Organic</option>
                    <option value="Natural farming">Natural farming</option>
                    <option value="Mixed">Mixed</option>
                    <option value="Conventional">Conventional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                  >
                    <option value="Beginner">Beginner (&lt; 2 yrs)</option>
                    <option value="Intermediate">Intermediate (2–7 yrs)</option>
                    <option value="Experienced">Experienced (7+ yrs)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@agrix.org"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          {authModalMode === 'login' && (
            <div className="text-right">
              <span className="text-xs text-stone-400 italic">
                Tip: Demo accounts password is <strong className="text-emerald-700">agrix123</strong>
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {submitting
              ? 'Processing...'
              : authModalMode === 'login'
              ? 'Sign In to AgriX'
              : 'Complete Registration (+20 pts)'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-stone-100 text-center text-xs text-stone-600">
          {authModalMode === 'login' ? (
            <>
              Don't have an AgriX farm profile yet?{' '}
              <button
                type="button"
                onClick={() => setAuthModalMode('register')}
                className="font-bold text-emerald-700 hover:underline"
              >
                Register as a Farmer
              </button>
            </>
          ) : (
            <>
              Already registered on AgriX?{' '}
              <button
                type="button"
                onClick={() => setAuthModalMode('login')}
                className="font-bold text-emerald-700 hover:underline"
              >
                Sign In here
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

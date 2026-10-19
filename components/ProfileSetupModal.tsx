import React, { useState, useEffect } from 'react';
import { X, Camera, Save, Edit2, User, Mail, Phone, MapPin, Calendar, FileText, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { THEME_COLORS, GRADIENTS, BACKGROUNDS, SHADOWS, BORDER_RADIUS } from '../constants/theme';
import { supabase } from '../services/supabase';
import { useAlert } from './ProfessionalAlertSystem';
import { sendProfileEmailNotification, logProfileForEmail } from '../services/profileEmailService';
import { uploadToCloudinary } from '../services/cloudinary';
import { useIsMobile } from '../hooks/useIsMobile';

export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
  profilePic: string;
  joinedDate: string;
}

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profileData: ProfileData) => void;
  initialData?: Partial<ProfileData>;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const { showAlert } = useAlert();
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    bio: initialData?.bio || '',
    profilePic: initialData?.profilePic || '',
    joinedDate: initialData?.joinedDate || new Date().toISOString()
  });

  // Load existing profile data from Supabase on mount
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('Loading profile data for user:', user.id);
          
          // Load profile data from profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Error loading profile data:', profileError);
          } else if (profileData) {
            console.log('Profile data loaded:', profileData);
            setProfileData({
              name: profileData.name || '',
              email: profileData.email || '',
              phone: '', // Will load from mobile table
              address: profileData.location || '',
              bio: profileData.bio || '',
              profilePic: profileData.avatar || '',
              joinedDate: profileData.created_at || new Date().toISOString()
            });
          }

          // Load mobile number from mobile table
          const { data: mobileData, error: mobileError } = await supabase
            .from('mobile')
            .select('number')
            .eq('user_id', user.id)
            .single();

          if (mobileError) {
            console.log('No mobile number found or error:', mobileError);
          } else if (mobileData) {
            console.log('Mobile number loaded:', mobileData.number);
            setProfileData(prev => ({
              ...prev,
              phone: mobileData.number || ''
            }));
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    loadProfileData();
  }, []);

  const [previewImage, setPreviewImage] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const steps = [
    { title: 'Basic Info', icon: User, description: 'Name & Profile Picture' },
    { title: 'Contact', icon: Mail, description: 'Email & Phone' },
    { title: 'Location', icon: MapPin, description: 'Address Details' },
    { title: 'About', icon: FileText, description: 'Bio & Description' }
  ];

  useEffect(() => {
    if (initialData) {
      setProfileData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(file);
        setPreviewImage(cloudinaryUrl);
        setProfileData(prev => ({ ...prev, profilePic: cloudinaryUrl }));
      } catch (error) {
        console.error('Failed to upload profile picture to Cloudinary:', error);
        // Fallback to base64 if Cloudinary fails
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setPreviewImage(result);
          setProfileData(prev => ({ ...prev, profilePic: result }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('Starting profile save process...');
      
      // Check if Supabase is enabled
      if (!supabase) {
        showAlert('error', 'Database Connection Error', 'Please try again later.');
        return;
      }
      
      // Test Supabase connection first
      console.log('Testing Supabase connection...');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (connectionError) {
        console.error('Supabase connection test failed:', connectionError);
        console.error('Connection error details:', JSON.stringify(connectionError, null, 2));
        showAlert('error', 'Connection Failed', 'Cannot connect to database. Please check your internet connection and try again.');
        return;
      }
      
      console.log('Supabase connection test passed:', connectionTest);
      
      // Connect to Supabase and save profile data
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Failed to get user:', userError);
        console.error('User error details:', JSON.stringify(userError, null, 2));
        showAlert('error', 'Authentication Error', 'Please log in again.');
        return;
      }
      
      if (!user) {
        console.error('No authenticated user found');
        showAlert('warning', 'Login Required', 'Please log in to save your profile.');
        return;
      }
      
      console.log('User found:', user.id);
      
      // Prepare profile data for Supabase
      const profileUpdateData = {
        id: user.id,
        name: profileData.name || '',
        email: profileData.email || '',
        location: profileData.address || '',
        bio: profileData.bio || '',
        avatar: profileData.profilePic || '',
        updated_at: new Date().toISOString()
      };
      
      console.log('Saving profile data:', profileUpdateData);
      
      // Test table access before saving
      console.log('Testing profiles table access...');
      const { data: tableTest, error: tableError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (tableError) {
        console.error('Profiles table access test failed:', tableError);
        console.error('Table error details:', JSON.stringify(tableError, null, 2));
        showAlert('error', 'Database Access Error', 'Cannot access profiles table. Please contact support.');
        return;
      }
      
      console.log('Profiles table access test passed:', tableTest);
      
      // Update profile in Supabase
      console.log('Attempting to save profile...');
      const { error: profileError, data: savedProfileData } = await supabase
        .from('profiles')
        .upsert([profileUpdateData])
        .select();

      if (profileError) {
        console.error('Failed to save profile to Supabase:', profileError);
        console.error('Error details:', JSON.stringify(profileError, null, 2));
        console.error('Profile data being saved:', profileUpdateData);
        
        // Try to save without upsert (insert only)
        console.log('Trying insert instead of upsert...');
        const { error: insertError, data: insertData } = await supabase
          .from('profiles')
          .insert([profileUpdateData])
          .select();
          
        if (insertError) {
          console.error('Insert also failed:', insertError);
          console.error('Insert error details:', JSON.stringify(insertError, null, 2));
          console.error('Profile data for insert:', profileUpdateData);
          
          // Check if it's a network error
          if (insertError && typeof insertError === 'object' && 'message' in insertError && insertError.message && (
            (insertError.message as string).includes('fetch') || 
            (insertError.message as string).includes('network') ||
            (insertError.message as string).includes('connection') ||
            (insertError.message as string).includes('timeout')
          )) {
            showAlert('error', 'Network Error', 'Please check your internet connection and try again.');
          } else if (insertError && typeof insertError === 'object' && 'code' in insertError && insertError.code === '23505') {
            showAlert('warning', 'Profile Exists', 'Profile already exists. Please try updating instead.');
          } else if (insertError && typeof insertError === 'object' && 'code' in insertError && insertError.code === '23503') {
            showAlert('error', 'Invalid Data', 'Profile data is invalid. Please check your input and try again.');
          } else {
            showAlert('error', 'Database Error', `${insertError && typeof insertError === 'object' && 'message' in insertError ? insertError.message : 'Unknown error occurred'}. Please try again.`);
          }
          return;
        } else {
          console.log('Profile saved successfully with insert:', insertData);
        }
      } else {
        console.log('Profile saved to Supabase successfully:', savedProfileData);
      }
      
      // Save phone number to separate mobile table
      if (profileData.phone && profileData.phone.trim() !== '') {
        console.log('Saving mobile number:', profileData.phone);
        
        const mobileUpdateData = {
          user_id: user.id,
          number: profileData.phone,
          updated_at: new Date().toISOString()
        };
        
        console.log('Testing mobile table access...');
        const { data: mobileTest, error: mobileTestError } = await supabase
          .from('mobile')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (mobileTestError) {
          console.log('Mobile table not accessible or no record found, will try insert...');
        } else {
          console.log('Mobile table access test passed:', mobileTest);
        }
        
        const { error: mobileError, data: savedMobileData } = await supabase
          .from('mobile')
          .upsert([mobileUpdateData])
          .select();

        if (mobileError) {
          console.error('Failed to save mobile number to Supabase:', mobileError);
          console.error('Mobile error details:', JSON.stringify(mobileError, null, 2));
          
          // Try insert for mobile as well
          const { error: mobileInsertError, data: mobileInsertData } = await supabase
            .from('mobile')
            .insert([mobileUpdateData])
            .select();
            
          if (mobileInsertError) {
            console.error('Mobile insert also failed:', mobileInsertError);
            console.log('Profile saved but mobile number save failed');
          } else {
            console.log('Mobile number saved with insert:', mobileInsertData);
          }
        } else {
          console.log('Mobile number saved to mobile table successfully:', savedMobileData);
        }
      } else {
        console.log('No phone number to save');
      }
      
      console.log('Profile save process completed successfully');
      
      // Send email notification with profile details
      console.log('Sending profile email notification...');
      logProfileForEmail(profileData);
      
      const emailSent = await sendProfileEmailNotification(profileData);
      if (emailSent) {
        console.log('✅ Profile email notification sent successfully');
        showAlert('success', 'Profile Saved Successfully!', 'Your profile has been saved and you will receive an email confirmation shortly.');
      } else {
        console.log('⚠️ Profile email notification failed, but profile was saved');
        showAlert('success', 'Profile Saved Successfully!', 'Your profile has been saved. Email notification failed but your data is safe.');
      }
      
      await onSave(profileData);
      
      // Show "Try Our App" alert after profile setup
      setTimeout(() => {
        showAlert('info', '🎉 Profile Complete!', '📱 Try Our App - Download our mobile app for exclusive deals and faster shopping! Available on iOS and Android.', 15000, true);
      }, 1000);
      onClose();
    } catch (error) {
      console.error('Failed to save profile:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
      
      // Check if it's a network error
      if (error && typeof error === 'object' && 'message' in error && error.message && (
        (error.message as string).includes('fetch') || 
        (error.message as string).includes('network') ||
        (error.message as string).includes('connection') ||
        (error.message as string).includes('timeout')
      )) {
        showAlert('error', 'Network Error', 'Please check your internet connection and try again.');
      } else {
        showAlert('error', 'Database Error', `${error && typeof error === 'object' && 'message' in error ? error.message : 'Unknown error occurred'}. Please try again.`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return profileData.name.trim() !== '';
      case 1:
        return profileData.email.trim() !== '' && profileData.email.includes('@');
      case 2:
        return true; // Address is optional
      case 3:
        return true; // Bio is optional
      default:
        return false;
    }
  };

  // ─── MOBILE: simple clean step content ───────────────────────────────────────
  const renderMobileStepContent = () => {
    const inputClass =
      'w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-400 placeholder-gray-400';
    const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-5">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                  {previewImage || profileData.profilePic ? (
                    <img src={previewImage || profileData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={36} className="text-gray-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-gray-800 text-white rounded-full p-1.5 cursor-pointer hover:bg-gray-700 transition-colors">
                  <Camera size={14} />
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">Tap to upload photo</p>
            </div>
            <div>
              <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={inputClass}
                placeholder="Enter your full name"
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={inputClass}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={inputClass}
                placeholder="+92 3xx xxxxxxx"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <Calendar size={14} className="text-gray-400 flex-shrink-0" />
              <span>Member since: {new Date(profileData.joinedDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Full Address</label>
              <textarea
                value={profileData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={4}
                className={`${inputClass} resize-none`}
                placeholder="Enter your complete address"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center gap-1.5 border border-gray-200 rounded-lg p-3 bg-gray-50 text-center">
                <MapPin size={20} className="text-gray-500" />
                <p className="text-xs font-medium text-gray-700">Delivery Address</p>
                <p className="text-xs text-gray-400">Where orders are delivered</p>
              </div>
              <div className="flex flex-col items-center gap-1.5 border border-gray-200 rounded-lg p-3 bg-gray-50 text-center">
                <Phone size={20} className="text-gray-500" />
                <p className="text-xs font-medium text-gray-700">Contact Number</p>
                <p className="text-xs text-gray-400">For order updates</p>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Bio / Description</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={5}
                className={`${inputClass} resize-none`}
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // ─── DESKTOP: original animated step content ─────────────────────────────────
  const renderDesktopStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <div 
                  className="w-40 h-40 rounded-full p-1"
                  style={{
                    background: GRADIENTS.accent.pink,
                    boxShadow: `
                      0 0 40px ${THEME_COLORS.accent.pink[500]}40,
                      0 0 80px ${THEME_COLORS.accent.pink[500]}20,
                      inset 0 0 20px ${THEME_COLORS.accent.pink[500]}30
                    `,
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                  }}
                >
                  <div 
                    className="w-full h-full rounded-full overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, 
                        ${THEME_COLORS.dark.card}80 0%, 
                        ${THEME_COLORS.dark.surface}60 100%
                      )`,
                      backdropFilter: 'blur(5px)',
                      WebkitBackdropFilter: 'blur(5px)'
                    }}
                  >
                    {previewImage || profileData.profilePic ? (
                      <motion.img
                        src={previewImage || profileData.profilePic}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{ filter: 'drop-shadow(0 0 20px rgba(236, 72, 153, 0.3))' }}
                      />
                    ) : (
                      <motion.div
                        className="w-full h-full flex items-center justify-center relative"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div 
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `radial-gradient(circle, rgba(14,165,233,0.1) 0%, rgba(168,85,247,0.05) 50%, transparent 100%)`,
                            filter: 'blur(20px)',
                            WebkitFilter: 'blur(20px)',
                            animation: 'pulse 3s ease-in-out infinite'
                          }}
                        />
                        <motion.svg
                          width="80" height="80" viewBox="0 0 24 24" fill="none"
                          initial={{ rotate: 0, scale: 0.8 }}
                          animate={{ rotate: [0, 360], scale: [0.8, 1.1, 0.8] }}
                          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                          style={{ filter: 'drop-shadow(0 0 30px rgba(14,165,233,0.5))', position: 'relative', zIndex: 10 }}
                        >
                          <motion.circle cx="12" cy="12" r="10" stroke="url(#gradient1)" strokeWidth="2" fill="none"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeInOut" }} />
                          <motion.circle cx="12" cy="12" r="6" fill="url(#gradient2)"
                            initial={{ scale: 0 }} animate={{ scale: [0, 1, 0.8, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
                          <motion.path d="M12 4 1.42 1.42L16 8l-4 4" stroke="url(#gradient1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                            transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }} />
                          <motion.circle cx="12" cy="12" r="3" stroke="url(#gradient1)" strokeWidth="2" fill="none"
                            initial={{ scale: 0 }} animate={{ scale: [0, 1, 0.8, 1], opacity: [0, 1, 0.8, 1] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
                          {[...Array(4)].map((_, i) => (
                            <motion.circle key={i}
                              cx={12 + Math.cos((i * Math.PI) / 2) * 8}
                              cy={12 + Math.sin((i * Math.PI) / 2) * 8}
                              r="1"
                              fill={i % 2 === 0 ? THEME_COLORS.primary[500] : THEME_COLORS.accent.pink[500]}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                              transition={{ duration: 2, delay: i * 0.5, repeat: Infinity, ease: "easeInOut" }}
                            />
                          ))}
                          <defs>
                            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor={THEME_COLORS.primary[500]} />
                              <stop offset="25%" stopColor={THEME_COLORS.primary[600]} />
                              <stop offset="50%" stopColor={THEME_COLORS.secondary[500]} />
                              <stop offset="75%" stopColor={THEME_COLORS.secondary[600]} />
                              <stop offset="100%" stopColor={THEME_COLORS.accent.pink[500]} />
                            </linearGradient>
                            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor={THEME_COLORS.accent.pink[500]} />
                              <stop offset="33%" stopColor={THEME_COLORS.accent.pink[600]} />
                              <stop offset="66%" stopColor={THEME_COLORS.secondary[500]} />
                              <stop offset="100%" stopColor={THEME_COLORS.primary[500]} />
                            </linearGradient>
                            <radialGradient id="gradient3">
                              <stop offset="0%" stopColor={THEME_COLORS.primary[500]} stopOpacity="0.8" />
                              <stop offset="100%" stopColor={THEME_COLORS.accent.pink[500]} stopOpacity="0.3" />
                            </radialGradient>
                          </defs>
                        </motion.svg>
                      </motion.div>
                    )}
                  </div>
                </div>
                <motion.label
                  whileHover={{ scale: 1.15, boxShadow: `0 0 30px ${THEME_COLORS.primary[500]}60` }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-2 right-2 text-white rounded-full p-3 cursor-pointer transition-all"
                  style={{
                    background: GRADIENTS.primary.main,
                    boxShadow: `0 0 20px ${THEME_COLORS.primary[500]}40, 0 0 40px ${THEME_COLORS.primary[500]}20, inset 0 0 10px ${THEME_COLORS.primary[300]}50`,
                    backdropFilter: 'blur(5px)',
                    WebkitBackdropFilter: 'blur(5px)'
                  }}
                >
                  <Camera size={20} />
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </motion.label>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                style={{ color: THEME_COLORS.neutral[500] }}
                className="mt-4 text-center"
              >
                Click the camera icon to upload your photo
              </motion.p>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <label className="block text-sm font-semibold mb-3" style={{ color: THEME_COLORS.dark.textSecondary }}>
                Full Name *
              </label>
              <motion.input
                whileFocus={{ scale: 1.02, boxShadow: `0 0 30px ${THEME_COLORS.primary[500]}40` }}
                type="text"
                value={profileData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 transition-all text-lg"
                style={{
                  background: `linear-gradient(135deg, ${THEME_COLORS.dark.card}80 0%, ${THEME_COLORS.dark.surface}60 100%)`,
                  borderColor: `${THEME_COLORS.primary[200]}40`,
                  color: THEME_COLORS.dark.text,
                  borderRadius: BORDER_RADIUS['2xl'],
                  boxShadow: `inset 0 2px 4px ${THEME_COLORS.neutral[900]}50, 0 0 20px ${THEME_COLORS.primary[500]}20`,
                  backdropFilter: 'blur(5px)',
                  WebkitBackdropFilter: 'blur(5px)'
                }}
                placeholder="Enter your full name"
              />
            </motion.div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <label className="block text-sm font-semibold mb-3" style={{ color: THEME_COLORS.dark.textSecondary }}>
                Email Address *
              </label>
              <motion.input
                whileFocus={{ scale: 1.02, boxShadow: `0 0 30px ${THEME_COLORS.primary[500]}40` }}
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 transition-all text-lg"
                style={{
                  background: `linear-gradient(135deg, ${THEME_COLORS.dark.card}80 0%, ${THEME_COLORS.dark.surface}60 100%)`,
                  borderColor: `${THEME_COLORS.primary[200]}40`,
                  color: THEME_COLORS.dark.text,
                  borderRadius: BORDER_RADIUS['2xl'],
                  boxShadow: `inset 0 2px 4px ${THEME_COLORS.neutral[900]}50, 0 0 20px ${THEME_COLORS.primary[500]}20`,
                  backdropFilter: 'blur(5px)',
                  WebkitBackdropFilter: 'blur(5px)'
                }}
                placeholder="your@email.com"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <label className="block text-sm font-semibold mb-3" style={{ color: THEME_COLORS.dark.textSecondary }}>
                Phone Number
              </label>
              <motion.input
                whileFocus={{ scale: 1.02, boxShadow: `0 0 30px ${THEME_COLORS.primary[500]}40` }}
                type="tel"
                value={profileData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 transition-all text-lg"
                style={{
                  background: `linear-gradient(135deg, ${THEME_COLORS.dark.card}80 0%, ${THEME_COLORS.dark.surface}60 100%)`,
                  borderColor: `${THEME_COLORS.primary[200]}40`,
                  color: THEME_COLORS.dark.text,
                  borderRadius: BORDER_RADIUS['2xl'],
                  boxShadow: `inset 0 2px 4px ${THEME_COLORS.neutral[900]}50, 0 0 20px ${THEME_COLORS.primary[500]}20`,
                  backdropFilter: 'blur(5px)',
                  WebkitBackdropFilter: 'blur(5px)'
                }}
                placeholder="+92 3xx xxxxxxx"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-6"
              style={{
                background: `linear-gradient(135deg, ${THEME_COLORS.primary[50]}20 0%, ${THEME_COLORS.secondary[50]}20 100%)`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: `1px solid ${THEME_COLORS.primary[200]}30`,
                boxShadow: `0 0 20px ${THEME_COLORS.primary[500]}20, inset 0 1px 0 ${THEME_COLORS.primary[100]}30`
              }}
            >
              <div className="flex items-center text-sm" style={{ color: THEME_COLORS.dark.textSecondary }}>
                <Calendar className="mr-2" size={20} style={{ color: THEME_COLORS.primary[500] }} />
                <span>Member since: {new Date(profileData.joinedDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <label className="block text-sm font-semibold mb-3" style={{ color: THEME_COLORS.dark.textSecondary }}>
                Full Address
              </label>
              <motion.textarea
                whileFocus={{ scale: 1.02, boxShadow: `0 0 30px ${THEME_COLORS.primary[500]}40` }}
                value={profileData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={5}
                className="w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 transition-all text-lg resize-none"
                style={{
                  background: `linear-gradient(135deg, ${THEME_COLORS.dark.card}80 0%, ${THEME_COLORS.dark.surface}60 100%)`,
                  borderColor: `${THEME_COLORS.primary[200]}40`,
                  color: THEME_COLORS.dark.text,
                  borderRadius: BORDER_RADIUS['2xl'],
                  boxShadow: `inset 0 2px 4px ${THEME_COLORS.neutral[900]}50, 0 0 20px ${THEME_COLORS.primary[500]}20`,
                  backdropFilter: 'blur(5px)',
                  WebkitBackdropFilter: 'blur(5px)'
                }}
                placeholder="Enter your complete address"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div whileHover={{ scale: 1.05 }} className="rounded-2xl p-6 text-center"
                style={{
                  background: `linear-gradient(135deg, ${THEME_COLORS.accent.green[50]}20 0%, ${THEME_COLORS.accent.green[100]}30 100%)`,
                  backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                  border: `1px solid ${THEME_COLORS.accent.green[200]}30`,
                  boxShadow: `0 0 20px ${THEME_COLORS.accent.green[500]}20, inset 0 1px 0 ${THEME_COLORS.accent.green[100]}30`
                }}
              >
                <MapPin className="mx-auto mb-2" size={32} style={{ color: THEME_COLORS.accent.green[500] }} />
                <p className="text-sm font-medium" style={{ color: THEME_COLORS.dark.text }}>Delivery Address</p>
                <p className="text-xs mt-1" style={{ color: THEME_COLORS.dark.textMuted }}>Where orders are delivered</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="rounded-2xl p-6 text-center"
                style={{
                  background: `linear-gradient(135deg, ${THEME_COLORS.accent.blue[50]}20 0%, ${THEME_COLORS.accent.blue[100]}30 100%)`,
                  backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                  border: `1px solid ${THEME_COLORS.accent.blue[200]}30`,
                  boxShadow: `0 0 20px ${THEME_COLORS.accent.blue[500]}20, inset 0 1px 0 ${THEME_COLORS.accent.blue[100]}30`
                }}
              >
                <Phone className="mx-auto mb-2" size={32} style={{ color: THEME_COLORS.accent.blue[500] }} />
                <p className="text-sm font-medium" style={{ color: THEME_COLORS.dark.text }}>Contact Number</p>
                <p className="text-xs mt-1" style={{ color: THEME_COLORS.dark.textMuted }}>For order updates</p>
              </motion.div>
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <label className="block text-sm font-semibold mb-3" style={{ color: THEME_COLORS.dark.textSecondary }}>
                Bio / Description
              </label>
              <motion.textarea
                whileFocus={{ scale: 1.02, boxShadow: `0 0 30px ${THEME_COLORS.primary[500]}40` }}
                value={profileData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={6}
                className="w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 transition-all text-lg resize-none"
                style={{
                  background: `linear-gradient(135deg, ${THEME_COLORS.dark.card}80 0%, ${THEME_COLORS.dark.surface}60 100%)`,
                  borderColor: `${THEME_COLORS.primary[200]}40`,
                  color: THEME_COLORS.dark.text,
                  borderRadius: BORDER_RADIUS['2xl'],
                  boxShadow: `inset 0 2px 4px ${THEME_COLORS.neutral[900]}50, 0 0 20px ${THEME_COLORS.primary[500]}20`,
                  backdropFilter: 'blur(5px)',
                  WebkitBackdropFilter: 'blur(5px)'
                }}
                placeholder="Tell us about yourself..."
              />
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE UI — simple, clean, no animations
  // ─────────────────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50">
        <div className="w-full bg-white rounded-t-2xl flex flex-col max-h-[95vh] overflow-hidden shadow-xl">
          {/* Header */}
          <div className="bg-gray-900 text-white px-5 py-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold leading-tight">Complete Your Profile</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-700 transition-colors text-gray-300"
              >
                <X size={18} />
              </button>
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-1">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isDone = index < currentStep;
                const isActive = index === currentStep;
                return (
                  <React.Fragment key={index}>
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 transition-colors ${
                      isDone ? 'bg-green-500 text-white' : isActive ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {isDone ? <Check size={13} /> : <StepIcon size={13} />}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-0.5 bg-gray-700 rounded overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-300" style={{ width: index < currentStep ? '100%' : '0%' }} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {renderMobileStepContent()}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 px-5 py-4 flex justify-between items-center gap-3 bg-white">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                currentStep === 0
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50 bg-white'
              }`}
            >
              <ArrowLeft size={15} />
              Back
            </button>
            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Saving...</>
                ) : (
                  <><Save size={15} />Complete Profile</>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isStepValid() ? 'bg-gray-900 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP UI — original animated glassmorphism version
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)'
      }}
    >
      {/* Left Side - Adil */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="absolute left-8 top-1/2 transform -translate-y-1/2"
      >
        <motion.h1
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.8, 0.3], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-6xl font-black"
          style={{
            background: `linear-gradient(135deg, ${THEME_COLORS.primary[500]} 0%, ${THEME_COLORS.secondary[500]} 50%, ${THEME_COLORS.accent.pink[500]} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: `0 0 40px ${THEME_COLORS.primary[500]}50`,
            filter: 'drop-shadow(0 0 20px rgba(14, 165, 233, 0.5))'
          }}
        >
          Adil
        </motion.h1>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-2 h-2 rounded-full mt-2"
          style={{
            background: `linear-gradient(135deg, ${THEME_COLORS.primary[500]} 0%, ${THEME_COLORS.accent.pink[500]} 100%)`,
            boxShadow: `0 0 20px ${THEME_COLORS.primary[500]}60`
          }}
        />
      </motion.div>

      {/* Right Side - Ahmed */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="absolute right-8 top-1/2 transform -translate-y-1/2"
      >
        <motion.h1
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.8, 0.3], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="text-6xl font-black"
          style={{
            background: `linear-gradient(135deg, ${THEME_COLORS.secondary[500]} 0%, ${THEME_COLORS.accent.pink[500]} 50%, ${THEME_COLORS.primary[500]} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: `0 0 40px ${THEME_COLORS.secondary[500]}50`,
            filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.5))'
          }}
        >
          Ahmed
        </motion.h1>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="w-2 h-2 rounded-full mt-2"
          style={{
            background: `linear-gradient(135deg, ${THEME_COLORS.secondary[500]} 0%, ${THEME_COLORS.accent.pink[500]} 100%)`,
            boxShadow: `0 0 20px ${THEME_COLORS.secondary[500]}60`
          }}
        />
      </motion.div>

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 2 === 0 ? THEME_COLORS.primary[500] : THEME_COLORS.secondary[500],
            boxShadow: `0 0 10px ${i % 2 === 0 ? THEME_COLORS.primary[500] : THEME_COLORS.secondary[500]}60`,
            left: i % 2 === 0 ? '10%' : '90%',
            top: `${20 + i * 10}%`
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          background: `linear-gradient(135deg, rgba(10,15,28,0.95) 0%, rgba(15,23,42,0.9) 50%, rgba(12,74,110,0.85) 100%)`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1px solid ${THEME_COLORS.primary[200]}30`,
          borderRadius: BORDER_RADIUS['3xl'],
          boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px ${THEME_COLORS.primary[500]}20, inset 0 1px 0 ${THEME_COLORS.primary[100]}20`
        }}
      >
        {/* Header */}
        <div 
          className="text-white p-8 relative overflow-hidden flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${THEME_COLORS.secondary[600]} 0%, ${THEME_COLORS.secondary[700]} 50%, ${THEME_COLORS.secondary[800]} 100%)`,
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            borderBottom: `1px solid ${THEME_COLORS.primary[300]}30`
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
            style={{ background: `radial-gradient(circle, ${THEME_COLORS.primary[500]} 0%, transparent 70%)`, transform: 'translate(50%, -50%)', filter: 'blur(20px)' }}
          />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-20"
            style={{ background: `radial-gradient(circle, ${THEME_COLORS.accent.pink[500]} 0%, transparent 70%)`, transform: 'translate(-50%, 50%)', filter: 'blur(20px)' }}
          />
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold mb-2">
                  Complete Your Profile
                </motion.h2>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-purple-100">
                  Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
                </motion.p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mt-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`relative ${index <= currentStep ? 'bg-white text-purple-600' : 'bg-white bg-opacity-30 text-white'} rounded-full p-3 transition-all`}
                  >
                    <step.icon size={20} />
                    {index < currentStep && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1">
                        <Check size={12} />
                      </motion.div>
                    )}
                  </motion.div>
                  {index < steps.length - 1 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: index < currentStep ? '100%' : '0%' }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="w-16 h-1 bg-white bg-opacity-30 mx-2 rounded-full overflow-hidden"
                    >
                      <div className="h-full bg-white" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div 
          className="p-8 overflow-y-auto flex-1"
          style={{
            background: `linear-gradient(135deg, rgba(10,15,28,0.8) 0%, rgba(15,23,42,0.7) 100%)`,
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            borderTop: `1px solid ${THEME_COLORS.primary[200]}20`
          }}
        >
          <AnimatePresence mode="wait">
            {renderDesktopStepContent()}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex justify-between items-center mt-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center px-6 py-3 rounded-2xl font-medium transition-all"
              style={{
                background: currentStep === 0 ? `${THEME_COLORS.neutral[800]}30` : `${THEME_COLORS.neutral[700]}50`,
                color: currentStep === 0 ? THEME_COLORS.neutral[500] : THEME_COLORS.neutral[200],
                borderRadius: BORDER_RADIUS['2xl'],
                border: `1px solid ${THEME_COLORS.neutral[600]}30`,
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)'
              }}
            >
              <ArrowLeft size={20} className="mr-2" />
              Previous
            </motion.button>

            {currentStep === steps.length - 1 ? (
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={isSaving}
                className="text-white px-8 py-3 rounded-2xl font-medium transition-all flex items-center"
                style={{ background: GRADIENTS.secondary.main, borderRadius: BORDER_RADIUS['2xl'], boxShadow: SHADOWS.secondary }}
              >
                {isSaving ? (
                  <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />Saving...</>
                ) : (
                  <><Save size={20} className="mr-2" />Complete Profile</>
                )}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex items-center px-6 py-3 rounded-2xl font-medium transition-all"
                style={{
                  background: !isStepValid() ? THEME_COLORS.neutral[100] : GRADIENTS.primary.main,
                  color: !isStepValid() ? THEME_COLORS.neutral[400] : 'white',
                  borderRadius: BORDER_RADIUS['2xl'],
                  boxShadow: !isStepValid() ? 'none' : SHADOWS.primary
                }}
              >
                Next
                <ArrowRight size={20} className="ml-2" />
              </motion.button>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { ProfileSetupModal } from './ProfileSetupModal';
import { useStore } from '../store/StoreContext';
import { useAlert } from './ProfessionalAlertSystem';
import { setGlobalAlert } from '../store/StoreContext';

export const ProfileModalWrapper: React.FC = () => {
  const { currentUser, showProfileSetup, setShowProfileSetup, updateProfile } = useStore();
  const { showAlert } = useAlert();

  // Set global alert function when component mounts
  useEffect(() => {
    setGlobalAlert(showAlert);
  }, [showAlert]);

  const handleSave = async (profileData: any) => {
    // Save profile data to user profile
    if (currentUser) {
      await updateProfile({
        ...currentUser,
        phone: profileData.phone,
        address: profileData.address,
        bio: profileData.bio,
        profilePic: profileData.profilePic
      });
    }
  };

  const getInitialData = () => {
    if (!currentUser) return undefined;
    
    return {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || '',
      address: currentUser.address || '',
      bio: currentUser.bio || '',
      profilePic: currentUser.profilePic || '',
      joinedDate: currentUser.joinedDate
    };
  };

  return (
    <ProfileSetupModal
      isOpen={showProfileSetup}
      onClose={() => setShowProfileSetup(false)}
      onSave={handleSave}
      initialData={getInitialData()}
    />
  );
};

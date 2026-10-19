// Profile email notification service with complete details
export const sendProfileEmailNotification = async (profileData: any): Promise<boolean> => {
  try {
    // Using Web3Forms with simple text format (no HTML)
    const formData = new FormData();
    formData.append('access_key', 'c8f29373-4d3a-4355-8dcb-83bcb5809716');
    formData.append('subject', `👤 Naya User Profile Banaya - ${profileData.name}`);
    formData.append('from_name', 'Zaman Mall');
    formData.append('to', 'malikmuhammadadilzaman@gmail.com');
    
    const emailContent = `
🏪 ZAMAN MALL - NAYA USER PROFILE BANAYA 👤

📋 PROFILE INFORMATION:
🔸 Pura Naam: ${profileData.name}
🔸 Email: ${profileData.email}
🔸 Phone: ${profileData.phone || 'Available nahi hai'}
🔸 Address: ${profileData.address || 'Available nahi hai'}
🔸 Bio: ${profileData.bio || 'Koi bio nahi di gayi'}
🔸 Joining Date: ${new Date(profileData.joinedDate).toLocaleString('en-IN', { 
  day: '2-digit', 
  month: '2-digit', 
  year: 'numeric', 
  hour: '2-digit', 
  minute: '2-digit' 
})}

📸 PROFILE STATUS:
🔸 Profile Photo: ${profileData.profilePic ? '✅ Upload ki gayi hai' : '❌ Upload nahi ki gayi'}

📞 CONTACT DETAILS:
🔸 Primary Email: ${profileData.email}
🔸 Phone Number: ${profileData.phone || 'Available nahi hai'}
🔸 Location: ${profileData.address || 'Available nahi hai'}

📝 ABOUT USER:
🔸 Bio: ${profileData.bio || 'Koi bio nahi di gayi'}

🚀 QUICK ACTIONS:
🔸 User ko email karein: ${profileData.email}
🔸 Phone karein: ${profileData.phone || 'Available nahi hai'}
🔸 Website par jayein: zamanmall.netlify.app

---
🏪 ZAMAN MALL 
📞 Customer Support: +923365942212
🌐 Website: zamanmall.netlify.app
📧 Email: malikmuhammadadilzaman@gmail.com

🔥 Naye user ne successfully apna profile banaya hai!
Ye ek automatic notification hai from Zaman Mall.
    `;
    
    formData.append('message', emailContent);

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      console.log('✅ Profile notification email sent successfully with complete details');
      return true;
    } else {
      console.log('⚠️ Profile email service response:', await response.text());
      return false;
    }

  } catch (error: any) {
    console.error('⚠️ Profile email notification failed:', error);
    return false;
  }
};

export const logProfileForEmail = (profileData: any) => {
  console.log('👤 PROFILE DETAILS FOR EMAIL:');
  console.log('Name:', profileData.name);
  console.log('Email:', profileData.email);
  console.log('Phone:', profileData.phone);
  console.log('Address:', profileData.address);
  console.log('Bio:', profileData.bio);
  console.log('Joined Date:', profileData.joinedDate);
  console.log('Profile Picture:', profileData.profilePic ? 'Yes' : 'No');
};

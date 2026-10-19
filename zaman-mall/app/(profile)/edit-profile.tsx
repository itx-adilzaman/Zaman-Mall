import SafeScreen from "@/components/SafeScreen";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { useAlert } from "@/context/AlertContext";
import PremiumButton from "@/components/PremiumButton";
import PremiumTextInput from "@/components/PremiumTextInput";


export default function EditProfileScreen() {
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawFirst = (params as any)?.first;
  const isFirstSetup = rawFirst === "1" || rawFirst === "true";
  const { user } = useAuth();
  
  const [name, setName] = useState(user?.user_metadata?.name || user?.user_metadata?.full_name || "");
  const [phone, setPhone] = useState(user?.user_metadata?.phone || "");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [newAvatarBase64, setNewAvatarBase64] = useState<string | null>(null);
  const { pickImage, uploadImage } = useImageUpload();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('bio, avatar, number, name')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        setBio(data.bio || "");
        const dbAvatar = data.avatar || null;
        setAvatar(dbAvatar);
        
        // Fix phone number display: try 'number' from profiles table first, then 'phone' from auth metadata
        const dbPhone = data.number || user?.user_metadata?.phone || "";
        setPhone(dbPhone);
        
        // If name exists in profiles, update name state too
        const dbName = (data as any).name || user?.user_metadata?.full_name || user?.user_metadata?.name || "";
        if (dbName) setName(dbName);
        
        // Handle preview for existing image
        if (dbAvatar) {
          if (dbAvatar.startsWith('http') || dbAvatar.startsWith('data:')) {
            setPreviewImage(dbAvatar);
          } else {
            // Check if it's likely a base64 string
            const isBase64 = /^[A-Za-z0-9+/=]+$/.test(dbAvatar.replace(/\s/g, ''));
            if (isBase64) {
              setPreviewImage(`data:image/jpeg;base64,${dbAvatar}`);
            } else {
              setPreviewImage(dbAvatar);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let finalAvatarValue = avatar;

      // If there's a new image, upload it to Cloudinary
      if (newAvatarBase64 && previewImage) {
        try {
          finalAvatarValue = await uploadImage(previewImage, newAvatarBase64);
        } catch (uploadErr: any) {
          throw new Error("Failed to upload image: " + uploadErr.message);
        }
      }

      // Update Supabase Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { name, phone }
      });

      if (authError) throw authError;

      // Upsert Profiles table (inserts if row doesn't exist, updates if it does)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          email: user.email || "",
          name, 
          number: phone, 
          bio, 
          avatar: finalAvatarValue 
        });

      if (profileError) throw profileError;

      const handleContinue = () => {
        if (isFirstSetup) {
          router.replace("/(tabs)");
        } else {
          router.back();
        }
      };

      showAlert({
        title: "Success",
        message: "Profile updated successfully!",
        icon: "checkmark-circle-outline",
        buttons: [{ text: isFirstSetup ? "Continue" : "Great", onPress: handleContinue }]
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showAlert({
        title: "Update Failed",
        message: error.message || "Something went wrong while updating profile",
        icon: "alert-circle-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await pickImage({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true
      });
      
      if (result) {
        setPreviewImage(result.uri);
        setNewAvatarBase64(result.base64 || null);
        console.log("Image picked, URI:", result.uri);
      }
    } catch (error) {
      console.error("Image pick error:", error);
      showAlert({
        title: "Error",
        message: "Failed to pick image",
        icon: "image-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
    }
  };

  const getImageSource = () => {
    if (previewImage) {
      return { uri: previewImage };
    }
    const fallbackName = name || user?.user_metadata?.name || user?.user_metadata?.full_name || "User";
    return { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=1DB954&color=fff&size=128` };
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header */}
          <View 
            className="px-6 pt-4 pb-4 flex-row items-center justify-between border-b"
            style={{ borderColor: colors.glassBorder }}
          >
            {isFirstSetup ? (
              <TouchableOpacity
                onPress={() => router.replace("/(tabs)")}
                className="px-3 py-2 rounded-full"
                style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder, borderWidth: 1 }}
              >
                <Text style={{ color: colors.textSecondary }} className="text-sm font-medium">Skip</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={() => router.back()} 
                className="w-10 h-10 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder, borderWidth: 1 }}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
            <Text style={{ color: colors.text }} className="text-xl font-bold tracking-tight">
              {isFirstSetup ? "Complete Profile" : "Edit Profile"}
            </Text>
            <View className="w-10" />
          </View>

          {/* Avatar Section */}
          <View className="items-center py-8">
            <View className="relative">
              <TouchableOpacity 
                onPress={handleImagePick}
                activeOpacity={0.8}
                className="w-32 h-32 rounded-full border-4 overflow-hidden relative"
                style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }}
              >
                <Image
                  key={previewImage || 'default'}
                  source={previewImage ? { uri: previewImage } : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=1DB954&color=fff&size=128` }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={200}
                />
                
                {/* Camera Overlay */}
                <View className="absolute inset-0 bg-black/30 items-center justify-center opacity-0 hover:opacity-100">
                  <Ionicons name="camera" size={32} color="#fff" />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleImagePick}
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full items-center justify-center border-4 shadow-lg"
                style={{ backgroundColor: colors.primary, borderColor: colors.background }}
              >
                <Ionicons name="camera" size={18} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.textSecondary }} className="text-sm mt-3 font-medium">Tap to change profile picture</Text>
          </View>

          {/* Form Fields */}
          <View className="px-6">
            <View 
              className="rounded-3xl p-6 border"
              style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }}
            >
              <View className="flex-row items-center mb-6">
                <Ionicons name="person-circle-outline" size={24} color={colors.primary} className="mr-2" />
                <Text style={{ color: colors.text }} className="font-bold text-lg">Personal Details</Text>
              </View>

              {/* Name Input */}
              <PremiumTextInput
                label="Full Name"
                icon="person-outline"
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
              />

              {/* Phone Input */}
              <PremiumTextInput
                label="Phone Number"
                icon="call-outline"
                placeholder="Enter your phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              {/* Bio Input */}
              <PremiumTextInput
                label="Bio"
                icon="information-circle-outline"
                placeholder="Tell us about yourself..."
                value={bio}
                onChangeText={setBio}
                multiline
                textAlignVertical="top"
                style={{ minHeight: 120 }}
              />
            </View>

            {/* Action Buttons */}
            <View className="mt-8 mb-6">
              <PremiumButton
                title="Save Changes"
                colors={[colors.primary, colors.primary] as [string, string]}
                onPress={handleUpdate}
                disabled={loading}
                loading={loading}
              />
              
              {!isFirstSetup && (
                <TouchableOpacity 
                  onPress={() => router.back()}
                  className="mt-4 py-4 rounded-2xl items-center border"
                  style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }}
                >
                  <Text style={{ color: colors.text }} className="font-medium text-base">Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

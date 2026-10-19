import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useAlert } from "@/context/AlertContext";
import { supabase } from "@/lib/supabase";
import PremiumTextInput from "@/components/PremiumTextInput";
import { PAKISTAN_DATA } from "../data/pakistan-data";

interface AddressFormData {
  label: string;
  fullName: string;
  streetAddress: string;
  city: string;
  province: string;
  district: string;
  tehsil: string;
  phone: string;
  isDefault: boolean;
}

interface AddressFormModalProps {
  visible: boolean;
  isEditing: boolean;
  addressForm: AddressFormData;
  isAddingAddress: boolean;
  isUpdatingAddress: boolean;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (form: AddressFormData) => void;
}

const AddressFormModal = ({
  addressForm,
  isAddingAddress,
  isEditing,
  isUpdatingAddress,
  onClose,
  onFormChange,
  onSave,
  visible,
}: AddressFormModalProps) => {
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showTehsilDropdown, setShowTehsilDropdown] = useState(false);
  
  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [tehsilSearch, setTehsilSearch] = useState("");

  const getDistricts = () => {
    if (!addressForm.province) return [];
    const province = PAKISTAN_DATA.find(p => p.name === addressForm.province);
    return province ? province.districts : [];
  };

  const getTehsils = () => {
    if (!addressForm.district) return [];
    const province = PAKISTAN_DATA.find(p => p.name === addressForm.province);
    const district = province?.districts.find(d => d.name === addressForm.district);
    return district ? district.tehsils : [];
  };

  const filteredProvinces = PAKISTAN_DATA.filter(p => 
    p.name.toLowerCase().includes(provinceSearch.toLowerCase())
  );

  const filteredDistricts = getDistricts().filter(d => 
    d.name.toLowerCase().includes(districtSearch.toLowerCase())
  );

  const filteredTehsils = getTehsils().filter(t => 
    t.toLowerCase().includes(tehsilSearch.toLowerCase())
  );

  const handleProvinceSelect = (provinceName: string) => {
    onFormChange({
      ...addressForm,
      province: provinceName,
      district: "",
      tehsil: "",
      city: "",
    });
    setShowProvinceDropdown(false);
    setProvinceSearch("");
  };

  const handleDistrictSelect = (districtName: string) => {
    onFormChange({
      ...addressForm,
      district: districtName,
      tehsil: "",
      city: districtName,
    });
    setShowDistrictDropdown(false);
    setDistrictSearch("");
  };

  const handleTehsilSelect = (tehsilName: string) => {
    onFormChange({
      ...addressForm,
      tehsil: tehsilName,
    });
    setShowTehsilDropdown(false);
    setTehsilSearch("");
  };

  const handleSave = () => {
    if (
      !addressForm.label ||
      !addressForm.fullName ||
      !addressForm.streetAddress ||
      !addressForm.city ||
      !addressForm.province ||
      !addressForm.district ||
      !addressForm.tehsil ||
      !addressForm.phone
    ) {
      showAlert({
        title: "Missing Info",
        message: "Please fill in all the required fields.",
        icon: "information-circle-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
      return;
    }
    onSave();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 bg-black/80">
          <View 
            className="flex-1 mt-10 rounded-t-3xl overflow-hidden"
            style={{ backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }}
          >
            {/* HEADER */}
            <View 
              className="px-6 py-5 border-b flex-row items-center justify-between"
              style={{ 
                backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
              }}
            >
              <Text style={{ color: colors.text }} className="text-xl font-bold tracking-tight">
                {isEditing ? "Edit Address" : "Add New Address"}
              </Text>
              <TouchableOpacity 
                onPress={onClose} 
                className="p-2 rounded-full"
                style={{ backgroundColor: colors.glassSurface }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 50 }}
              showsVerticalScrollIndicator={false}
            >
              <View className="p-6">
                {/* Contact Information Section */}
                <View className="mb-8">
                  <Text style={{ color: colors.primary }} className="font-bold text-sm uppercase tracking-wider mb-4">Contact Information</Text>
                  
                  {/* LABEL INPUT */}
                  <PremiumTextInput
                    label="Label (e.g. Home, Work)"
                    icon="bookmark-outline"
                    placeholder="e.g., Home, Work, Office"
                    value={addressForm.label}
                    onChangeText={(text) => onFormChange({ ...addressForm, label: text })}
                  />

                  {/* NAME INPUT */}
                  <PremiumTextInput
                    label="Full Name"
                    icon="person-outline"
                    placeholder="Enter your full name"
                    value={addressForm.fullName}
                    onChangeText={(text) => onFormChange({ ...addressForm, fullName: text })}
                  />

                  {/* Phone Number */}
                  <PremiumTextInput
                    label="Phone Number"
                    icon="call-outline"
                    placeholder="+92 300 1234567"
                    value={addressForm.phone}
                    onChangeText={(text) => onFormChange({ ...addressForm, phone: text })}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Location Details Section */}
                <View className="mb-6">
                  <Text style={{ color: colors.primary }} className="font-bold text-sm uppercase tracking-wider mb-4">Location Details</Text>

                  {/* Province Dropdown */}
                  <View className="mb-4">
                    <Text style={{ color: colors.textSecondary }} className="text-xs font-bold mb-2 ml-1 uppercase">Province</Text>
                    <TouchableOpacity
                      className="px-4 py-3 rounded-2xl text-base flex-row justify-between items-center border"
                      style={{ 
                        backgroundColor: colors.glassSurface,
                        borderColor: colors.glassBorder
                      }}
                      onPress={() => setShowProvinceDropdown(!showProvinceDropdown)}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="map-outline" size={20} color={colors.textSecondary} />
                        <Text 
                          className="ml-3 text-base"
                          style={{ color: addressForm.province ? colors.text : (isDark ? "#666" : "#999") }}
                        >
                          {addressForm.province || "Select Province"}
                        </Text>
                      </View>
                      <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    
                    {showProvinceDropdown && (
                      <View 
                        className="rounded-2xl mt-2 max-h-72 overflow-hidden border shadow-2xl"
                        style={{ 
                          backgroundColor: colors.glassSurface,
                          borderColor: colors.glassBorder
                        }}
                      >
                        <View className="p-3 border-b" style={{ borderBottomColor: colors.glassBorder }}>
                          <View className="flex-row items-center bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2">
                            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                            <TextInput
                              className="flex-1 ml-2 text-sm"
                              style={{ color: colors.text }}
                              placeholder="Search Province..."
                              placeholderTextColor={isDark ? "#666" : "#999"}
                              value={provinceSearch}
                              onChangeText={setProvinceSearch}
                            />
                          </View>
                        </View>
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                          {filteredProvinces.map((province) => (
                            <TouchableOpacity
                              key={province.name}
                              className="px-4 py-4 border-b flex-row justify-between items-center"
                              style={{ borderBottomColor: colors.glassBorder }}
                              onPress={() => handleProvinceSelect(province.name)}
                            >
                              <Text style={{ color: colors.text, fontWeight: addressForm.province === province.name ? "bold" : "normal" }}>
                                {province.name}
                              </Text>
                              {addressForm.province === province.name && (
                                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                              )}
                            </TouchableOpacity>
                          ))}
                          {filteredProvinces.length === 0 && (
                            <View className="p-8 items-center">
                              <Ionicons name="search-outline" size={32} color={colors.textSecondary} />
                              <Text style={{ color: colors.textSecondary }} className="mt-2">No province found</Text>
                            </View>
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {/* District Dropdown */}
                  <View className="mb-4">
                    <Text style={{ color: colors.textSecondary }} className="text-xs font-bold mb-2 ml-1 uppercase">District</Text>
                    <TouchableOpacity
                      className="px-4 py-3 rounded-2xl text-base flex-row justify-between items-center border"
                      style={{ 
                        backgroundColor: colors.glassSurface,
                        borderColor: colors.glassBorder
                      }}
                      onPress={() => {
                        if (addressForm.province) {
                          setShowDistrictDropdown(!showDistrictDropdown);
                          setShowProvinceDropdown(false);
                          setShowTehsilDropdown(false);
                        } else {
                          showAlert({
                            title: 'Required',
                            message: 'Please select a province first',
                            icon: 'information-circle-outline',
                            buttons: [{ text: 'OK', onPress: () => {} }]
                          });
                        }
                      }}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="business-outline" size={20} color={colors.textSecondary} />
                        <Text 
                          className="ml-3 text-base"
                          style={{ color: addressForm.district ? colors.text : (isDark ? "#666" : "#999") }}
                        >
                          {addressForm.district || "Select District"}
                        </Text>
                      </View>
                      <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    
                    {showDistrictDropdown && (
                      <View 
                        className="rounded-2xl mt-2 max-h-72 overflow-hidden border shadow-2xl"
                        style={{ 
                          backgroundColor: colors.glassSurface,
                          borderColor: colors.glassBorder
                        }}
                      >
                        <View className="p-3 border-b" style={{ borderBottomColor: colors.glassBorder }}>
                          <View className="flex-row items-center bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2">
                            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                            <TextInput
                              className="flex-1 ml-2 text-sm"
                              style={{ color: colors.text }}
                              placeholder="Search District..."
                              placeholderTextColor={isDark ? "#666" : "#999"}
                              value={districtSearch}
                              onChangeText={setDistrictSearch}
                            />
                          </View>
                        </View>
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                          {filteredDistricts.map((district) => (
                            <TouchableOpacity
                              key={district.name}
                              className="px-4 py-4 border-b flex-row justify-between items-center"
                              style={{ borderBottomColor: colors.glassBorder }}
                              onPress={() => handleDistrictSelect(district.name)}
                            >
                              <Text style={{ color: colors.text, fontWeight: addressForm.district === district.name ? "bold" : "normal" }}>
                                {district.name}
                              </Text>
                              {addressForm.district === district.name && (
                                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                              )}
                            </TouchableOpacity>
                          ))}
                          {filteredDistricts.length === 0 && (
                            <View className="p-8 items-center">
                              <Ionicons name="search-outline" size={32} color={colors.textSecondary} />
                              <Text style={{ color: colors.textSecondary }} className="mt-2">No district found</Text>
                            </View>
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {/* Tehsil Dropdown */}
                  <View className="mb-4">
                    <Text style={{ color: colors.textSecondary }} className="text-xs font-bold mb-2 ml-1 uppercase">Tehsil</Text>
                    <TouchableOpacity
                      className="px-4 py-3 rounded-2xl text-base flex-row justify-between items-center border"
                      style={{ 
                        backgroundColor: colors.glassSurface,
                        borderColor: colors.glassBorder
                      }}
                      onPress={() => {
                        if (addressForm.district) {
                          setShowTehsilDropdown(!showTehsilDropdown);
                          setShowProvinceDropdown(false);
                          setShowDistrictDropdown(false);
                        } else {
                          showAlert({
                            title: 'Required',
                            message: 'Please select a district first',
                            icon: 'information-circle-outline',
                            buttons: [{ text: 'OK', onPress: () => {} }]
                          });
                        }
                      }}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
                        <Text 
                          className="ml-3 text-base"
                          style={{ color: addressForm.tehsil ? colors.text : (isDark ? "#666" : "#999") }}
                        >
                          {addressForm.tehsil || "Select Tehsil"}
                        </Text>
                      </View>
                      <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    
                    {showTehsilDropdown && (
                      <View 
                        className="rounded-2xl mt-2 max-h-72 overflow-hidden border shadow-2xl"
                        style={{ 
                          backgroundColor: colors.glassSurface,
                          borderColor: colors.glassBorder
                        }}
                      >
                        <View className="p-3 border-b" style={{ borderBottomColor: colors.glassBorder }}>
                          <View className="flex-row items-center bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2">
                            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                            <TextInput
                              className="flex-1 ml-2 text-sm"
                              style={{ color: colors.text }}
                              placeholder="Search Tehsil..."
                              placeholderTextColor={isDark ? "#666" : "#999"}
                              value={tehsilSearch}
                              onChangeText={setTehsilSearch}
                            />
                          </View>
                        </View>
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                          {filteredTehsils.map((tehsil) => (
                            <TouchableOpacity
                              key={tehsil}
                              className="px-4 py-4 border-b flex-row justify-between items-center"
                              style={{ borderBottomColor: colors.glassBorder }}
                              onPress={() => handleTehsilSelect(tehsil)}
                            >
                              <Text style={{ color: colors.text, fontWeight: addressForm.tehsil === tehsil ? "bold" : "normal" }}>
                                {tehsil}
                              </Text>
                              {addressForm.tehsil === tehsil && (
                                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                              )}
                            </TouchableOpacity>
                          ))}
                          {filteredTehsils.length === 0 && (
                            <View className="p-8 items-center">
                              <Ionicons name="search-outline" size={32} color={colors.textSecondary} />
                              <Text style={{ color: colors.textSecondary }} className="mt-2">No tehsil found</Text>
                            </View>
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {/* City Input */}
                  <PremiumTextInput
                    label="City / Town"
                    icon="navigate-outline"
                    placeholder="e.g., Lahore, Karachi"
                    value={addressForm.city}
                    onChangeText={(text) => onFormChange({ ...addressForm, city: text })}
                  />

                  {/* Address Input */}
                  <PremiumTextInput
                    label="Street Address"
                    icon="home-outline"
                    placeholder="Street address, House No, Area..."
                    value={addressForm.streetAddress}
                    onChangeText={(text) => onFormChange({ ...addressForm, streetAddress: text })}
                    multiline
                    textAlignVertical="top"
                    style={{ minHeight: 112 }}
                  />
                </View>

                {/* Default Address Toggle */}
                <View 
                  className="rounded-2xl p-4 flex-row items-center justify-between mb-8 border"
                  style={{ 
                    backgroundColor: colors.glassSurface,
                    borderColor: colors.glassBorder
                  }}
                >
                  <View className="flex-row items-center">
                    <View 
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: colors.primary + '1A' }} // 10% opacity
                    >
                      <Ionicons name="star-outline" size={20} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={{ color: colors.text }} className="font-bold">Set as default</Text>
                      <Text style={{ color: colors.textSecondary }} className="text-xs">Use as main delivery address</Text>
                    </View>
                  </View>
                  <Switch
                    value={addressForm.isDefault}
                    onValueChange={(value) => onFormChange({ ...addressForm, isDefault: value })}
                    thumbColor={addressForm.isDefault ? "#FFFFFF" : "#f4f3f4"}
                    trackColor={{ false: "#767577", true: colors.primary }}
                  />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  className="rounded-2xl py-4 items-center mb-6 shadow-lg"
                  style={{ 
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary
                  }}
                  activeOpacity={0.8}
                  onPress={handleSave}
                  disabled={isAddingAddress || isUpdatingAddress}
                >
                  {isAddingAddress || isUpdatingAddress ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text className="text-black font-bold text-lg">
                      {isEditing ? "Save Changes" : "Add Address"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddressFormModal;

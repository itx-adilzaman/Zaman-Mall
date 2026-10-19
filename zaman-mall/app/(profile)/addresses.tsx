import AddressCard from "@/components/AddressCard";
import AddressesHeader from "@/components/AddressesHeader";
import AddressFormModal from "@/components/AddressFormModal";
import SafeScreen from "@/components/SafeScreen";
import { useAddresses } from "@/hooks/useAddresses";
import { Address } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { useAlert } from "@/context/AlertContext";

function AddressesScreen() {
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const {
    addAddress,
    addresses,
    deleteAddress,
    isAddingAddress,
    isDeletingAddress,
    isError,
    isLoading,
    isUpdatingAddress,
    updateAddress,
  } = useAddresses();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: "",
    fullName: "",
    streetAddress: "",
    city: "",
    province: "",
    phone: "",
    isDefault: false,
    district: "",
    tehsil: ""
  });

  const handleAddAddress = () => {
    setShowAddressForm(true);
    setEditingAddressId(null);
    setAddressForm({
      label: "",
      fullName: "",
      streetAddress: "",
      city: "",
      province: "",
      phone: "",
      isDefault: false,
      district: "",
      tehsil: ""
    });
  };

  const handleEditAddress = (address: Address) => {
    setShowAddressForm(true);
    setEditingAddressId(address.id);
    setAddressForm({
      label: address.label,
      fullName: address.fullName,
      streetAddress: address.streetAddress,
      city: address.city,
      province: address.province || "",
      phone: address.phone,
      isDefault: address.isDefault,
      district: (address as any).district || "",
      tehsil: (address as any).tehsil || ""
    });
  };

  const handleDeleteAddress = (addressId: string, label: string) => {
    showAlert({
      title: "Delete Address",
      message: `Are you sure you want to delete ${label}?`,
      icon: "trash-outline",
      buttons: [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteAddress(addressId) },
      ],
    });
  };

  const handleSaveAddress = () => {
    if (
      !addressForm.label ||
      !addressForm.fullName ||
      !addressForm.streetAddress ||
      !addressForm.city ||
      !addressForm.province ||
      !addressForm.phone
    ) {
      showAlert({
        title: "Error",
        message: "Please fill in all fields",
        icon: "alert-circle-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
      return;
    }

    if (editingAddressId) {
      // update an existing address
      updateAddress(
        {
          addressId: editingAddressId,
          addressData: addressForm,
        },
        {
          onSuccess: () => {
            setShowAddressForm(false);
            setEditingAddressId(null);
            showAlert({
              title: "Success",
              message: "Address updated successfully",
              icon: "checkmark-circle-outline",
              buttons: [{ text: "Great", onPress: () => {} }]
            });
          },
          onError: (error: any) => {
            showAlert({
              title: "Error",
              message: error?.response?.data?.error || "Failed to update address",
              icon: "alert-circle-outline",
              buttons: [{ text: "OK", onPress: () => {} }]
            });
          },
        }
      );
    } else {
      // create new address
      addAddress(addressForm, {
        onSuccess: () => {
          setShowAddressForm(false);
          showAlert({
            title: "Success",
            message: "Address added successfully",
            icon: "checkmark-circle-outline",
            buttons: [{ text: "Great", onPress: () => {} }]
          });
        },
        onError: (error: any) => {
          showAlert({
            title: "Error",
            message: error?.response?.data?.error || "Failed to add address",
            icon: "alert-circle-outline",
            buttons: [{ text: "OK", onPress: () => {} }]
          });
        },
      });
    }
  };

  const handleCloseAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
  };

  if (isLoading) return <LoadingUI />;
  if (isError) return <ErrorUI />;

  return (
    <SafeScreen>
      <AddressesHeader />

      {addresses.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          {/* Icon */}
          <View style={{
            width: 96, height: 96, borderRadius: 48,
            backgroundColor: colors.glassSurface,
            borderWidth: 1, borderColor: colors.glassBorder,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="location-outline" size={46} color={colors.textSecondary} />
          </View>

          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 20, letterSpacing: -0.3, textAlign: 'center' }}>
            Koi address nahi
          </Text>
          <Text style={{
            color: colors.textSecondary, textAlign: 'center',
            fontSize: 13, lineHeight: 20, marginTop: 8, maxWidth: 260,
          }}>
            Delivery ke liye apna pehla address add karein.
          </Text>

          {/* Button */}
          <TouchableOpacity
            onPress={handleAddAddress}
            activeOpacity={0.85}
            style={{
              marginTop: 24,
              paddingVertical: 16, paddingHorizontal: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
              flexDirection: 'row', alignItems: 'center', gap: 8,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#000" />
            <Text style={{ color: '#000', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 }}>
              Address Add Karein
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="px-6 py-6">
            <View className="flex-row items-center justify-between mb-8">
               <Text style={{ color: colors.text }} className="text-2xl font-bold tracking-tight">My Addresses</Text>
               <View 
                 className="px-3 py-1 rounded-full border"
                 style={{ 
                   backgroundColor: colors.primary + '1A',
                   borderColor: colors.primary + '33'
                 }}
               >
                  <Text style={{ color: colors.primary }} className="text-xs font-bold">{addresses.length} SAVED</Text>
               </View>
            </View>

            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={handleEditAddress}
                onDelete={handleDeleteAddress}
                isUpdatingAddress={isUpdatingAddress}
                isDeletingAddress={isDeletingAddress}
              />
            ))}

            <TouchableOpacity
              className="mt-6 rounded-3xl p-8 items-center justify-center border-2 border-dashed"
              style={{ 
                backgroundColor: colors.glassSurface,
                borderColor: colors.glassBorder
              }}
              activeOpacity={0.7}
              onPress={handleAddAddress}
            >
              <View 
                className="w-14 h-14 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: colors.primary + '1A' }}
              >
                <Ionicons name="add" size={30} color={colors.primary} />
              </View>
              <Text style={{ color: colors.text }} className="font-bold text-xl">Add New Address</Text>
              <Text style={{ color: colors.textSecondary }} className="text-sm mt-1">Add a new delivery location</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <AddressFormModal
        visible={showAddressForm}
        isEditing={!!editingAddressId}
        addressForm={addressForm}
        isAddingAddress={isAddingAddress}
        isUpdatingAddress={isUpdatingAddress}
        onClose={handleCloseAddressForm}
        onSave={handleSaveAddress}
        onFormChange={setAddressForm}
      />
    </SafeScreen>
  );
}
export default AddressesScreen;

function ErrorUI() {
  const { colors } = useTheme();
  return (
    <SafeScreen>
      <AddressesHeader />
      <View className="flex-1 items-center justify-center px-6">
        <View 
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
        >
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        </View>
        <Text style={{ color: colors.text }} className="font-bold text-xl mt-2">
          Failed to load addresses
        </Text>
        <Text style={{ color: colors.textSecondary }} className="text-center mt-2 text-base">
          Please check your connection and try again
        </Text>
        <TouchableOpacity 
          className="mt-8 px-8 py-3 rounded-xl"
          style={{ backgroundColor: colors.glassSurface, borderWidth: 1, borderColor: colors.glassBorder }}
        >
          <Text style={{ color: colors.text }} className="font-bold">Try Again</Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}

function LoadingUI() {
  const { colors } = useTheme();
  return (
    <SafeScreen>
      <AddressesHeader />
      <View className="flex-1 items-center justify-center px-6">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary }} className="mt-4 text-base">Loading addresses...</Text>
      </View>
    </SafeScreen>
  );
}


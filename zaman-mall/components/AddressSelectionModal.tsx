import { useAddresses } from "@/hooks/useAddresses";
import { Address } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface AddressSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onProceed: (address: Address) => void;
  isProcessing: boolean;
}

const AddressSelectionModal = ({
  visible,
  onClose,
  onProceed,
  isProcessing,
}: AddressSelectionModalProps) => {
  const { colors, isDark } = useTheme();
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const { addresses, isLoading: addressesLoading } = useAddresses();

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View style={{ backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }} className="rounded-t-[32px] h-[75%] shadow-2xl overflow-hidden">
          {/* Modal Header */}
          <View style={{ borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }} className="px-6 py-5 border-b flex-row items-center justify-between">
            <View>
              <Text style={{ color: colors.text }} className="text-2xl font-bold tracking-tight">Shipping Address</Text>
              <Text style={{ color: colors.textSecondary }} className="text-sm mt-0.5">Select where to send your order</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }}
              className="rounded-full p-2 border"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ADDRESSES LIST */}
          <ScrollView 
            className="flex-1 px-6 pt-6"
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {addressesLoading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.textSecondary }} className="mt-4 font-medium">Loading addresses...</Text>
              </View>
            ) : (
              <View className="gap-4">
                {addresses?.map((address: Address) => {
                  const isSelected = selectedAddress?.id === address.id;
                  return (
                    <TouchableOpacity
                      key={address.id}
                      style={{ 
                        backgroundColor: isSelected ? colors.primary + '1A' : colors.glassSurface,
                        borderColor: isSelected ? colors.primary : colors.glassBorder
                      }}
                      className="rounded-2xl p-5 border"
                      activeOpacity={0.7}
                      onPress={() => setSelectedAddress(address)}
                    >
                      <View className="flex-row items-start">
                        {/* Radio Indicator */}
                        <View 
                          style={{ borderColor: isSelected ? colors.primary : colors.textSecondary }}
                          className="w-5 h-5 rounded-full border-2 mr-4 mt-1 items-center justify-center"
                        >
                          {isSelected && <View style={{ backgroundColor: colors.primary }} className="w-2.5 h-2.5 rounded-full" />}
                        </View>

                        <View className="flex-1">
                          <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center">
                              <Ionicons 
                                name={address.label.toLowerCase().includes('home') ? 'home' : address.label.toLowerCase().includes('work') ? 'briefcase' : 'location'} 
                                size={14} 
                                color={isSelected ? colors.primary : colors.textSecondary} 
                                style={{ marginRight: 6 }}
                              />
                              <Text 
                                style={{ color: isSelected ? colors.primary : colors.text }}
                                className="font-bold text-base"
                              >
                                {address.label}
                              </Text>
                            </View>
                            {address.isDefault && (
                              <View style={{ backgroundColor: colors.primary + '33' }} className="px-2 py-0.5 rounded-md">
                                <Text style={{ color: colors.primary }} className="text-[10px] font-bold uppercase tracking-wider">Default</Text>
                              </View>
                            )}
                          </View>
                          
                          <Text style={{ color: colors.text }} className="font-semibold text-lg mb-1">
                            {address.fullName}
                          </Text>
                          <Text style={{ color: colors.textSecondary }} className="text-sm leading-5">
                            {address.streetAddress}
                          </Text>
                          <Text style={{ color: colors.textSecondary }} className="text-sm mb-2">
                            {address.city}, {address.province}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="call-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                            <Text style={{ color: colors.textSecondary }} className="text-xs">{address.phone}</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={{ backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} className="p-6 border-t shadow-2xl">
            <TouchableOpacity
              style={{ 
                backgroundColor: !selectedAddress || isProcessing ? colors.glassSurfaceStrong : colors.primary,
                opacity: !selectedAddress || isProcessing ? 0.5 : 1
              }}
              className="rounded-2xl py-4 shadow-lg"
              activeOpacity={0.9}
              onPress={() => {
                if (selectedAddress) onProceed(selectedAddress);
              }}
              disabled={!selectedAddress || isProcessing}
            >
              <View className="flex-row items-center justify-center">
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text 
                      style={{ color: '#FFFFFF' }}
                      className="font-bold text-lg mr-2"
                    >
                      Confirm & Pay
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddressSelectionModal;

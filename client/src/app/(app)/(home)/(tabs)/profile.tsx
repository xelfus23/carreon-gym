import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import SubscriptionCard from "../../../components/Profile/ProfileSubscriptionCard";
import BasicInfoCard from "../../../components/Profile/BasicInfoCard";
import CurrentStatCard from "../../../components/Profile/CurrentStatCard";
import ProfileHeader from "../../../components/Profile/ProfileHeader";
import ProfileDetailsCard from "../../../components/Profile/ProfileDetailsCard";
import { useUserProfile } from "@/src/context/profileProvider";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import getCustomLoader from "@/src/app/components/CustomRefreshControl";
import { useModal } from "@/src/context/ModalProvider";
import EditProfileModal from "@/src/app/components/Modals/EditProfileModal";

export default function Profile() {
  const { refreshProfile, isLoading } = useUserProfile();
  const { subscription } = useModal();
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile]),
  );

  return (
    <>
      <ScrollView
        className="bg-background flex-1"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        refreshControl={getCustomLoader(isLoading, refreshProfile)}
      >
        <View className="p-4">
          <ProfileHeader />
          <SubscriptionCard />
          <TouchableOpacity
            onPress={subscription.show}
            className="bg-primary rounded-xl p-4 items-center mb-4"
          >
            <Text className="text-background font-bold text-center text-sm">
              Upgrade Membership
            </Text>
          </TouchableOpacity>

          <BasicInfoCard />
          <ProfileDetailsCard />
          <CurrentStatCard />
          <TouchableOpacity
            className="bg-primary rounded-xl p-4 items-center"
            onPress={() => setEditProfileOpen(true)}
          >
            <Text className="text-background font-bold text-base">
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <EditProfileModal
        visible={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />
    </>
  );
}

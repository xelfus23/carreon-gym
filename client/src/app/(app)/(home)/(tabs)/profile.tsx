import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import SubscriptionCard from "../../../components/Profile/ProfileSubscriptionCard";
import BasicInfoCard from "../../../components/Profile/BasicInfoCard";
import CurrentStatCard from "../../../components/Profile/CurrentStatCard";
import ProfileHeader from "../../../components/Profile/ProfileHeader";
import { useUserProfile } from "@/src/context/profileProvider";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

export default function Profile() {
  const { refreshProfile } = useUserProfile();

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile]),
  );

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerClassName="pb-14"
    >
      <View className="p-4 pb-8">
        <ProfileHeader />
        <SubscriptionCard />
        <BasicInfoCard />
        <CurrentStatCard />
        <TouchableOpacity
          className="bg-primary rounded-xl p-4 items-center"
          onPress={() => {
            /* Navigate to edit screen */
          }}
        >
          <Text className="text-background font-bold text-base">
            Edit Profile
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

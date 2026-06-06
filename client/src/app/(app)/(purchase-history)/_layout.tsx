import React from "react";
import { Stack } from "expo-router";
import CustomHeader from "../../components/CustomHeader";

export default function Layout() {

  return (
    <Stack
      screenOptions={{
        header: (props) => <CustomHeader title={props.route.name} />,
      }}
    >
      <Stack.Screen name="purchases" />
    </Stack>
  );
}

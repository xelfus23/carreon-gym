import React from "react";
import { Stack } from "expo-router";
import CustomHeader from "../../components/CustomHeader";

export default function Layout() {

  return (
    <Stack
      screenOptions={{
        header: (props) => <CustomHeader title={props.options.title || ""} />,
      }}
    >
      <Stack.Screen name="purchases" options={{
        title: "Recent Purchase"
      }} />
    </Stack>
  );
}

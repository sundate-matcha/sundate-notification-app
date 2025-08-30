import { Slot } from "expo-router";

export default function RootLayout() {
  // Root chỉ cần Slot, không cần Stack
  return <Slot />;
}

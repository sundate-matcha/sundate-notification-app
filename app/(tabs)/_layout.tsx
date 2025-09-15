import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, Pressable, View } from "react-native";

export default function TabLayout() {
  const router = useRouter();

  const handlePress = () => {
    // đổi icon
    router.push("/screens/noti");
  };

  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#FFF8DE",
          headerStyle: {
            backgroundColor: "#FFF8DE",
            height: 122,
          },
          headerShadowVisible: false,
          headerTintColor: "#831B1B",
          tabBarStyle: {
            backgroundColor: "#831B1B",
          },
          tabBarInactiveTintColor: "#FFF8DE",
          headerRight: () => (
            <Pressable onPress={handlePress}>
              <Ionicons
                name={"notifications-outline"}
                size={30}
                color="#831B1B"
                style={{ marginRight: 40 }}
              />
            </Pressable>
          ),
          headerTitle: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={require("../../assets/images/Symbol.png")}
                style={{ width: 100, height: 40 }}
                resizeMode="contain"
              />
              <Image
                source={require("../../assets/images/Typeeface (version 2).png")}
                style={{ width: 100, height: 40 }}
                resizeMode="contain"
              />
            </View>
          ),
          headerTitleAlign: "left",
        }}
      >
        <Tabs.Screen
          name="overall"
          options={{
            title: "Tổng quan",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "bar-chart" : "bar-chart-outline"}
                color={"#FFF8DE"}
                size={24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Lịch đặt bàn",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "calendar" : "calendar-outline"}
                color={color}
                size={24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Hồ sơ",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                color={"#FFF8DE"}
                size={24}
              />
            ),
          }}
        />
        {/* <Tabs.Screen
          name="noti"
          options={{
            href: null, // 👈 không hiển thị trên tab bar
            title: "Thông báo",
          }}
        /> */}
        {/* Không cần thêm Tabs.Screen cho reservationDateInfo vì nó là route con */}
      </Tabs>
    </>
  );
}

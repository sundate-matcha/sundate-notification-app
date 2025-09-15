import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const notifications = [
  {
    id: "1",
    title: "Đơn đặt bàn mới",
    message: "Khách Nguyễn Văn A đặt bàn lúc 19:00",
  },
  {
    id: "2",
    title: "Đơn đặt bàn mới",
    message: "Khách Trần Thị B đặt bàn lúc 20:30",
  },
  {
    id: "3",
    title: "Đơn đặt bàn mới",
    message: "Khách Lê Văn C đặt bàn lúc 18:45",
  },
];

export default function NotiScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back-outline" size={30} color="#831B1B" />
        </TouchableOpacity>
        <Text style={styles.header}>Thông báo mới</Text>
        <Ionicons
          style={styles.settingsIcon}
          name="ellipsis-vertical"
          size={30}
          color="#831B1B"
        />
      </View>

      <FlatList
        style={styles.content}
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { backgroundColor: "#F2F2F2", padding: 16, flex: 1 },
  headerContainer: {
    backgroundColor: "#FFF8DE",
    height: 122,
    alignItems: "flex-end",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    flexDirection: "row",
  },
  backButton: {
    marginBottom: 24,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#831B1B",
    marginBottom: 24,
  },
  settingsIcon: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: "bold", color: "#831B1B" },
  message: { fontSize: 14, color: "#333" },
});

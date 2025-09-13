import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

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
    navigation.setOptions({
      title: "Thông báo",
      headerTitleAlign: "center", // 👈 căn giữa
      headerStyle: {
        backgroundColor: "#FFF8DE", // giống header gốc
        height: 200, // 👈 chiều cao custom
      },
      headerTintColor: "#831B1B", // màu icon back
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#831B1B",
      },
      headerShadowVisible: false, // bỏ shadow
      headerBackTitle: "Trở lại",
    });
  }, [navigation]);
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Thông báo mới</Text>
      <FlatList
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
  container: { flex: 1, backgroundColor: "#FFF8DE", padding: 16 },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#831B1B",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  title: { fontSize: 16, fontWeight: "bold", color: "#831B1B" },
  message: { fontSize: 14, color: "#333" },
});

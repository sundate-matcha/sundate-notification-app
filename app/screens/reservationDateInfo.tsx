import { HeaderBackContext } from "@react-navigation/elements";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

// Data demo
const reservations = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    phone: "0987654321",
    guests: 1,
    table: "Bàn quầy bar",
    time: "09:30",
    note: "",
  },
  {
    id: "2",
    name: "Nguyễn Văn B",
    phone: "0987654321",
    guests: 2,
    table: "Bàn cửa sổ",
    time: "10:30",
    note: "",
  },
  {
    id: "3",
    name: "Nguyễn Thị C",
    phone: "0987654321",
    guests: 4,
    table: "Bàn dài",
    time: "11:30",
    note: "",
  },
  {
    id: "4",
    name: "Nguyễn Văn A",
    phone: "0987654321",
    guests: 1,
    table: "Bàn quầy bar",
    time: "09:30",
    note: "",
  },
  {
    id: "5",
    name: "Nguyễn Văn A",
    phone: "0987654321",
    guests: 1,
    table: "Bàn quầy bar",
    time: "09:30",
    note: "",
  },
  {
    id: "6",
    name: "Nguyễn Văn A",
    phone: "0987654321",
    guests: 1,
    table: "Bàn quầy bar",
    time: "09:30",
    note: "",
  },
];

const ReservationItem = ({ item }: { item: (typeof reservations)[0] }) => (
  <View style={styles.itemContainer}>
    <View style={styles.row}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.phone}>{item.phone}</Text>
    </View>
    <Text style={styles.label}>
      Số khách: <Text style={styles.value}>{item.guests}</Text>
    </Text>
    <Text style={styles.label}>
      Thời gian: <Text style={styles.value}>{item.time}</Text>
    </Text>
    <Text style={styles.label}>Ghi chú:</Text>
    <Text style={styles.table}>{item.table}</Text>
  </View>
);

export default function ReservationDateInfoScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const navigation = useNavigation();

  // format ngày
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Chi tiết đặt bàn";
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleDateString("vi-VN", { month: "long" });
    const year = d.getFullYear();
    return `Ngày ${day} ${month}, ${year}`;
  };

  const formattedDate = formatDate(date);

  // 👇 đổi header title khi vào màn hình
  useEffect(() => {
    navigation.setOptions({
      title: formattedDate,
      headerTitleAlign: "center", // 👈 căn giữa
      headerStyle: {
        backgroundColor: "#FFF8DE", // giống header gốc
        height: 200,
      },
      headerTintColor: "#831B1B", // màu icon back
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#831B1B",
      },
      headerShadowVisible: false, // bỏ shadow
      headerBackTitle: "Trở lại",
      headerBackTitleVisible: false,
    });
  }, [navigation, formattedDate]);

  return (
    <View style={styles.container}>
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReservationItem item={item} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F2" },
  listContent: { padding: 8, paddingBottom: 16 },
  itemContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  name: { fontWeight: "600", fontSize: 15, color: "#222" },
  phone: { fontSize: 15, color: "#222" },
  label: { fontSize: 13, color: "#444", marginTop: 2 },
  value: { fontWeight: "600", color: "#222" },
  table: { fontSize: 13, color: "#831B1B", marginTop: 2, fontWeight: "500" },
  separator: { height: 12 },
});

import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReservationDetailModal from "../components/reservationDetailModal";

// Data demo
const reservations = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    phone: "0987654321",
    guests: 1,
    table: "Bàn quầy bar",
    time: "09:30",
    note: "Không có",
  },
  {
    id: "2",
    name: "Nguyễn Văn B",
    phone: "0987654321",
    guests: 2,
    table: "Bàn cửa sổ",
    time: "10:30",
    note: "Khách quen",
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
];

const ReservationItem = ({
  item,
  onPress,
}: {
  item: (typeof reservations)[0];
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
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
  </TouchableOpacity>
);

export default function ReservationDateInfoScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const navigation = useNavigation();

  const [selectedItem, setSelectedItem] = useState<
    (typeof reservations)[0] | null
  >(null);

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

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back-outline" size={30} color="#831B1B" />
        </TouchableOpacity>
        <Text style={styles.header}>{formattedDate}</Text>
        <Ionicons
          style={styles.settingsIcon}
          name="ellipsis-vertical"
          size={30}
          color="#831B1B"
        />
      </View>

      {/* List */}
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReservationItem item={item} onPress={() => setSelectedItem(item)} />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Modal chi tiết */}
      <ReservationDetailModal
        visible={!!selectedItem}
        reservation={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F2" },
  headerContainer: {
    backgroundColor: "#FFF8DE",
    height: 122,
    alignItems: "flex-end",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    flexDirection: "row",
  },
  backButton: { marginBottom: 24 },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#831B1B",
    marginBottom: 24,
  },
  settingsIcon: { marginBottom: 24 },
  listContent: { padding: 16, paddingBottom: 16 },
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

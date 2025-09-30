import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReservationDetailModal from "../components/reservationDetailModal";

type Reservation = {
  id: string;
  fullName: string;
  phone: string;
  guest: number;
  tableType: string;
  time: string;
  description?: string;
  status: "Pending" | "Completed" | "Cancelled";
  date: string;
};

const ReservationItem = ({
  item,
  onPress,
}: {
  item: Reservation;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    <View style={styles.row}>
      <Text style={styles.fullName}>{item.fullName}</Text>
      <Text style={styles.phone}>{item.phone}</Text>
    </View>
    <Text style={styles.label}>
      Số khách: <Text style={styles.value}>{item.guest}</Text>
    </Text>
    <Text style={styles.label}>
      Thời gian: <Text style={styles.value}>{item.time}</Text>
    </Text>
    <Text style={styles.label}>
      Trạng thái:{" "}
      <Text
        style={[
          styles.value,
          {
            color:
              item.status === "Pending"
                ? "orange"
                : item.status === "Completed"
                ? "green"
                : "red",
          },
        ]}
      >
        {item.status}
      </Text>
    </Text>
    <Text style={styles.label}>Bàn: {item.tableType}</Text>
  </TouchableOpacity>
);

export default function ReservationDateInfoScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const navigation = useNavigation();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedItem, setSelectedItem] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  // Fetch API
  useEffect(() => {
    const fetchReservations = async () => {
      if (!date) return;
      setLoading(true);
      try {
        const res = await fetch(
          "https://68a2a89fc5a31eb7bb1d6794.mockapi.io/api/reservation"
        );
        const data: Reservation[] = await res.json();
        const filtered = data.filter((r) => r.date === date);
        setReservations(filtered);
      } catch (err) {
        console.error("Error fetching reservations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, [date]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Chi tiết đặt bàn";
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleDateString("vi-VN", { month: "long" });
    const year = d.getFullYear();
    return `Ngày ${day} ${month}, ${year}`;
  };

  const formattedDate = formatDate(date);

  const handleUpdateStatus = (id: string, newStatus: Reservation["status"]) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    setSelectedItem((prev) => (prev ? { ...prev, status: newStatus } : prev));
  };

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

      {/* Loading spinner */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#831B1B" />
          <Text style={{ marginTop: 8 }}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReservationItem
              item={item}
              onPress={() => setSelectedItem(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              Không có đặt bàn trong ngày này
            </Text>
          }
        />
      )}

      {/* Modal chi tiết */}
      <ReservationDetailModal
        visible={!!selectedItem}
        reservation={selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdateStatus={handleUpdateStatus}
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
  fullName: { fontWeight: "600", fontSize: 15, color: "#222" },
  phone: { fontSize: 15, color: "#222" },
  label: { fontSize: 13, color: "#444", marginTop: 2 },
  value: { fontWeight: "600", color: "#222" },
  tableType: {
    fontSize: 13,
    color: "#831B1B",
    marginTop: 2,
    fontWeight: "500",
  },
  separator: { height: 12 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

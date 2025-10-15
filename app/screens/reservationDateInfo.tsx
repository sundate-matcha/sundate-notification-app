import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ReservationDetailModal from "../components/reservationDetailModal";

type Reservation = {
  id: string;
  name: string;
  phone: string;
  guests: number;
  tableCategory: string;
  tableCategoryName: string;
  time: string;
  specialRequests?: string;
  status: "pending" | "confirmed" | "cancelled";
  date: string;
};

type TableCategory = {
  id: string;
  name: string;
};

const ReservationItem = ({
  item,
  onPress,
}: {
  item: Reservation;
  onPress: () => void;
}) => {
  const displayPhone = item.phone.startsWith("+84")
    ? item.phone.replace("+84", "0")
    : item.phone;

  return (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.fullName}>{item.name}</Text>
        <Text style={styles.phone}>{displayPhone}</Text>
      </View>
      <Text style={styles.label}>
        Số khách: <Text style={styles.value}>{item.guests}</Text>
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
                item.status === "pending"
                  ? "orange"
                  : item.status === "confirmed"
                  ? "green"
                  : "red",
            },
          ]}
        >
          {item.status === "pending"
            ? "Chưa xác nhận"
            : item.status === "confirmed"
            ? "Đã xác nhận"
            : "Đã hủy"}
        </Text>
      </Text>
      <Text style={styles.label}>
        Bàn: <Text style={styles.value}>{item.tableCategoryName}</Text>
      </Text>
    </TouchableOpacity>
  );
};

export default function ReservationDateInfoScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const navigation = useNavigation();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tableCategories, setTableCategories] = useState<TableCategory[]>([]);
  const [selectedItem, setSelectedItem] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "confirmed" | "cancelled"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  // Fetch table categories on mount
  useEffect(() => {
    const fetchTableCategories = async () => {
      try {
        const res = await fetch(
          "https://sundate.justdemo.work/api/table-categories/active"
        );
        if (!res.ok) throw new Error(`Lỗi HTTP ${res.status}`);
        const data = await res.json();
        setTableCategories(data);
      } catch (err) {
        console.error("Error fetching table categories:", err);
      }
    };
    fetchTableCategories();
  }, []);

  // Fetch reservations on mount
  useEffect(() => {
    const fetchReservations = async () => {
      if (!date) return;
      setLoading(true);
      try {
        const res = await fetch(
          `https://sundate.justdemo.work/api/reservations?date=${date}`
        );
        if (!res.ok) throw new Error(`Lỗi HTTP ${res.status}`);
        const { reservations: data } = await res.json();
        const mappedReservations = data.map((r: any) => ({
          ...r,
          tableCategoryName:
            tableCategories.find((tc) => tc.id === r.tableCategory)?.name ||
            r.tableCategory,
        }));
        setReservations(
          mappedReservations.filter((r: any) => r.date.split("T")[0] === date)
        );
        setError(null);
      } catch (err) {
        console.error("Error fetching reservations:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, [date, tableCategories]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(
        `https://sundate.justdemo.work/api/reservations?date=${date}`
      );
      if (!res.ok) throw new Error(`Lỗi HTTP ${res.status}`);
      const { reservations: data } = await res.json();
      const mappedReservations = data.map((r: any) => ({
        ...r,
        tableCategoryName:
          tableCategories.find((tc) => tc.id === r.tableCategory)?.name ||
          r.tableCategory,
      }));
      setReservations(
        mappedReservations.filter((r: any) => r.date.split("T")[0] === date)
      );
      setError(null);
    } catch (err) {
      console.error("Error refreshing reservations:", err);
      setError("Không thể làm mới dữ liệu. Vui lòng thử lại.");
    } finally {
      setRefreshing(false);
    }
  };

  // Bộ đếm số lượng từng loại
  const counts = useMemo(() => {
    return {
      all: reservations.length,
      pending: reservations.filter((r) => r.status === "pending").length,
      confirmed: reservations.filter((r) => r.status === "confirmed").length,
      cancelled: reservations.filter((r) => r.status === "cancelled").length,
    };
  }, [reservations]);

  // Lọc dữ liệu
  const filteredReservations = reservations.filter((r) => {
    const matchesStatus =
      statusFilter === "all" ? true : r.status === statusFilter;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      r.name.toLowerCase().includes(query) ||
      r.phone.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

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

      {/* Bộ lọc + search */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { label: `Tất cả (${counts.all})`, value: "all" },
            { label: `Chờ xác nhận (${counts.pending})`, value: "pending" },
            { label: `Đã xác nhận (${counts.confirmed})`, value: "confirmed" },
            { label: `Đã hủy (${counts.cancelled})`, value: "cancelled" },
          ].map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[
                styles.filterButton,
                statusFilter === f.value && styles.filterButtonActive,
              ]}
              onPress={() => setStatusFilter(f.value as any)}
            >
              <Text
                style={[
                  styles.filterText,
                  statusFilter === f.value && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên hoặc số điện thoại..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Danh sách */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#831B1B" />
          <Text style={{ marginTop: 8 }}>Đang tải dữ liệu...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : filteredReservations.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          Không có đặt bàn phù hợp
        </Text>
      ) : (
        <ScrollView
          style={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#831B1B"
            />
          }
        >
          {filteredReservations.map((item) => (
            <React.Fragment key={item.id}>
              <ReservationItem
                item={item}
                onPress={() => setSelectedItem(item)}
              />
              <View style={styles.separator} />
            </React.Fragment>
          ))}
        </ScrollView>
      )}

      <ReservationDetailModal
        visible={!!selectedItem}
        reservation={selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdateStatus={handleUpdateStatus}
        tableCategories={tableCategories}
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
  separator: { height: 12 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  errorText: {
    textAlign: "center",
    color: "#F44336",
    fontSize: 16,
    marginTop: 20,
  },
  filterContainer: {
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomColor: "#DDD",
    borderBottomWidth: 1,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: "#831B1B",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#831B1B",
  },
  filterText: {
    color: "#831B1B",
    fontSize: 13,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
  },
  searchInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginTop: 10,
  },
});

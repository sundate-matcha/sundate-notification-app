import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

// Định nghĩa type cho reservation từ API
type Reservation = {
  id: string;
  status: "Pending" | "Completed" | "Cancelled";
  date: string; // Thêm date để đánh dấu ngày
};

// Định nghĩa type cho markedDates (mở rộng để hỗ trợ selected và selectedColor)
type MarkedDates = {
  [date: string]: {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
  };
};

// Cấu hình lịch tiếng Việt
LocaleConfig.locales["vi"] = {
  monthNames: [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ],
  monthNamesShort: [
    "Thg1",
    "Thg2",
    "Thg3",
    "Thg4",
    "Thg5",
    "Thg6",
    "Thg7",
    "Thg8",
    "Thg9",
    "Thg10",
    "Thg11",
    "Thg12",
  ],
  dayNames: [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ],
  dayNamesShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  today: "Hôm nay",
};
LocaleConfig.defaultLocale = "vi";

export default function Overall() {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]); // Lưu toàn bộ reservation để đánh dấu
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Format YYYY-MM-DD cho Calendar
  const todayStr = date.toISOString().split("T")[0];

  // Fetch dữ liệu từ API
  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          "https://68a2a89fc5a31eb7bb1d6794.mockapi.io/api/reservation"
        );
        if (!res.ok) {
          throw new Error(`Lỗi HTTP ${res.status}`);
        }
        const data = await res.json();
        // Lưu toàn bộ reservation để đánh dấu ngày
        setAllReservations(data);
        // Lọc theo ngày được chọn
        const filtered = data.filter(
          (r: any) => r.date === todayStr
        ) as Reservation[];
        setReservations(filtered);

        // Tạo markedDates cho các ngày có reservation
        const marked: MarkedDates = {};
        data.forEach((r: any) => {
          if (r.date) {
            marked[r.date] = {
              marked: true,
              dotColor: "#831B1B",
            };
          }
        });
        // Đánh dấu ngày được chọn
        marked[todayStr] = {
          ...marked[todayStr],
          selected: true,
          selectedColor: "#831B1B",
        };
        setMarkedDates(marked);

        setError(null);
      } catch (err) {
        console.error("Error fetching reservations:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, [todayStr]);

  // Thống kê theo trạng thái (ánh xạ sang tiếng Việt)
  const statusMap: { [key: string]: string } = {
    Pending: "Chưa đến",
    Completed: "Đã đến",
    Cancelled: "Đã hủy bàn",
  };

  const total = reservations.length;
  const stats = {
    "Chưa đến": reservations.filter((r) => r.status === "Pending").length,
    "Đã đến": reservations.filter((r) => r.status === "Completed").length,
    "Đã hủy bàn": reservations.filter((r) => r.status === "Cancelled").length,
  };

  const pieData = [
    {
      name: "Chưa đến",
      population: stats["Chưa đến"],
      color: "#FF9800",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Đã đến",
      population: stats["Đã đến"],
      color: "#4CAF50",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Đã hủy bàn",
      population: stats["Đã hủy bàn"],
      color: "#F44336",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
  ].filter((item) => item.population > 0); // Loại bỏ trạng thái không có dữ liệu

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>ĐƠN ĐẶT BÀN</Text>

      {/* Date Selector */}
      <TouchableOpacity
        style={styles.dateCard}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.dateText}>
          Ngày:{" "}
          <Text style={styles.chosenDate}>
            {date.toLocaleDateString("vi-VN")}
          </Text>
        </Text>
        <Ionicons name="chevron-down-outline" size={20} color="#831B1B" />
      </TouchableOpacity>

      {/* Overlay Calendar */}
      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.modalContent}>
            <Calendar
              current={todayStr}
              onDayPress={(day) => {
                setDate(new Date(day.dateString));
                setShowPicker(false);
              }}
              markedDates={markedDates}
              theme={{
                todayTextColor: "#831B1B",
                selectedDayBackgroundColor: "#831B1B",
                arrowColor: "#831B1B",
                textSectionTitleColor: "#831B1B",
                dotColor: "#831B1B",
                selectedDotColor: "#FFF8DE",
              }}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.closeText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Loading or Error */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#831B1B" />
          <Text style={{ marginTop: 8 }}>Đang tải dữ liệu...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          {/* Stats Cards */}
          <View style={styles.statsRow}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tổng đơn</Text>
              <Text style={styles.cardNumber}>{total}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Chưa đến</Text>
              <Text style={[styles.cardNumber, { color: "#FF9800" }]}>
                {stats["Chưa đến"]}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Đã đến</Text>
              <Text style={[styles.cardNumber, { color: "#4CAF50" }]}>
                {stats["Đã đến"]}
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Đã hủy</Text>
              <Text style={[styles.cardNumber, { color: "#F44336" }]}>
                {stats["Đã hủy bàn"]}
              </Text>
            </View>
          </View>

          {/* Pie Chart */}
          {total > 0 ? (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Trạng thái đặt bàn</Text>
              <PieChart
                data={pieData}
                width={screenWidth - 40}
                height={250}
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  color: () => "#333",
                }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                absolute
              />
            </View>
          ) : (
            <Text style={styles.noDataText}>
              Không có đơn đặt bàn trong ngày này
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F2", padding: 16 },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 16, color: "#111" },
  dateCard: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: { fontSize: 16, color: "#333" },
  chosenDate: {
    fontWeight: 700,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
  },
  closeButton: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#831B1B",
    borderRadius: 10,
    alignItems: "center",
  },
  closeText: { color: "#fff", fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    alignItems: "center",
  },
  cardTitle: { fontSize: 14, color: "#555" },
  cardNumber: { fontSize: 20, fontWeight: "700", marginTop: 6 },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
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
  noDataText: {
    textAlign: "center",
    color: "#555",
    fontSize: 16,
    marginTop: 20,
  },
});

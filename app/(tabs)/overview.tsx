import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

type Reservation = {
  id: string;
  status: "pending" | "confirmed" | "cancelled";
  date: string;
};

type MarkedDates = {
  [date: string]: {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
  };
};

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
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const todayStr = date.toISOString().split("T")[0];

  // Fetch reservations on mount
  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://sundate.justdemo.work/api/reservations?limit=0"
      );
      if (!res.ok) {
        throw new Error(`Lỗi HTTP ${res.status}`);
      }
      const { reservations: data } = await res.json();
      setAllReservations(data);
      const filtered = data.filter(
        (r: any) => r.date.split("T")[0] === todayStr
      ) as Reservation[];
      setReservations(filtered);

      const marked: MarkedDates = {};
      data.forEach((r: any) => {
        if (r.date) {
          const dateStr = new Date(r.date).toISOString().split("T")[0];
          marked[dateStr] = {
            marked: true,
            dotColor: "#831B1B",
          };
        }
      });
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
      setRefreshing(false);
    }
  };

  // Run fetch on mount
  useEffect(() => {
    fetchReservations();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  // Update reservations when date changes
  useEffect(() => {
    const filtered = allReservations.filter(
      (r: any) => r.date.split("T")[0] === todayStr
    ) as Reservation[];
    setReservations(filtered);

    const marked: MarkedDates = {};
    allReservations.forEach((r: any) => {
      if (r.date) {
        const dateStr = new Date(r.date).toISOString().split("T")[0];
        marked[dateStr] = {
          marked: true,
          dotColor: "#831B1B",
        };
      }
    });
    marked[todayStr] = {
      ...marked[todayStr],
      selected: true,
      selectedColor: "#831B1B",
    };
    setMarkedDates(marked);
  }, [date]);

  const statusMap: { [key: string]: string } = {
    pending: "Chưa xác nhận",
    confirmed: "Đã xác nhận",
    cancelled: "Đã hủy bàn",
  };

  const total = reservations.length;
  const stats = {
    "Chưa xác nhận": reservations.filter((r) => r.status === "pending").length,
    "Đã xác nhận": reservations.filter((r) => r.status === "confirmed").length,
    "Đã hủy bàn": reservations.filter((r) => r.status === "cancelled").length,
  };

  const pieData = [
    {
      name: "Chưa xác nhận",
      population: stats["Chưa xác nhận"],
      color: "#FF9800",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Đã xác nhận",
      population: stats["Đã xác nhận"],
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
  ].filter((item) => item.population > 0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync("sundate_token");
        if (!token) {
          Alert.alert(
            "Phiên đăng nhập hết hạn",
            "Vui lòng đăng nhập để tiếp tục sử dụng hệ thống.",
            [
              {
                text: "OK",
                onPress: () => router.replace("/(auth)/login"),
              },
            ]
          );
          return;
        }

        const res = await fetch(
          "https://sundate.justdemo.work/api/auth/verify",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          await SecureStore.deleteItemAsync("sundate_token");
          await SecureStore.deleteItemAsync("sundate_fullName");
          Alert.alert(
            "Phiên đăng nhập hết hạn",
            "Vui lòng đăng nhập lại để tiếp tục sử dụng.",
            [
              {
                text: "OK",
                onPress: () => router.replace("/(auth)/login"),
              },
            ]
          );
          return;
        }

        const data = await res.json();
        if (!data.valid) {
          await SecureStore.deleteItemAsync("sundate_token");
          await SecureStore.deleteItemAsync("sundate_fullName");
          Alert.alert(
            "Phiên đăng nhập hết hạn",
            "Vui lòng đăng nhập lại để tiếp tục sử dụng.",
            [
              {
                text: "OK",
                onPress: () => router.replace("/(auth)/login"),
              },
            ]
          );
          return;
        }

        // Token hợp lệ → lấy tên user nếu chưa có
        const user = data.user;
        const name =
          (user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.username) || "Admin";

        const storedName = await SecureStore.getItemAsync("sundate_fullName");
        if (!storedName && name) {
          await SecureStore.setItemAsync("sundate_fullName", name);
        }
      } catch (error) {
        console.error("[Overview] Token check failed:", error);
        Alert.alert(
          "Lỗi đăng nhập",
          "Không thể xác minh tài khoản. Vui lòng đăng nhập lại.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(auth)/login"),
            },
          ]
        );
      }
    };

    checkAuth();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#831B1B"
        />
      }
    >
      <Text style={styles.header}>ĐƠN ĐẶT BÀN</Text>

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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#831B1B" />
          <Text style={{ marginTop: 8 }}>Đang tải dữ liệu...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/screens/reservationDateInfo",
                  params: { date: todayStr },
                })
              }
            >
              <Text style={styles.cardTitle}>Tổng đơn</Text>
              <Text style={styles.cardNumber}>{total}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/screens/reservationDateInfo",
                  params: { date: todayStr, status: "pending" },
                })
              }
            >
              <Text style={styles.cardTitle}>Chưa xác nhận</Text>
              <Text style={[styles.cardNumber, { color: "#FF9800" }]}>
                {stats["Chưa xác nhận"]}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/screens/reservationDateInfo",
                  params: { date: todayStr, status: "confirmed" },
                })
              }
            >
              <Text style={styles.cardTitle}>Đã xác nhận</Text>
              <Text style={[styles.cardNumber, { color: "#4CAF50" }]}>
                {stats["Đã xác nhận"]}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/screens/reservationDateInfo",
                  params: { date: todayStr, status: "cancelled" },
                })
              }
            >
              <Text style={styles.cardTitle}>Đã hủy</Text>
              <Text style={[styles.cardNumber, { color: "#F44336" }]}>
                {stats["Đã hủy bàn"]}
              </Text>
            </TouchableOpacity>
          </View>

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
  container: { flex: 1, backgroundColor: "#f8fafd", padding: 16 },
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
  chosenDate: { fontWeight: "700" },
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

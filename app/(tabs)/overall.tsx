import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import DateTimePicker from "@react-native-community/datetimepicker";

const screenWidth = Dimensions.get("window").width;

const reservations = [
  { id: "1", status: "Chưa đến" },
  { id: "2", status: "Đã đến" },
  { id: "3", status: "Chưa đến" },
  { id: "4", status: "Đã hủy bàn" },
  { id: "5", status: "Chưa đến" },
  { id: "6", status: "Đã đến" },
];

export default function Overall() {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // Thống kê theo trạng thái
  const total = reservations.length;
  const stats = {
    "Chưa đến": reservations.filter((r) => r.status === "Chưa đến").length,
    "Đã đến": reservations.filter((r) => r.status === "Đã đến").length,
    "Đã hủy bàn": reservations.filter((r) => r.status === "Đã hủy bàn").length,
  };

  const pieData = [
    { name: "Chưa đến", population: stats["Chưa đến"], color: "#FFB74D", legendFontColor: "#333", legendFontSize: 14 },
    { name: "Đã đến", population: stats["Đã đến"], color: "#4CAF50", legendFontColor: "#333", legendFontSize: 14 },
    { name: "Đã hủy bàn", population: stats["Đã hủy bàn"], color: "#E57373", legendFontColor: "#333", legendFontSize: 14 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📊 Tổng quan đặt bàn</Text>

      {/* Date Selector */}
      <TouchableOpacity style={styles.dateCard} onPress={() => setShowPicker(true)}>
        <Text style={styles.dateText}>Ngày: {date.toLocaleDateString("vi-VN")}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="inline" // iOS inline style
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tổng đơn</Text>
          <Text style={styles.cardNumber}>{total}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chưa đến</Text>
          <Text style={[styles.cardNumber, { color: "#FF9800" }]}>{stats["Chưa đến"]}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Đã đến</Text>
          <Text style={[styles.cardNumber, { color: "#4CAF50" }]}>{stats["Đã đến"]}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Đã hủy</Text>
          <Text style={[styles.cardNumber, { color: "#F44336" }]}>{stats["Đã hủy bàn"]}</Text>
        </View>
      </View>

      {/* Pie Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Trạng thái đặt bàn</Text>
        <PieChart
          data={pieData}
          width={screenWidth - 40}
          height={220}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7", padding: 16 },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 16, color: "#111" },

  dateCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: { fontSize: 16, color: "#333" },

  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 6,
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
  chartTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10, color: "#333" },
});

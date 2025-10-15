import React from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

interface Props {
  visible: boolean;
  reservation: Reservation | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: Reservation["status"]) => void;
  tableCategories: TableCategory[];
}

const ReservationDetailModal: React.FC<Props> = ({
  visible,
  reservation,
  onClose,
  onUpdateStatus,
  tableCategories,
}) => {
  if (!reservation) return null;

  // ✅ Hàm đổi trạng thái (sửa đúng route backend)
  const handleChangeStatus = async (newStatus: Reservation["status"]) => {
    if (!reservation) return;

    // Xác định đúng endpoint dựa vào trạng thái
    const endpoint =
      newStatus === "confirmed"
        ? `https://sundate.justdemo.work/api/reservations/${reservation.id}/confirm`
        : `https://sundate.justdemo.work/api/reservations/${reservation.id}/cancel`;

    console.log("Calling endpoint:", endpoint);

    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log("Error response from API:", errorData);
        throw new Error(
          `Lỗi HTTP ${res.status}: ${
            errorData.error || errorData.message || "Yêu cầu không hợp lệ"
          }`
        );
      }

      onUpdateStatus(reservation.id, newStatus);
      onClose(); // Đóng modal sau khi cập nhật thành công
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định";
      console.error("Lỗi update:", errorMessage);
      Alert.alert("Lỗi", errorMessage);
    }
  };

  const displayPhone = reservation.phone.startsWith("+84")
    ? reservation.phone.replace("+84", "0")
    : reservation.phone;

  const handleCall = () => {
    const phoneNumber = displayPhone.replace(/\s+/g, ""); // loại bỏ khoảng trắng
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert("Không thể thực hiện cuộc gọi", "Vui lòng thử lại sau.");
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.modalTitle}>Chi tiết đặt bàn</Text>

          <Text>Tên: <Text style={styles.value}>{reservation.name}</Text></Text>
          <Text>SĐT: <Text style={styles.value}>{displayPhone}</Text></Text>
          <Text>Số khách: <Text style={styles.value}>{reservation.guests}</Text></Text>
          <Text>Thời gian: <Text style={styles.value}>{reservation.time}</Text></Text>
          <Text>
            Bàn:{" "}
            <Text style={styles.value}>
              {tableCategories.find((tc) => tc.id === reservation.tableCategory)
                ?.name || reservation.tableCategory}
            </Text>
          </Text>
          <Text>Ghi chú: <Text style={styles.value}>{reservation.specialRequests || "Không có"}</Text></Text>
          <Text>
            Trạng thái:{" "}
            <Text
              style={{
                color:
                  reservation.status === "pending"
                    ? "orange"
                    : reservation.status === "confirmed"
                    ? "green"
                    : "red",
              }}
            >
              {reservation.status === "pending"
                ? "Chưa xác nhận"
                : reservation.status === "confirmed"
                ? "Đã xác nhận"
                : "Đã hủy"}
            </Text>
          </Text>

          {/* Nút hành động */}
          {reservation.status === "pending" ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "red" }]}
                onPress={() => handleChangeStatus("cancelled")}
              >
                <Text style={{ color: "#fff" }}>Hủy bàn</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "orange" }]}
                onPress={handleCall}
              >
                <Text style={{ color: "#fff" }}>Gọi ngay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "green" }]}
                onPress={() => handleChangeStatus("confirmed")}
              >
                <Text style={{ color: "#fff" }}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={{ color: "#fff" }}>Đóng</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ReservationDetailModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#831B1B",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  value: { fontWeight: "600" },
});

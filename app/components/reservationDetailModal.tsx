import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Reservation = {
  id: string;
  fullName: string;
  phone: string;
  guests: number;
  tableType: string;
  time: string;
  note?: string;
  status: "Pending" | "Completed" | "Cancelled";
};

interface Props {
  visible: boolean;
  reservation: Reservation | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: Reservation["status"]) => void;
}

const ReservationDetailModal: React.FC<Props> = ({
  visible,
  reservation,
  onClose,
  onUpdateStatus,
}) => {
  if (!reservation) return null;

  // Hàm đổi trạng thái
  const handleChangeStatus = async (newStatus: Reservation["status"]) => {
    try {
      await fetch(
        `https://68a2a89fc5a31eb7bb1d6794.mockapi.io/api/reservation/${reservation.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      onUpdateStatus(reservation.id, newStatus); // cập nhật UI
    } catch (error) {
      console.error("Lỗi update:", error);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.modalTitle}>Chi tiết đặt bàn</Text>
          <Text>Tên: {reservation.fullName}</Text>
          <Text>SĐT: {reservation.phone}</Text>
          <Text>Số khách: {reservation.guests}</Text>
          <Text>Thời gian: {reservation.time}</Text>
          <Text>Bàn: {reservation.tableType}</Text>
          <Text>Ghi chú: {reservation.note || "Không có"}</Text>
          <Text>
            Trạng thái:{" "}
            <Text
              style={{
                color:
                  reservation.status === "Pending"
                    ? "orange"
                    : reservation.status === "Completed"
                    ? "green"
                    : "red",
              }}
            >
              {reservation.status}
            </Text>
          </Text>

          {/* Nút hành động */}
          {reservation.status === "Pending" && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "red" }]}
                onPress={() => handleChangeStatus("Cancelled")}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "green" }]}
                onPress={() => handleChangeStatus("Completed")}
              >
                <Text style={{ color: "#fff" }}>Complete</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={{ color: "#fff" }}>Đóng</Text>
          </TouchableOpacity>
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
});

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
  name: string;
  phone: string;
  guests: number;
  table: string;
  time: string;
  note?: string;
};

interface Props {
  visible: boolean;
  reservation: Reservation | null;
  onClose: () => void;
}

const ReservationDetailModal: React.FC<Props> = ({ visible, reservation, onClose }) => {
  if (!reservation) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Chi tiết đặt bàn</Text>
          <Text>Tên: {reservation.name}</Text>
          <Text>SĐT: {reservation.phone}</Text>
          <Text>Số khách: {reservation.guests}</Text>
          <Text>Thời gian: {reservation.time}</Text>
          <Text>Bàn: {reservation.table}</Text>
          <Text>Ghi chú: {reservation.note || "Không có"}</Text>

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
  closeButton: {
    marginTop: 20,
    backgroundColor: "#831B1B",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
});

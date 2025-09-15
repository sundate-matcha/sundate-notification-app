import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      {/* Card Profile */}
      <View style={styles.card}>
        <Image
          source={{
            uri: "https://i.pravatar.cc/300", // ảnh đại diện demo
          }}
          style={styles.avatar}
        />
        <Text style={styles.name}>Nguyễn Văn A</Text>
        <Text style={styles.info}>📞 0123 456 789</Text>
        <Text style={styles.info}>✉️ nguyenvana@example.com</Text>
      </View>

      {/* Nút đổi mật khẩu */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button}>
          <Ionicons name="key-outline" size={20} color="#0568FB" />
          <Text style={styles.buttonText1}>Đổi mật khẩu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Ionicons name="log-out-outline" size={20} color="#E52424" />
          <Text style={styles.buttonText2}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    paddingTop: 40,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    width: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  info: {
    fontSize: 16,
    color: "#555",
    marginBottom: 4,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    width: "90%",
    justifyContent: "center",
  },
  buttonText1: {
    color: "#0568FB",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
  buttonText2: {
    color: "#E52424",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
  footer: {
    width: "100%",
    alignItems: "center",
    position: "absolute",
    bottom: 30,
  },
});

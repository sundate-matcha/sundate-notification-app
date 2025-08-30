import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Overall() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tổng quan</Text>
      {/* Dùng /calendar để chắc chắn reload không lỗi */}
      <Link href="/calendar" style={styles.button}>
        Đi đến màn hình Lịch đặt bàn
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#0",
  },
  button: {
    fontSize: 20,
    textDecorationLine: "underline",
    color: "#0",
  },
});

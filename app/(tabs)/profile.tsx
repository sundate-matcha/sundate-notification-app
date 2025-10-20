import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const storedName = await SecureStore.getItemAsync("sundate_fullName");
        if (storedName) {
          setFullName(storedName);
          setLoading(false);
          return;
        }

        const token = await SecureStore.getItemAsync("sundate_token");
        if (!token) {
          setLoading(false);
          return;
        }

        // Gọi đúng endpoint /api/auth/profile
        const res = await fetch(
          "https://sundate.justdemo.work/api/auth/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const text = await res.text();
        let data: any = text;
        try {
          data = JSON.parse(text);
        } catch (e) {
          // keep raw text if not JSON
        }

        if (res.ok) {
          // server trả { user }
          const user = data?.user || {};
          const name =
            (user.firstName &&
              user.lastName &&
              `${user.firstName} ${user.lastName}`) ||
            user.fullName ||
            user.name ||
            user.username ||
            null;
          if (name) {
            setFullName(name);
            await SecureStore.setItemAsync("sundate_fullName", name);
          }
        } else {
          console.warn("[Profile] /auth/profile failed", res.status, data);
        }
      } catch (err) {
        console.error("[Profile] error loading profile:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("sundate_token");
    await SecureStore.deleteItemAsync("sundate_fullName");
    router.push("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      {/* Card Profile */}
      <View style={styles.card}>
        <Image
          source={require("../../assets/images/Logo.png")}
          style={styles.avatar}
        />
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.name}>{fullName || "Admin"}</Text>
        )}
      </View>

      {/* Nút đổi mật khẩu */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button}>
          <Ionicons name="key-outline" size={20} color="#0568FB" />
          <Text style={styles.buttonText1}>Đổi mật khẩu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogout}>
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

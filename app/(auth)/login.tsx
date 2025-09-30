import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function LoginScreen() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // <-- state cho ẩn/hiện mật khẩu

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(400)).current;

  const openModal = () => {
    setShowOverlay(true);
  };

  useEffect(() => {
    if (showOverlay) {
      fadeAnim.setValue(0);
      slideAnim.setValue(400);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showOverlay]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowOverlay(false);
    });
  };

  const handleLogin = () => {
    if (username === "admin" && password === "123456") {
      closeModal();
      router.push("/(tabs)/overview");
    } else {
      alert("Sai tài khoản hoặc mật khẩu");
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require("../../assets/images/Symbol.png")}
        style={styles.logo1}
      />

      <Text style={styles.title}>Reservation and Order Management</Text>
      <Text style={styles.subtitle}>Sundate - matcha holic shelter</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.signInButton} onPress={openModal}>
          <Text style={styles.signInText}>Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signUpButton}>
          <Text style={styles.signUpText}>Register</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet Modal */}
      <Modal transparent visible={showOverlay} animationType="none">
        <TouchableWithoutFeedback onPress={closeModal}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
                <Animated.View
                  style={[
                    styles.bottomSheet,
                    { transform: [{ translateY: slideAnim }] },
                  ]}
                >
                  <Text style={styles.overlayTitle}>Log In</Text>
                  <View>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={username}
                      onChangeText={setUsername}
                      keyboardType="email-address"
                    />
                    <Text style={styles.inputLabel}>Mật khẩu</Text>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword} // toggle ẩn/hiện
                    />
                    {/* Nút ẩn/hiện mật khẩu */}
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.toggleBtn}
                    >
                      <Text style={styles.toggleText}>
                        {showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.signInBtn}
                    onPress={handleLogin}
                  >
                    <Text style={styles.signInText2}>Log In</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={closeModal}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </Animated.View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8DE",
    alignItems: "center",
    justifyContent: "center",
  },
  logo1: {
    width: 250,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    alignItems: "center",
  },
  signInButton: {
    backgroundColor: "#831B1B",
    borderRadius: 25,
    marginBottom: 15,
    width: "90%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  signInText: {
    color: "#FFF8DE",
    fontSize: 16,
    fontWeight: "bold",
  },
  signUpButton: {
    backgroundColor: "#FFF8DE",
    borderRadius: 25,
    marginBottom: 15,
    width: "90%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#831B1B",
  },
  signUpText: {
    color: "#831B1B",
    fontSize: 16,
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  bottomSheet: {
    width: "100%",
    backgroundColor: "#FFF5E1",
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
    backgroundColor: "#fff",
  },
  inputLabel: {
    marginBottom: 5,
  },
  toggleBtn: {
    marginBottom: 15,
    alignSelf: "flex-end",
  },
  toggleText: {
    color: "#831B1B",
    fontSize: 13,
    fontWeight: "bold",
  },
  signInBtn: {
    backgroundColor: "#831B1B",
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 10,
    justifyContent: "center",
  },
  signInText2: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelText: {
    color: "#831B1B",
    fontWeight: "bold",
  },
});

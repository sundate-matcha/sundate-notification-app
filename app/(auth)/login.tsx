import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image source={require("../../assets/Logo.png")} style={styles.logo} />

      {/* Title */}
      <Text style={styles.title}>Reservation and Order Management</Text>
      <Text style={styles.subtitle}>Sundate - matcha holic shelter</Text>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.signInButton}>
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signUpButton}>
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 150,
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
    backgroundColor: "#8B0000",
    paddingVertical: 15,
    paddingHorizontal: 80,
    borderRadius: 25,
    marginBottom: 15,
  },
  signInText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  signUpButton: {
    borderWidth: 1,
    borderColor: "#8B0000",
    paddingVertical: 15,
    paddingHorizontal: 80,
    borderRadius: 25,
  },
  signUpText: {
    color: "#8B0000",
    fontSize: 16,
    fontWeight: "bold",
  },
});


import { StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";

export default function CalendarScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LỊCH ĐẶT BÀN</Text>
      <View style={styles.calendarContainer}>
        <Calendar
          monthFormat={"MMMM yyyy"}
          theme={{
            todayTextColor: "#FFF8DE",
            todayBackgroundColor: "#831B1B",
            selectedDayBackgroundColor: "#831B1B",
            arrowColor: "#831B1B",
            textSectionTitleColor: "#831B1B",
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    backgroundColor: "#F2F2F2",
    gap: 50,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    left: 20,
    paddingTop: 20,
  },
  calendarContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
});

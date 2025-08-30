import { useRouter } from "expo-router"; // 👈 import router
import { StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";

export default function CalendarScreen() {
  const router = useRouter();

  const handleDayPress = (day: any) => {
    router.push({
      pathname: "/screens/reservationDateInfo",
      params: { date: day.dateString },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LỊCH ĐẶT BÀN</Text>
      <View style={styles.calendarContainer}>
        <Calendar
          monthFormat={"MMMM yyyy"}
          onDayPress={handleDayPress}
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
    backgroundColor: "#F2F2F7",
    gap: 50,
    flex: 1,
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

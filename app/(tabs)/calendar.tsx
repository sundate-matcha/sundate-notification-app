import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import React, { useEffect, useState } from "react";

export default function CalendarScreen() {
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);

  type MarkedDates = {
    [date: string]: {
      marked?: boolean;
      dotColor?: string;
    };
  };

  const [markedDates, setMarkedDates] = useState<MarkedDates>({});

  // Fetch reservations từ API
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await fetch(
          "https://68a2a89fc5a31eb7bb1d6794.mockapi.io/api/reservation"
        );
        const data = await res.json();
        setReservations(data);

        // Tạo danh sách ngày có đặt bàn
        const marked: MarkedDates = {};
        data.forEach((r: any) => {
          if (r.date) {
            marked[r.date] = {
              marked: true,
              dotColor: "#831B1B",
            };
          }
        });
        setMarkedDates(marked);
      } catch (err) {
        console.error("Error fetching reservations:", err);
      }
    };
    fetchReservations();
  }, []);

  const handleDayPress = (day: any) => {
    router.push({
      pathname: "/screens/reservationDateInfo",
      params: { date: day.dateString },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LỊCH ĐẶT BÀN</Text>
      <View style={styles.calendarWrapper}>
        <Calendar
          monthFormat={"MMMM yyyy"}
          onDayPress={handleDayPress}
          markedDates={markedDates}
          theme={{
            todayTextColor: "#FFF8DE",
            todayBackgroundColor: "#831B1B",
            selectedDayBackgroundColor: "#831B1B",
            arrowColor: "#831B1B",
            textSectionTitleColor: "#831B1B",
            dotColor: "#831B1B",
            selectedDotColor: "#FFF8DE",
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F2F2F2",
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 70,
    color: "#111",
  },
  calendarWrapper: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
});

import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

export default function CalendarScreen() {
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  type MarkedDates = {
    [date: string]: {
      marked?: boolean;
      dotColor?: string;
    };
  };

  const [markedDates, setMarkedDates] = useState<MarkedDates>({});

  // Fetch reservations from API
  const fetchReservations = async () => {
    try {
      const res = await fetch(
        "https://sundate.justdemo.work/api/reservations?limit=0"
      );
      const { reservations: data } = await res.json();
      setReservations(data);

      const marked: MarkedDates = {};
      data.forEach((r: any) => {
        if (r.date) {
          const dateStr = r.date.split("T")[0];
          marked[dateStr] = {
            marked: true,
            dotColor: "#831B1B",
          };
        }
      });
      setMarkedDates(marked);
    } catch (err) {
      console.error("Error fetching reservations:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchReservations();
  }, []);

  const handleDayPress = (day: any) => {
    router.push({
      pathname: "/screens/reservationDateInfo",
      params: { date: day.dateString },
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#831B1B"
        />
      }
    >
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8fafd",
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

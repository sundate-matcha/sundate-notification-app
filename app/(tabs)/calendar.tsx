import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";

// Mockup data
const reservations = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    phone: "0987654321",
    guests: 2,
    date: "2025-09-10",
    time: "09:30",
    table: "Bàn quầy bar",
    note: "",
    status: "Chưa đến",
  },
  {
    id: "2",
    name: "Nguyễn Văn B",
    phone: "0987654321",
    guests: 4,
    date: "2025-09-10",
    time: "11:00",
    table: "Bàn cửa sổ",
    note: "Sinh nhật",
    status: "Đã đến",
  },
  {
    id: "3",
    name: "Nguyễn Văn C",
    phone: "0987654321",
    guests: 3,
    date: "2025-09-12",
    time: "19:00",
    table: "Bàn dài",
    note: "",
    status: "Đã hủy bàn",
  },
];

export default function CalendarScreen() {
  const router = useRouter();

  type MarkedDates = {
    [date: string]: {
      marked?: boolean;
      dotColor?: string;
      selected?: boolean;
      selectedColor?: string;
      disableTouchEvent?: boolean;
    };
  };

  // Tạo danh sách ngày có đặt bàn (dùng dấu chấm)
  const markedDates: MarkedDates = reservations.reduce(
    (acc: MarkedDates, r) => {
      acc[r.date] = {
        marked: true,
        dotColor: "#831B1B",
      };
      return acc;
    },
    {}
  );

  const handleDayPress = (day: any) => {
    router.push({
      pathname: "/reservationDateInfo",
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
            textDayFontFamily: "HelveticaNeue-Medium",
            textMonthFontFamily: "HelveticaNeue-Bold",
            textDayHeaderFontFamily: "HelveticaNeue",
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F2F2F7",
    flex: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 70,
    marginTop: 20,
    color: "#111",
  },
  calendarWrapper: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
});

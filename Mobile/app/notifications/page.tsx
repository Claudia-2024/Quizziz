import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QuizHeader from "@/components/headers/header";
import { useTheme } from "@/theme/global";

const initialNotifications = [
  {
    id: "1",
    title: "New Test Available",
    message: "Math Revision Test is now available.",
    time: "2 min ago",
    read: false,
    type: "exam",
  },
  {
    id: "2",
    title: "Reminder",
    message: "You have a test scheduled tomorrow.",
    time: "1 hr ago",
    read: false,
    type: "reminder",
  },
  {
    id: "3",
    title: "Update",
    message: "New past questions uploaded.",
    time: "Yesterday",
    read: true,
    type: "update",
  },
];

export default function Notifications() {
  const theme = useTheme();
  const { typography } = theme;

  const [notifications, setNotifications] = useState(initialNotifications);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "exam":
        return "document-text-outline";
      case "reminder":
        return "alarm-outline";
      default:
        return "notifications-outline";
    }
  };

  return (
    <View style={styles.container}>
      <QuizHeader />
      <Text style={[{fontFamily: typography.fontFamily.heading},styles.title]}>Notifications</Text>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              !item.read && styles.unreadCard,
            ]}
            onPress={() => markAsRead(item.id)}
          >
            <View style={styles.iconBox}>
              <Ionicons
                name={getIcon(item.type)}
                size={24}
                color="#4B1F3B"
              />
            </View>

            <View style={styles.textBox}>
              <Text style={[{ fontFamily: typography.fontFamily.buttonText},styles.cardTitle]}>{item.title}</Text>
              <Text style={[{ fontFamily: typography.fontFamily.body},styles.cardMessage]}>{item.message}</Text>
              <Text style={[{ fontFamily: typography.fontFamily.body}, styles.time]}>{item.time}</Text>
            </View>

            {!item.read && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2e6f7",
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginHorizontal: 15,
    marginBottom: 15,
    color: "#4B1F3B",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    marginHorizontal: 15,
    marginBottom: 12,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#4B1F3B",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f2e6f7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textBox: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  cardMessage: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4B1F3B",
  },
});

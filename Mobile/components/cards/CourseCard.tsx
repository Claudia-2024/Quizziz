// components/cards/CourseCard.tsx
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useTheme } from "@/theme/global";
import { LinearGradient } from "expo-linear-gradient";

interface CourseCardProps {
  courseCode: string;
  courseName: string;
  instructor?: string;
  credits?: number;
  onPress?: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({
  courseCode,
  courseName,
  instructor,
  credits,
  onPress,
}) => {
  const theme = useTheme();
  const { colors, typography, spacing, radius } = theme;

  // Generate a consistent color based on course code
  const getGradientColors = (code: string) => {
    const hash = code
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      ["#FD2A9B", "#FF6B9D"],
      ["#331424", "#5A2447"],
      ["#33CCCC", "#66D9D9"],
      ["#FDCB50", "#FFD873"],
      ["#F15249", "#FF7B73"],
    ];
    return gradients[hash % gradients.length];
  };

  const gradientColors = getGradientColors(courseCode);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.touchable}
    >
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientBar, { borderRadius: radius.sm }]}
        />

        <View style={styles.content}>
          <View style={styles.header}>
            <View
              style={[styles.codeBadge, { backgroundColor: colors.secondary }]}
            >
              <Text
                style={[
                  styles.codeText,
                  { fontFamily: typography.fontFamily.buttonText },
                ]}
              >
                {courseCode}
              </Text>
            </View>

            {credits && (
              <View
                style={[styles.creditsBadge, { backgroundColor: colors.muted }]}
              >
                <Text
                  style={[
                    styles.creditsText,
                    { fontFamily: typography.fontFamily.body },
                  ]}
                >
                  {credits} Credits
                </Text>
              </View>
            )}
          </View>

          <Text
            style={[
              styles.courseName,
              {
                fontFamily: typography.fontFamily.heading,
                color: colors.text,
              },
            ]}
            numberOfLines={2}
          >
            {courseName}
          </Text>

          {instructor && (
            <Text
              style={[
                styles.instructor,
                {
                  fontFamily: typography.fontFamily.body,
                  color: colors.text,
                  opacity: 0.6,
                },
              ]}
            >
              👨‍🏫 {instructor}
            </Text>
          )}

          <View style={styles.footer}>
            <View
              style={[styles.statusDot, { backgroundColor: colors.blue }]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  fontFamily: typography.fontFamily.body,
                  color: colors.text,
                  opacity: 0.5,
                },
              ]}
            >
              Active
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CourseCard;
const styles = StyleSheet.create({
  touchable: {
    marginHorizontal: 15,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gradientBar: {
    height: 6,
    width: "100%",
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  codeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  codeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  creditsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  creditsText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  courseName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 24,
  },
  instructor: {
    fontSize: 14,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
});

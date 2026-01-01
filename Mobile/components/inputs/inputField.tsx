// components/InputField.tsx
import { useTheme } from "@/theme/global";
import React, { useEffect, useRef } from "react";
import {
  TextInput,
  StyleSheet,
  Image,
  Animated,
  Platform,
  Text,
} from "react-native";

interface Props {
  placeholder: string;
  icon?: any;
  secureTextEntry?: boolean;  //for passwords 
  value?: string;
  onChangeText?: (t: string) => void;
}

export default function InputField({
  placeholder,
  icon,
  secureTextEntry,
  value,
  onChangeText,
}: Props) {
  const theme = useTheme();
  const { typography, colors } = theme;
    // floating label animation 1 if text is there and label floats. 0 otherwise
  const focusAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = () => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    if (!value) {
      Animated.timing(focusAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start();
    }
  };

  // Label animation styles
  const labelStyle = {
    position: "absolute" as const,
    left: icon ? 44 : 14,
    top: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -6],
    }),
    fontSize: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 16],
    }),
    color: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.primary, colors.primary],
    }),
    fontFamily: typography.fontFamily.buttonText,
  };

  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', colors.white],
  });

  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.16],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor: colors.primary,
          backgroundColor: bgColor,
          shadowOpacity,
        },
      ]}
    >
      {icon ? (
        <Image source={icon} style={[styles.icon, { tintColor: colors.primary }]} />
      ) : null}

      <Animated.Text style={labelStyle}>{placeholder}</Animated.Text>

      <TextInput
        style={[
          styles.input,
          { fontFamily: typography.fontFamily.buttonText, color: '#000', backgroundColor: "transparent" },
        ]}
        secureTextEntry={secureTextEntry}
        onFocus={handleFocus}
        onBlur={handleBlur}
        value={value}
        onChangeText={onChangeText}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderBottomWidth: 1.5,
    // borderLeftWidth: 1.5,
    // borderRightWidth: 1.5,
    paddingHorizontal: 14,
    height: 60,
    margin: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
    position: "relative",
  },
  icon: {
    width: 24,
    height: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
  },
});

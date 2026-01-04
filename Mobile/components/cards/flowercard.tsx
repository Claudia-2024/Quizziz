// app/get-started-minimal.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  useColorScheme,
  Dimensions,
  ImageBackground,
} from "react-native";
import { router, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useTheme } from "@/theme/global";
import IconButton from "../buttons/iconButton";

const { width, height } = Dimensions.get("window");

export default function FlowerCard() {
  const theme = useTheme();
  const { colors, typography } = theme;

  return (
    <ImageBackground
      source={require("../../assets/images/leaf.png")}
      style={styles.background}
      imageStyle={{ borderRadius: 20 }}
    >
      <BlurView intensity={90} tint="dark" style={styles.blurOverlay} />

      {/* Add a custom color overlay */}
      <View style={styles.colorTint} />

      <View style={styles.container}>
        <View style={{flexDirection: 'row'}}>
        <Image source={require('../../assets/images/stack-of-books.png')} style={{width:165, height:165 ,position:'absolute', left:190, bottom:-10}} />
        </View>
      </View>
    </ImageBackground>
  );
}

export const styles = StyleSheet.create({
  background: {
    width: 370,
    height: 184,
    overflow: "hidden",
    borderRadius: 20,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  // The custom colored tint
  colorTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(51, 20, 36, 0.8)", // #331424 with transparency
  },
  text:{
    width:'70%',
    color: '#fff'
  },

  container: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  topContainer: {
    alignItems: "center",
  },

  hero: {
    width: width * 0.75,
    height: 300,
    marginBottom: 30,
    borderRadius: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
    color: '#fff'

  },

  subtitle: {
    fontSize: 18,
    textAlign: "center",
  },

  bottomContainer: {
    alignItems: "center",
  },
});

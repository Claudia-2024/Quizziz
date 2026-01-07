// components/cards/FlowerCard.tsx
import { useTheme } from "@/theme/global";
import { BlurView } from "expo-blur";
import React from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface FlowerCardProps {
  greeting: string;
  subtitle?: string;
}

export default function FlowerCard({ greeting, subtitle = "Ready to ace your exams?" }: FlowerCardProps) {
  const theme = useTheme();
  const { colors, typography } = theme;

  return (
    <ImageBackground
      source={require("../../assets/images/leaf.png")}
      style={styles.background}
      imageStyle={{ borderRadius: 20 }}
    >
      <BlurView intensity={2} tint="dark" style={styles.blurOverlay} />
      
      {/* Custom color overlay */}
      <View style={[ { backgroundColor: '#331424' }]} />

      <View style={styles.container}>
        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={[styles.greeting, { fontFamily: typography.fontFamily.heading, color: colors.white }]}>
            {greeting}
          </Text>
          <Text style={[styles.subtitle, { fontFamily: typography.fontFamily.body, color: colors.white }]}>
            {subtitle}
          </Text>
          
          {/* Decorative element */}
          <View style={styles.decorativeLine}>
            <View style={[styles.line, { backgroundColor: colors.secondary }]} />
            <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
          </View>
        </View>

        {/* Book Stack Image */}
        <Image 
          source={require('../../assets/images/stack-of-books.png')} 
          style={styles.bookImage}
          resizeMode="contain"
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    width: 370,
    height: 184,
    overflow: "hidden",
    borderRadius: 20,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  container: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 20,
    width:  370,
    height: 300,
    justifyContent: 'space-between',
    alignItems: 'center',
        backgroundColor: "rgba(51, 20, 36, 0.9)", // #331424 with transparency

  },
    hero: {
    width:  350,
    height: 300,
    marginBottom: 30,
    borderRadius: 20,
  },
  textContainer: {
    flex: 1,
    maxWidth: '55%',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
    color: '#fff',
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 20,
  },
  decorativeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  line: {
    width: 40,
    height: 3,
    borderRadius: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  bookImage: {
    width: 140,
    height: 140,
    position: 'absolute',
    right: 10,
    bottom: 10,
  },

});

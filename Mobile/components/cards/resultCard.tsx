import { StyleSheet, Text, View, Image, Animated } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/theme/global';

interface Props {
  // Deprecated: prefer structured props below
  title?: string;
  // Structured props for clearer rendering
  typeLabel?: string;
  courseCode?: string;
  courseName?: string;
  progress: number;
  total: number;
}

export default function ResultCard({ title, typeLabel, courseCode, courseName, progress, total }: Props) {
  const theme = useTheme();
  const { colors } = theme;

  const animatedWidth = useRef(new Animated.Value(0)).current;
  const progressPercent = (progress / total) * 100;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progressPercent,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  return (
    <View style={[styles.card, { backgroundColor: colors.white }]}>
      <Image
        source={require('../../assets/icons/document.png')}
        style={styles.icon}
      />

      <View style={styles.content}>
        <Text style={styles.title}>{typeLabel || title || ''}</Text>
        {(courseCode || courseName) ? (
          <Text style={styles.subTitle} numberOfLines={1}>
            {[courseCode || '', courseName || ''].filter(Boolean).join(' — ')}
          </Text>
        ) : null}

        {/* Progress bar */}
        <View style={styles.progressBackground}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: animatedWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          <Text style={styles.progressTextOverlay}>
            {progress}/{total}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf:'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom:12,
    borderWidth:1,
    borderColor: '#331424',
    width: 362,
    elevation: 3,
    marginLeft:15,
    marginRight:15,
  },

  icon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },

  subTitle: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
  },

  progressBackground: {
    width: '100%',
    height: 24, // increased height for better text fit
    borderRadius: 5,
    backgroundColor: '#E5E5E5',
    overflow: 'hidden',
    justifyContent: 'center', // centers the text vertically
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#4B164C',
    borderRadius: 5,
    position: 'absolute', // stays behind the text
    left: 0,
    top: 0,
  },

  progressTextOverlay: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    zIndex: 1,
  },
});

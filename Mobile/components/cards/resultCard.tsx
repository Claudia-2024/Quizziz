import { StyleSheet, Text, View, Image, Animated } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/theme/global';

interface Props {
  // Deprecated: prefer structured props below
  title?: string;

  // Structured props
  typeLabel?: string;
  courseCode?: string;
  courseName?: string;

  progress: number;
  total: number;
}

export default function ResultCard({
  title,
  typeLabel,
  courseCode,
  courseName,
  progress,
  total,
}: Props) {
  const theme = useTheme();
  const { colors, typography } = theme;

  const animatedWidth = useRef(new Animated.Value(0)).current;

  // ✅ Safe percentage calculation
  const progressPercent =
    total > 0 ? Math.min((progress / total) * 100, 100) : 0;

  useEffect(() => {
    animatedWidth.setValue(0); // reset animation on change

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
        <Text
          style={[
            styles.title,
            { fontFamily: typography?.fontFamily?.heading },
          ]}
        >
          {typeLabel || title || ''}
        </Text>

        {(courseCode || courseName) ? (
          <Text
            style={[
              styles.subTitle,
              { fontFamily: typography?.fontFamily?.body },
            ]}
            numberOfLines={1}
          >
            {[courseCode, courseName].filter(Boolean).join(' — ')}
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
            {total > 0 ? `${progress}/${total}` : '0/0'}
          </Text>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#331424',
    width: 362,
    elevation: 3,
    marginLeft: 15,
    marginRight: 15,
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
    height: 24,
    borderRadius: 5,
    backgroundColor: '#E5E5E5',
    overflow: 'hidden',
    justifyContent: 'center',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#4B164C',
    borderRadius: 5,
    position: 'absolute',
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

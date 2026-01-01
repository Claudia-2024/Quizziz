import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/global';

const TabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, typography } = theme;

  return (
    <View
      style={[
        styles.tabBar,
        {
          position: 'absolute',
          bottom: 30,
          borderColor: colors.primary,
          borderWidth:1,
          width: '100%',
          alignItems: 'center',
          paddingBottom: insets.bottom ? insets.bottom - 22 : 10,
        },
      ]}
    >
      {/* Background Curve */}
      <View style={styles.tabBackground} />

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel ??
          options.title ??
          route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        // ICON LOGIC
        const icon = (() => {
          switch (label) {
            case 'Home':
              return isFocused
                ? require('../../assets/icons/fhome.png')
                : require('../../assets/icons/home.png');
            case 'Test':
              return isFocused
                ? require('../../assets/icons/ftest.png')
                : require('../../assets/icons/test.png');
            case 'Study':
              return isFocused
                ? require('../../assets/icons/fstudy.png')
                : require('../../assets/icons/study.png');
            case 'Stats':
              return isFocused
                ? require('../../assets/icons/fstats.png')
                : require('../../assets/icons/stats.png');
            case 'Profile':
              return isFocused
                ? require('../../assets/icons/fprofile.png')
                : require('../../assets/icons/profile.png');
            default:
              return require('../../assets/icons/home.png');
          }
        })();

        return (
          <TouchableOpacity
            key={label}
            accessibilityRole="button"
            onPress={onPress}
            style={styles.tabButton}
          >
            <Image
              source={icon}
              style={{ 
                width: isFocused ? 52: 22,
                 height: isFocused ? 52: 22 }}
              resizeMode="contain"
            />

            {/* Hide label when focused */}
            {!isFocused && (
                
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.primary,
                    fontFamily: typography.fontFamily.buttonText,
                    fontSize: typography.fontSize.xs,
                  },
                ]}
              >
                {label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default TabBar;

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderRadius:30,
    justifyContent: 'space-around',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 80 : 70,
  },

  tabBackground: {
    position: 'absolute',
    bottom: 0,
    top:0,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius:30,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    marginTop: 4,
    fontWeight: '700',
  },
});

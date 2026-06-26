import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Platform } from 'react-native';

export default function CustomLoader({ themeColor }) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000, 
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web', 
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
      <Animated.Image
        source={require('../../assets/star.png')}
        style={{
          width: 50,
          height: 50,
          tintColor: themeColor,
          transform: [{ rotate: spin }]
        }}
        resizeMode="contain"
      />
    </View>
  );
}
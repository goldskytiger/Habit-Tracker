import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type Props = {
  color: string;
  visible: boolean;
};

const COUNT = 10;

export function RewardBurst({ color, visible }: Props) {
  const anims = useRef(
    Array.from({ length: COUNT }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      angle: (i / COUNT) * 2 * Math.PI,
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;
    const seqs = anims.map((anim) => {
      const dist = 36 + Math.random() * 22;
      const tx = Math.cos(anim.angle) * dist;
      const ty = Math.sin(anim.angle) * dist;
      anim.x.setValue(0);
      anim.y.setValue(0);
      anim.opacity.setValue(1);
      anim.scale.setValue(0);
      return Animated.parallel([
        Animated.timing(anim.x, { toValue: tx, duration: 480, useNativeDriver: true }),
        Animated.timing(anim.y, { toValue: ty, duration: 480, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(anim.scale, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(anim.scale, { toValue: 0.5, duration: 380, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(180),
          Animated.timing(anim.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]);
    });
    Animated.parallel(seqs).start();
  }, [visible]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: color },
            {
              transform: [
                { translateX: anim.x },
                { translateY: anim.y },
                { scale: anim.scale },
              ],
              opacity: anim.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    top: '50%',
    left: '50%',
    marginTop: -4,
    marginLeft: -4,
  },
});

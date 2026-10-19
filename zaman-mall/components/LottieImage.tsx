import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Image, ImageProps } from "expo-image";
import LottieView from "lottie-react-native";

interface LottieImageProps extends Omit<ImageProps, "source"> {
  uri?: string;
  source?: ImageProps["source"];
  lottieSize?: number;
  bgColor?: string;
}

/**
 * Drop-in replacement for expo-image Image / ShimmeringImage.
 * Shows Lottie animation while the image loads, then fades it in.
 */
export default function LottieImage({
  uri,
  source,
  style,
  lottieSize = 60,
  bgColor,
  contentFit = "cover",
  ...rest
}: LottieImageProps) {
  const [loaded, setLoaded] = useState(false);

  const resolvedSource = source ?? (uri ? { uri } : undefined);

  return (
    <View style={[style, styles.wrapper, bgColor ? { backgroundColor: bgColor } : {}]}>
      {/* Lottie placeholder */}
      {!loaded && (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <LottieView
            source={require("../assets/58741126-92b7-45ad-97db-0ef14c9baa72.json")}
            autoPlay
            loop
            style={{ width: lottieSize, height: lottieSize }}
          />
        </View>
      )}

      {/* Actual image */}
      {resolvedSource && (
        <Image
          source={resolvedSource}
          style={[StyleSheet.absoluteFill, { opacity: loaded ? 1 : 0 }]}
          contentFit={contentFit}
          transition={300}
          onLoad={() => setLoaded(true)}
          {...rest}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { overflow: "hidden" },
  center:  { alignItems: "center", justifyContent: "center" },
});

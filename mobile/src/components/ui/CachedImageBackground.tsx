import { Image, type ImageProps } from "expo-image";
import type { PropsWithChildren } from "react";
import {
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewProps,
} from "react-native";

type CachedImageBackgroundProps = PropsWithChildren<
  Omit<ViewProps, "children"> & {
    imageStyle?: StyleProp<ImageStyle>;
    source: ImageProps["source"];
  }
>;

export function CachedImageBackground({
  children,
  imageStyle,
  source,
  style,
  ...props
}: CachedImageBackgroundProps) {
  return (
    <View style={style} {...props}>
      <Image
        cachePolicy="memory-disk"
        contentFit="cover"
        priority="high"
        source={source}
        style={[styles.image, imageStyle]}
        transition={0}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});

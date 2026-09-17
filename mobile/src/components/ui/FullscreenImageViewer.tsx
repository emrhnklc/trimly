import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SymbolView } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';

export type FullscreenImage = {
  id: string;
  label?: string;
  source: { headers?: Record<string, string>; uri: string };
};

export function FullscreenImageViewer({
  images,
  initialIndex,
  onClose,
  visible,
}: {
  images: FullscreenImage[];
  initialIndex: number;
  onClose: () => void;
  visible: boolean;
}) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function showInitialImage() {
    setActiveIndex(initialIndex);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ animated: false, x: initialIndex * width });
    });
  }

  function updateIndex(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} onShow={showInitialImage} statusBarTranslucent visible={visible}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <View style={styles.header}>
          <AppText color="onPrimary" variant="label">
            {images.length > 1 ? `${activeIndex + 1} / ${images.length}` : 'Fotoğraf'}
          </AppText>
          <Pressable
            accessibilityLabel="Tam ekran fotoğrafı kapat"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'xmark', android: 'close', web: 'close' }}
              size={24}
              tintColor="#FFFFFF"
            />
          </Pressable>
        </View>
        <ScrollView
          decelerationRate="fast"
          horizontal
          onMomentumScrollEnd={updateIndex}
          pagingEnabled
          ref={scrollRef}
          showsHorizontalScrollIndicator={false}>
          {images.map((image) => (
            <View key={image.id} style={[styles.page, { width }]}>
              <Image
                accessibilityLabel={image.label ?? 'Tam ekran stil fotoğrafı'}
                contentFit="contain"
                source={image.source}
                style={styles.image}
                transition={150}
              />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#090909', flex: 1 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 68,
    paddingBottom: 8,
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 22,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  pressed: { opacity: 0.65 },
  page: { flex: 1, justifyContent: 'center' },
  image: { height: '100%', width: '100%' },
});

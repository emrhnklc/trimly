import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getPublicBarbershops } from '@/features/barbershops/api';
import type { PublicBarbershop } from '@/features/barbershops/types';

export default function DiscoverBarbershopsScreen() {
  const [barbershops, setBarbershops] = useState<PublicBarbershop[]>([]);
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBarbershops = useCallback(async (search?: string, refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      setBarbershops(await getPublicBarbershops(search));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Beklenmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const requestId = setTimeout(() => {
      void loadBarbershops();
    }, 0);

    return () => clearTimeout(requestId);
  }, [loadBarbershops]);

  function submitSearch() {
    const search = searchText.trim();
    setSubmittedSearch(search);
    void loadBarbershops(search);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={barbershops}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadBarbershops(submittedSearch, true)}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>TRIMLY</Text>
            <Text style={styles.title}>Yakınındaki iyi berberleri bul.</Text>
            <Text style={styles.subtitle}>
              Hizmeti, berberi ve sana uygun saati tek yerden seç.
            </Text>
            <View style={styles.searchRow}>
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={submitSearch}
                placeholder="Berber ara"
                placeholderTextColor="#8B8B93"
                returnKeyType="search"
                style={styles.searchInput}
              />
              <Pressable onPress={submitSearch} style={styles.searchButton}>
                <Text style={styles.searchButtonText}>Ara</Text>
              </Pressable>
            </View>
            <Text style={styles.sectionTitle}>
              {submittedSearch ? `“${submittedSearch}” için sonuçlar` : 'İşletmeleri keşfet'}
            </Text>
          </View>
        }
        renderItem={({ item }) => <BarbershopCard barbershop={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color="#111111" style={styles.loader} />
          ) : (
            <Text style={styles.emptyText}>
              {error ?? 'Henüz gösterilecek bir işletme yok.'}
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}

function BarbershopCard({ barbershop }: { barbershop: PublicBarbershop }) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{barbershop.name.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{barbershop.name}</Text>
        <Text numberOfLines={2} style={styles.cardDescription}>
          {barbershop.description || 'Randevu için profili incele.'}
        </Text>
        {barbershop.address ? <Text style={styles.address}>{barbershop.address}</Text> : null}
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F7F4' },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  eyebrow: { color: '#D05B32', fontSize: 12, fontWeight: '800', letterSpacing: 1.8, marginTop: 22 },
  title: { color: '#161616', fontSize: 34, fontWeight: '800', letterSpacing: -1.1, marginTop: 10 },
  subtitle: { color: '#66636A', fontSize: 16, lineHeight: 23, marginTop: 10 },
  searchRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  searchInput: { backgroundColor: '#FFFFFF', borderColor: '#E6E2DD', borderRadius: 14, borderWidth: 1, color: '#161616', flex: 1, fontSize: 16, height: 52, paddingHorizontal: 16 },
  searchButton: { alignItems: 'center', backgroundColor: '#161616', borderRadius: 14, justifyContent: 'center', paddingHorizontal: 18 },
  searchButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  sectionTitle: { color: '#161616', fontSize: 19, fontWeight: '700', marginBottom: 14, marginTop: 32 },
  card: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#EAE6E1', borderRadius: 18, borderWidth: 1, flexDirection: 'row', minHeight: 104, padding: 16 },
  cardPressed: { opacity: 0.72 },
  avatar: { alignItems: 'center', backgroundColor: '#F7E5DB', borderRadius: 16, height: 56, justifyContent: 'center', marginRight: 14, width: 56 },
  avatarText: { color: '#B84B24', fontSize: 23, fontWeight: '800' },
  cardContent: { flex: 1 },
  cardTitle: { color: '#1A1918', fontSize: 16, fontWeight: '700' },
  cardDescription: { color: '#737078', fontSize: 13, lineHeight: 18, marginTop: 4 },
  address: { color: '#A25D43', fontSize: 12, fontWeight: '600', marginTop: 6 },
  arrow: { color: '#918D88', fontSize: 30, lineHeight: 30, marginLeft: 8 },
  separator: { height: 10 },
  loader: { marginTop: 32 },
  emptyText: { color: '#6F6C70', fontSize: 15, lineHeight: 22, paddingTop: 12, textAlign: 'center' },
});

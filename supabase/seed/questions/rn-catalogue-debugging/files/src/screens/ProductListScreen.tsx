import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProducts } from '../hooks/useProducts';
import { ProductRow } from '../components/ProductRow';

const FAVOURITES_KEY = 'catalogue:favourites';

interface Props {
  onOpenProduct: (productId: string) => void;
}

export function ProductListScreen({ onOpenProduct }: Props) {
  const [query, setQuery] = useState('');
  const [favourites, setFavourites] = useState<string[]>([]);
  const { products, loading, error } = useProducts(query);

  useEffect(() => {
    AsyncStorage.getItem(FAVOURITES_KEY).then((raw) => {
      if (raw) setFavourites(JSON.parse(raw));
    });
  }, []);

  const toggleFavourite = useCallback((productId: string) => {
    const index = favourites.indexOf(productId);
    if (index >= 0) {
      favourites.splice(index, 1);
    } else {
      favourites.push(productId);
    }
    setFavourites(favourites);
    AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search products"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={products}
        keyExtractor={(_, index) => String(index)}
        renderItem={({ item }) => (
          <ProductRow
            product={item}
            isFavourite={favourites.includes(item.id)}
            onToggleFavourite={toggleFavourite}
            onPress={() => onOpenProduct(item.id)}
          />
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No products found</Text> : null}
        ListFooterComponent={loading ? <ActivityIndicator style={styles.spinner} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  search: {
    height: 44,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  error: { color: '#B42318', marginBottom: 8 },
  empty: { textAlign: 'center', color: '#526670', marginTop: 32 },
  spinner: { marginVertical: 16 },
});

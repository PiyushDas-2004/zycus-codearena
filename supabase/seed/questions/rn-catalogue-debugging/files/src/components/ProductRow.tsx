import React, { memo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '../api/catalogue';

interface Props {
  product: Product;
  isFavourite: boolean;
  onToggleFavourite: (productId: string) => void;
  onPress: () => void;
}

export const ProductRow = memo(function ProductRow({ product, isFavourite, onToggleFavourite, onPress }: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={product.name}>
      {imageFailed ? (
        <View style={[styles.image, styles.placeholder]} />
      ) : (
        <Image source={{ uri: product.imageUrl }} style={styles.image} onError={() => setImageFailed(true)} />
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatPrice(product.priceMinor, product.currency)}</Text>
      </View>
      <Pressable
        onPress={() => onToggleFavourite(product.id)}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
      >
        <Text style={styles.heart}>{isFavourite ? '♥' : '♡'}</Text>
      </Pressable>
    </Pressable>
  );
});

function formatPrice(minorUnits: number, currency: string) {
  return `${currency} ${(minorUnits / 100).toFixed(2)}`;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  image: { width: 56, height: 56, borderRadius: 8 },
  placeholder: { backgroundColor: '#E2E8F0' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#0B1F3F' },
  price: { marginTop: 2, color: '#526670' },
  heart: { fontSize: 22, color: '#0036B0' },
});

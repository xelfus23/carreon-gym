import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useProducts } from "@/src/hooks/useProducts";
import getCustomLoader from "../../components/CustomRefreshControl";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Store() {
  const { products = [], refresh, isLoading } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // References to smoothly animate scroll positions
  const categoryScrollRef = useRef<ScrollView>(null);
  const horizontalListRef = useRef<FlatList>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const unique = new Set(products.map((p) => p.category));
    return ["All", ...Array.from(unique)];
  }, [products]);

  // Pre-group or map data by category for the swiper
  const productsByCategory = useMemo(() => {
    return categories.map((category) => {
      const filtered =
        category === "All"
          ? products.filter((p) => p.is_active && p.available)
          : products.filter(
            (p) => p.category === category && p.is_active && p.available,
          );
      return { category, data: filtered };
    });
  }, [products, categories]);

  // Handle manual category pill taps
  const handleCategoryPress = (category: string, index: number) => {
    setSelectedCategory(category);
    horizontalListRef.current?.scrollToIndex({ index, animated: true });
  };

  // Sync state when swiping finishes
  const onMomentumScrollEnd = (e: any) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (index >= 0 && index < categories.length) {
      setSelectedCategory(categories[index]);
    }
  };

  return (
    <View className="flex-1 bg-background gap-2 pb-14 pt-2">
      {/* Category Select Ribbon */}
      <View className="h-12">
        <ScrollView
          ref={categoryScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            alignItems: "center",
            gap: 8,
          }}
        >
          {categories.map((cat, index) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => handleCategoryPress(cat, index)}
                className={`px-4 py-2 rounded-full border ${isActive
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                  }`}
              >
                <Text
                  className={`text-xs font-bold ${isActive ? "text-background" : "text-text-secondary"
                    }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Horizontal Swiper Container */}
      <FlatList
        ref={horizontalListRef}
        data={productsByCategory}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.category}
        onMomentumScrollEnd={onMomentumScrollEnd}
        // Prevents layout shifting and ensures snappy page calculations
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item: categoryGroup }) => (
          // Individual Page wrapper matching exact device width
          <View style={{ width: SCREEN_WIDTH }}>
            <FlatList
              data={categoryGroup.data}
              keyExtractor={(item, idx) => `${item.id}+${idx}`}
              numColumns={2}
              refreshControl={getCustomLoader(isLoading === null, refresh)}
              columnWrapperStyle={{
                justifyContent: "space-between",
                paddingHorizontal: 16,
              }}
              contentContainerClassName="pb-4 gap-4"
              renderItem={({ item }) => (
                <View className="w-[48%] bg-surface border border-border rounded-xl p-3 flex flex-col shadow-sm">
                  <View>
                    <View className="w-full h-28 bg-background rounded-lg overflow-hidden flex items-center justify-center mb-2">
                      <Image
                        source={{ uri: item.icon_url }}
                        className="w-full h-full"
                        resizeMode="contain"
                      />
                    </View>
                    <Text className="text-xs font-semibold text-text-secondary uppercase tracking-tight">
                      {item.category}
                    </Text>
                    <Text className="text-sm font-bold text-text-primary h-8 leading-tight">
                      {item.product_name}
                    </Text>
                  </View>

                  <View className="mt-2">
                    <Text className="text-base font-black text-primary">
                      ₱{Number(item.price).toFixed(2)}
                    </Text>
                    <Text className="text-[10px] text-text-secondary">
                      Stock: {item.stocks} units
                    </Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View
                  className="items-center justify-center py-20"
                  style={{ width: SCREEN_WIDTH - 32 }}
                >
                  <Text className="text-sm text-text-secondary italic">
                    No active store items match this category filter.
                  </Text>
                </View>
              }
            />
          </View>
        )}
      />
    </View>
  );
}

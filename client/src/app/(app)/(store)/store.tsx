import React, { useState, useMemo } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, ScrollView } from "react-native";
import { useProducts } from "@/src/hooks/useProducts";
import { SafeAreaView } from "react-native-safe-area-context";
// import { ProductProps } from "@/src/types/Product";
// import { useRouter } from "expo-router";

// interface CartItem {
//   product: ProductProps;
//   quantity: number;
// }

export default function Store() {
  const { products = [], refresh, isLoading } = useProducts();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  // const [cart, setCart] = useState<Record<string, CartItem>>({});
  // const navigation = useRouter();

  const categories = useMemo(() => {
    const unique = new Set(products.map((p) => p.category));
    return ["All", ...Array.from(unique)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return selectedCategory === "All"
      ? products.filter((p) => p.is_active && p.available)
      : products.filter((p) => p.category === selectedCategory && p.is_active && p.available);
  }, [products, selectedCategory]);

  // const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  // const totalPrice = Object.values(cart).reduce(
  //   (sum, item) => sum + item.product.price * item.quantity,
  //   0
  // );

  // const updateQuantity = (product: ProductProps, delta: number) => {
  //   setCart((prevCart) => {
  //     const currentItem = prevCart[product.id];
  //     const currentQty = currentItem ? currentItem.quantity : 0;
  //     const targetQty = currentQty + delta;

  //     if (targetQty <= 0) {
  //       const nextCart = { ...prevCart };
  //       delete nextCart[product.id];
  //       return nextCart;
  //     }

  //     if (targetQty > product.stocks) {
  //       alert(`Sorry, only ${product.stocks} items left in stock.`);
  //       return prevCart;
  //     }

  //     return {
  //       ...prevCart,
  //       [product.id]: { product, quantity: targetQty },
  //     };
  //   });
  // };

  // const handleCheckout = () => {
  //   const cartItems = Object.values(cart);

  //   if (cartItems.length === 0) {
  //     Alert.alert("Empty Cart", "Please add items to your cart before checking out.");
  //     return;
  //   }

  //   // Serialize cart items as a JSON string to pass via params
  //   const serializedItems = JSON.stringify(
  //     cartItems.map((ci) => ({
  //       productId: ci.product.id,
  //       name: ci.product.product_name,
  //       quantity: ci.quantity,
  //       price: ci.product.price,
  //       icon_url: ci.product.icon_url,
  //     }))
  //   );

  //   navigation.push({
  //     pathname: "/(app)/(home)/payment-instructions",
  //     params: {
  //       transactionType: "product",
  //       items: serializedItems,
  //       amount: String(totalPrice.toFixed(2)),
  //       itemName: cartItems.length === 1
  //         ? cartItems[0].product.product_name
  //         : `${cartItems.length} items`,
  //     },
  //   });
  // };

  return (
    <View className="flex-1 bg-background gap-2 pb-14 pt-2">
      {/* Category Select Ribbon */}
      <View className="h-12">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, alignItems: "center", gap: 8 }}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full border ${isActive ? "bg-primary border-primary" : "bg-surface border-border"
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

      {/* Product Catalog Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item, idx) => `${item.id}+${idx}`}
        numColumns={2}
        refreshing={isLoading === null}
        onRefresh={refresh}
        columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 16 }}
        contentContainerClassName="pb-4 gap-4"
        renderItem={({ item }) => {
          // const cartItem = cart[item.id];
          // const quantityInCart = cartItem ? cartItem.quantity : 0;

          return (
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
                <Text className="text-sm font-bold text-text-primary  h-8 leading-tight">
                  {item.product_name}
                </Text>
              </View>

              <View className="">
                <Text className="text-base font-black text-primary">
                  ₱{Number(item.price).toFixed(2)}
                </Text>
                <Text className="text-[10px] text-text-secondary">
                  Stock: {item.stocks} units
                </Text>

                {/* {quantityInCart > 0 ? (
                  <View className="flex-row items-center justify-between bg-background border border-border rounded-lg p-1">
                    <TouchableOpacity
                      onPress={() => updateQuantity(item, -1)}
                      className="w-7 h-7 bg-surface rounded-md items-center justify-center border border-border"
                    >
                      <Text className="text-sm font-bold text-text-primary">-</Text>
                    </TouchableOpacity>
                    <Text className="text-sm font-bold text-text-primary">{quantityInCart}</Text>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item, 1)}
                      className="w-7 h-7 bg-primary rounded-md items-center justify-center"
                    >
                      <Text className="text-sm font-bold text-background">+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => updateQuantity(item, 1)}
                    disabled={item.stocks <= 0}
                    className={`w-full py-2 rounded-lg items-center justify-center ${item.stocks <= 0 ? "bg-border" : "bg-primary"
                      }`}
                  >
                    <Text
                      className={`text-xs font-bold ${item.stocks <= 0 ? "text-text-secondary" : "text-background"
                        }`}
                    >
                      {item.stocks <= 0 ? "Out of Stock" : "Add to Cart"}
                    </Text>
                  </TouchableOpacity>
                )} */}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-sm text-text-secondary italic">
              No active store items match this category filter.
            </Text>
          </View>
        }
      />

      {/* {totalItems > 0 && (
        <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border px-6 pt-4 pb-6 shadow-2xl flex flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-text-secondary font-medium">
              Total Selection ({totalItems} items)
            </Text>
            <Text className="text-xl font-black text-text-primary mt-0.5">
              ₱{totalPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleCheckout}
            className="bg-primary px-6 py-3 rounded-xl shadow-md flex-row items-center justify-center"
          >
            <Text className="text-sm font-black text-background tracking-wide uppercase">
              Checkout Order
            </Text>
          </TouchableOpacity>
        </View>
      )} */}
    </View>
  );
}
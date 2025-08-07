import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star, ShoppingCart, Eye } from "lucide-react";
import { useLocation } from "wouter";

import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
  onCardClick?: (product: Product) => void;
  showDetailsButton?: boolean;
}

export function ProductCard({ product, onViewDetails, onCardClick, showDetailsButton = true }: ProductCardProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();


  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/cart", "POST", {
        productId: product.id,
        quantity: 1,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
      // Redirect to cart page after successful add
      setLocation("/cart");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // For rental products, redirect to product detail page to select dates
    if (product.productType === "rental") {
      setLocation(`/products/${product.id}`);
      return;
    }
    
    addToCartMutation.mutate();
  };



  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <Star className="w-4 h-4 text-gray-300" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      );
    }

    return stars;
  };

  const rating = parseFloat(product.rating || "0");
  const reviewCount = product.reviewCount || 0;

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(product);
    }
  };

  return (
    <Card 
      className="group cursor-pointer overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-gradient-to-br from-white to-slate-50 flex flex-col"
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden rounded-t-xl">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <span className="text-slate-600 text-2xl font-bold">
              {product.name.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3">
          {product.isFeatured && (
            <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs px-3 py-1.5 font-semibold shadow-lg">
              ⭐ Featured
            </Badge>
          )}
        </div>
        



      </div>
      
      <CardContent className="p-6 bg-gradient-to-b from-transparent to-slate-50/30 flex flex-col">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-blue-700 transition-colors duration-300">
            {product.name}
          </h3>
          
          <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {product.description || "No description available"}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ${parseFloat(
                product.productType === "rental" && product.rentalPrice 
                  ? product.rentalPrice 
                  : product.price
              ).toFixed(2)}
              {product.productType === "rental" && product.rentalPeriod && (
                <span className="text-sm text-slate-600 font-normal ml-1">
                  /{product.rentalPeriod}
                </span>
              )}
            </span>
            
            {rating > 0 && (
              <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200">
                <div className="flex">
                  {renderStars(rating)}
                </div>
                <span className="text-slate-600 text-sm font-medium">
                  ({reviewCount > 0 ? reviewCount : rating.toFixed(1)})
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-auto">
          {showDetailsButton ? (
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="flex-1 border-2 border-blue-200 hover:border-blue-400 text-blue-600 hover:text-blue-700 font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails?.(product);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Details
              </Button>
              
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group disabled:opacity-50 disabled:hover:scale-100"
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending}
              >
                {addToCartMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
                    Adding...
                  </div>
                ) : (
                  <>
                    <ShoppingCart className="mr-1 h-4 w-4 group-hover:animate-bounce" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group disabled:opacity-50 disabled:hover:scale-100"
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending}
            >
              {addToCartMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
                  Adding...
                </div>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                  Add to Cart
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

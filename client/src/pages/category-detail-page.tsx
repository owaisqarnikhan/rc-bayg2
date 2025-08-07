import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import type { Product, Category } from "@shared/schema";

export default function CategoryDetailPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");


  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const currentCategory = categories?.find(c => c.id === categoryId);

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = product.categoryId === categoryId;
    return matchesSearch && matchesCategory;
  }) || [];

  if (!currentCategory && categories) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Package className="w-24 h-24 text-slate-300 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Category Not Found</h1>
            <p className="text-slate-600 mb-8">The category you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/categories")}>
              Browse All Categories
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/categories")} 
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Button>

          <div className="mb-6">
            {currentCategory?.imageUrl && (
              <div className="w-full h-64 mb-6 rounded-2xl overflow-hidden shadow-lg">
                <img 
                  src={currentCategory.imageUrl} 
                  alt={currentCategory.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              {currentCategory?.name || "Category"}
            </h1>
            
            {currentCategory?.description && (
              <p className="text-lg text-slate-600 mb-6">
                {currentCategory.description}
              </p>
            )}

            <div className="flex items-center text-sm text-slate-500">
              <Package className="w-4 h-4 mr-2" />
              {filteredProducts.length} products available
            </div>
          </div>
          
          {/* Search */}
          <div className="mb-8">
            <Input
              placeholder={`Search ${currentCategory?.name || 'category'} products...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-8 w-20 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                onCardClick={(product) => setLocation(`/products/${product.id}`)}
                showDetailsButton={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="w-24 h-24 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {searchQuery ? "No Products Found" : "No Products Yet"}
            </h2>
            <p className="text-slate-600 mb-8">
              {searchQuery 
                ? `No products found matching "${searchQuery}" in ${currentCategory?.name}.`
                : `No products have been added to ${currentCategory?.name} yet.`
              }
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>


      
    </div>
  );
}
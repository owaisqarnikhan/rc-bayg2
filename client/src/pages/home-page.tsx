import { useQuery } from "@tanstack/react-query";
import { ImageSlider } from "@/components/image-slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import type { Category, SliderImage } from "@shared/schema";

export default function HomePage() {
  const [, setLocation] = useLocation();

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });



  const { data: sliderImages } = useQuery<SliderImage[]>({
    queryKey: ["/api/slider-images/active"],
  });

  return (
    <div className="bg-slate-50">
      {/* Image Slider Section */}
      <section className="w-full">
        <ImageSlider 
          images={sliderImages || []} 
          height="h-[60vh] min-h-[400px] w-full"
          autoplay={true}
          autoplayInterval={5000}
          showControls={true}
          showIndicators={true}
        />
      </section>

      {/* Product Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl mb-8 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-blue-900 bg-clip-text text-transparent mb-6 leading-relaxed min-h-[4rem] flex items-center justify-center">
              Shop by Category
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-emerald-600 to-blue-600 mx-auto rounded-full"></div>
          </div>
          
          {categoriesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="group relative overflow-hidden bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 opacity-80"></div>
                  <div className="relative">
                    <Skeleton className="h-56 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-6 w-32" />
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
                {categories.map((category) => (
                  <Card 
                    key={category.id} 
                    className="group cursor-pointer overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-gradient-to-br from-white to-slate-50/80 backdrop-blur-sm"
                    onClick={() => setLocation(`/category/${category.id}`)}
                  >
                    <div className="relative overflow-hidden">
                      {category.imageUrl ? (
                        <img 
                          src={category.imageUrl} 
                          alt={category.name}
                          className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-56 bg-gradient-to-br from-emerald-100 via-blue-50 to-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                              <span className="text-white text-2xl font-bold">
                                {category.name.charAt(0)}
                              </span>
                            </div>
                            <span className="text-slate-600 text-lg font-semibold">{category.name}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    
                    <CardContent className="p-6 bg-gradient-to-b from-transparent to-slate-50/30">
                      <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors duration-300">
                        {category.name}
                      </h3>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {category.description || "Discover our curated collection of premium products"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-600 font-semibold group-hover:text-emerald-700 transition-colors duration-300">
                          Browse Products
                        </span>
                        <svg className="w-5 h-5 text-emerald-600 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Call to Action */}
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={() => setLocation("/categories")}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  View All Categories
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">Categories Coming Soon</h3>
              <p className="text-slate-600 max-w-md mx-auto">
                We're organizing our product collections. Check back soon for easy category browsing!
              </p>
            </div>
          )}
        </div>
      </section>



      
    </div>
  );
}

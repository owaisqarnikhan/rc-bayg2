import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { format, differenceInDays } from "date-fns";
import { 
  Star, 
  ShoppingCart, 
  Package, 
  Tag, 
  Info, 
  Calendar,
  Calendar as CalendarIcon,
  DollarSign,
  Minus,
  Plus,
  ArrowLeft
} from "lucide-react";
import type { Product } from "@shared/schema";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  
  // Rental date state
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [dateError, setDateError] = useState("");
  const [isSingleDay, setIsSingleDay] = useState(false);
  
  // Rental period constants - ensure proper date boundaries
  const RENTAL_START = new Date(2025, 9, 18, 0, 0, 0); // October 18, 2025 00:00:00
  const RENTAL_END = new Date(2025, 9, 31, 23, 59, 59); // October 31, 2025 23:59:59

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity, rentalStartDate, rentalEndDate }: { 
      productId: string; 
      quantity: number;
      rentalStartDate?: string;
      rentalEndDate?: string;
    }) => {
      const res = await apiRequest("/api/cart", "POST", { 
        productId, 
        quantity,
        rentalStartDate,
        rentalEndDate
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to Cart",
        description: `${product?.name} has been added to your cart.`,
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

  // Date validation function
  const validateDateRange = (start: Date, end: Date): string => {
    if (start < RENTAL_START || start > RENTAL_END || end < RENTAL_START || end > RENTAL_END) {
      return "Selected dates are outside the allowed rental period. Please choose dates between 18th October and 31st October 2025.";
    }
    // For single day rentals, allow start and end to be the same
    if (!isSingleDay && start >= end) {
      return "End date must be after start date.";
    }
    // For single day rentals, start and end should be the same
    if (isSingleDay && start.getTime() !== end.getTime()) {
      return "For single day rental, start and end dates must be the same.";
    }
    return "";
  };

  // Calculate rental days and total cost
  const calculateRentalCost = (): { days: number; totalCost: number; dailyRate: number } => {
    if (!startDate || !endDate || !product?.rentalPrice) {
      return { days: 0, totalCost: 0, dailyRate: 0 };
    }
    
    const days = differenceInDays(endDate, startDate) + 1; // Include both start and end dates
    const dailyRate = parseFloat(product.rentalPrice);
    const totalCost = days * dailyRate * quantity;
    
    return { days, totalCost, dailyRate };
  };

  // Handle date selection
  const handleStartDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setStartDate(date);
    setDateError("");
    
    // For single day rental, set end date to start date
    if (isSingleDay) {
      setEndDate(date);
    } else if (endDate) {
      // If we have both dates, validate them
      const error = validateDateRange(date, endDate);
      setDateError(error);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (!date || isSingleDay) return; // Prevent end date selection in single day mode
    
    setEndDate(date);
    setDateError("");
    
    // If we have both dates, validate them
    if (startDate) {
      const error = validateDateRange(startDate, date);
      setDateError(error);
    }
  };

  const handleSingleDayToggle = (checked: boolean) => {
    setIsSingleDay(checked);
    if (checked && startDate) {
      setEndDate(startDate); // Set end date to start date for single day
      setDateError(""); // Clear any existing errors
    } else if (!checked && startDate && endDate && startDate.getTime() === endDate.getTime()) {
      setEndDate(undefined); // Clear end date if it was same as start date
      setDateError("");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="outline" onClick={() => setLocation("/products")} className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600">The product you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    // Validate rental dates if product is rental
    if (product.productType === "rental") {
      if (!startDate || !endDate) {
        toast({
          title: "Dates Required",
          description: "Please select start and end dates for rental period.",
          variant: "destructive",
        });
        return;
      }
      
      if (dateError) {
        toast({
          title: "Invalid Dates",
          description: dateError,
          variant: "destructive",
        });
        return;
      }

    }

    // Format dates as YYYY-MM-DD without timezone conversion
    const formatDateForServer = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startDateString = startDate ? formatDateForServer(startDate) : undefined;
    const endDateString = endDate ? formatDateForServer(endDate) : undefined;
    


    addToCartMutation.mutate({
      productId: product.id,
      quantity,
      rentalStartDate: startDateString,
      rentalEndDate: endDateString
    });
  };

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="outline" onClick={() => setLocation("/products")} className="mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-xl overflow-hidden shadow-lg">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <Package className="w-24 h-24 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Product Badges */}
            <div className="flex flex-wrap gap-2">
              {product.isFeatured && (
                <Badge variant="default" className="bg-yellow-500">
                  ⭐ Featured
                </Badge>
              )}
              <Badge variant={product.productType === "sale" ? "default" : "secondary"}>
                {product.productType === "sale" ? "For Sale" : "For Rent"}
              </Badge>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Available
              </Badge>
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              {/* Rating */}
              {rating > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center">
                    {renderStars(rating)}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.rating} ({product.reviewCount} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Pricing */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-semibold text-gray-700">
                      {product.productType === "rental" ? "Rental Price:" : "Sale Price:"}
                    </span>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-primary">
                        ${parseFloat(
                          product.productType === "rental" && product.rentalPrice 
                            ? product.rentalPrice 
                            : product.price
                        ).toFixed(2)}
                      </span>
                      {product.productType === "rental" && product.rentalPeriod && (
                        <p className="text-sm text-gray-600">per {product.rentalPeriod}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* VAT Notice */}
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                    <Info className="w-4 h-4 inline mr-2" />
                    Prices exclude 10% VAT
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                {product.description || "No description available for this product."}
              </p>
            </div>

            {/* Rental Date Selection */}
            {product.productType === "rental" && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Select Rental Period</h3>
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Products rental only between 18th October and 31st October 2025.
                        You can select dates for single day or multiple day rentals. Pricing will be automatically calculated based on the number of days selected.
                      </p>
                    </div>
                    
                    {/* Single Day Option */}
                    <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Checkbox 
                        id="single-day" 
                        checked={isSingleDay}
                        onCheckedChange={handleSingleDayToggle}
                      />
                      <label 
                        htmlFor="single-day" 
                        className="text-sm font-medium text-blue-800 cursor-pointer flex-1"
                      >
                        Single day rental (just pick one date)
                      </label>
                      {isSingleDay && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          Only start date needed
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Start Date Picker */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Start Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "PPP") : "Select start date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={startDate}
                              onSelect={handleStartDateSelect}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const checkDate = new Date(date);
                                checkDate.setHours(0, 0, 0, 0);
                                
                                if (checkDate < RENTAL_START || checkDate > RENTAL_END || checkDate < today) {
                                  return true;
                                }
                                return false;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* End Date Picker */}
                      <div className={`space-y-2 ${isSingleDay ? 'opacity-50 pointer-events-none' : ''}`}>
                        <label className="text-sm font-medium text-gray-700">
                          End Date {isSingleDay && "(Not needed for single day)"}
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP") : "Select end date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={endDate}
                              onSelect={handleEndDateSelect}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const checkDate = new Date(date);
                                checkDate.setHours(0, 0, 0, 0);
                                
                                if (checkDate < RENTAL_START || checkDate > RENTAL_END || checkDate < today) {
                                  return true;
                                }
                                if (startDate && checkDate <= startDate) {
                                  return true;
                                }
                                return false;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    {/* Date Error Display */}
                    {dateError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">❗ {dateError}</p>
                      </div>
                    )}
                    
                    {/* Rental Cost Display */}
                    {startDate && endDate && !dateError && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 mb-2">Rental Summary</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-green-700">Duration:</span>
                            <p className="font-medium text-green-900">{calculateRentalCost().days} days</p>
                          </div>
                          <div>
                            <span className="text-green-700">Daily Rate:</span>
                            <p className="font-medium text-green-900">${calculateRentalCost().dailyRate}</p>
                          </div>
                          <div>
                            <span className="text-green-700">Total Cost:</span>
                            <p className="font-bold text-green-900">${calculateRentalCost().totalCost.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Details */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Product Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">SKU:</span>
                    <span className="font-medium">{product.sku || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">Unit:</span>
                    <span className="font-medium">{product.unitOfMeasure || 'piece'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{product.productType}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">Added:</span>
                    <span className="font-medium">
                      {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add to Cart Section */}
            <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-medium text-gray-700">Quantity:</span>
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-10 w-10 p-0"
                          onClick={decrementQuantity}
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-16 text-center font-medium text-lg">{quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-10 w-10 p-0"
                          onClick={incrementQuantity}
                          disabled={false}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-2xl font-semibold">
                        Total: ${(() => {
                          if (product.productType === "rental" && startDate && endDate && !dateError) {
                            return calculateRentalCost().totalCost.toFixed(2);
                          }
                          const displayPrice = product.productType === "rental" && product.rentalPrice 
                            ? product.rentalPrice 
                            : product.price;
                          return (parseFloat(displayPrice) * quantity).toFixed(2);
                        })()}
                      </span>
                      <Button 
                        onClick={handleAddToCart}
                        disabled={addToCartMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        size="lg"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>


          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ShoppingCart, 
  Star, 
  Package, 
  Tag, 
  Info, 
  Calendar,
  DollarSign,
  Minus,
  Plus,
  CalendarIcon
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;

  sku: string | null;
  categoryId: string | null;
  unitOfMeasure?: string | null;
  imageUrl?: string | null;
  isActive: boolean | null;
  isFeatured: boolean | null;
  rating: string | null;
  reviewCount: number | null;
  productType: string;
  rentalPeriod?: string | null;
  rentalPrice?: string | null;
  createdAt: Date | null;
  category?: {
    name: string;
  };
}

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [dateError, setDateError] = useState<string>("");

  // Define rental period constraints
  const RENTAL_START = new Date(2025, 9, 18); // October 18, 2025 (month is 0-indexed)
  const RENTAL_END = new Date(2025, 9, 31); // October 31, 2025

  // Validate date range for rental products
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
    // Get the appropriate price for rental calculation
    const rentalPrice = product?.productType === "rental" && product?.rentalPrice 
      ? product.rentalPrice 
      : product?.price;
    
    if (!startDate || !endDate || !rentalPrice) {
      return { days: 0, totalCost: 0, dailyRate: 0 };
    }
    
    const days = differenceInDays(endDate, startDate) + 1; // Include both start and end dates
    const dailyRate = parseFloat(rentalPrice);
    const totalCost = days * dailyRate * quantity;
    
    return { days, totalCost, dailyRate };
  };

  // Add single day rental state
  const [isSingleDay, setIsSingleDay] = useState(false);
  
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

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity, rentalStartDate, rentalEndDate }: { 
      productId: string; 
      quantity: number; 
      rentalStartDate?: Date; 
      rentalEndDate?: Date; 
    }) => {
      const payload: any = { productId, quantity };
      
      // Add rental dates if this is a rental product
      if (product?.productType === "rental" && rentalStartDate && rentalEndDate) {
        payload.rentalStartDate = rentalStartDate.toISOString();
        payload.rentalEndDate = rentalEndDate.toISOString();
      }
      
      const res = await apiRequest("/api/cart", "POST", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to Cart",
        description: `${product?.name} has been added to your cart.`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  if (!product) return null;

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

    addToCartMutation.mutate({
      productId: product.id,
      quantity,
      rentalStartDate: startDate,
      rentalEndDate: endDate
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Details
          </DialogTitle>
          <DialogDescription>
            Complete information about {product.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <Package className="w-16 h-16 text-gray-400" />
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
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
              {product.category && (
                <p className="text-sm text-gray-600 mb-3">
                  Category: {product.category.name}
                </p>
              )}
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= parseFloat(product.rating || "0")
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>
            </div>

            {/* Pricing */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-700">
                      {product.productType === "rental" ? "Rental Price:" : "Sale Price:"}
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary">
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
                  <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                    <Info className="w-4 h-4 inline mr-1" />
                    Prices exclude 10% VAT
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description || "No description available for this product."}
              </p>
            </div>

            {/* Product Details */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">SKU:</span>
                    <span className="font-medium">{product.sku || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Stock:</span>
                    <span className="font-medium">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{product.productType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Added:</span>
                    <span className="font-medium">
                      {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rental Date Selection - Only for rental products */}
            {product.productType === "rental" && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Rental Period</h3>
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-800">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Products rental only between 18th October and 31st October 2025.
                        You can select dates for single day or multiple day rentals. Pricing will be automatically calculated based on the number of days selected.
                      </p>
                    </div>
                    
                    {/* Single Day Option */}
                    <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Checkbox 
                        id="modal-single-day" 
                        checked={isSingleDay}
                        onCheckedChange={handleSingleDayToggle}
                      />
                      <label 
                        htmlFor="modal-single-day" 
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
                              disabled={(date) => 
                                date < RENTAL_START || 
                                date > RENTAL_END || 
                                date < new Date()
                              }
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
                                return date < RENTAL_START || 
                                       date > RENTAL_END || 
                                       date < new Date() ||
                                       (startDate ? date <= startDate : false);
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
                        <p className="text-sm text-red-800">
                          ❗ {dateError}
                        </p>
                      </div>
                    )}

                    {/* Rental Cost Summary */}
                    {startDate && endDate && !dateError && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-sm text-green-800 space-y-1">
                          <p><strong>Rental Summary:</strong></p>
                          <p>• Period: {format(startDate, "MMM dd")} - {format(endDate, "MMM dd, yyyy")}</p>
                          <p>• Duration: {calculateRentalCost().days} days</p>
                          <p>• Rate: ${calculateRentalCost().dailyRate} per day</p>
                          <p>• Quantity: {quantity} item(s)</p>
                          <p><strong>• Total: ${calculateRentalCost().totalCost.toFixed(2)}</strong></p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add to Cart Section */}
            {true && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-700">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={decrementQuantity}
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={incrementQuantity}
                          disabled={false}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">
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
                        disabled={addToCartMutation.isPending || (product.productType === "rental" && (!startDate || !endDate || !!dateError))}
                        className="flex items-center gap-2"
                      >
                        {addToCartMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Adding...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}


          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Gift } from "lucide-react";

interface PromotionalBannerProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onButtonClick?: () => void;
  variant?: "default" | "accent" | "gradient";
  icon?: "sparkles" | "zap" | "gift";
}

export function PromotionalBanner({
  title = "Special Offer",
  description = "Don't miss out on our exclusive deals",
  buttonText = "Shop Now",
  onButtonClick,
  variant = "default",
  icon = "sparkles"
}: PromotionalBannerProps) {
  const icons = {
    sparkles: Sparkles,
    zap: Zap,
    gift: Gift
  };
  
  const IconComponent = icons[icon];

  const getBackgroundClass = () => {
    switch (variant) {
      case "accent":
        return "bg-gradient-to-r from-accent to-yellow-500";
      case "gradient":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      default:
        return "bg-gradient-to-r from-primary to-blue-600";
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-0">
        <div className={`relative ${getBackgroundClass()} text-white overflow-hidden`}>
          {/* Prominent Corner Geometric Designs */}
          <div 
            className="absolute top-0 right-0 w-24 h-24 opacity-100 pointer-events-none"
            style={{
              backgroundImage: `url('/attached_assets/Artboard-1_1753876937461.png')`,
              backgroundSize: 'contain',
              backgroundPosition: 'top right',
              backgroundRepeat: 'no-repeat',
              transform: 'scale(1.4)'
            }}
          />
          <div 
            className="absolute bottom-0 left-0 w-24 h-24 opacity-90 pointer-events-none"
            style={{
              backgroundImage: `url('/attached_assets/Artboard-1_1753876937461.png')`,
              backgroundSize: 'contain',
              backgroundPosition: 'bottom left',
              backgroundRepeat: 'no-repeat',
              transform: 'scale(1.3) rotate(180deg)'
            }}
          />
          
          {/* Enhanced Center Geometric Background */}
          <div 
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: `url('/attached_assets/Artboard-1_1753876937461.png')`,
              backgroundSize: '25%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              mixBlendMode: 'overlay'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
          <div className="relative z-10 p-8 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-full">
                <IconComponent className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">{title}</h3>
                <p className="opacity-90">{description}</p>
              </div>
            </div>
            {onButtonClick && (
              <Button
                onClick={onButtonClick}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 transition-all duration-200"
                variant="outline"
              >
                {buttonText}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
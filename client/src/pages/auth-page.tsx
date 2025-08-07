import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Removed tabs import - only login now available
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type SiteSettings } from "@shared/schema";
import { z } from "zod";
import { Loader2, Store, Shield, Truck, CreditCard } from "lucide-react";

const loginSchema = insertUserSchema.pick({ username: true, password: true });
type LoginData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  // Redirect if already logged in (use effect to avoid render issues)
  if (user) {
    setTimeout(() => setLocation("/"), 0);
    return null;
  }

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data, {
      onSuccess: () => setLocation("/"),
    });
  };

  // Registration removed - login only

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Forms */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div className="text-center">
            {settings?.loginPageLogo && settings.loginPageLogo.trim() !== "" && (
              <img 
                src={settings.loginPageLogo} 
                alt={settings.loginPageTitle || "Login"} 
                className="w-auto mx-auto mb-4 sm:mb-6 max-w-full h-auto"
                style={{ 
                  height: `${Math.min(settings.loginPageLogoWidth || 80, 120)}px`,
                  maxHeight: '120px'
                }}
              />
            )}
            
            {/* Three main customizable headings */}
            {settings?.loginPageHeading1 && settings.loginPageHeading1.trim() !== "" && (
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                {settings.loginPageHeading1}
              </h1>
            )}
            
            {settings?.loginPageHeading2 && settings.loginPageHeading2.trim() !== "" && (
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                {settings.loginPageHeading2}
              </h1>
            )}
            
            {settings?.loginPageHeading3 && settings.loginPageHeading3.trim() !== "" && (
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                {settings.loginPageHeading3}
              </h1>
            )}
          </div>

          <Card className="shadow-lg border-0 sm:border bg-white dark:bg-gray-800">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl text-center dark:text-white">
                Sign In to Your Account
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4 sm:space-y-5">
                <div>
                  <Label htmlFor="username" className="text-sm font-medium dark:text-gray-200">
                    Username
                  </Label>
                  <Input
                    id="username"
                    {...loginForm.register("username")}
                    className="mt-2 h-11 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    placeholder="Enter your username"
                  />
                  {loginForm.formState.errors.username && (
                    <p className="text-sm text-red-500 mt-2">
                      {loginForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-sm font-medium dark:text-gray-200">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...loginForm.register("password")}
                    className="mt-2 h-11 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    placeholder="Enter your password"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500 mt-2">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium mt-6" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
              
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {settings?.loginPageAccessMessage || "Need an account? Contact your store administrator for access credentials."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Background Image (hidden on mobile, visible on large screens) */}
      <div 
        className="hidden lg:flex lg:flex-1 relative overflow-hidden"
        style={{
          backgroundImage: `url('/uploads/login-separator.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Optional overlay for better contrast */}
        <div className="absolute inset-0 bg-black/10"></div>
      </div>
    </div>
  );
}

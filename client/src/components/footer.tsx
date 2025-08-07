import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import type { SiteSettings } from "@shared/schema";

export default function Footer() {
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="text-white relative bg-cover bg-center bg-no-repeat min-h-[200px] w-full flex-shrink-0 mt-auto"
      style={{
        backgroundImage: `url('${settings?.footerBackgroundUrl || '/uploads/footer-background.png'}')`,
      }}
    >
      <div className="absolute inset-0 bg-slate-900/85"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Company Info - Custom Image */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            {settings?.footerLeftImage ? (
              <div className="mb-4 sm:mb-6">
                <img 
                  src={settings.footerLeftImage} 
                  alt="Company Image" 
                  className="h-auto rounded max-w-full" 
                  style={{ maxWidth: `${Math.min(settings.footerLeftImageWidth || 200, 180)}px` }}
                />
              </div>
            ) : (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold">{settings?.siteName || "InnovanceOrbit"}</h3>
              </div>
            )}
            {settings?.footerDescription && (
              <p className="text-slate-300 mb-4 sm:mb-6 text-sm sm:text-base max-w-md">
                {settings.footerDescription}
              </p>
            )}
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm sm:text-base">
              {settings?.contactEmail && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span className="text-slate-300 break-all">{settings.contactEmail}</span>
                </div>
              )}
              {settings?.contactPhone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span className="text-slate-300">{settings.contactPhone}</span>
                </div>
              )}
              {settings?.contactAddress && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-sm sm:text-base">{settings.contactAddress}</span>
                </div>
              )}

            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{settings?.quickLinksTitle || "Quick Links"}</h4>
            <nav className="space-y-2">
              <Link href="/" className="block text-slate-300 hover:text-white transition-colors">
                {settings?.quickLinkHome || "Home"}
              </Link>
              <Link href="/products" className="block text-slate-300 hover:text-white transition-colors">
                {settings?.quickLinkProducts || "Products"}
              </Link>
              <Link href="/about" className="block text-slate-300 hover:text-white transition-colors">
                {settings?.quickLinkAbout || "About"}
              </Link>
              <Link href="/contact" className="block text-slate-300 hover:text-white transition-colors">
                {settings?.quickLinkContact || "Contact"}
              </Link>
            </nav>
          </div>

          {/* Office Hours & Social Media */}
          <div>
            {/* Office Hours */}
            {settings?.businessHours && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4">{settings?.officeHoursTitle || "Office Hours"}</h4>
                <div className="flex items-center space-x-2 text-slate-300">
                  <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{settings.businessHours}</span>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {settings?.paymentMethodsImage && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4">Payment Methods</h4>
                <img 
                  src={settings.paymentMethodsImage} 
                  alt="Accepted payment methods" 
                  className="h-auto rounded"
                  style={{ maxWidth: `${settings.paymentMethodsImageWidth || 250}px` }}
                />
              </div>
            )}

            {/* Social Media */}
            {(settings?.socialFacebook || settings?.socialTwitter || settings?.socialInstagram || settings?.socialLinkedin) && (
              <>
                <h4 className="text-lg font-semibold mb-4">{settings?.socialTitle || "Follow Us"}</h4>
                <div className="flex space-x-4">
                  {settings?.socialFacebook && (
                    <a href={settings.socialFacebook} target="_blank" rel="noopener noreferrer" 
                       className="text-slate-400 hover:text-white transition-colors">
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {settings?.socialTwitter && (
                    <a href={settings.socialTwitter} target="_blank" rel="noopener noreferrer"
                       className="text-slate-400 hover:text-white transition-colors">
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {settings?.socialInstagram && (
                    <a href={settings.socialInstagram} target="_blank" rel="noopener noreferrer"
                       className="text-slate-400 hover:text-white transition-colors">
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {settings?.socialLinkedin && (
                    <a href={settings.socialLinkedin} target="_blank" rel="noopener noreferrer"
                       className="text-slate-400 hover:text-white transition-colors">
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-2 border-slate-600 mt-6 pt-6 text-center">
          <p className="text-slate-400">
            {settings?.copyrightText || `© ${currentYear} InnovanceOrbit. All rights reserved.`}
          </p>
          {settings?.additionalFooterText && (
            <p className="text-slate-500 text-sm mt-2">{settings.additionalFooterText}</p>
          )}
        </div>
      </div>
    </footer>
  );
}
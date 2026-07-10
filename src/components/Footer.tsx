import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="mt-32 bg-[oklch(0.21_0.05_260)] text-white/80">
      <div className="container-page py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="RentalSphere Logo" className="h-9 w-9 object-contain" />
            <span className="font-display text-xl font-semibold text-white">RentalSphere</span>
          </div>
          <p className="text-sm leading-relaxed text-white/60">
            Premium car and bike rentals across the UK. Drive luxury, ride freedom.
          </p>
          <div className="flex gap-2">
            {[
              { Icon: Facebook, href: "https://facebook.com" },
              { Icon: Instagram, href: "https://instagram.com" },
              { Icon: Twitter, href: "https://twitter.com" },
              { Icon: Youtube, href: "https://youtube.com" },
            ].map(({ Icon, href }, i) => (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-white/5 hover:bg-primary hover:text-white transition-colors"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Company</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/about" className="hover:text-white">
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/careers" className="hover:text-white">
                Careers
              </Link>
            </li>
            <li>
              <Link to="/press" className="hover:text-white">
                Press
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Explore</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/cars" className="hover:text-white">
                Cars
              </Link>
            </li>
            <li>
              <Link to="/bikes" className="hover:text-white">
                Bikes
              </Link>
            </li>
            <li>
              <Link to="/locations" className="hover:text-white">
                Locations
              </Link>
            </li>
            <li>
              <Link to="/help" className="hover:text-white">
                Help Center
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Stay in the loop</h4>
          <p className="text-sm text-white/60 mb-3">Weekly drops on new fleet and deals.</p>
          <form className="flex gap-2">
            <input
              type="email"
              placeholder="you@email.com"
              className="flex-1 h-11 rounded-full bg-white/5 border border-white/10 px-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary"
            />
            <button className="h-11 px-5 rounded-full gradient-brand text-white text-sm font-medium">
              Join
            </button>
          </form>
          <div className="mt-6 space-y-2 text-xs text-white/60">
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" /> +44 20 7946 0958
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> hello@rentalsphere.com
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> Soho, London, UK
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <span>© {new Date().getFullYear()} RentalSphere. All rights reserved.</span>
          <div className="flex gap-5">
            <Link to="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link to="/cookies" className="hover:text-white">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";

import appCss from "../styles.css?url";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth-context";
import logo from "@/assets/logo.png";

function NotFoundComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-ink">Lost in the hills</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The road you're looking for doesn't exist. Let's get you back on track.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 px-6 items-center justify-center rounded-full gradient-brand text-white text-sm font-medium shadow-[var(--shadow-glow)]"
        >
          Drive home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-ink">Something went sideways</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try refreshing or head back home.</p>
        <div className="mt-6 flex gap-2 justify-center">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="h-10 px-5 rounded-full gradient-brand text-white text-sm font-medium"
          >
            Try again
          </button>
          <a
            href="/"
            className="h-10 px-5 inline-flex items-center rounded-full border border-border text-sm font-medium"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RentalSphere — Premium Car & Bike Rentals Across the UK" },
      {
        name: "description",
        content:
          "Rent luxury cars, SUVs and bikes across the UK. Instant booking, transparent pricing, and multiple checkout options.",
      },
      { name: "theme-color", content: "#5D8BF4" },
      { property: "og:title", content: "RentalSphere — Premium Car & Bike Rentals" },
      {
        property: "og:description",
        content: "Drive luxury, ride freedom. Premium rentals across the UK.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: logo },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1 pt-16 md:pt-20">
                <Outlet />
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

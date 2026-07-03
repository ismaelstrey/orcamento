import type { Metadata } from "next";
import { IBM_Plex_Mono, Libre_Baskerville } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/components/auth/authProvider";
import { ThemeProvider } from "@/components/theme/themeProvider";
import "./globals.css";

const displayFont = Libre_Baskerville({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Orcamento | IQP Bootstrap",
  description: "Base inicial do Intelligent Quote Platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${displayFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              var storedTheme = window.localStorage.getItem("orcamento-theme");
              var theme = storedTheme;

              if (theme !== "light" && theme !== "dark") {
                theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
              }

              document.documentElement.dataset.theme = theme;
            } catch (error) {
              document.documentElement.dataset.theme = "dark";
            }
          `}
        </Script>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

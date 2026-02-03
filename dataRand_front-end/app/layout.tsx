import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Provider from "./provider";
import { GlobalMetricsProvider } from "@/hooks/useGlobalMetrics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DataRand - Get paid to be you..",
  description: "Decentralized task platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider>
          <Providers>
            <GlobalMetricsProvider>
              {children}
            </GlobalMetricsProvider>
          </Providers>
        </Provider>
      </body>
    </html>
  );
}

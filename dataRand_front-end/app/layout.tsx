import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Provider from "./provider";
import { GlobalMetricsProvider } from "@/hooks/useGlobalMetrics";

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
      <body className="font-sans">
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

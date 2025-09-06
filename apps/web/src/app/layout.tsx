import { QueryClientProvider } from "@/providers/query-client";
import { ToasterProvider } from "@/providers/toaster-provider";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider>
          {children}
          <ToasterProvider />
        </QueryClientProvider>
      </body>
    </html>
  );
}

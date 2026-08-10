import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yapiary",
  description: "Deine Sprachmemos werden zu Tagebucheinträgen.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Yapiary",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-black font-sans">
        {children}
      </body>
    </html>
  );
}

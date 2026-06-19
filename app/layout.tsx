import type { Metadata } from "next";
import "./globals.css";
// import Providers from "@/components/Providers";
// import HeaderWrapper from "@/components/HeaderWrapper";
// import { Toaster } from "react-hot-toast";
// import Footer from "@/components/Footer";
// import { authOptions } from "./api/auth/[...nextauth]/route";
// import { getServerSession } from "next-auth";

export const metadata: Metadata = {
  title: "Savings App",
  description: "Savings App for money",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html
      lang="en"
      className="h-full antialiased font-poppins"
    >
      <body className="min-h-full flex flex-col">
        <main className='w-[95%] md:w-[90%] mx-auto'>
          {children}
        </main>
      </body>
    </html>
  );
}
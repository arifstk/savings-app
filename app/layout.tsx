import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import Footer from "@/components/Footer";
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
        <Providers>
          <Header />
          <main className='w-[95%] md:w-[90%] mx-auto min-h-screen'>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}



// bg-linear-to-r from-teal-500 to-cyan-500 
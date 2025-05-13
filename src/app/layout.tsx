
import type {Metadata} from 'next';
import {Inter} from 'next/font/google'; 
import './globals.css';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster" 

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Papers, Please', 
  description: 'MIT Manipal Library: Revamped', 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning={true} 
        className={cn(
          "min-h-screen bg-background font-sans antialiased", 
          inter.variable
        )}>
        {children}
        <Toaster /> 
      </body>
    </html>
  );
}

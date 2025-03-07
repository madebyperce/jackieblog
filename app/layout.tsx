import './globals.css';
import { Inter, Work_Sans } from 'next/font/google';
import { NextAuthProvider } from '@/app/providers';
import SitePassword from './components/SitePassword';

const inter = Inter({ subsets: ['latin'] });
const workSans = Work_Sans({ 
  subsets: ['latin'],
  variable: '--font-work-sans',
});

export const metadata = {
  title: "Jackie's Blog",
  description: 'A personal blog showcasing photos and stories',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${workSans.variable}`}>
        <NextAuthProvider>
          <SitePassword>
            <div className="min-h-screen bg-gray-50">
              <main>{children}</main>
            </div>
          </SitePassword>
        </NextAuthProvider>
      </body>
    </html>
  );
}

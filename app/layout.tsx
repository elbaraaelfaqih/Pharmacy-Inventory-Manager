import type {Metadata} from 'next';
import { Tajawal } from 'next/font/google';
import './globals.css'; // Global styles

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-tajawal',
});

export const metadata: Metadata = {
  title: 'صيدليتي الذكية - لوحة التحكم بالدواء والمخزون',
  description: 'منظومة إدارة مخزون الأدوية الذكية مع مزامنة فورية لقوقل شيت وتنبيهات تفاعلية للأدوية البديلة',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" className={`${tajawal.variable} font-sans`} dir="rtl">
      <body className="bg-slate-50 text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

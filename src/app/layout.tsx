
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Toaster } from "@/components/ui/toaster";
import PageTransitionWrapper from '@/components/common/PageTransitionWrapper';

export const metadata: Metadata = {
  title: 'WordLune - Master Your Vocabulary',
  description: 'Save, categorize, and learn new English words with WordLune.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2329ABE2'/><text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-size='70' font-weight='bold' fill='white' font-family='sans-serif'>W</text></svg>" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <PageTransitionWrapper>
            {children}
          </PageTransitionWrapper>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

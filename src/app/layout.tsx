import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Smart Calculator Pro',
  description: 'A modern calculator app with converters and history tools.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#0f172a', color: '#f8fafc' }}>
        {children}
      </body>
    </html>
  );
}

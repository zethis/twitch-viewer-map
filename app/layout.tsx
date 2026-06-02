import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Twitch Viewer Map',
  description: 'Map of Twitch viewers by city',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

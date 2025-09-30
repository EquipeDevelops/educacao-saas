import type { Metadata } from 'next';
import { Providers } from '../providers/providers';
import { Roboto, Roboto_Serif } from 'next/font/google';
import '../styles/global.css'

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
});

const robotoSerif = Roboto_Serif({
  variable: '--font-roboto-serif',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Educação SaaS',
  description: 'Site para gestão escolar',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body className={`${roboto.className} ${robotoSerif.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

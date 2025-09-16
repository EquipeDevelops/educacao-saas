import type { Metadata } from 'next';
import { Roboto, Roboto_Serif } from 'next/font/google';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../themes/theme';
import './globals.css';

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${roboto.variable} ${robotoSerif.variable}`}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}

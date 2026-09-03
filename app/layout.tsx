import './globals.css';

export const metadata = {
  title: 'Gazeta Abierta — Lector digital',
  description: 'Lector editorial con efecto de volteo de página.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}

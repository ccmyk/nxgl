// app/layout.jsx
'use client';

import WebGLProvider from '@/contexts/WebGLContext';
import LenisProvider from '@/contexts/LenisContext';
import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import MouseCursor from '@/components/layout/MouseCursor';
import Loader from '@/components/layout/Loader';
import './main.pcss';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WebGLProvider>
          <LenisProvider>
            <Loader />
            <Nav />
            <MouseCursor />
            <main>{children}</main>
            <Footer />
          </LenisProvider>
        </WebGLProvider>
      </body>
    </html>
  );
}
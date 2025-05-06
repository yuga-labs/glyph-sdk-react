import '@use-glyph/sdk-react/dist/assets/react-widget.css';

export const metadata = {
  title: 'Next.js App with Glyph Widget',
  description: 'Example of using Glyph Widget in a Next.js application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Preload the font files to avoid the webpack-internal URL scheme error */}
        <link 
          href="/assets/GramatikaTrial-Regular.woff2" 
          rel="preload" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        <link 
          href="/assets/GramatikaTrial-Bold.woff2" 
          rel="preload" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        <link 
          href="/assets/GramatikaTrial-Medium.woff2" 
          rel="preload" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

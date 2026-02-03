import { AppProps } from 'next/app';
import { Providers } from '../app/providers';
import '../app/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  );
}

export default MyApp;

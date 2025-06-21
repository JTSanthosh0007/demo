import type { Viewport } from 'next';
import { defaultViewport } from '../lib/viewport';
import PaytmClientPage from './PaytmClientPage';

export function generateViewport(): Viewport {
  return defaultViewport;
}

const PaytmPage = () => {
    return <PaytmClientPage />;
};

export default PaytmPage; 
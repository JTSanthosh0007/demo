import type { Viewport } from 'next';
import { defaultViewport } from '../lib/viewport';
import BanksClientPage from './BanksClientPage';

export function generateViewport(): Viewport {
  return defaultViewport;
}

const BanksPage = () => {
    return <BanksClientPage />;
};

export default BanksPage; 
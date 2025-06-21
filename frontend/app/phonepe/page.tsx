import type { Viewport } from 'next';
import { defaultViewport } from '../lib/viewport';
import PhonePeClientPage from './PhonePeClientPage';

export function generateViewport(): Viewport {
  return defaultViewport;
}

const PhonePePage = () => {
    return <PhonePeClientPage />;
};

export default PhonePePage; 
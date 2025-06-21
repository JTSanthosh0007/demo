import type { Viewport } from 'next';
import { defaultViewport } from '../lib/viewport';
import PDFUnlockerClientPage from './PDFUnlockerClientPage';

export function generateViewport(): Viewport {
  return defaultViewport;
}

const PDFUnlockerPage = () => {
    return <PDFUnlockerClientPage />;
};

export default PDFUnlockerPage; 
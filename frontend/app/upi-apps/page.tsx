import type { Viewport } from 'next';
import { defaultViewport } from '../lib/viewport';
import UPIAppsClientPage from './UPIAppsClientPage';

export function generateViewport(): Viewport {
  return defaultViewport;
}

const UPIAppsPage = () => {
    return <UPIAppsClientPage />;
};

export default UPIAppsPage; 
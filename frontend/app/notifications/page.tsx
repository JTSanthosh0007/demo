import type { Viewport } from 'next';
import { defaultViewport } from '../lib/viewport';
import NotificationsClientPage from './NotificationsClientPage';

export function generateViewport(): Viewport {
  return defaultViewport;
}

const NotificationsPage = () => {
    return <NotificationsClientPage />;
};

export default NotificationsPage; 
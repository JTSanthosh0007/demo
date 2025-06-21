import type { Viewport } from 'next';
import { defaultViewport } from '../lib/viewport';
import NotificationSettingsClientPage from './NotificationSettingsClientPage';

export function generateViewport(): Viewport {
  return defaultViewport;
}

const NotificationSettingsPage = () => {
    return <NotificationSettingsClientPage />;
};

export default NotificationSettingsPage; 
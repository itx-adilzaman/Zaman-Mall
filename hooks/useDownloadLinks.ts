import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export interface DownloadLink {
  platform: string;
  download_url: string;
  is_active: boolean;
  sub_label: string;
  version: string;
}

const DEFAULTS: Record<string, DownloadLink> = {
  android: {
    platform: 'android',
    download_url: 'https://drive.google.com/file/d/1RREImUr7m2O_q0VI7rT3T6zIGBHGUV2Z/view?usp=sharing',
    is_active: true,
    sub_label: 'Free Download ↓',
    version: '',
  },
  windows: {
    platform: 'windows',
    download_url: 'https://drive.google.com/file/d/15kyUbtcxknEn4nPg_JCOajuWR6yixEXD/view?usp=sharing',
    is_active: true,
    sub_label: 'Desktop App ↓',
    version: '',
  },
  ios: {
    platform: 'ios',
    download_url: '#',
    is_active: false,
    sub_label: 'Coming Soon ⏳',
    version: '',
  },
};

/**
 * Fetches download links from the `download_links` Supabase table.
 * Falls back to hardcoded defaults if the table has no rows.
 * Admin can update links from the admin panel → Supabase directly.
 */
export function useDownloadLinks(): Record<string, DownloadLink> {
  const [links, setLinks] = useState<Record<string, DownloadLink>>(DEFAULTS);

  useEffect(() => {
    supabase
      .from('download_links')
      .select('platform, download_url, is_active, sub_label, version')
      .then(({ data }) => {
        if (!data?.length) return;
        const map: Record<string, DownloadLink> = {};
        data.forEach((row: DownloadLink) => {
          map[row.platform] = row;
        });
        setLinks(prev => ({ ...prev, ...map }));
      });
  }, []);

  return links;
}

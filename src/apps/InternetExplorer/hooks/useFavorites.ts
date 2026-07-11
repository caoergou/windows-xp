import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FavoriteItem } from '../types';
import { useStorage } from '../../../context/StorageContext';
import { useCulture } from '../../../context/CultureContext';
import { normalizeCultureLang } from '../../../data/culture';

const STORAGE_KEY = 'ie_favorites';

const DEFAULT_FAVORITES_BY_LOCALE: Record<string, FavoriteItem[]> = {
  zh: [
    { name: '百度', url: 'http://www.baidu.com' },
    { name: '新浪', url: 'http://www.sina.com.cn' },
    { name: '搜狐', url: 'http://www.sohu.com' },
    { name: '网易', url: 'http://www.163.com' },
    { name: '腾讯', url: 'http://www.qq.com' },
    { name: 'QQ空间', url: 'http://qzone.qq.com' },
    { name: '163邮箱', url: 'http://mail.163.com' },
    { name: '迅雷看看', url: 'http://kankan.xunlei.com' },
    { name: 'VeryCD', url: 'http://www.verycd.com' },
    { name: '天涯社区', url: 'http://www.tianya.cn' },
    { name: '百度贴吧', url: 'http://tieba.baidu.com' },
  ],
  en: [
    { name: 'Google', url: 'http://www.google.com' },
    { name: 'Yahoo!', url: 'http://www.yahoo.com' },
    { name: 'MSN', url: 'http://www.msn.com' },
    { name: 'AOL', url: 'http://www.aol.com' },
    { name: 'eBay', url: 'http://www.ebay.com' },
    { name: 'MySpace', url: 'http://www.myspace.com' },
    { name: 'YouTube', url: 'http://www.youtube.com' },
    { name: 'Wikipedia', url: 'http://www.wikipedia.org' },
    { name: 'Newgrounds', url: 'http://www.newgrounds.com' },
    { name: 'DeviantArt', url: 'http://www.deviantart.com' },
  ],
};

const getDefaultFavorites = (lang: string): FavoriteItem[] => {
  const normalizedLang = normalizeCultureLang(lang);
  return DEFAULT_FAVORITES_BY_LOCALE[normalizedLang] ?? DEFAULT_FAVORITES_BY_LOCALE.zh;
};

export const useFavorites = () => {
  const { i18n } = useTranslation();
  const storage = useStorage();
  const { cultureKey } = useCulture();
  const storageKey = storage.key(`${STORAGE_KEY}_${cultureKey}`);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    try {
      const saved = storage.local.getItem(storageKey);
      if (saved) {
        setFavorites(JSON.parse(saved));
      } else {
        const defaults = getDefaultFavorites(i18n.language);
        setFavorites(defaults);
        storage.local.setItem(storageKey, JSON.stringify(defaults));
      }
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  }, [i18n.language, storageKey, storage]);

  const addFavorite = useCallback(
    (name: string, url: string) => {
      if (!name || !url) return;
      setFavorites(prev => {
        const updated = [...prev, { name, url }];
        storage.local.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey, storage]
  );

  const deleteFavorite = useCallback(
    (index: number) => {
      setFavorites(prev => {
        const updated = [...prev];
        updated.splice(index, 1);
        storage.local.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey, storage]
  );

  const filteredFavorites = favorites.filter(
    item => !item.locales || item.locales.includes(i18n.language?.startsWith('zh') ? 'zh' : 'en')
  );

  return {
    favorites,
    filteredFavorites,
    addFavorite,
    deleteFavorite,
  };
};

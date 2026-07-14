import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { CulturePackage, resolveCulture, enCulture, zhCulture } from '../data/culture';

export interface CultureContextType {
  /** Currently active culture package */
  culture: CulturePackage;
  /** Current culture package ID */
  cultureKey: string;
  /** All registered culture packages */
  cultures: CulturePackage[];
  /** Register a new culture package; same id overwrites the existing one */
  registerCulture: (pkg: CulturePackage) => void;
  /** Switch culture package by id */
  setCulture: (id: string) => void;
  /** Automatically select the best-matching culture package by language */
  setCultureByLang: (lang: string) => void;
}

const CultureContext = createContext<CultureContextType | undefined>(undefined);

const defaultCultureContext: CultureContextType = {
  culture: enCulture,
  cultureKey: enCulture.id,
  cultures: [enCulture, zhCulture],
  registerCulture: () => {
    /* no-op: used when rendered outside CultureProvider */
  },
  setCulture: () => {
    /* no-op: used when rendered outside CultureProvider */
  },
  setCultureByLang: () => {
    /* no-op: used when rendered outside CultureProvider */
  },
};

export const useCulture = (): CultureContextType => {
  const context = useContext(CultureContext);
  return context ?? defaultCultureContext;
};

const mergeCultures = (userCultures: CulturePackage[]): CulturePackage[] => {
  const defaults = [enCulture, zhCulture];
  const byId = new Map<string, CulturePackage>();
  defaults.forEach(pkg => byId.set(pkg.id, pkg));
  userCultures.forEach(pkg => byId.set(pkg.id, pkg));
  return Array.from(byId.values());
};

export interface CultureProviderProps {
  children: React.ReactNode;
  /** User-defined culture package, merged with the default en/zh packages */
  cultures?: CulturePackage[];
  /** Initial language, used to select the default culture package */
  defaultLanguage?: string;
}

export const CultureProvider: React.FC<CultureProviderProps> = ({
  children,
  cultures: userCultures = [],
  defaultLanguage = 'en',
}) => {
  const [cultures, setCultures] = useState<CulturePackage[]>(() => mergeCultures(userCultures));

  const [cultureId, setCultureId] = useState<string>(() => {
    const matched = resolveCulture(mergeCultures(userCultures), defaultLanguage);
    return matched?.id ?? cultures[0]?.id ?? 'en';
  });

  const activeCulture = useMemo(() => {
    const found = cultures.find(pkg => pkg.id === cultureId);
    return found ?? cultures[0] ?? enCulture;
  }, [cultureId, cultures]);

  const registerCulture = useCallback((pkg: CulturePackage) => {
    setCultures(prev => {
      const filtered = prev.filter(p => p.id !== pkg.id);
      return [...filtered, pkg];
    });
  }, []);

  // Re-merge when the set of `cultures` prop ids changes so packages added
  // after mount take effect; runtime-registered packages (in state) are
  // preserved and the prop wins on id collision (#122).
  const userCulturesKey = (userCultures ?? []).map(c => c.id).join('|');
  useEffect(() => {
    setCultures(prev => {
      const byId = new Map(prev.map(p => [p.id, p]));
      (userCultures ?? []).forEach(pkg => byId.set(pkg.id, pkg));
      return Array.from(byId.values());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCulturesKey]);

  const setCulture = useCallback((id: string) => {
    setCultureId(id);
  }, []);

  const setCultureByLang = useCallback(
    (lang: string) => {
      const matched = resolveCulture(cultures, lang);
      if (matched) {
        setCultureId(matched.id);
      }
    },
    [cultures]
  );

  const value = useMemo<CultureContextType>(
    () => ({
      culture: activeCulture,
      cultureKey: activeCulture.id,
      cultures,
      registerCulture,
      setCulture,
      setCultureByLang,
    }),
    [activeCulture, cultures, registerCulture, setCulture, setCultureByLang]
  );

  return <CultureContext.Provider value={value}>{children}</CultureContext.Provider>;
};

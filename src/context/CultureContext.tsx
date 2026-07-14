import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { CulturePackage, resolveCulture, enCulture, zhCulture } from '../data/culture';

export interface CultureContextType {
  /** 当前生效的文化包 */
  culture: CulturePackage;
  /** 当前文化包 ID */
  cultureKey: string;
  /** 所有已注册的文化包 */
  cultures: CulturePackage[];
  /** 注册一个新文化包；同 id 会覆盖已有文化包 */
  registerCulture: (pkg: CulturePackage) => void;
  /** 按 id 切换文化包 */
  setCulture: (id: string) => void;
  /** 按语言自动选择最合适的文化包 */
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
  /** 用户自定义文化包，会与默认 en/zh 合并 */
  cultures?: CulturePackage[];
  /** 初始语言，用于选择默认文化包 */
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

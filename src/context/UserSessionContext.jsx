import React, { createContext, useState, useContext } from 'react';
import userConfig from '../data/user_config.json';

const UserSessionContext = createContext();

export const useUserSession = () => useContext(UserSessionContext);

// 判断是否需要登录：只有关机、重启、注销后才需要重新输入密码
const getInitialLoginState = () => {
  const powerState = localStorage.getItem('xp_power_state');
  const hasLoggedInBefore = localStorage.getItem('xp_logged_in') === 'true';

  // 关机、重启、注销 → 需要重新登录
  if (powerState === 'shutdown' || powerState === 'restart' || powerState === 'logout') {
    return false;
  }

  // 之前登录过且不是关机/重启/注销 → 免密码进入
  return hasLoggedInBefore;
};

export const UserSessionProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(getInitialLoginState);
  const [user, setUser] = useState({ name: userConfig.username, avatar: userConfig.avatar });

  const login = (password) => {
      if (password === userConfig.password) {
          setIsLoggedIn(true);
          localStorage.setItem('xp_logged_in', 'true');
          // 登录成功后将 power_state 恢复为 running
          localStorage.setItem('xp_power_state', 'running');
          return true;
      }
      return false;
  };

  const logout = () => {
      setIsLoggedIn(false);
      localStorage.setItem('xp_power_state', 'logout');
  };

  return (
    <UserSessionContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </UserSessionContext.Provider>
  );
};

import React, { createContext, useState, useEffect } from 'react';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const savedTheme = localStorage.getItem('lifeplanner_theme');
    const savedLang = localStorage.getItem('lifeplanner_lang');
    if (savedTheme) setTheme(savedTheme);
    if (savedLang) setLanguage(savedLang);
  }, []);

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-theme' : '';
    localStorage.setItem('lifeplanner_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lifeplanner_lang', language);
  }, [language]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'it' : 'en');

  return (
    <SettingsContext.Provider value={{ theme, toggleTheme, language, toggleLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
};

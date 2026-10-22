// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// i18next setup (§10.8): Indonesian default, English; language follows the device unless chosen.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import id from './id.json';

void i18n.use(initReactI18next).init({
  resources: { id: { translation: id }, en: { translation: en } },
  lng: 'id',
  fallbackLng: 'id',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;

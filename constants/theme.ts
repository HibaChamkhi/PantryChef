export const colors = {
  cream50: '#fdfcf9',
  cream100: '#f8f5ee',
  cream200: '#f0eadb',
  sage100: '#e5ecdf',
  sage500: '#5f844e',
  sage600: '#4a6a3c',
  sage700: '#3b5431',
  clay500: '#d4874f',
  ink900: '#1f2a1c',
  ink600: '#4b5747',
  ink400: '#7d877a',
  danger500: '#c2493d',
} as const;

export type ColorToken = keyof typeof colors;

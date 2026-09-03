/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // 卡通风格调色板
      colors: {
        primary: '#FF9F43',
        'primary-deep': '#F97F16',
        expense: '#FF6B6B',
        income: '#2ED573',
        cream: '#FFF8EE',
        main: '#4A3B2A',
        sub: '#B9A99A',
        line: '#F3EADD',
      },
      boxShadow: {
        card: '0 6px 14px rgba(255, 159, 67, 0.10)',
        fab: '0 8px 20px rgba(255, 159, 67, 0.45)',
      },
    },
  },
  plugins: [],
};

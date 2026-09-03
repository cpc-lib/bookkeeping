import type { ThemeConfig } from 'antd';

/** 卡通风格 antd 主题 */
export const cartoonTheme: ThemeConfig = {
  token: {
    colorPrimary: '#FF9F43',
    colorLink: '#FF9F43',
    colorError: '#FF6B6B',
    colorSuccess: '#2ED573',
    colorWarning: '#FFB84C',
    borderRadius: 16,
    colorBgLayout: '#FFF8EE',
    colorBgContainer: '#FFFFFF',
    colorText: '#4A3B2A',
    colorTextSecondary: '#B9A99A',
    controlHeight: 40,
    fontSize: 14,
  },
  components: {
    Button: {
      controlHeight: 46,
      fontWeight: 600,
    },
    Input: {
      controlHeight: 46,
    },
  },
};

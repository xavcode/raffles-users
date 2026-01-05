/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        primary: '#4f46e5', // indigo-600
        secondary: '#10b981', // emerald-600
        accent: '#6366f1', // indigo-500

        // UI Colors
        background: '#f8fafc', // slate-50
        surface: '#ffffff', // white
        border: '#e2e8f0', // slate-200
        input: '#f1f5f9', // slate-100

        // Text Colors
        'text-main': '#1e293b', // slate-800
        'text-muted': '#64748b', // slate-500
        'text-light': '#94a3b8', // slate-400

        // State Colors
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',

        // iOS Specific Colors
        'ios-bg': '#F2F2F7',
        'ios-red': '#FF3B30',
        'ios-blue': '#007AFF',
        'ios-gray': '#8E8E93',

        muted: '#64748b' // slate-500 (updated from '#440' which seemed wrong)
      },
      fontFamily: {
        quicksand: ["Quicksand-Regular", "sans-serif"],
        "quicksand-bold": ["Quicksand-Bold", "sans-serif"],
        "quicksand-semibold": ["Quicksand-SemiBold", "sans-serif"],
        "quicksand-light": ["Quicksand-Light", "sans-serif"],
        "quicksand-medium": ["Quicksand-Medium", "sans-serif"]
      }
    }
  },
  plugins: [],
}

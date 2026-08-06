import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useContext } from 'react';
import { AppContext } from '../App';

export default function UpdateBanner() {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // فحص التحديثات دورياً كل ساعة
      r && setInterval(() => { r.update(); }, 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className={`fixed top-0 left-0 w-full z-[100] px-4 py-3 shadow-2xl flex items-center justify-between border-b backdrop-blur-md transition-all ${
      isDarkMode 
        ? 'bg-gray-900/95 border-[#E6B981]/40 text-gray-100' 
        : 'bg-[#FDFBF7]/95 border-[#D4A373]/40 text-gray-800'
    }`} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-[#E6B981]/20 text-[#E6B981]' : 'bg-[#D4A373]/20 text-[#D4A373]'}`}>
          <Sparkles size={20} className="animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-xs md:text-sm">
            {isAr ? 'يتوفر تحديث جديد للتطبيق 🚀' : 'New version available 🚀'}
          </span>
          <span className="text-[10px] md:text-xs opacity-75">
            {isAr ? 'انقر لتحديث التطبيق فوراً والحصول على أحدث الميزات' : 'Click to refresh and get the latest features'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => updateServiceWorker(true)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all ${
            isDarkMode
              ? 'bg-[#E6B981] text-gray-900 hover:bg-[#d6a575]'
              : 'bg-[#D4A373] text-white hover:bg-[#b58555]'
          }`}
        >
          <RefreshCw size={14} />
          <span>{isAr ? 'تحديث' : 'Update'}</span>
        </button>
      </div>
    </div>
  );
}
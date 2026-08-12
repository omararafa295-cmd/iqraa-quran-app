import { useState, useEffect, useContext } from "react";
import { Sun, Moon, RotateCcw, Heart, X, AlertTriangle, ChevronDown } from "lucide-react";
import { AppContext } from "../App";

const initialMorningAzkar = [
  { id: 1, text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ لا إِلَهَ إِلا اللَّهُ، وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.", count: 1, originalCount: 1 },
  { id: 2, text: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ.", count: 1, originalCount: 1 },
  { id: 3, text: "سُبْحَانَ اللهِ وَبِحَمْدِهِ.", count: 100, originalCount: 100 },
];

const initialEveningAzkar = [
  { id: 1, text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ لا إِلَهَ إِلا اللَّهُ، وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.", count: 1, originalCount: 1 },
  { id: 2, text: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ.", count: 1, originalCount: 1 },
  { id: 3, text: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ.", count: 100, originalCount: 100 },
];

const BEADS_PER_LAP = 33;

export default function Azkar() {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';
  
  const [activeTab, setActiveTab] = useState("tasbih");
  const [tasbihCount, setTasbihCount] = useState(() => parseInt(localStorage.getItem("tasbihCount")) || 0);
  const [morningAzkar, setMorningAzkar] = useState(initialMorningAzkar);
  const [eveningAzkar, setEveningAzkar] = useState(initialEveningAzkar);


  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  useEffect(() => {
    localStorage.setItem("tasbihCount", tasbihCount);
  }, [tasbihCount]);

  const triggerVibration = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleTasbihClick = () => {
    triggerVibration();
    setTasbihCount(prev => prev + 1);
  };

  const requestReset = (target) => {
    setResetTarget(target);
    setShowResetModal(true);
  };

  const confirmReset = () => {
    if (resetTarget === 'tasbih') setTasbihCount(0);
    else if (resetTarget === 'morning') setMorningAzkar(initialMorningAzkar);
    else if (resetTarget === 'evening') setEveningAzkar(initialEveningAzkar);
    setShowResetModal(false);
  };

  const handleZikrClick = (id, type) => {
    triggerVibration();
    if (type === 'morning') {
      setMorningAzkar(prev => prev.map(zikr => 
        zikr.id === id && zikr.count > 0 ? { ...zikr, count: zikr.count - 1 } : zikr
      ));
    } else {
      setEveningAzkar(prev => prev.map(zikr => 
        zikr.id === id && zikr.count > 0 ? { ...zikr, count: zikr.count - 1 } : zikr
      ));
    }
  };

  const t = {
    title: isAr ? "الأذكار والسبحة" : "Azkar & Tasbih",
    tasbih: isAr ? "السبحة" : "Tasbih",
    morning: isAr ? "الصباح" : "Morning",
    evening: isAr ? "المساء" : "Evening",
    clickToCount: isAr ? "اضغط للتسبيح" : "Tap to count",
    reset: isAr ? "تصفير" : "Reset",
    done: isAr ? "تم الانتهاء بفضل الله ✨" : "Completed successfully ✨",
    confirmTitle: isAr ? "تأكيد التصفير" : "Confirm Reset",
    confirmMsg: isAr ? "هل أنت متأكد أنك تريد تصفير العداد والبدء من جديد؟" : "Are you sure you want to reset the counter?",
    cancelBtn: isAr ? "إلغاء" : "Cancel",
    confirmBtn: isAr ? "نعم، صفر العداد" : "Yes, Reset",
    lap: isAr ? "الخرزة" : "Bead",
    of: isAr ? "من" : "of",
    laps: isAr ? "دورات مكتملة" : "Completed rounds",
  };

  // موقع الخرزة الحالية جوه الدورة (0-32)، وعدد الدورات الكاملة اللي خلصت
  const posInLap = tasbihCount % BEADS_PER_LAP;
  const filledBeads = tasbihCount > 0 && posInLap === 0 ? BEADS_PER_LAP : posInLap;
  const completedLaps = Math.floor(tasbihCount / BEADS_PER_LAP);
  // بندوّر حلقة الخرزات كلها عشان الخرزة الجاية تيجي دايماً تحت علامة "الإبهام" فوق - زي ما بتسحب سبحة حقيقية
  const ringRotation = -(filledBeads * (360 / BEADS_PER_LAP));

  const renderAzkarList = (azkarList, type) => {
    const remainingAzkar = azkarList.filter(z => z.count > 0);

    if (remainingAzkar.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart size={64} className="text-[#D4A373] mb-4 opacity-50" />
          <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>{t.done}</h3>
          <button onClick={() => requestReset(type)} className="mt-6 flex items-center gap-2 text-gray-500 hover:text-[#D4A373] transition-colors">
            <RotateCcw size={18} /> {t.reset}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-10">
        <div className="flex justify-end mb-2">
          <button onClick={() => requestReset(type)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#D4A373] transition-colors">
            <RotateCcw size={16} /> {t.reset}
          </button>
        </div>
        {remainingAzkar.map(zikr => (
          <div 
            key={zikr.id} 
            onClick={() => handleZikrClick(zikr.id, type)}
            className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] border shadow-sm relative overflow-hidden ${
              isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-[#E6B981]' : 'bg-white border-[#F0EBE1] hover:border-[#D4A373]'
            }`}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-[#D4A373]/10 transition-all duration-300"
              style={{ width: `${((zikr.originalCount - zikr.count) / zikr.originalCount) * 100}%` }}
            ></div>
            
            <p className={`relative z-10 text-xl leading-loose ${isAr ? 'font-quran' : 'font-sans'} ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              {zikr.text}
            </p>
            <div className="relative z-10 flex justify-between items-center mt-6">
              <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {isAr ? 'التبقي:' : 'Remaining:'} <span className={`text-xl ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>{zikr.count}</span>
              </span>
              <div className={`w-10 h-10 flex items-center justify-center rounded-full bg-[#D4A373] text-white shadow-md`}>
                {zikr.originalCount}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 pt-20" dir={isAr ? "rtl" : "ltr"}>
      <h2 className={`text-3xl font-bold mb-8 text-center ${isAr ? 'font-quran' : 'font-serif'} ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>
        {t.title}
      </h2>

      <div className={`flex p-1.5 rounded-2xl mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-[#F0EBE1]/50'}`}>
        <button onClick={() => setActiveTab("tasbih")} className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === "tasbih" ? (isDarkMode ? "bg-gray-700 text-[#E6B981]" : "bg-white text-[#D4A373] shadow-sm") : "text-gray-500 hover:text-gray-400"}`}>
          <Heart size={20} /> {t.tasbih}
        </button>
        <button onClick={() => setActiveTab("morning")} className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === "morning" ? (isDarkMode ? "bg-gray-700 text-[#E6B981]" : "bg-white text-[#D4A373] shadow-sm") : "text-gray-500 hover:text-gray-400"}`}>
          <Sun size={20} /> {t.morning}
        </button>
        <button onClick={() => setActiveTab("evening")} className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === "evening" ? (isDarkMode ? "bg-gray-700 text-[#E6B981]" : "bg-white text-[#D4A373] shadow-sm") : "text-gray-500 hover:text-gray-400"}`}>
          <Moon size={20} /> {t.evening}
        </button>
      </div>

      {activeTab === "tasbih" && (
        <div className="flex flex-col items-center justify-center py-6">

          {/* علامة الإبهام الثابتة - بتأشر على مكان الخرزة الجاية دايماً */}
          <div className={`mb-1 ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>
            <ChevronDown size={22} strokeWidth={3} />
          </div>

          <div className="relative w-80 h-80 mb-4 select-none">
            
            {/* حلقة الخرزات - بتلف كل ما تضغط، زي ما بتسحب سبحة حقيقية بين صوابعك */}
            <div
              className="absolute inset-0 transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${ringRotation}deg)` }}
            >
              {Array.from({ length: BEADS_PER_LAP }).map((_, i) => {
                const angle = (i / BEADS_PER_LAP) * 2 * Math.PI - Math.PI / 2;
                const radius = 148;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const isFilled = i < filledBeads;
                const isNext = i === filledBeads;
                const size = isNext ? 20 : 15;

                return (
                  <div
                    key={i}
                    className={`absolute rounded-full transition-colors duration-200 ${
                      isFilled
                        ? (isDarkMode ? 'bg-[#E6B981] shadow-[0_0_10px_rgba(230,185,129,0.55)]' : 'bg-[#D4A373] shadow-[0_0_10px_rgba(212,163,115,0.45)]')
                        : isNext
                          ? (isDarkMode ? 'bg-gray-800 border-2 border-[#E6B981] animate-pulse' : 'bg-white border-2 border-[#D4A373] animate-pulse')
                          : (isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-[#F0EBE1] border border-[#E2D8C3]')
                    }`}
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      left: `calc(50% + ${x}px - ${size / 2}px)`,
                      top: `calc(50% + ${y}px - ${size / 2}px)`,
                    }}
                  />
                );
              })}

              {/* خرزة الإمام - الخرزة الكبيرة اللي بتفصل كل دورة 33 عن اللي بعدها */}
              <div
                className={`absolute rounded-full shadow-md ${isDarkMode ? 'bg-[#b58555]' : 'bg-[#9c6b3f]'}`}
                style={{ width: '24px', height: '24px', left: 'calc(50% - 12px)', top: 'calc(50% - 148px - 4px)' }}
              />
            </div>

            {/* الزرار المركزي - نفس التفاعل زي الأول بالظبط */}
            <button 
              onClick={handleTasbihClick}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full flex flex-col items-center justify-center shadow-[0_10px_40px_rgba(212,163,115,0.3)] border-8 active:scale-95 transition-transform duration-100 ${
                isDarkMode ? 'bg-gray-800 border-[#E6B981] text-[#E6B981]' : 'bg-white border-[#D4A373] text-[#D4A373]'
              }`}
            >
              <span className="text-6xl font-bold font-sans">{tasbihCount}</span>
              <span className={`mt-2 text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.clickToCount}</span>
            </button>
          </div>

          <div className={`text-sm font-bold mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t.lap} {filledBeads} {t.of} {BEADS_PER_LAP}
            {completedLaps > 0 && (
              <span className={isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}> · {completedLaps} {t.laps}</span>
            )}
          </div>
          
          <button 
            onClick={() => requestReset('tasbih')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-colors ${
              isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-[#F0EBE1]'
            }`}
          >
            <RotateCcw size={18} /> {t.reset}
          </button>
        </div>
      )}

      {activeTab === "morning" && renderAzkarList(morningAzkar, 'morning')}
      {activeTab === "evening" && renderAzkarList(eveningAzkar, 'evening')}
      
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowResetModal(false)}>
          <div 
            className={`w-full max-w-sm p-6 rounded-[2rem] shadow-2xl transform transition-all ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`} 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? "bg-red-500/20 text-red-400" : "bg-red-50 text-red-500"}`}>
                <AlertTriangle size={32} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>{t.confirmTitle}</h3>
              <p className={`text-sm font-medium mb-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{t.confirmMsg}</p>
              
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setShowResetModal(false)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors ${isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {t.cancelBtn}
                </button>
                <button 
                  onClick={confirmReset}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-md"
                >
                  {t.confirmBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
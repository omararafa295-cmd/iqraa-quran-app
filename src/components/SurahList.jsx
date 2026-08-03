import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Search, BookOpen, Layers, ArrowLeft, Loader2, Sparkles, Target, CheckCircle, Plus, Trash2, Calendar, BookMarked, AlertTriangle } from "lucide-react";
import { AppContext } from "../App";

const juzData = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  nameAr: ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر", "الحادي عشر", "الثاني عشر", "الثالث عشر", "الرابع عشر", "الخامس عشر", "السادس عشر", "السابع عشر", "الثامن عشر", "التاسع عشر", "العشرون", "الحادي والعشرون", "الثاني والعشرون", "الثالث والعشرون", "الرابع والعشرون", "الخامس والعشرون", "السادس والعشرون", "السابع والعشرون", "الثامن والعشرون", "التاسع والعشرون", "الثلاثون"][i],
  nameEn: ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth", "Twentieth", "Twenty-First", "Twenty-Second", "Twenty-Third", "Twenty-Fourth", "Twenty-Fifth", "Twenty-Sixth", "Twenty-Seventh", "Twenty-Eighth", "Twenty-Ninth", "Thirtieth"][i],
  hizbStart: (i * 2) + 1,
  hizbEnd: (i * 2) + 2
}));

export default function SurahList() {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';
  const navigate = useNavigate();

  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("surahs");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRead, setLastRead] = useState(null);

  const [khatma, setKhatma] = useState(() => JSON.parse(localStorage.getItem('khatmaPlan')) || null);
  const [showKhatmaModal, setShowKhatmaModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Modal تأكيد الحذف
  const [khatmaDays, setKhatmaDays] = useState(30);

  useEffect(() => {
    const savedLastRead = localStorage.getItem("lastRead");
    if (savedLastRead) {
      setLastRead(JSON.parse(savedLastRead));
    }

    setLoading(true);
    setError(null);

    axios.get("https://api.alquran.cloud/v1/surah", { timeout: 10000 })
      .then((response) => {
        setSurahs(response.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching surahs:", err);
        setSurahs([]);
        setError(isAr ? "تعذر تحميل قائمة السور. يرجى التحقق من اتصالك." : "Failed to load Surahs. Check connection.");
        setLoading(false);
      });
  }, [isAr]);

  const normalizeSearch = (text) => {
    if (!text) return "";
    return text
      .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u06DF-\u06E8\u0640]/g, "") 
      .replace(/[أإآاٱ]/g, "ا") 
      .replace(/ة/g, "ه") 
      .replace(/ى/g, "ي") 
      .replace(/ئ/g, "ي") 
      .replace(/ء/g, "") 
      .replace(/^سوره\s+/, "") 
      .replace(/^سورة\s+/, "")
      .trim()
      .toLowerCase();
  };

  const filteredSurahs = surahs.filter(surah => {
    const normalizedQuery = normalizeSearch(searchQuery);
    const normalizedName = normalizeSearch(surah.name);
    return normalizedName.includes(normalizedQuery) || 
           surah.englishName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const startKhatma = () => {
    const plan = {
      days: khatmaDays,
      pagesPerDay: Math.ceil(604 / khatmaDays),
      pagesRead: 0,
      startDate: new Date().toISOString()
    };
    setKhatma(plan);
    localStorage.setItem('khatmaPlan', JSON.stringify(plan));
    setShowKhatmaModal(false);
  };

  const addPages = (num) => {
    setKhatma(prev => {
      const updated = { ...prev, pagesRead: Math.min(604, prev.pagesRead + num) };
      localStorage.setItem('khatmaPlan', JSON.stringify(updated));
      return updated;
    });
  };

  // دوال الحذف الجديدة
  const deleteKhatma = () => setShowDeleteConfirm(true);
  
  const confirmDeleteKhatma = () => {
    setKhatma(null);
    localStorage.removeItem('khatmaPlan');
    setShowDeleteConfirm(false);
  };

  const t = {
    search: isAr ? "ابحث عن سورة..." : "Search for a Surah...",
    surahs: isAr ? "السور" : "Surahs",
    ajzaa: isAr ? "الأجزاء" : "Juzs",
    noResult: isAr ? "لا توجد سورة بهذا الاسم..." : "No Surah found...",
    continue: isAr ? "متابعة القراءة" : "Continue Reading",
    juzTitle: isAr ? "الجزء" : "Juz",
    hizb: isAr ? "الحزب" : "Hizb",
    khatmaTitle: isAr ? "خطة الختمة" : "Khatma Plan",
    createPlan: isAr ? "ابدأ خطة جديدة" : "Start New Plan",
    dailyGoal: isAr ? "الورد اليومي" : "Daily Goal",
    pages: isAr ? "صفحات" : "Pages",
    doneToday: isAr ? "أتممت الورد" : "Done Today",
  };

  const percentage = khatma ? Math.round((khatma.pagesRead / 604) * 100) : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pt-20" dir={isAr ? "rtl" : "ltr"}>
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* الهيرو سكشن الفخم */}
      <div className={`relative overflow-hidden rounded-[3rem] mb-8 shadow-2xl ${
        isDarkMode 
          ? 'bg-gradient-to-b from-gray-900 via-[#1e1814] to-gray-900 border border-gray-700' 
          : 'bg-gradient-to-b from-[#e3b88d] via-[#d6a575] to-[#c7915b]'
      }`}>
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <div className="w-[200%] h-[200%] animate-[spin_60s_linear_infinite]" 
               style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.08) 30deg, transparent 60deg, rgba(255,255,255,0.08) 90deg, transparent 120deg, rgba(255,255,255,0.08) 150deg, transparent 180deg, rgba(255,255,255,0.08) 210deg, transparent 240deg, rgba(255,255,255,0.08) 270deg, transparent 300deg, rgba(255,255,255,0.08) 330deg, transparent 360deg)' }}>
          </div>
        </div>

        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 md:w-64 md:h-64 rounded-full blur-[70px] animate-pulse pointer-events-none ${
          isDarkMode ? 'bg-[#E6B981]/20' : 'bg-white/30'
        }`} style={{ animationDuration: '4s' }}></div>
        
        <div className="relative z-10 p-6 md:p-10 flex flex-col items-center text-center">
          <div className="relative mb-6 mt-2 flex items-center justify-center w-24 h-24 md:w-28 md:h-28" style={{ animation: 'float 6s ease-in-out infinite' }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4A373] to-white blur-[20px] opacity-60 animate-pulse" style={{ animationDuration: '3s' }}></div>
            <div className={`absolute w-20 h-20 md:w-24 md:h-24 border border-white/20 rounded-full animate-[spin_10s_linear_infinite] border-t-white/80`}></div>
            <div className={`absolute w-24 h-24 md:w-28 md:h-28 border border-white/10 rounded-full animate-[spin_15s_linear_reverse_infinite] border-b-white/60`}></div>
            <div className="absolute w-12 h-12 md:w-14 md:h-14 animate-[spin_25s_linear_infinite]">
              <div className={`absolute inset-0 border-[1.5px] ${isDarkMode ? 'border-[#E6B981]' : 'border-white'} rounded-sm opacity-80`}></div>
              <div className={`absolute inset-0 rotate-45 border-[1.5px] ${isDarkMode ? 'border-[#E6B981]' : 'border-white'} rounded-sm opacity-80`}></div>
            </div>
            <div className="absolute w-6 h-6 md:w-8 md:h-8 animate-[spin_12s_linear_reverse_infinite]">
              <div className={`absolute inset-0 rotate-45 bg-gradient-to-tr ${isDarkMode ? 'from-[#D4A373] to-[#E6B981]' : 'from-white/80 to-white'} shadow-[0_0_15px_rgba(255,255,255,0.6)] rounded-sm`}></div>
            </div>
            <div className="absolute w-2 h-2 md:w-3 md:h-3 bg-white rounded-full shadow-[0_0_15px_#fff] animate-ping" style={{ animationDuration: '1.5s' }}></div>
            <div className="absolute w-1 h-1 md:w-1.5 md:h-1.5 bg-white rounded-full"></div>
          </div>
          
          <h1 className={`text-4xl md:text-5xl font-quran mb-9 leading-normal drop-shadow-xl ${isDarkMode ? 'text-[#E6B981]' : 'text-white'}`}>
            {isAr ? 'القرآن الكريم' : 'The Noble Quran'}
          </h1>
          
          <div className={`relative px-5 py-3 md:py-4 rounded-3xl backdrop-blur-sm mb-6 border shadow-lg max-w-xl ${
            isDarkMode ? 'bg-black/30 border-[#E6B981]/20' : 'bg-white/10 border-white/30'
          }`}>
            <p className={`text-sm md:text-lg font-medium leading-loose ${isDarkMode ? 'text-[#f4e6d3]' : 'text-white'} ${isAr ? 'font-sans' : 'font-serif'}`}>
              {isAr 
                ? "« كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ وَلِيَتَذَكَّرَ أُولُو الْأَلْبَابِ »" 
                : '"A blessed Book which We have revealed to you, that they might reflect upon its verses"'}
            </p>
          </div>

          {lastRead && (
            <Link 
              to={`/surah/${lastRead.id}`} 
              state={{ targetPage: lastRead.page }}
              className={`group relative overflow-hidden inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs md:text-sm transition-all transform hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] ${
                isDarkMode ? 'bg-[#E6B981] text-gray-900' : 'bg-white text-[#D4A373]'
              }`}
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <Sparkles size={16} className="relative z-10 animate-pulse" />
              <span className="relative z-10">{t.continue}: {isAr ? `سورة ${lastRead.name.replace('سُورَةُ ', '')}` : `Surah ${lastRead.englishName || lastRead.name}`}</span>
              {isAr ? <ArrowLeft size={16} className="relative z-10" /> : <ArrowLeft size={16} className="rotate-180 relative z-10" />}
            </Link>
          )}
        </div>
      </div>

      {/* 🌟 ويدجيت الختمة 🌟 */}
      <div className={`max-w-2xl mx-auto mb-8 rounded-[2rem] overflow-hidden shadow-sm border transition-all ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#F0EBE1]'
      }`}>
        {!khatma ? (
          <div className="flex items-center justify-between p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-gray-700 text-[#E6B981]' : 'bg-[#FDFBF7] text-[#D4A373]'}`}>
                <Target size={24} />
              </div>
              <div>
                <h3 className={`text-lg font-bold font-quran mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{t.khatmaTitle}</h3>
                <p className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isAr ? 'نظم قراءتك واختم في مدة محددة' : 'Set a goal to finish the Quran'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowKhatmaModal(true)}
              className={`px-5 py-2.5 rounded-full font-bold text-sm shrink-0 transition-all shadow-md hover:shadow-lg ${
                isDarkMode ? 'bg-[#E6B981] text-gray-900' : 'bg-[#D4A373] text-white'
              }`}
            >
              {t.createPlan}
            </button>
          </div>
        ) : (
          <div className="p-5 md:p-6 flex flex-col sm:flex-row items-center gap-6">
            
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="none" className={isDarkMode ? "text-gray-700" : "text-gray-100"} />
                <circle 
                  cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                  className={`transition-all duration-1000 ease-out ${isDarkMode ? "text-[#E6B981]" : "text-[#D4A373]"}`} 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold font-sans ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{percentage}%</span>
              </div>
            </div>

            <div className={`flex-1 w-full flex flex-col ${isAr ? 'text-right' : 'text-left'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className={`font-bold text-xl ${isAr ? 'font-quran' : 'font-sans'} mb-1 ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>
                    {t.khatmaTitle} <span className="text-sm">({khatma.days} {isAr ? 'يوم' : 'Days'})</span>
                  </h3>
                  <div className={`flex items-center gap-2 text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <BookMarked size={14} /> <span>{t.dailyGoal}: {khatma.pagesPerDay} {t.pages}</span>
                  </div>
                </div>
                <button onClick={deleteKhatma} className="text-gray-400 hover:text-red-500 p-1 transition-colors bg-red-50/0 hover:bg-red-50 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>

              <div className={`flex justify-between text-xs font-bold mb-4 pb-4 border-b ${isDarkMode ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-100'}`}>
                <span>{isAr ? 'المقروء:' : 'Read:'} <span className={isDarkMode ? 'text-white' : 'text-black'}>{khatma.pagesRead}</span></span>
                <span>{isAr ? 'المتبقي:' : 'Left:'} <span className={isDarkMode ? 'text-white' : 'text-black'}>{604 - khatma.pagesRead}</span></span>
              </div>

              {khatma.pagesRead < 604 ? (
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => addPages(khatma.pagesPerDay)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                      isDarkMode ? 'bg-[#E6B981] text-gray-900 hover:bg-[#d6a575]' : 'bg-[#D4A373] text-white hover:bg-[#c7915b]'
                    }`}
                  >
                    <CheckCircle size={16} /> {t.doneToday}
                  </button>
                  <button 
                    onClick={() => addPages(5)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors border ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    +5
                  </button>
                  <button 
                    onClick={() => addPages(1)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors border ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    +1
                  </button>
                </div>
              ) : (
                <div className={`text-center py-3 font-bold rounded-xl w-full ${isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-600'}`}>
                  {isAr ? 'ما شاء الله! مبارك ختم القرآن الكريم 🎉' : 'Mashallah! Quran completed 🎉'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 🌟 نافذة تأكيد إلغاء الخطة 🌟 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div className={`w-full max-w-sm p-6 rounded-[2rem] shadow-2xl transform transition-all ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`} onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? "bg-red-500/20 text-red-400" : "bg-red-50 text-red-500"}`}>
                <AlertTriangle size={32} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
                {isAr ? 'إلغاء الخطة' : 'Cancel Plan'}
              </h3>
              <p className={`text-sm font-medium mb-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {isAr ? 'هل أنت متأكد من إلغاء خطة الختمة الحالية؟ سيتم مسح تقدمك الحالي ولن يمكنك التراجع.' : 'Are you sure you want to cancel the current plan? Your progress will be lost.'}
              </p>
              <div className="flex w-full gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {isAr ? 'تراجع' : 'Cancel'}
                </button>
                <button onClick={confirmDeleteKhatma} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-md">
                  {isAr ? 'نعم، إلغاء' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إعداد الخطة */}
      {showKhatmaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowKhatmaModal(false)}>
          <div 
            className={`w-full max-w-sm p-6 rounded-[2rem] shadow-2xl transform transition-all ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`} 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-gray-700 text-[#E6B981]' : 'bg-[#FDFBF7] text-[#D4A373]'}`}>
                <Calendar size={32} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
                {isAr ? 'تحديد مدة الختمة' : 'Set Khatma Duration'}
              </h3>
              <p className={`text-sm font-medium mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {isAr ? 'في كم يوم تريد أن تختم القرآن؟' : 'In how many days do you want to finish?'}
              </p>
              
              <div className="flex w-full gap-2 mb-6">
                {[15, 30, 60].map(days => (
                  <button 
                    key={days}
                    onClick={() => setKhatmaDays(days)}
                    className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors border ${
                      khatmaDays === days 
                        ? (isDarkMode ? 'bg-[#E6B981] text-gray-900 border-[#E6B981]' : 'bg-[#D4A373] text-white border-[#D4A373]') 
                        : (isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-50 text-gray-600 border-gray-200')
                    }`}
                  >
                    {days} {isAr ? 'يوم' : 'Days'}
                  </button>
                ))}
              </div>

              <div className="w-full relative mb-8">
                <input 
                  type="number" 
                  min="1" 
                  max="1000"
                  value={khatmaDays}
                  onChange={(e) => setKhatmaDays(parseInt(e.target.value) || 30)}
                  className={`w-full p-4 text-center rounded-xl font-bold text-xl border focus:outline-none transition-colors ${
                    isDarkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-[#E6B981]' : 'bg-white border-gray-200 text-gray-800 focus:border-[#D4A373]'
                  }`}
                  dir="ltr"
                />
              </div>
              
              <button 
                onClick={startKhatma}
                className={`w-full py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg ${
                  isDarkMode ? 'bg-[#E6B981] text-gray-900' : 'bg-[#D4A373] text-white'
                }`}
              >
                {isAr ? 'توكلنا على الله' : 'Start Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* شريط البحث */}
      <div className="relative mb-8 max-w-2xl mx-auto">
        <input 
          type="text" 
          placeholder={t.search} 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className={`w-full p-4 ${isAr ? 'pr-14' : 'pl-14'} rounded-2xl border focus:outline-none shadow-sm transition-colors font-medium text-lg ${
            isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 focus:border-[#E6B981]' : 'bg-white border-[#F0EBE1] text-gray-700 focus:border-[#D4A373]'
          }`} 
        />
        <Search className={`absolute ${isAr ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} size={22} />
      </div>

      <div className={`flex max-w-md mx-auto p-1.5 rounded-2xl mb-10 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-[#F0EBE1]/50'}`}>
        <button 
          onClick={() => setActiveTab("surahs")} 
          className={`flex-1 flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold transition-all text-sm md:text-base ${
            activeTab === "surahs" 
              ? (isDarkMode ? "bg-gray-700 text-[#E6B981] shadow-md" : "bg-white text-[#D4A373] shadow-md") 
              : "text-gray-500 hover:text-gray-400"
          }`}
        >
          <BookOpen size={20} /> {t.surahs}
        </button>
        <button 
          onClick={() => setActiveTab("ajzaa")} 
          className={`flex-1 flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold transition-all text-sm md:text-base ${
            activeTab === "ajzaa" 
              ? (isDarkMode ? "bg-gray-700 text-[#E6B981] shadow-md" : "bg-white text-[#D4A373] shadow-md") 
              : "text-gray-500 hover:text-gray-400"
          }`}
        >
          <Layers size={20} /> {t.ajzaa}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <Loader2 size={40} className={`animate-spin mb-4 ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`} />
        </div>
      ) : error ? (
        <div className="text-center py-10 font-bold text-red-500 bg-red-50 rounded-2xl max-w-md mx-auto">{error}</div>
      ) : activeTab === "surahs" ? (
        <div className="grid grid-cols-3 min-[500px]:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {filteredSurahs.length > 0 ? (
            filteredSurahs.map((surah) => (
              <Link 
                to={`/surah/${surah.number}`} 
                key={surah.number} 
                className={`flex flex-col items-center justify-center text-center p-3 md:p-4 rounded-2xl shadow-sm border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md group ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-[#E6B981]' : 'bg-white border-[#F0EBE1] hover:border-[#D4A373]'
                }`}
              >
                <div className={`relative flex items-center justify-center w-10 h-10 mb-3 rounded-xl rotate-45 border-2 transition-all shrink-0 ${
                  isDarkMode ? 'border-gray-700 group-hover:bg-[#E6B981] group-hover:border-[#E6B981]' : 'border-[#F0EBE1] group-hover:bg-[#D4A373] group-hover:border-[#D4A373]'
                }`}>
                  <span className={`absolute -rotate-45 font-bold text-xs md:text-sm ${
                    isDarkMode ? 'text-gray-400 group-hover:text-gray-900' : 'text-gray-500 group-hover:text-white'
                  }`}>
                    {surah.number}
                  </span>
                </div>
                
                <h3 className={`text-xl md:text-2xl font-bold font-quran mb-4 pb-1 leading-relaxed transition-colors ${
                  isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'
                }`}>
                  {surah.name.replace('سُورَةُ ', '')}
                </h3>
                
                <span className={`text-[10px] md:text-xs font-bold font-sans truncate w-full transition-colors ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {surah.englishName}
                </span>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-10 font-medium text-gray-500">{t.noResult}</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {juzData.map((juz) => (
            <Link 
              to={`/juz/${juz.id}`} 
              key={juz.id} 
              className={`relative flex flex-col items-center text-center p-4 rounded-2xl border shadow-sm transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg overflow-hidden ${
                isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-[#E6B981]' : 'bg-white border-[#F0EBE1] hover:border-[#D4A373]'
              }`}
            >
              <div className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-lg border-[2px] transition-all mb-3 ${
                isDarkMode ? 'border-gray-700 text-[#E6B981] group-hover:bg-[#E6B981] group-hover:text-gray-900' : 'border-[#F0EBE1] text-[#D4A373] group-hover:bg-[#D4A373] group-hover:border-[#D4A373] group-hover:text-white'
              }`}>
                {juz.id}
              </div>
              
              <h3 className={`font-bold text-lg md:text-xl ${isAr ? 'font-quran' : 'font-sans'} mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {t.juzTitle} {isAr ? juz.nameAr : juz.nameEn}
              </h3>
              <p className={`text-[10px] md:text-xs font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {t.hizb} {juz.hizbStart} - {juz.hizbEnd}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
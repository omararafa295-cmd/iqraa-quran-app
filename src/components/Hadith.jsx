import { useState, useEffect, useContext, useMemo, useRef } from "react";
import axios from "axios";
import { AppContext } from "../App";
import { 
  Copy, Check, Bookmark, BookmarkCheck, BookOpen, ScrollText, 
  Search, WifiOff, Loader2, X, Sparkles, ChevronDown 
} from "lucide-react";

const CDN_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

// 📚 الكتب المتاحة
const BOOKS = [
  { id: "bukhari", nameAr: "صحيح البخاري", nameEn: "Sahih al-Bukhari" },
  { id: "muslim", nameAr: "صحيح مسلم", nameEn: "Sahih Muslim" },
  { id: "abudawud", nameAr: "سنن أبي داود", nameEn: "Sunan Abu Dawud" },
  { id: "tirmidhi", nameAr: "جامع الترمذي", nameEn: "Jami at-Tirmidhi" },
  { id: "nasai", nameAr: "سنن النسائي", nameEn: "Sunan an-Nasa'i" },
  { id: "ibnmajah", nameAr: "سنن ابن ماجه", nameEn: "Sunan Ibn Majah" },
  { id: "malik", nameAr: "موطأ مالك", nameEn: "Muwatta Malik" },
  { id: "nawawi", nameAr: "الأربعون النووية", nameEn: "40 Nawawi" },
  { id: "qudsi", nameAr: "الأربعون القدسية", nameEn: "40 Qudsi" },
];

const FAVORITES_ID = "favorites";

export default function Hadith() {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';

  const [copiedId, setCopiedId] = useState(null);
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hadith_bookmarks_v2") || "[]"); } catch { return []; }
  });
  const [activeBook, setActiveBook] = useState(FAVORITES_ID);
  const [searchQuery, setSearchQuery] = useState("");

  const [hadithsByBook, setHadithsByBook] = useState({}); 
  const [sectionByBook, setSectionByBook] = useState({}); 
  const [hasMoreByBook, setHasMoreByBook] = useState({});
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [selectedHadith, setSelectedHadith] = useState(null);
  const dailyPickedRef = useRef({});

  useEffect(() => {
    setActiveBook("bukhari");
  }, []);

  useEffect(() => {
    localStorage.setItem("hadith_bookmarks_v2", JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    setSelectedHadith(null);
  }, [activeBook, searchQuery]);

  const t = {
    title: isAr ? "الأحاديث النبوية" : "Prophetic Hadiths",
    subtitle: isAr ? "وما ينطق عن الهوى إن هو إلا وحي يوحى" : "Selections from the Prophet's sayings",
    emptyFav: isAr ? "لا توجد أحاديث في المفضلة بعد" : "No favorite hadiths yet",
    emptySearch: isAr ? "لا توجد نتائج مطابقة فيما تم تحميله حالياً" : "No matches in what's loaded so far",
    search: isAr ? "ابحث في الأحاديث المحمّلة..." : "Search loaded hadiths...",
    favorites: isAr ? "المفضلة" : "Favorites",
    loading: isAr ? "جاري التحميل..." : "Loading...",
    loadError: isAr ? "تعذر تحميل الأحاديث، تأكد من اتصالك بالإنترنت" : "Couldn't load hadiths, check your connection",
    retry: isAr ? "إعادة المحاولة" : "Retry",
    reference: isAr ? "حديث رقم" : "Hadith No.",
    daily: isAr ? "حديث مختار" : "Featured Hadith",
    readMore: isAr ? "اقرأ الحديث كاملاً" : "Read Full Hadith",
    loadMoreBtn: isAr ? "تحميل المزيد" : "Load More",
    endOfBook: isAr ? "وصلت لآخر ما هو متاح من هذا الكتاب حالياً" : "You've reached the end of what's loaded",
  };

  const fetchSection = async (bookId, sectionNo) => {
    const url = `${CDN_BASE}/editions/ara-${bookId}/sections/${sectionNo}.min.json`;
    if ('caches' in window) {
      try {
        const cache = await caches.open('hadith-cache-v1');
        const cached = await cache.match(url);
        if (cached) {
          const data = await cached.json();
          return data.hadiths || [];
        }
      } catch (e) {}
    }
    const res = await axios.get(url, { timeout: 8000 });
    try {
      if ('caches' in window) {
        const cache = await caches.open('hadith-cache-v1');
        cache.put(url, new Response(JSON.stringify(res.data)));
      }
    } catch (e) {}
    return res.data.hadiths || [];
  };

  const loadNextSection = async (bookId, isInitial = false) => {
    if (isInitial) { setLoadingInitial(true); setLoadError(false); }
    else setLoadingMore(true);

    const nextSection = (sectionByBook[bookId] || 0) + 1;

    try {
      const raw = await fetchSection(bookId, nextSection);
      if (!raw || raw.length === 0) {
        setHasMoreByBook(prev => ({ ...prev, [bookId]: false }));
      } else {
        const mapped = raw.map(h => ({
          id: `${bookId}-${h.hadithnumber}`,
          bookId,
          hadithnumber: h.hadithnumber,
          text: h.text,
          grade: h.grades && h.grades[0] ? h.grades[0].grade : null,
        }));
        setHadithsByBook(prev => ({ ...prev, [bookId]: [...(prev[bookId] || []), ...mapped] }));
        setSectionByBook(prev => ({ ...prev, [bookId]: nextSection }));
        
        if (!dailyPickedRef.current[bookId] && mapped.length > 0) {
          dailyPickedRef.current[bookId] = mapped[Math.floor(Math.random() * mapped.length)];
        }
      }
    } catch (e) {
      if (isInitial) setLoadError(true);
      setHasMoreByBook(prev => ({ ...prev, [bookId]: false }));
    } finally {
      setLoadingInitial(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (activeBook === FAVORITES_ID) return;
    if (!hadithsByBook[activeBook] && hasMoreByBook[activeBook] !== false) {
      loadNextSection(activeBook, true);
    }
  }, [activeBook]);

  const handleCopy = (e, hadith, sourceLabel) => {
    if (e) e.stopPropagation();
    const textToCopy = `« ${hadith.text} »\n\n${sourceLabel}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(hadith.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const isBookmarked = (id) => bookmarks.some(b => b.id === id);

  const toggleBookmark = (e, hadith, sourceLabel) => {
    if (e) e.stopPropagation();
    setBookmarks(prev => {
      if (prev.some(b => b.id === hadith.id)) {
        return prev.filter(b => b.id !== hadith.id);
      }
      return [...prev, { id: hadith.id, bookId: hadith.bookId, hadithnumber: hadith.hadithnumber, text: hadith.text, grade: hadith.grade, sourceLabel, savedAt: Date.now() }];
    });
  };

  const sourceLabelFor = (bookId, hadithnumber) => {
    const book = BOOKS.find(b => b.id === bookId);
    return `${isAr ? (book?.nameAr || bookId) : (book?.nameEn || bookId)} - ${t.reference} ${hadithnumber}`;
  };

  const currentBookHadiths = hadithsByBook[activeBook] || [];
  
  const displayedList = useMemo(() => {
    const source = activeBook === FAVORITES_ID
      ? bookmarks.map(b => ({ id: b.id, bookId: b.bookId, hadithnumber: b.hadithnumber, text: b.text, grade: b.grade }))
      : currentBookHadiths;

    if (!searchQuery.trim()) return source;
    return source.filter(h => h.text.includes(searchQuery));
  }, [activeBook, currentBookHadiths, bookmarks, searchQuery]);

  const dailyHadith = activeBook !== FAVORITES_ID ? dailyPickedRef.current[activeBook] : null;
  const showDaily = !searchQuery && dailyHadith && activeBook !== FAVORITES_ID;

  const HadithSkeleton = () => (
    <div className={`p-5 md:p-6 rounded-3xl border animate-pulse shadow-sm ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-[#F0EBE1]"}`}>
      <div className={`h-4 rounded-full mb-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ width: '90%' }} />
      <div className={`h-4 rounded-full mb-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ width: '70%' }} />
      <div className={`h-4 rounded-full mb-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ width: '40%' }} />
    </div>
  );

  return (

    <div className="max-w-5xl mx-auto px-4 md:px-6 pt-2 md:pt-6 pb-32" dir={isAr ? "rtl" : "ltr"}>

      <div className="text-center mb-4 md:mb-6 mt-0 md:mt-2 px-2">
        <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full flex items-center justify-center mb-3 md:mb-4 border-2 shadow-sm transition-colors ${
          isDarkMode ? "bg-gray-800 border-[#E5C158] text-[#E5C158]" : "bg-[#FDFBF7] border-[#D4AF37] text-[#D4AF37]"
        }`}>
          <ScrollText size={24} className="md:w-8 md:h-8" />
        </div>
        <h2 className={`text-2xl md:text-3xl font-bold ${isAr ? 'font-quran' : 'font-serif tracking-wide'} mb-2 md:mb-3 ${isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'}`}>
          {t.title}
        </h2>
        <p className="text-gray-500 text-[10px] md:text-sm font-medium mb-4 md:mb-6">{t.subtitle}</p>
      </div>

      <div className="relative mb-5 md:mb-6 max-w-2xl mx-auto">
        <input
          type="text"
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full p-3.5 md:p-4 ${isAr ? 'pr-12 md:pr-14' : 'pl-12 md:pl-14'} rounded-2xl border focus:outline-none shadow-sm transition-colors font-medium text-xs md:text-base ${
            isDarkMode ? 'bg-gray-800 border-gray-700 text-[#E5C158] focus:border-[#E5C158]' : 'bg-white border-[#F0EBE1] text-gray-700 focus:border-[#D4AF37]'
          }`}
        />
        <Search className={`absolute ${isAr ? 'right-4 md:right-5' : 'left-4 md:left-5'} top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-4 mb-4 md:mb-6">
        <button
          onClick={() => { setActiveBook(FAVORITES_ID); setSearchQuery(""); }}
          className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm shrink-0 transition-all whitespace-nowrap ${
            activeBook === FAVORITES_ID
              ? (isDarkMode ? "bg-[#E5C158] text-gray-900 shadow-md" : "bg-[#D4AF37] text-white shadow-md")
              : (isDarkMode ? "bg-gray-800 text-[#E5C158] hover:text-gray-200" : "bg-white border border-[#F0EBE1] text-[#D4AF37] hover:bg-gray-50")
          }`}
        >
          <Bookmark size={14} className={activeBook === FAVORITES_ID ? "fill-current" : ""} />
          {t.favorites}
        </button>
        {BOOKS.map(book => (
          <button
            key={book.id}
            onClick={() => { setActiveBook(book.id); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm shrink-0 transition-all whitespace-nowrap ${
              activeBook === book.id
                ? (isDarkMode ? "bg-[#E5C158] text-gray-900 shadow-md" : "bg-[#D4AF37] text-white shadow-md")
                : (isDarkMode ? "bg-gray-800 text-gray-400 hover:text-[#E5C158]" : "bg-white border border-[#F0EBE1] text-gray-600 hover:bg-gray-50")
            }`}
          >
            {isAr ? book.nameAr : book.nameEn}
          </button>
        ))}
      </div>

      <div>
        {loadingInitial && activeBook !== FAVORITES_ID ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <HadithSkeleton /><HadithSkeleton /><HadithSkeleton /><HadithSkeleton />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-10 md:py-16 text-center">
            <WifiOff size={36} className={isDarkMode ? "text-gray-600 mb-3" : "text-gray-300 mb-3"} />
            <p className="text-gray-500 font-medium text-sm md:text-base mb-4">{t.loadError}</p>
            <button
              onClick={() => loadNextSection(activeBook, true)}
              className={`px-5 py-2 rounded-full font-bold text-xs md:text-sm ${isDarkMode ? 'bg-gray-800 text-[#E5C158] border border-gray-700' : 'bg-white text-[#D4AF37] border border-[#F0EBE1] shadow-sm'}`}
            >
              {t.retry}
            </button>
          </div>
        ) : displayedList.length === 0 ? (
          <div className="text-center py-12 md:py-16 text-gray-500 text-sm md:text-base font-medium">
            {activeBook === FAVORITES_ID ? t.emptyFav : (searchQuery ? t.emptySearch : "")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-start">

            {showDaily && (
              <div 
                onClick={() => setSelectedHadith(dailyHadith)}
                className={`col-span-1 md:col-span-2 cursor-pointer p-5 md:p-6 rounded-3xl shadow-md border transition-all hover:scale-[1.01] overflow-hidden ${
                  isDarkMode ? "bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700" : "bg-gradient-to-br from-[#FDFBF7] to-white border-[#D4AF37]/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className={isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"} />
                  <h3 className={`font-bold text-xs md:text-sm ${isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"}`}>{t.daily}</h3>
                </div>
                <p className={`text-base md:text-xl font-medium line-clamp-3 leading-relaxed ${isAr ? 'font-sans text-justify' : 'font-serif text-left'} ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                  {dailyHadith.text}
                </p>
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700/50 flex justify-between items-center">
                  <span className={`text-[10px] md:text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{sourceLabelFor(dailyHadith.bookId, dailyHadith.hadithnumber)}</span>
                  <span className={`text-[10px] md:text-xs font-bold ${isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'}`}>{t.readMore}</span>
                </div>
              </div>
            )}

            {displayedList.filter(h => !showDaily || h.id !== dailyHadith?.id).map((hadith) => {
              const sourceLabel = sourceLabelFor(hadith.bookId, hadith.hadithnumber);
              const bookmarked = isBookmarked(hadith.id);
              
              return (
                <div 
                  key={hadith.id}
                  onClick={() => setSelectedHadith(hadith)}
                  className={`cursor-pointer flex flex-col p-4 md:p-5 rounded-3xl shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${
                    isDarkMode ? "bg-gray-800 border-gray-700 hover:border-[#E5C158]/50" : "bg-white border-[#F0EBE1] hover:border-[#D4AF37]/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    {hadith.grade && (
                      <span className={`text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-full ${
                        isDarkMode ? 'bg-[#E5C158]/15 text-[#E5C158]' : 'bg-[#D4AF37]/10 text-[#B8942E]'
                      }`}>
                        {hadith.grade}
                      </span>
                    )}
                    <button
                      onClick={(e) => toggleBookmark(e, hadith, sourceLabel)}
                      className={`p-1 md:p-1.5 rounded-lg transition-colors ${bookmarked ? (isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]') : 'text-gray-400 hover:text-[#D4AF37]'}`}
                    >
                      {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>
                  </div>

              
                  <div className="relative mb-3 md:mb-4">
                    <p className={`text-[14px] md:text-base leading-loose font-medium line-clamp-3 ${isAr ? 'font-sans text-justify' : 'font-serif text-left'} ${isDarkMode ? "text-[#E5C158]" : "text-gray-700"}`}>
                      {hadith.text}
                    </p>
                  
                    <div className={`absolute bottom-0 left-0 w-full h-6 md:h-8 bg-gradient-to-t ${isDarkMode ? 'from-gray-800' : 'from-white'} to-transparent`} />
                  </div>

                  <div className={`mt-auto pt-3 border-t flex items-center justify-between gap-2 ${isDarkMode ? "border-gray-700/50" : "border-[#F0EBE1]"}`}>
                    <span className={`text-[10px] md:text-[11px] font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {sourceLabel}
                    </span>
                    <span className={`text-[10px] md:text-[11px] font-bold shrink-0 ${isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'}`}>
                      {t.readMore}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeBook !== FAVORITES_ID && !searchQuery && !loadingInitial && !loadError && (
          <div className="flex flex-col items-center pt-6 md:pt-8">
            {hasMoreByBook[activeBook] === false ? (
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">{t.endOfBook}</p>
            ) : (
              <button
                onClick={() => loadNextSection(activeBook, false)}
                disabled={loadingMore}
                className={`flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3 rounded-full font-bold text-xs md:text-sm transition-all shadow-sm ${
                  isDarkMode ? 'bg-gray-800 text-[#E5C158] border border-gray-700 hover:bg-gray-700' : 'bg-white text-[#D4AF37] border border-[#F0EBE1] hover:bg-gray-50'
                }`}
              >
                {loadingMore ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} />}
                {loadingMore ? t.loading : t.loadMoreBtn}
              </button>
            )}
          </div>
        )}
      </div>

      {selectedHadith && (
        <div 
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4"
          onClick={() => setSelectedHadith(null)}
        >
          <div 
            className={`w-full max-w-xl max-h-[85vh] md:max-h-[90vh] flex flex-col rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl transform transition-all animate-in slide-in-from-bottom md:zoom-in-95 ${
              isDarkMode ? "bg-gray-900 border border-gray-800" : "bg-[#FDFBF7] border border-[#F0EBE1]"
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* هيدر المودال */}
            <div className={`flex items-center justify-between p-4 md:p-6 border-b shrink-0 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className={isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'} />
                <span className={`font-bold text-xs md:text-base ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {sourceLabelFor(selectedHadith.bookId, selectedHadith.hadithnumber)}
                </span>
              </div>
              <button 
                onClick={() => setSelectedHadith(null)}
                className={`p-1.5 md:p-2 rounded-full transition-colors ${isDarkMode ? 'bg-gray-800 text-gray-400 hover:text-red-400' : 'bg-gray-100 text-gray-500 hover:text-red-500'}`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 md:p-8 overflow-y-auto relative">
              {selectedHadith.grade && (
                <span className={`inline-block mb-4 md:mb-5 text-[10px] md:text-[11px] font-bold px-3 py-1 md:py-1.5 rounded-full ${
                  isDarkMode ? 'bg-[#E5C158]/15 text-[#E5C158]' : 'bg-[#D4AF37]/10 text-[#B8942E]'
                }`}>
                  {selectedHadith.grade}
                </span>
              )}

              <div className="relative">
                <span className={`absolute -top-5 md:-top-6 -right-2 md:-right-2 text-5xl md:text-6xl opacity-15 font-serif ${isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'}`}>"</span>
                <p className={`text-[17px] md:text-2xl leading-[2.2] md:leading-[2.4] font-medium ${isAr ? 'font-sans text-justify' : 'font-serif text-left'} ${isDarkMode ? "text-[#E5C158]" : "text-[#2b241d]"}`}>
                  {selectedHadith.text}
                </p>
                <span className={`absolute -bottom-5 md:-bottom-6 -left-2 md:-left-2 text-5xl md:text-6xl opacity-15 font-serif ${isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'}`}>"</span>
              </div>
            </div>

            <div className={`p-4 md:p-6 border-t shrink-0 flex items-center justify-between gap-2 md:gap-3 ${isDarkMode ? 'bg-gray-900 border-gray-800 rounded-b-[2.5rem]' : 'bg-white border-gray-200 rounded-b-[2.5rem]'}`}>
              <button
                onClick={(e) => handleCopy(e, selectedHadith, sourceLabelFor(selectedHadith.bookId, selectedHadith.hadithnumber))}
                className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all border shadow-sm ${
                  copiedId === selectedHadith.id 
                    ? "bg-green-500 text-white border-green-500" 
                    : (isDarkMode ? "bg-gray-800 border-gray-700 text-[#E5C158] hover:bg-gray-700" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100")
                }`}
              >
                {copiedId === selectedHadith.id ? <><Check size={16} /> {isAr ? "تم النسخ" : "Copied"}</> : <><Copy size={16} /> {isAr ? "نسخ" : "Copy"}</>}
              </button>

              <button
                onClick={(e) => toggleBookmark(e, selectedHadith, sourceLabelFor(selectedHadith.bookId, selectedHadith.hadithnumber))}
                className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all border shadow-sm ${
                  isBookmarked(selectedHadith.id)
                    ? (isDarkMode ? "bg-amber-950/60 border-[#E5C158] text-[#E5C158]" : "bg-amber-50 border-[#D4AF37] text-[#D4AF37]")
                    : (isDarkMode ? "bg-[#E5C158] text-gray-900 border-[#E5C158] hover:bg-[#D4AF37]" : "bg-[#D4AF37] text-white border-[#D4AF37] hover:bg-[#B8942E]")
                }`}
              >
                {isBookmarked(selectedHadith.id) ? <><BookmarkCheck size={16} /> {isAr ? "محفوظ" : "Saved"}</> : <><Bookmark size={16} /> {isAr ? "حفظ" : "Save"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
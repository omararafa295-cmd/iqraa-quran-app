import { useEffect, useMemo, useState, useContext } from "react";
import axios from "axios";
import { ArrowLeft, CheckCircle, CloudDownload, Download, Loader2, Trash2, Volume2, WifiOff, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../App";

const reciters = [
  { id: "ar.alafasy", nameAr: "مشاري العفاسي", nameEn: "Mishary Alafasy" },
  { id: "ar.abdulsamad", nameAr: "عبد الباسط عبد الصمد", nameEn: "AbdulBaset AbdulSamad" },
  { id: "ar.husary", nameAr: "خليل الحصري", nameEn: "Al-Husary" },
  { id: "ar.husarymujawwad", nameAr: "الحصري (مجود)", nameEn: "Al-Husary (Mujawwad)" },
  { id: "ar.saadalghamdi", nameAr: "سعد الغامدي", nameEn: "Saad Al-Ghamdi" },
  { id: "ar.mahermuaiqly", nameAr: "ماهر المعيقلي", nameEn: "Maher Al Muaiqly" },
  { id: "ar.yasseraldossari", nameAr: "ياسر الدوسري", nameEn: "Yasser Al-Dossari" },
  { id: "ar.minshawimujawwad", nameAr: "محمد صديق المنشاوي (مجود)", nameEn: "Mohamed Siddiq Al-Minshawi (Mujawwad)" },
  { id: "ar.abdurrahmaansudais", nameAr: "عبد الرحمن السديس", nameEn: "As-Sudais" },
  { id: "ar.saoodshuraym", nameAr: "سعود الشريم", nameEn: "Saud Al-Shuraim" },
  { id: "ar.ahmedajamy", nameAr: "أحمد العجمي", nameEn: "Ahmed Al-Ajmi" },
  { id: "ar.hudhaify", nameAr: "علي الحذيفي", nameEn: "Al-Hudhaify" },
  { id: "ar.abdullahbasfar", nameAr: "عبدالله بصفر", nameEn: "Abdullah Basfar" },
  { id: "ar.shaatree", nameAr: "أبو بكر الشاطري", nameEn: "Abu Bakr Ash-Shaatree" }
];

const everyAyahMap = {
  "ar.alafasy": "Alafasy_128kbps",
  "ar.abdulsamad": "Abdul_Basit_Murattal_192kbps",
  "ar.husary": "Husary_128kbps",
  "ar.husarymujawwad": "Husary_Mujawwad_64kbps",
  "ar.abdurrahmaansudais": "Abdurrahmaan_As-Sudais_192kbps",
  "ar.saoodshuraym": "Saood_ash-Shuraym_128kbps",
  "ar.ahmedajamy": "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net",
  "ar.hudhaify": "Hudhaify_128kbps",
  "ar.mahermuaiqly": "MaherAlMuaiqly128kbps",
  "ar.abdullahbasfar": "Abdullah_Basfar_192kbps",
  "ar.shaatree": "Abu_Bakr_Ash-Shaatree_128kbps"
};

const getAudioUrl = (reciterId, surahNumber, ayahNumberInSurah, globalAyahNumber) => {
  if (reciterId === "ar.saadalghamdi") {
    return `https://alfurqan.online/api/v1/audio/ghamadi/surah/${surahNumber}/ayah/${ayahNumberInSurah}`;
  }

  if (reciterId === "ar.yasseraldossari") {
    return `https://the-quran-project.github.io/Quran-Audio/Data/4/${surahNumber}_${ayahNumberInSurah}.mp3`;
  }

  if (everyAyahMap[reciterId]) {
    const sNum = String(surahNumber).padStart(3, "0");
    const aNum = String(ayahNumberInSurah).padStart(3, "0");
    return `https://everyayah.com/data/${everyAyahMap[reciterId]}/${sNum}${aNum}.mp3`;
  }

  return `https://cdn.islamic.network/quran/audio/64/${reciterId}/${globalAyahNumber}.mp3`;
};

const manifestKey = (id) => `offline_audio_manifest_${id}`;
const fullKey = (id) => `offline_audio_full_${id}`;

export default function AudioDownloads({ isDrawer = false, onClose }) {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const [downloaded, setDownloaded] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [progress, setProgress] = useState({});
  const [error, setError] = useState("");
  const [loadingState, setLoadingState] = useState(true);
  const [quranAyahs, setQuranAyahs] = useState([]);

  const title = isAr ? "الصوتيات" : "Audio Library";
  const description = isAr ?  "إدارة وتحميل القرآن الكريم كاملًا للاستماع بدون إنترنت" : "Manage and download complete Quran for offline listening";
  const loadDownloaded = () => {
    const next = {};
    reciters.forEach((reciter) => {
      next[reciter.id] = localStorage.getItem(fullKey(reciter.id)) === "true";
    });
    setDownloaded(next);
  };

  useEffect(() => {
    loadDownloaded();
    let cancelled = false;

    const loadQuran = async () => {
      try {
        const cached = localStorage.getItem("smart_search_quran_ar");
        if (cached) {
          const parsed = JSON.parse(cached);
          const ayahs = parsed.flatMap((surah) => (surah.ayahs || []).map((ayah) => ({
            number: ayah.number,
            numberInSurah: ayah.numberInSurah,
            surahNumber: surah.number
          })));
          if (ayahs.length > 6000) {
            if (!cancelled) setQuranAyahs(ayahs);
            setLoadingState(false);
            return;
          }
        }

        const response = await axios.get("https://api.alquran.cloud/v1/quran/quran-simple", { timeout: 20000 });
        const surahs = response.data?.data?.surahs || [];
        const ayahs = surahs.flatMap((surah) => (surah.ayahs || []).map((ayah) => ({
          number: ayah.number,
          numberInSurah: ayah.numberInSurah,
          surahNumber: surah.number
        })));

        if (!cancelled) {
          setQuranAyahs(ayahs);
          localStorage.setItem("smart_search_quran_ar", JSON.stringify(surahs));
        }
      } catch {
        if (!cancelled) setError(isAr ? "تعذر تجهيز بيانات المصحف للتحميل." : "Couldn't prepare Quran data for download.");
      } finally {
        if (!cancelled) setLoadingState(false);
      }
    };

    loadQuran();
    return () => {
      cancelled = true;
    };
  }, [isAr]);

  const downloadedCount = useMemo(() => Object.values(downloaded).filter(Boolean).length, [downloaded]);

  const downloadReciter = async (reciter) => {
    if (!navigator.onLine) {
      setError(isAr ? "أنت غير متصل بالإنترنت." : "You are offline.");
      return;
    }

    if (!quranAyahs.length || !("caches" in window)) {
      setError(isAr ? "لا يمكن بدء التحميل حالياً." : "Download cannot start right now.");
      return;
    }

    if (activeId) return;

    setError("");
    setActiveId(reciter.id);
    setProgress((prev) => ({ ...prev, [reciter.id]: 0 }));

    try {
      const cache = await caches.open("quran-audio-cache");
      const manifest = [];
      let completed = 0;
      let failed = 0;
      const concurrency = 4;
      let cursor = 0;

      const worker = async () => {
        while (true) {
          const index = cursor++;
          if (index >= quranAyahs.length) return;

          const ayah = quranAyahs[index];
          const url = getAudioUrl(reciter.id, ayah.surahNumber, ayah.numberInSurah, ayah.number);
          manifest.push(url);

          let success = false;
          for (let attempt = 0; attempt < 2 && !success; attempt++) {
            try {
              const cached = await cache.match(url);
              if (cached) {
                success = true;
              } else {
                const response = await fetch(url, { cache: "no-store" });
                if (response.ok) {
                  await cache.put(url, response.clone());
                  success = true;
                }
              }
            } catch {}
          }

          if (!success) failed += 1;
          completed += 1;
          setProgress((prev) => ({ ...prev, [reciter.id]: Math.round((completed / quranAyahs.length) * 100) }));
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));

      const uniqueManifest = [...new Set(manifest)];
      localStorage.setItem(manifestKey(reciter.id), JSON.stringify(uniqueManifest));

      if (failed === 0 && completed === quranAyahs.length) {
        localStorage.setItem(fullKey(reciter.id), "true");
        setDownloaded((prev) => ({ ...prev, [reciter.id]: true }));
        setProgress((prev) => ({ ...prev, [reciter.id]: 100 }));
      } else {
        localStorage.removeItem(fullKey(reciter.id));
        setDownloaded((prev) => ({ ...prev, [reciter.id]: false }));
        setError(isAr ? `اكتمل التحميل جزئيًا وفشل تحميل ${failed} آية.` : `${failed} ayahs failed to download.`);
      }
    } catch {
      setError(isAr ? "حدث خطأ أثناء تحميل الصوتيات." : "An error occurred while downloading audio.");
    } finally {
      setActiveId(null);
    }
  };

  const deleteReciter = async (reciter) => {
    try {
      const cache = await caches.open("quran-audio-cache");
      const raw = localStorage.getItem(manifestKey(reciter.id));
      const manifest = raw ? JSON.parse(raw) : [];
      await Promise.all(manifest.map((url) => cache.delete(url)));
      localStorage.removeItem(manifestKey(reciter.id));
      localStorage.removeItem(fullKey(reciter.id));
      for (let surah = 1; surah <= 114; surah++) {
        localStorage.removeItem(`offline_audio_saved_${surah}_${reciter.id}`);
      }
      setDownloaded((prev) => ({ ...prev, [reciter.id]: false }));
      setProgress((prev) => ({ ...prev, [reciter.id]: 0 }));
    } catch {
      setError(isAr ? "تعذر حذف الصوتيات." : "Couldn't delete audio.");
    }
  };

  return (
    <div
      className={
        isDrawer
          ? "h-full flex flex-col overflow-hidden p-4"
          : "max-w-3xl mx-auto p-4 md:p-6 pt-3 md:pt-6 pb-32"
      }
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between gap-3 mb-5 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Volume2 size={22} className={isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"} />
            <h1 className={`text-xl md:text-2xl font-bold truncate ${isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"}`}>{title}</h1>
          </div>
          <p className={`text-xs mt-1 truncate ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{description}</p>
        </div>

        <button
          onClick={onClose ? onClose : () => navigate(-1)}
          className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center border shadow-sm transition-all ${
            isDarkMode
              ? "bg-gray-800 border-gray-700 text-[#E5C158] hover:bg-gray-700"
              : "bg-white border-[#F0EBE1] text-[#D4AF37] hover:bg-gray-50"
          }`}
          title={isAr ? "رجوع" : "Back"}
        >
          {isDrawer ? <X size={20} /> : <ArrowLeft size={19} />}
        </button>
      </div>

      <div className={`rounded-[2rem] border p-4 mb-4 shrink-0 ${isDarkMode ? "bg-gray-800/70 border-gray-700" : "bg-white border-[#F0EBE1]"}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isDarkMode ? "bg-[#E5C158]/10 text-[#E5C158]" : "bg-[#D4AF37]/10 text-[#D4AF37]"}`}>
              <CloudDownload size={22} />
            </div>
            <div>
              <h2 className="font-bold text-sm md:text-base">{isAr ? "إدارة التحميلات" : "Download Manager"}</h2>
              <p className="text-xs text-gray-500 mt-1">{isAr ? `${downloadedCount} قارئ محمل بالكامل` : `${downloadedCount} reciters fully downloaded`}</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isDarkMode ? "bg-gray-900 text-[#E5C158]" : "bg-[#FDFBF7] text-[#D4AF37]"}`}>{reciters.length}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl p-3 text-sm font-bold bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
          <WifiOff size={18} />
          <span>{error}</span>
        </div>
      )}

      {loadingState ? (
        <div className={`py-16 flex flex-col items-center justify-center gap-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          <Loader2 size={28} className="animate-spin" />
          <span className="text-sm font-bold">{isAr ? "جاري تجهيز الصوتيات..." : "Preparing audio library..."}</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto overscroll-contain space-y-3 pr-1 pb-4 scrollbar-thin">
          {reciters.map((reciter) => {
            const isDownloaded = !!downloaded[reciter.id];
            const isActive = activeId === reciter.id;
            const currentProgress = progress[reciter.id] || 0;

            return (
              <div key={reciter.id} className={`rounded-[1.7rem] border p-4 shadow-sm transition-all ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-[#F0EBE1]"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isDownloaded ? "bg-green-500/10 text-green-500" : isDarkMode ? "bg-gray-900 text-[#E5C158]" : "bg-[#FDFBF7] text-[#D4AF37]"}`}>
                    {isDownloaded ? <CheckCircle size={22} /> : <Volume2 size={21} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-bold text-sm md:text-base truncate ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>{isAr ? reciter.nameAr : reciter.nameEn}</h3>
                    <p className="text-[11px] text-gray-500 mt-1">{isDownloaded ? (isAr ? "القرآن كاملًا متاح بدون إنترنت" : "Complete Quran available offline") : isActive ? `${currentProgress}%` : (isAr ? "غير محمل" : "Not downloaded")}</p>
                  </div>
                  <div className="shrink-0">
                    {isDownloaded ? (
                      <button onClick={() => deleteReciter(reciter)} className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors" title={isAr ? "حذف" : "Delete"}>
                        <Trash2 size={18} />
                      </button>
                    ) : (
                      <button onClick={() => downloadReciter(reciter)} disabled={!!activeId || quranAyahs.length === 0} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? "bg-[#E5C158] text-gray-900 disabled:opacity-50" : "bg-[#D4AF37] text-white disabled:opacity-50"}`} title={isAr ? "تحميل القرآن كاملًا" : "Download complete Quran"}>
                        {isActive ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                      </button>
                    )}
                  </div>
                </div>
                {isActive && (
                  <div className="mt-3">
                    <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
                      <div className="h-full rounded-full transition-all duration-300 bg-[#D4AF37]" style={{ width: `${currentProgress}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] font-bold text-gray-500">
                      <span>{isAr ? "جاري تحميل القرآن كاملًا" : "Downloading complete Quran"}</span>
                      <span>{currentProgress}%</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
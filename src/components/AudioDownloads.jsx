import { useEffect, useMemo, useState, useContext } from "react";
import axios from "axios";
import {
  ArrowLeft,
  CheckCircle,
  Clock3,
  CloudDownload,
  Download,
  HardDrive,
  Loader2,
  Pause,
  Play,
  Trash2,
  Volume2,
  WifiOff,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../App";
import audioDownloadManager from "../services/audioDownloadManager";

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
  { id: "ar.shaatree", nameAr: "أبو بكر الشاطري", nameEn: "Abu Bakr Ash-Shaatree" },
];

const fullKey = (id) => `offline_audio_full_${id}`;

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 MB";
  }

  const megabytes = bytes / 1024 / 1024;

  if (megabytes < 1000) {
    return `${
      megabytes < 10
        ? megabytes.toFixed(1)
        : megabytes.toFixed(0)
    } MB`;
  }

  return `${(megabytes / 1024).toFixed(1)} GB`;
};

const formatSpeed = (bytesPerSecond) => {
  if (
    !Number.isFinite(bytesPerSecond) ||
    bytesPerSecond <= 0
  ) {
    return "";
  }

  const kb = bytesPerSecond / 1024;

  if (kb < 1024) {
    return `${Math.round(kb)} KB/s`;
  }

  return `${(kb / 1024).toFixed(1)} MB/s`;
};

const formatEta = (seconds, isAr) => {
  if (
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    return isAr
      ? "جارٍ الحساب..."
      : "Calculating...";
  }

  const rounded = Math.ceil(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor(
    (rounded % 3600) / 60
  );
  const secs = rounded % 60;

  if (hours > 0) {
    return isAr
      ? `${hours} س ${minutes} د تقريبًا`
      : `About ${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return isAr
      ? `${minutes} د ${secs} ث تقريبًا`
      : `About ${minutes}m ${secs}s`;
  }

  return isAr
    ? `${secs} ث تقريبًا`
    : `About ${secs}s`;
};

export default function AudioDownloads({
  isDrawer = false,
  onClose,
}) {
  const {
    isDarkMode,
    lang,
  } = useContext(AppContext);

  const isAr = lang === "ar";
  const navigate = useNavigate();

  const [jobs, setJobs] = useState({});
  const [
    activeDownloadsCount,
    setActiveDownloadsCount,
  ] = useState(0);

  const [error, setError] = useState("");
  const [
    loadingState,
    setLoadingState,
  ] = useState(true);

  const [
    quranAyahs,
    setQuranAyahs,
  ] = useState([]);

  const [
    storageInfo,
    setStorageInfo,
  ] = useState({
    usage: 0,
    quota: 0,
  });

  const title = isAr
    ? "الصوتيات"
    : "Audio Library";

  const description = isAr
    ? "إدارة وتحميل القرآن الكريم كاملًا للاستماع بدون إنترنت"
    : "Manage and download complete Quran for offline listening";

  const refreshStorageInfo = async () => {
    try {
      if (!navigator.storage?.estimate) {
        return;
      }

      const estimate =
        await navigator.storage.estimate();

      setStorageInfo({
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      });
    } catch {}
  };

  useEffect(() => {
    const unsubscribe =
      audioDownloadManager.subscribe(
        (snapshot) => {
          setJobs(snapshot.jobs);
          setActiveDownloadsCount(
            snapshot.activeDownloadsCount
          );
        }
      );

    refreshStorageInfo();

    return unsubscribe;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const applyAyahs = (ayahs) => {
      if (cancelled) return;

      setQuranAyahs(ayahs);

      audioDownloadManager.initializeReciters(
        reciters.map(
          (reciter) => reciter.id
        ),
        ayahs.length
      );

      audioDownloadManager.setQuranTotal(
        ayahs.length
      );
    };

    const loadQuran = async () => {
      try {
        const cached =
          localStorage.getItem(
            "smart_search_quran_ar"
          );

        if (cached) {
          const parsed =
            JSON.parse(cached);

          const ayahs =
            parsed.flatMap(
              (surah) =>
                (
                  surah.ayahs || []
                ).map(
                  (ayah) => ({
                    number:
                      ayah.number,
                    numberInSurah:
                      ayah.numberInSurah,
                    surahNumber:
                      surah.number,
                  })
                )
            );

          if (ayahs.length > 6000) {
            applyAyahs(ayahs);
            return;
          }
        }

        const response =
          await axios.get(
            "https://api.alquran.cloud/v1/quran/quran-simple",
            {
              timeout: 20000,
            }
          );

        const surahs =
          response.data?.data?.surahs ||
          [];

        const ayahs =
          surahs.flatMap(
            (surah) =>
              (
                surah.ayahs || []
              ).map(
                (ayah) => ({
                  number:
                    ayah.number,
                  numberInSurah:
                    ayah.numberInSurah,
                  surahNumber:
                    surah.number,
                })
              )
          );

        if (!cancelled) {
          localStorage.setItem(
            "smart_search_quran_ar",
            JSON.stringify(surahs)
          );

          applyAyahs(ayahs);
        }
      } catch {
        if (!cancelled) {
          setError(
            isAr
              ? "تعذر تجهيز بيانات المصحف للتحميل."
              : "Couldn't prepare Quran data for download."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingState(false);
        }
      }
    };

    loadQuran();

    return () => {
      cancelled = true;
    };
  }, [isAr]);

  const downloadedCount = useMemo(
    () =>
      reciters.filter(
        (reciter) =>
          jobs[reciter.id]?.status ===
            "complete" ||
          localStorage.getItem(
            fullKey(reciter.id)
          ) === "true"
      ).length,
    [jobs]
  );

  const pauseReciter = (reciterId) => {
    audioDownloadManager.pause(
      reciterId
    );
  };

  const downloadReciter = async (
    reciter
  ) => {
    try {
      setError("");

      await audioDownloadManager.start(
        reciter,
        quranAyahs
      );

      await refreshStorageInfo();
    } catch (err) {
      if (err?.message === "offline") {
        setError(
          isAr
            ? "أنت غير متصل بالإنترنت."
            : "You are offline."
        );
        return;
      }

      if (
        err?.message === "max-active"
      ) {
        setError(
          isAr
            ? "يمكن تحميل قارئين في نفس الوقت كحد أقصى."
            : "You can download up to two reciters at the same time."
        );
        return;
      }

      if (err?.message === "quota") {
        setError(
          isAr
            ? "مساحة التخزين غير كافية. احذف بعض التحميلات ثم حاول مرة أخرى."
            : "Not enough storage. Delete some downloads and try again."
        );
        return;
      }

      if (
        err?.message === "unavailable"
      ) {
        setError(
          isAr
            ? "لا يمكن بدء التحميل حالياً."
            : "Download cannot start right now."
        );
        return;
      }

      setError(
        isAr
          ? "حدث خطأ أثناء تحميل الصوتيات."
          : "An error occurred while downloading audio."
      );
    }
  };

  const deleteReciter = async (
    reciter
  ) => {
    try {
      await audioDownloadManager.remove(
        reciter.id
      );

      await refreshStorageInfo();
    } catch {
      setError(
        isAr
          ? "تعذر حذف الصوتيات."
          : "Couldn't delete audio."
      );
    }
  };

  const freeStorage = Math.max(
    storageInfo.quota -
      storageInfo.usage,
    0
  );

  return (
    <div
      className={
        isDrawer
          ? "h-full min-h-0 flex flex-col overflow-hidden p-4"
          : "max-w-3xl mx-auto p-4 md:p-6 pt-3 md:pt-6 pb-32"
      }
      dir={
        isAr
          ? "rtl"
          : "ltr"
      }
    >
      <div className="flex items-center justify-between gap-3 mb-5 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Volume2
              size={22}
              className={
                isDarkMode
                  ? "text-[#E5C158]"
                  : "text-[#D4AF37]"
              }
            />

            <h1
              className={`text-xl md:text-2xl font-bold truncate ${
                isDarkMode
                  ? "text-[#E5C158]"
                  : "text-[#D4AF37]"
              }`}
            >
              {title}
            </h1>
          </div>

          <p
            className={`text-xs mt-1 truncate ${
              isDarkMode
                ? "text-gray-400"
                : "text-gray-500"
            }`}
          >
            {description}
          </p>
        </div>

        <button
          onClick={
            onClose
              ? onClose
              : () => navigate(-1)
          }
          className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center border shadow-sm transition-all ${
            isDarkMode
              ? "bg-gray-800 border-gray-700 text-[#E5C158] hover:bg-gray-700"
              : "bg-white border-[#F0EBE1] text-[#D4AF37] hover:bg-gray-50"
          }`}
          title={
            isAr
              ? "رجوع"
              : "Back"
          }
        >
          {isDrawer ? (
            <X size={20} />
          ) : (
            <ArrowLeft size={19} />
          )}
        </button>
      </div>

      <div
        className={`rounded-[2rem] border p-4 mb-4 shrink-0 ${
          isDarkMode
            ? "bg-gray-800/70 border-gray-700"
            : "bg-white border-[#F0EBE1]"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                isDarkMode
                  ? "bg-[#E5C158]/10 text-[#E5C158]"
                  : "bg-[#D4AF37]/10 text-[#D4AF37]"
              }`}
            >
              <CloudDownload
                size={22}
              />
            </div>

            <div className="min-w-0">
              <h2 className="font-bold text-sm md:text-base">
                {isAr
                  ? "إدارة التحميلات"
                  : "Download Manager"}
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                {isAr
                  ? `${downloadedCount} مكتمل • ${activeDownloadsCount}/2 جاري التحميل`
                  : `${downloadedCount} complete • ${activeDownloadsCount}/2 downloading`}
              </p>

              {storageInfo.quota >
                0 && (
                <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                  <HardDrive
                    size={11}
                  />

                  <span>
                    {isAr
                      ? `المتاح للتطبيق تقريبًا ${formatBytes(
                          freeStorage
                        )}`
                      : `About ${formatBytes(
                          freeStorage
                        )} available`}
                  </span>
                </p>
              )}
            </div>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${
              isDarkMode
                ? "bg-gray-900 text-[#E5C158]"
                : "bg-[#FDFBF7] text-[#D4AF37]"
            }`}
          >
            {reciters.length}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl p-3 text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
          <WifiOff
            size={18}
            className="shrink-0 mt-0.5"
          />

          <span className="flex-1">
            {error}
          </span>

          <button
            onClick={() =>
              setError("")
            }
            className="shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {loadingState ? (
        <div
          className={`py-16 flex flex-col items-center justify-center gap-3 ${
            isDarkMode
              ? "text-gray-400"
              : "text-gray-500"
          }`}
        >
          <Loader2
            size={28}
            className="animate-spin"
          />

          <span className="text-sm font-bold">
            {isAr
              ? "جاري تجهيز الصوتيات..."
              : "Preparing audio library..."}
          </span>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 pr-1 pb-4 scrollbar-thin">
          {reciters.map(
            (reciter) => {
              const job =
                jobs[
                  reciter.id
                ] || {};

              const isDownloaded =
                job.status ===
                "complete";

              const isPreparing =
                job.status ===
                "preparing";

              const isDownloading =
                job.status ===
                "downloading";

              const isPaused =
                job.status ===
                  "paused" &&
                !isDownloaded;

              const currentProgress =
                isDownloaded
                  ? 100
                  : job.progress ||
                    0;

              const downloadedBytes =
                job.downloadedBytes ||
                0;

              const estimatedTotalBytes =
                job.estimatedTotalBytes ||
                0;

              const canStart =
                isDownloading ||
                activeDownloadsCount <
                  2;

              return (
                <div
                  key={
                    reciter.id
                  }
                  className={`rounded-[1.7rem] border p-4 shadow-sm transition-all ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-[#F0EBE1]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        isDownloaded
                          ? "bg-green-500/10 text-green-500"
                          : isPreparing ||
                            isDownloading
                          ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                          : isDarkMode
                          ? "bg-gray-900 text-[#E5C158]"
                          : "bg-[#FDFBF7] text-[#D4AF37]"
                      }`}
                    >
                      {isDownloaded ? (
                        <CheckCircle
                          size={22}
                        />
                      ) : isPreparing ||
                        isDownloading ? (
                        <Loader2
                          size={21}
                          className="animate-spin"
                        />
                      ) : (
                        <Volume2
                          size={21}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3
                        className={`font-bold text-sm md:text-base truncate ${
                          isDarkMode
                            ? "text-gray-100"
                            : "text-gray-800"
                        }`}
                      >
                        {isAr
                          ? reciter.nameAr
                          : reciter.nameEn}
                      </h3>

                      <p className="text-[11px] text-gray-500 mt-1">
                        {isDownloaded
                          ? isAr
                            ? "القرآن كاملًا متاح بدون إنترنت"
                            : "Complete Quran available offline"
                          : isPreparing
                          ? isAr
                            ? "جاري تجهيز التحميل..."
                            : "Preparing download..."
                          : isDownloading
                          ? isAr
                            ? `جاري التحميل • ${currentProgress}%`
                            : `Downloading • ${currentProgress}%`
                          : isPaused
                          ? isAr
                            ? `متوقف مؤقتًا • ${currentProgress}%`
                            : `Paused • ${currentProgress}%`
                          : isAr
                          ? "غير محمل"
                          : "Not downloaded"}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isDownloaded ? (
                        <button
                          onClick={() =>
                            deleteReciter(
                              reciter
                            )
                          }
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors"
                          title={
                            isAr
                              ? "حذف"
                              : "Delete"
                          }
                        >
                          <Trash2
                            size={18}
                          />
                        </button>
                      ) : isPreparing ||
                        isDownloading ? (
                        <button
                          onClick={() =>
                            pauseReciter(
                              reciter.id
                            )
                          }
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            isDarkMode
                              ? "bg-gray-900 text-[#E5C158]"
                              : "bg-[#FDFBF7] text-[#D4AF37]"
                          }`}
                          title={
                            isAr
                              ? "إيقاف مؤقت"
                              : "Pause"
                          }
                        >
                          <Pause
                            size={18}
                          />
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            downloadReciter(
                              reciter
                            )
                          }
                          disabled={
                            !canStart ||
                            quranAyahs.length ===
                              0
                          }
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            isDarkMode
                              ? "bg-[#E5C158] text-gray-900 disabled:opacity-40"
                              : "bg-[#D4AF37] text-white disabled:opacity-40"
                          }`}
                          title={
                            isPaused
                              ? isAr
                                ? "استكمال التحميل"
                                : "Resume download"
                              : isAr
                              ? "تحميل القرآن كاملًا"
                              : "Download complete Quran"
                          }
                        >
                          {isPaused ? (
                            <Play
                              size={18}
                            />
                          ) : (
                            <Download
                              size={18}
                            />
                          )}
                        </button>
                      )}

                      {isPaused &&
                        currentProgress >
                          0 && (
                          <button
                            onClick={() =>
                              deleteReciter(
                                reciter
                              )
                            }
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors"
                            title={
                              isAr
                                ? "حذف التحميل الجزئي"
                                : "Delete partial download"
                            }
                          >
                            <Trash2
                              size={16}
                            />
                          </button>
                        )}
                    </div>
                  </div>

                  {(isPreparing ||
                    isDownloading ||
                    isPaused) &&
                    currentProgress >
                      0 && (
                      <div className="mt-3">
                        <div
                          className={`h-2 rounded-full overflow-hidden ${
                            isDarkMode
                              ? "bg-gray-900"
                              : "bg-gray-100"
                          }`}
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isPaused
                                ? "bg-amber-500"
                                : "bg-[#D4AF37]"
                            }`}
                            style={{
                              width: `${currentProgress}%`,
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div
                            className={`rounded-xl p-2.5 ${
                              isDarkMode
                                ? "bg-gray-900/70"
                                : "bg-gray-50"
                            }`}
                          >
                            <div
                              className={`flex items-center gap-1.5 text-[10px] text-gray-500 mb-1 ${
                                isAr
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              <HardDrive
                                size={12}
                              />

                              <span>
                                {isAr
                                  ? "الحجم"
                                  : "Size"}
                              </span>
                            </div>

                            <div
                              className={
                                isAr
                                  ? "text-right"
                                  : "text-left"
                              }
                            >
                              <span
                                dir="ltr"
                                className="inline-flex items-center gap-1 text-[11px] font-bold whitespace-nowrap"
                              >
                                <span>
                                  {downloadedBytes >
                                  0
                                    ? formatBytes(
                                        downloadedBytes
                                      )
                                    : "—"}
                                </span>

                                {estimatedTotalBytes >
                                  0 && (
                                  <span className="text-gray-500 font-normal">
                                    / ~
                                    {formatBytes(
                                      estimatedTotalBytes
                                    )}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`rounded-xl p-2.5 ${
                              isDarkMode
                                ? "bg-gray-900/70"
                                : "bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1">
                              <Clock3
                                size={12}
                              />

                              <span>
                                {isAr
                                  ? "الوقت المتبقي"
                                  : "Time left"}
                              </span>
                            </div>

                            <p className="text-[11px] font-bold">
                              {isPaused
                                ? isAr
                                  ? "متوقف مؤقتًا"
                                  : "Paused"
                                : isPreparing
                                ? isAr
                                  ? "جارٍ التجهيز..."
                                  : "Preparing..."
                                : formatEta(
                                    job.etaSeconds,
                                    isAr
                                  )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 text-[10px] font-bold text-gray-500 gap-2">
                          <span>
                            {isAr
                              ? `${
                                  job.completed ||
                                  0
                                } من ${
                                  job.total ||
                                  quranAyahs.length
                                } آية`
                              : `${
                                  job.completed ||
                                  0
                                } of ${
                                  job.total ||
                                  quranAyahs.length
                                } ayahs`}
                          </span>

                          <div
                            className="flex items-center gap-2 shrink-0"
                            dir="ltr"
                          >
                            {isDownloading &&
                              job.speedBps >
                                0 && (
                                <span>
                                  {formatSpeed(
                                    job.speedBps
                                  )}
                                </span>
                              )}

                            <span>
                              {
                                currentProgress
                              }
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
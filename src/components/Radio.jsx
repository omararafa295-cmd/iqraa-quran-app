import { useState, useEffect, useRef, useContext, useMemo } from "react";
import axios from "axios";
import {
  Radio as RadioIcon,
  PlayCircle,
  PauseCircle,
  Search,
  Activity,
  Star,
  LoaderCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { AppContext } from "../App";

export default function Radio() {
  const {
    isDarkMode,
    lang,
    isPlaying: isQuranPlaying,
    setIsPlaying: setIsQuranPlaying,
    isRadioPlaying,
    setIsRadioPlaying,
  } = useContext(AppContext);

  const isAr = lang === "ar";

  const [radios, setRadios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRadio, setActiveRadio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLetter, setActiveLetter] = useState(null);
  const [streamStatus, setStreamStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const audioRef = useRef(null);
  const playRequestIdRef = useRef(0);
  const retryTimerRef = useRef(null);
  const retryCountRef = useRef(0);

  const intentionalPauseRef = useRef(false);

  const MAX_RETRIES = 4;
  const RETRY_DELAY = 1500;

  const t = {
    title: isAr ? "إذاعات القرآن الكريم" : "Quran Radio",
    search: isAr
      ? "ابحث عن إذاعة أو قارئ..."
      : "Search for a radio or reciter...",
    loading: isAr ? "جاري تحميل الإذاعات..." : "Loading radios...",
    nowPlaying: isAr ? "يتم التشغيل الآن" : "Now Playing",
    noResult: isAr ? "لا توجد إذاعة بهذا الاسم" : "No radio found",
    featured: isAr ? "إذاعات مميزة" : "Featured Stations",
    reciters: isAr ? "إذاعات القراء" : "Reciter Stations",
    all: isAr ? "الكل" : "All",

    connecting: isAr ? "جاري الاتصال..." : "Connecting...",
    reconnecting: isAr ? "جاري إعادة الاتصال..." : "Reconnecting...",
    paused: isAr ? "متوقف " : "Paused",
    streamError: isAr ? "تعذر تشغيل الإذاعة" : "Unable to play radio",
    retry: isAr ? "إعادة المحاولة" : "Retry",
  };

  const featuredKeywords = [
    "رمضان",
    "الأطفال",
    "تجويد",
    "كامل",
    "القرآن الكريم",
    "تلاوات متنوعة",
    "قصار السور",
  ];

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const setStoppedState = () => {
    setIsPlaying(false);
    setIsRadioPlaying(false);
  };

  const stopCurrentAudio = () => {
    clearRetryTimer();

    const audio = audioRef.current;
    if (!audio) return;

    intentionalPauseRef.current = true;

    try {
      audio.pause();
    } catch (error) {
      console.warn("Audio pause error:", error);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setLoading(true);

    axios
      .get(
        `https://mp3quran.net/api/v3/radios?language=${isAr ? "ar" : "eng"}`,
        {
          signal: controller.signal,
        }
      )
      .then((res) => {
        if (cancelled) return;

        const sortedRadios = (res.data.radios || []).sort((a, b) =>
          a.name.localeCompare(b.name, isAr ? "ar" : "en")
        );

        setRadios(sortedRadios);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.code === "ERR_CANCELED") return;

        console.error("Error fetching radios:", err);
        setRadios([]);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isAr]);

  useEffect(() => {
    return () => {
      playRequestIdRef.current += 1;
      clearRetryTimer();

      const audio = audioRef.current;

      if (audio) {
        intentionalPauseRef.current = true;

        try {
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
        } catch (error) {
          console.warn("Audio cleanup error:", error);
        }
      }

      setIsPlaying(false);
      setIsRadioPlaying(false);
    };
  }, [setIsRadioPlaying]);

  useEffect(() => {
    if (!isQuranPlaying) return;

    if (isPlaying || streamStatus === "loading" || streamStatus === "playing") {
      playRequestIdRef.current += 1;
      clearRetryTimer();

      stopCurrentAudio();

      setIsPlaying(false);
      setIsRadioPlaying(false);
      setStreamStatus("paused");
    }
  }, [
    isQuranPlaying,
    isPlaying,
    streamStatus,
    setIsRadioPlaying,
  ]);
  const cleanName = (name) =>
    name
      .replace(/^إذاعة\s+/, "")
      .replace(/^Radio\s+/i, "")
      .trim();

  const { featured, byLetter, letters } = useMemo(() => {
    const featuredList = [];
    const reciterList = [];

    radios.forEach((radio) => {
      const isFeatured = featuredKeywords.some((kw) =>
        radio.name.includes(kw)
      );

      if (isFeatured) {
        featuredList.push(radio);
      } else {
        reciterList.push(radio);
      }
    });

    const grouped = {};

    reciterList.forEach((radio) => {
      const clean = cleanName(radio.name);
      const firstLetter = clean.charAt(0).toUpperCase();

      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }

      grouped[firstLetter].push(radio);
    });

    const sortedLetters = Object.keys(grouped).sort((a, b) =>
      a.localeCompare(b, isAr ? "ar" : "en")
    );

    return {
      featured: featuredList,
      byLetter: grouped,
      letters: sortedLetters,
    };
  }, [radios, isAr]);


  const playRadio = async (radio, requestId) => {
    const audio = audioRef.current;

    if (!audio || requestId !== playRequestIdRef.current) {
      return;
    }

    if (!radio?.url) {
      setStreamStatus("error");
      setErrorMessage(t.streamError);
      setStoppedState();
      return;
    }

    setStreamStatus("loading");
    setErrorMessage("");

    try {
      intentionalPauseRef.current = false;

      audio.pause();
      const streamUrl = radio.url.trim();

      audio.src = streamUrl;
      audio.load();

      await audio.play();

      if (requestId !== playRequestIdRef.current) {
        try {
          audio.pause();
        } catch (_) {}

        return;
      }

      retryCountRef.current = 0;
      setRetryCount(0);
      setStreamStatus("playing");
      setIsPlaying(true);
      setIsRadioPlaying(true);
    } catch (error) {
      if (requestId !== playRequestIdRef.current) {
        return;
      }

      if (error?.name === "AbortError") {
        return;
      }

      console.error("Radio play error:", error);

      setIsPlaying(false);
      setIsRadioPlaying(false);
      scheduleReconnect(radio, requestId);
    }
  };


  const scheduleReconnect = (radio, requestId) => {
    clearRetryTimer();

    if (requestId !== playRequestIdRef.current) {
      return;
    }

    const next = retryCountRef.current + 1;

    if (next > MAX_RETRIES) {
      setStreamStatus("error");
      setErrorMessage(t.streamError);
      setRetryCount(retryCountRef.current);
      return;
    }

    retryCountRef.current = next;
    setRetryCount(next);
    setStreamStatus("loading");

    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;

      if (requestId !== playRequestIdRef.current) {
        return;
      }

      playRadio(radio, requestId);
    }, RETRY_DELAY);
  };

  const retryCurrentRadio = async () => {
    if (!activeRadio) return;

    clearRetryTimer();

    const requestId = ++playRequestIdRef.current;

    retryCountRef.current = 0;
    setRetryCount(0);
    setErrorMessage("");

    await playRadio(activeRadio, requestId);
  };

  const togglePlay = async (radio) => {
    if (!radio) return;

    if (isQuranPlaying) {
      setIsQuranPlaying(false);
    }

    if (activeRadio?.id === radio.id) {
      if (isPlaying || streamStatus === "playing") {
        // Intentional user pause.
        playRequestIdRef.current += 1;
        clearRetryTimer();

        intentionalPauseRef.current = true;

        if (audioRef.current) {
          try {
            audioRef.current.pause();
          } catch (error) {
            console.warn("Audio pause error:", error);
          }
        }

        setIsPlaying(false);
        setIsRadioPlaying(false);
        setStreamStatus("paused");
        return;
      }

      const requestId = ++playRequestIdRef.current;

      setRetryCount(0);
      setErrorMessage("");

      await playRadio(radio, requestId);
      return;
    }

    const requestId = ++playRequestIdRef.current;

    clearRetryTimer();

    intentionalPauseRef.current = true;

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      } catch (error) {
        console.warn("Previous stream cleanup error:", error);
      }
    }

    setActiveRadio(radio);
    retryCountRef.current = 0;
    setRetryCount(0);
    setErrorMessage("");
    setStreamStatus("loading");
    setIsPlaying(false);
    setIsRadioPlaying(false);

    await playRadio(radio, requestId);
  };

  const handleAudioPlay = () => {
    if (!audioRef.current) return;

    // Only update state after the browser actually starts playback.
    setStreamStatus("playing");
    setIsPlaying(true);
    setIsRadioPlaying(true);
    setErrorMessage("");
  };

  const handleAudioPause = () => {
    // Don't let an old pause event overwrite a newer play request.
    if (!intentionalPauseRef.current) {
      setIsPlaying(false);
      setIsRadioPlaying(false);

      if (streamStatus === "playing") {
        setStreamStatus("paused");
      }
    }

    intentionalPauseRef.current = false;
  };

  const handleAudioError = () => {
    const currentRadio = activeRadio;

    if (!currentRadio) {
      setStoppedState();
      setStreamStatus("error");
      return;
    }

    console.error("Audio stream error:", {
      station: currentRadio.name,
      url: currentRadio.url,
    });

    setIsPlaying(false);
    setIsRadioPlaying(false);

    const requestId = playRequestIdRef.current;

    scheduleReconnect(currentRadio, requestId);
  };

  const handleAudioWaiting = () => {
    // waiting/stalled is normal for live streams.
    if (isPlaying) {
      setStreamStatus("loading");
    }
  };

  const handleAudioStalled = () => {
    if (!activeRadio || !isPlaying) return;

    const requestId = playRequestIdRef.current;

    // Give the browser a short chance to recover by itself.
    clearRetryTimer();

    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;

      if (requestId !== playRequestIdRef.current) return;

      const audio = audioRef.current;
      if (!audio) return;

      if (audio.paused || audio.readyState < 2) {
        scheduleReconnect(activeRadio, requestId);
      }
    }, 2500);
  };

  const filteredRadios = searchQuery
    ? radios.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const RadioCard = ({ radio }) => {
    const isActive = activeRadio?.id === radio.id;

    const isCurrentLoading =
      isActive &&
      (streamStatus === "loading" || streamStatus === "connecting");

    const isCurrentError = isActive && streamStatus === "error";

    return (
      <div
        key={radio.id}
        onClick={() => togglePlay(radio)}
        className={`flex items-center justify-between p-3 rounded-2xl shadow-sm border cursor-pointer transition-all duration-200 transform hover:scale-[1.01] ${
          isActive
            ? isDarkMode
              ? "bg-gray-800 border-[#E5C158] shadow-[#E5C158]/10"
              : "bg-[#FDFBF7] border-[#D4AF37] shadow-[#D4AF37]/10"
            : isDarkMode
            ? "bg-gray-800 border-gray-700 hover:border-[#E5C158]"
            : "bg-white border-[#F0EBE1] hover:border-[#D4AF37]"
        }`}
      >
        <div
          className={`flex items-center gap-3 w-full truncate ${
            !isAr && "flex-row-reverse"
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay(radio);
            }}
            disabled={isCurrentLoading}
            className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full transition-colors ${
              isActive
                ? "bg-[#D4AF37] text-white shadow-md"
                : isDarkMode
                ? "bg-gray-900 text-[#E5C158]"
                : "bg-[#FDFBF7] text-[#D4AF37]"
            } ${isCurrentLoading ? "opacity-80 cursor-wait" : ""}`}
          >
            {isCurrentLoading ? (
              <LoaderCircle size={20} className="animate-spin" />
            ) : isCurrentError ? (
              <RefreshCw size={20} />
            ) : isActive && isPlaying ? (
              <PauseCircle size={20} />
            ) : (
              <PlayCircle size={20} />
            )}
          </button>

          <h3
            className={`font-bold text-sm md:text-base truncate w-full ${
              isAr ? "text-right" : "text-left font-sans"
            } ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
          >
            {radio.name}
          </h3>
        </div>

        {isActive && isPlaying && (
          <Activity
            size={18}
            className={`shrink-0 mx-2 animate-pulse ${
              isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"
            }`}
          />
        )}

        {isCurrentLoading && (
          <LoaderCircle
            size={18}
            className={`shrink-0 mx-2 animate-spin ${
              isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"
            }`}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className={`flex justify-center items-center min-h-screen font-bold text-xl ${
          !isAr && "font-sans"
        } ${isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"}`}
      >
        {t.loading}
      </div>
    );
  }
  return (
    <div
      className="max-w-4xl mx-auto px-4 md:px-6 pt-2 md:pt-6 pb-32"
      dir={isAr ? "rtl" : "ltr"}
    >
      <audio
        ref={audioRef}
        preload="none"
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
        onEnded={() => {
          setIsPlaying(false);
          setIsRadioPlaying(false);
          setStreamStatus("paused");
        }}
        onError={handleAudioError}
        onWaiting={handleAudioWaiting}
        onStalled={handleAudioStalled}
      />

      <div className="flex items-center justify-center gap-3 mb-8 mt-4">
        <h2
          className={`text-3xl font-bold ${
            isAr ? "font-quran" : "font-serif tracking-wide"
          } ${isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"}`}
        >
          {t.title}
        </h2>
      </div>

      <div className="relative mb-6 max-w-xl mx-auto">
        <input
          type="text"
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full p-4 ${
            isAr ? "pr-12" : "pl-12"
          } rounded-2xl border focus:outline-none shadow-sm transition-colors ${
            !isAr && "font-sans"
          } ${
            isDarkMode
              ? "bg-gray-800 border-gray-700 text-gray-200 focus:border-[#E5C158]"
              : "bg-white border-[#F0EBE1] text-gray-700 focus:border-[#D4AF37]"
          }`}
        />

        <Search
          className={`absolute ${
            isAr ? "right-4" : "left-4"
          } top-1/2 -translate-y-1/2 text-gray-400`}
          size={20}
        />
      </div>

      {searchQuery ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredRadios.length > 0 ? (
            filteredRadios.map((radio) => (
              <RadioCard key={radio.id} radio={radio} />
            ))
          ) : (
            <div
              className={`col-span-full text-center py-10 font-medium ${
                !isAr && "font-sans"
              } text-gray-500`}
            >
              {t.noResult}
            </div>
          )}
        </div>
      ) : (
        <>
          <div
            className={`flex flex-wrap gap-2 mb-6 justify-center ${
              !isAr && "font-sans"
            }`}
          >
            <button
              onClick={() => setActiveLetter(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-bold border transition-colors ${
                activeLetter === null
                  ? "bg-[#D4AF37] text-white border-[#D4AF37]"
                  : isDarkMode
                  ? "border-gray-700 text-gray-300"
                  : "border-[#F0EBE1] text-gray-600"
              }`}
            >
              {t.all}
            </button>

            {letters.map((letter) => (
              <button
                key={letter}
                onClick={() => setActiveLetter(letter)}
                className={`w-9 h-9 rounded-full text-sm font-bold border transition-colors ${
                  activeLetter === letter
                    ? "bg-[#D4AF37] text-white border-[#D4AF37]"
                    : isDarkMode
                    ? "border-gray-700 text-gray-300 hover:border-[#E5C158]"
                    : "border-[#F0EBE1] text-gray-600 hover:border-[#D4AF37]"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>

          {featured.length > 0 && !activeLetter && (
            <div className="mb-8">
              <div
                className={`flex items-center gap-2 mb-3 px-1 ${
                  !isAr && "font-sans"
                }`}
              >
                <Star
                  size={18}
                  className={
                    isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"
                  }
                />

                <h3
                  className={`font-bold text-lg ${
                    isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"
                  }`}
                >
                  {t.featured}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {featured.map((radio) => (
                  <RadioCard key={radio.id} radio={radio} />
                ))}
              </div>
            </div>
          )}

          <div>
            {!activeLetter && (
              <div
                className={`flex items-center gap-2 mb-3 px-1 ${
                  !isAr && "font-sans"
                }`}
              >
                <h3
                  className={`font-bold text-lg ${
                    isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"
                  }`}
                >
                  {t.reciters}
                </h3>
              </div>
            )}

            {(activeLetter ? [activeLetter] : letters).map((letter) => (
              <div key={letter} className="mb-6">
                <div
                  className={`text-sm font-bold mb-2 px-1 ${
                    isDarkMode ? "text-gray-400" : "text-gray-400"
                  }`}
                >
                  {letter}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {byLetter[letter].map((radio) => (
                    <RadioCard key={radio.id} radio={radio} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeRadio && (
        <div
          className={`fixed bottom-25 left-3 right-3 md:bottom-25 md:left-1/2 md:-translate-x-1/2 md:w-[450px] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] z-[100] transition-colors border backdrop-blur-md ${
            isDarkMode
              ? "bg-gray-900/95 border-gray-700"
              : "bg-white/95 border-[#F0EBE1]"
          }`}
        >
          <div
            className={`px-4 py-3 flex items-center justify-between ${
              !isAr && "flex-row-reverse"
            }`}
          >
            <div
              className={`flex items-center gap-3 w-3/4 ${
                !isAr && "flex-row-reverse"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#D4AF37] dark:bg-[#E5C158] flex items-center justify-center text-white dark:text-gray-900 shrink-0 shadow-md">
                <RadioIcon size={20} />
              </div>

              <div
                className={`overflow-hidden ${
                  isAr ? "text-right" : "text-left"
                }`}
              >
                <p
                  className={`text-[10px] font-bold uppercase ${
                    isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"
                  }`}
                >
                  {streamStatus === "loading"
                    ? retryCount > 0
                      ? t.reconnecting
                      : t.connecting
                    : streamStatus === "error"
                    ? t.streamError
                    : streamStatus === "paused"
                    ? t.paused
                    : t.nowPlaying}
                </p>

                <p
                  className={`text-sm font-bold truncate ${
                    isAr ? "" : "font-sans"
                  } ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  {activeRadio.name}
                </p>

                {streamStatus === "loading" && retryCount > 0 && (
                  <p
                    className={`text-[10px] mt-0.5 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {retryCount}/{MAX_RETRIES}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {streamStatus === "error" && (
                <button
                  onClick={retryCurrentRadio}
                  title={t.retry}
                  className={`p-2 rounded-full transition-all ${
                    isDarkMode
                      ? "text-[#E5C158] hover:bg-gray-800"
                      : "text-[#D4AF37] hover:bg-[#FDFBF7]"
                  }`}
                >
                  <RefreshCw size={20} />
                </button>
              )}

              {streamStatus === "error" ? (
                <AlertCircle
                  size={22}
                  className={
                    isDarkMode ? "text-red-400" : "text-red-500"
                  }
                />
              ) : streamStatus === "loading" ? (
                <LoaderCircle
                  size={24}
                  className={`animate-spin ${
                    isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"
                  }`}
                />
              ) : (
                <button
                  onClick={() => togglePlay(activeRadio)}
                  className={`p-2 rounded-full border-2 transition-all ${
                    isDarkMode
                      ? "border-[#E5C158] text-[#E5C158] hover:bg-[#E5C158] hover:text-gray-900"
                      : "border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white"
                  }`}
                >
                  {isPlaying ? (
                    <PauseCircle size={24} />
                  ) : (
                    <PlayCircle size={24} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
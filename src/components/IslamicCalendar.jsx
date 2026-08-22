import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    useContext,
} from "react";
import axios from "axios";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCw,
    Sparkles,
    X,
} from "lucide-react";
import { AppContext } from "../App";

const CACHE_TTL =
    24 * 60 * 60 * 1000;

const holidayNamesAr = {
    "Islamic New Year":
        "رأس السنة الهجرية",
    Ashura:
        "يوم عاشوراء",
    "Mawlid al-Nabi":
        "المولد النبوي",
    "Lailat-ul-Miraj":
        "ليلة الإسراء والمعراج",
    "Lailat-ul-Bara'at":
        "ليلة النصف من شعبان",
    "1st Day of Ramadan":
        "بداية شهر رمضان",
    "Laylat al-Qadr":
        "ليلة القدر",
    "Eid-ul-Fitr":
        "عيد الفطر",
    Arafa:
        "يوم عرفة",
    "Eid-ul-Adha":
        "عيد الأضحى",
};

const normalizeHoliday = (
    name,
    isAr
) => {
    if (!isAr) {
        return name;
    }

    return (
        holidayNamesAr[name] ||
        name
    );
};

const pad = (value) =>
    String(value).padStart(
        2,
        "0"
    );

const cacheKey = (
    year,
    month
) =>
    `iqraa_islamic_calendar_${year}_${month}`;

const parseCached = (
    year,
    month
) => {
    try {
        const raw =
            localStorage.getItem(
                cacheKey(
                    year,
                    month
                )
            );

        if (!raw) {
            return null;
        }

        const parsed =
            JSON.parse(raw);

        if (
            !Array.isArray(
                parsed?.data
            )
        ) {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
};

const saveCached = (
    year,
    month,
    data
) => {
    try {
        localStorage.setItem(
            cacheKey(
                year,
                month
            ),
            JSON.stringify({
                data,
                savedAt:
                    Date.now(),
            })
        );
    } catch { }
};

const getHijriPart = (
    date,
    type,
    locale
) => {
    try {
        return new Intl.DateTimeFormat(
            locale,
            {
                calendar:
                    "islamic-umalqura",
                [type]:
                    type === "month"
                        ? "long"
                        : "numeric",
            }
        ).format(date);
    } catch {
        return new Intl.DateTimeFormat(
            locale,
            {
                calendar:
                    "islamic",
                [type]:
                    type === "month"
                        ? "long"
                        : "numeric",
            }
        ).format(date);
    }
};

const createFallbackMonth = (
    year,
    month,
    isAr
) => {
    const daysInMonth =
        new Date(
            year,
            month,
            0
        ).getDate();

    const locale =
        isAr
            ? "ar-EG"
            : "en-US";

    return Array.from(
        {
            length:
                daysInMonth,
        },
        (_, index) => {
            const day =
                index + 1;

            const date =
                new Date(
                    year,
                    month - 1,
                    day,
                    12,
                    0,
                    0
                );

            return {
                gregorian: {
                    day:
                        pad(day),

                    month: {
                        number:
                            month,

                        en:
                            new Intl.DateTimeFormat(
                                "en-US",
                                {
                                    month:
                                        "long",
                                }
                            ).format(
                                date
                            ),
                    },

                    year:
                        String(year),

                    weekday: {
                        en:
                            new Intl.DateTimeFormat(
                                "en-US",
                                {
                                    weekday:
                                        "long",
                                }
                            ).format(
                                date
                            ),
                    },

                    date:
                        `${pad(
                            day
                        )}-${pad(
                            month
                        )}-${year}`,
                },

                hijri: {
                    day:
                        getHijriPart(
                            date,
                            "day",
                            locale
                        ),

                    month: {
                        number:
                            null,

                        ar:
                            getHijriPart(
                                date,
                                "month",
                                "ar-EG"
                            ),

                        en:
                            getHijriPart(
                                date,
                                "month",
                                "en-US"
                            ),
                    },

                    year:
                        getHijriPart(
                            date,
                            "year",
                            locale
                        ),

                    holidays: [],
                },
            };
        }
    );
};

const getDateFromItem = (
    item
) => {
    const [
        day,
        month,
        year,
    ] = String(
        item?.gregorian
            ?.date || ""
    )
        .split("-")
        .map(Number);

    if (
        !day ||
        !month ||
        !year
    ) {
        return null;
    }

    return new Date(
        year,
        month - 1,
        day,
        12,
        0,
        0
    );
};

const isSameDate = (
    a,
    b
) =>
    a &&
    b &&
    a.getFullYear() ===
    b.getFullYear() &&
    a.getMonth() ===
    b.getMonth() &&
    a.getDate() ===
    b.getDate();

export default function IslamicCalendar({
    onClose,
}) {
    const {
        isDarkMode,
        lang,
    } = useContext(
        AppContext
    );

    const isAr =
        lang === "ar";

    const today =
        useMemo(
            () => new Date(),
            []
        );

    const [
        viewDate,
        setViewDate,
    ] = useState(
        () =>
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            )
    );

    const [
        days,
        setDays,
    ] = useState([]);

    const [
        selectedIndex,
        setSelectedIndex,
    ] = useState(null);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [
        usingFallback,
        setUsingFallback,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const year =
        viewDate.getFullYear();

    const month =
        viewDate.getMonth() +
        1;

    const loadMonth =
        useCallback(
            async (
                force = false
            ) => {
                const cached =
                    parseCached(
                        year,
                        month
                    );

                if (
                    cached?.data
                        ?.length
                ) {
                    setDays(
                        cached.data
                    );

                    setLoading(
                        false
                    );

                    setUsingFallback(
                        false
                    );

                    if (
                        !force &&
                        Date.now() -
                        Number(
                            cached.savedAt ||
                            0
                        ) <
                        CACHE_TTL
                    ) {
                        return;
                    }
                } else {
                    setLoading(
                        true
                    );
                }

                if (force) {
                    setRefreshing(
                        true
                    );
                }

                setError("");

                try {
                    const response =
                        await axios.get(
                            `https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`,
                            {
                                timeout:
                                    15000,
                            }
                        );

                    const data =
                        response.data
                            ?.data;

                    if (
                        !Array.isArray(
                            data
                        ) ||
                        !data.length
                    ) {
                        throw new Error(
                            "INVALID_CALENDAR"
                        );
                    }

                    setDays(data);

                    setUsingFallback(
                        false
                    );

                    saveCached(
                        year,
                        month,
                        data
                    );
                } catch {
                    if (
                        !cached?.data
                            ?.length
                    ) {
                        const fallback =
                            createFallbackMonth(
                                year,
                                month,
                                isAr
                            );

                        setDays(
                            fallback
                        );

                        setUsingFallback(
                            true
                        );
                    }

                    setError(
                        isAr
                            ? "تعذر تحديث التقويم من الإنترنت. يتم عرض التقويم المحفوظ أو التقريبي."
                            : "Couldn't refresh the calendar. Showing cached or approximate dates."
                    );
                } finally {
                    setLoading(
                        false
                    );

                    setRefreshing(
                        false
                    );
                }
            },
            [
                year,
                month,
                isAr,
            ]
        );

    useEffect(() => {
        setSelectedIndex(
            null
        );

        loadMonth();
    }, [loadMonth]);

    useEffect(() => {
        const handleKeyDown = (
            event
        ) => {
            if (
                event.key ===
                "Escape" &&
                onClose
            ) {
                onClose();
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [onClose]);

    const monthTitle =
        useMemo(() => {
            return new Intl.DateTimeFormat(
                isAr
                    ? "ar-EG"
                    : "en-US",
                {
                    month:
                        "long",
                    year:
                        "numeric",
                }
            ).format(
                viewDate
            );
        }, [
            viewDate,
            isAr,
        ]);

    const hijriTitle =
        useMemo(() => {
            if (
                !days.length
            ) {
                return "";
            }

            const first =
                days[0]?.hijri;

            const last =
                days[
                    days.length -
                    1
                ]?.hijri;

            if (
                !first ||
                !last
            ) {
                return "";
            }

            const firstMonth =
                isAr
                    ? first.month
                        ?.ar ||
                    first.month
                        ?.en
                    : first.month
                        ?.en ||
                    first.month
                        ?.ar;

            const lastMonth =
                isAr
                    ? last.month
                        ?.ar ||
                    last.month
                        ?.en
                    : last.month
                        ?.en ||
                    last.month
                        ?.ar;

            const firstYear =
                first.year || "";

            const lastYear =
                last.year || "";

            if (
                firstMonth ===
                lastMonth &&
                firstYear ===
                lastYear
            ) {
                return `${firstMonth} ${firstYear}`;
            }

            if (
                firstYear ===
                lastYear
            ) {
                return `${firstMonth} – ${lastMonth} ${firstYear}`;
            }

            return `${firstMonth} ${firstYear} – ${lastMonth} ${lastYear}`;
        }, [
            days,
            isAr,
        ]);

    const selectedDay =
        selectedIndex !==
            null
            ? days[
            selectedIndex
            ]
            : null;

    const selectedDate =
        selectedDay
            ? getDateFromItem(
                selectedDay
            )
            : null;

    const selectedHolidays =
        selectedDay?.hijri
            ?.holidays || [];

    const selectedGregorianText =
        useMemo(() => {
            if (
                !selectedDate
            ) {
                return "";
            }

            return new Intl.DateTimeFormat(
                isAr
                    ? "ar-EG"
                    : "en-US",
                {
                    weekday:
                        "long",
                    day:
                        "numeric",
                    month:
                        "long",
                    year:
                        "numeric",
                }
            ).format(
                selectedDate
            );
        }, [
            selectedDate,
            isAr,
        ]);

    const selectedHijriText =
        useMemo(() => {
            if (
                !selectedDay
            ) {
                return "";
            }

            const hijri =
                selectedDay.hijri;

            const monthName =
                isAr
                    ? hijri
                        ?.month?.ar ||
                    hijri
                        ?.month?.en
                    : hijri
                        ?.month?.en ||
                    hijri
                        ?.month?.ar;

            if (
                !hijri?.day ||
                !monthName ||
                !hijri?.year
            ) {
                return "";
            }

            return isAr
                ? `${hijri.day} ${monthName} ${hijri.year} هـ`
                : `${hijri.day} ${monthName} ${hijri.year} AH`;
        }, [
            selectedDay,
            isAr,
        ]);

    const firstDayOffset =
        useMemo(() => {
            if (
                !days.length
            ) {
                return 0;
            }

            const firstDate =
                getDateFromItem(
                    days[0]
                );

            if (
                !firstDate
            ) {
                return 0;
            }

            const weekStartsOn =
                isAr
                    ? 6
                    : 0;

            return (
                (firstDate.getDay() -
                    weekStartsOn +
                    7) %
                7
            );
        }, [
            days,
            isAr,
        ]);

    const weekdays =
        isAr
            ? [
                "س",
                "ح",
                "ن",
                "ث",
                "ر",
                "خ",
                "ج",
            ]
            : [
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
            ];

    const goPreviousMonth =
        () => {
            setViewDate(
                (current) =>
                    new Date(
                        current.getFullYear(),
                        current.getMonth() -
                        1,
                        1
                    )
            );
        };

    const goNextMonth =
        () => {
            setViewDate(
                (current) =>
                    new Date(
                        current.getFullYear(),
                        current.getMonth() +
                        1,
                        1
                    )
            );
        };

    useEffect(() => {
        if (
            !days.length
        ) {
            return;
        }

        if (
            year ===
            today.getFullYear() &&
            month ===
            today.getMonth() +
            1
        ) {
            const index =
                days.findIndex(
                    (item) =>
                        isSameDate(
                            getDateFromItem(
                                item
                            ),
                            today
                        )
                );

            if (
                index >= 0
            ) {
                setSelectedIndex(
                    index
                );

                return;
            }
        }

        setSelectedIndex(
            0
        );
    }, [
        days,
        year,
        month,
        today,
    ]);

    return (
        <div
            className="h-full min-h-0 flex flex-col overflow-hidden p-4"
            dir={
                isAr
                    ? "rtl"
                    : "ltr"
            }
        >
            <div className="flex items-start justify-between gap-3 mb-4 shrink-0">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <CalendarDays
                            size={22}
                            className={
                                isDarkMode
                                    ? "text-[#E5C158]"
                                    : "text-[#D4AF37]"
                            }
                        />

                        <h1
                            id="islamic-calendar-title"
                            className={`text-xl md:text-2xl font-bold ${isDarkMode
                                    ? "text-[#E5C158]"
                                    : "text-[#D4AF37]"
                                }`}
                        >
                            {isAr
                                ? "التقويم"
                                : "Calendar"}
                        </h1>
                    </div>

                    <p
                        className={`text-xs mt-1 ${isDarkMode
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                    >
                        {isAr
                            ? "الهجري والميلادي والمناسبات الإسلامية"
                            : "Hijri, Gregorian and Islamic occasions"}
                    </p>
                </div>

                <button
                    onClick={
                        onClose
                    }
                    className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center border shadow-sm transition-all ${isDarkMode
                            ? "bg-gray-800 border-gray-700 text-[#E5C158] hover:bg-gray-700"
                            : "bg-white border-[#F0EBE1] text-[#D4AF37] hover:bg-gray-50"
                        }`}
                    aria-label={
                        isAr
                            ? "إغلاق التقويم"
                            : "Close calendar"
                    }
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-4 scrollbar-thin">
                <div
                    className={`rounded-[1.75rem] border p-4 shadow-sm ${isDarkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-[#F0EBE1]"
                        }`}
                >
                    <div className="flex items-center justify-between gap-2">
                        <button
                            onClick={
                                goPreviousMonth
                            }
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode
                                    ? "bg-gray-900 text-[#E5C158] hover:bg-gray-700"
                                    : "bg-[#FDFBF7] text-[#D4AF37] hover:bg-gray-100"
                                }`}
                            aria-label={
                                isAr
                                    ? "الشهر السابق"
                                    : "Previous month"
                            }
                        >
                            {isAr ? (
                                <ChevronRight
                                    size={19}
                                />
                            ) : (
                                <ChevronLeft
                                    size={19}
                                />
                            )}
                        </button>

                        <div className="text-center min-w-0">
                            <h2
                                className={`font-bold text-base ${isDarkMode
                                        ? "text-gray-100"
                                        : "text-gray-800"
                                    }`}
                            >
                                {
                                    monthTitle
                                }
                            </h2>

                            <p
                                className={`text-xs mt-1 truncate ${isDarkMode
                                        ? "text-[#E5C158]"
                                        : "text-[#B18A17]"
                                    }`}
                            >
                                {
                                    hijriTitle
                                }
                            </p>
                        </div>

                        <button
                            onClick={
                                goNextMonth
                            }
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode
                                    ? "bg-gray-900 text-[#E5C158] hover:bg-gray-700"
                                    : "bg-[#FDFBF7] text-[#D4AF37] hover:bg-gray-100"
                                }`}
                            aria-label={
                                isAr
                                    ? "الشهر التالي"
                                    : "Next month"
                            }
                        >
                            {isAr ? (
                                <ChevronLeft
                                    size={19}
                                />
                            ) : (
                                <ChevronRight
                                    size={19}
                                />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-4">
                        <button
                            onClick={() =>
                                loadMonth(
                                    true
                                )
                            }
                            disabled={
                                refreshing
                            }
                            className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center transition-colors disabled:opacity-50 ${isDarkMode
                                    ? "bg-gray-900 text-gray-300 hover:text-[#E5C158]"
                                    : "bg-gray-100 text-gray-600 hover:text-[#D4AF37]"
                                }`}
                            aria-label={
                                isAr
                                    ? "تحديث التقويم"
                                    : "Refresh calendar"
                            }
                        >
                            <RefreshCw
                                size={15}
                                className={
                                    refreshing
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                        </button>

                        {selectedDay && (
                            <div
                                className={`min-w-0 flex-1 max-w-[245px] rounded-2xl px-3 py-2.5 text-center ${isDarkMode
                                        ? "bg-gray-900/70"
                                        : "bg-gray-50"
                                    }`}
                            >
                                <p
                                    className={`text-[11px] font-bold truncate ${isDarkMode
                                            ? "text-gray-100"
                                            : "text-gray-800"
                                        }`}
                                >
                                    {
                                        selectedGregorianText
                                    }
                                </p>

                                <p
                                    className={`text-[10px] mt-1 truncate ${isDarkMode
                                            ? "text-[#E5C158]"
                                            : "text-[#B18A17]"
                                        }`}
                                >
                                    {
                                        selectedHijriText
                                    }
                                </p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div
                            className={`mt-3 rounded-xl px-3 py-2 text-[11px] ${isDarkMode
                                    ? "bg-amber-500/10 text-amber-300"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                        >
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="py-16 flex items-center justify-center">
                            <Loader2
                                size={27}
                                className={`animate-spin ${isDarkMode
                                        ? "text-[#E5C158]"
                                        : "text-[#D4AF37]"
                                    }`}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-7 gap-1 mt-5">
                                {weekdays.map(
                                    (
                                        weekday
                                    ) => (
                                        <div
                                            key={
                                                weekday
                                            }
                                            className="text-center text-[10px] font-bold text-gray-500 py-1"
                                        >
                                            {
                                                weekday
                                            }
                                        </div>
                                    )
                                )}

                                {Array.from(
                                    {
                                        length:
                                            firstDayOffset,
                                    }
                                ).map(
                                    (
                                        _,
                                        index
                                    ) => (
                                        <div
                                            key={`empty-${index}`}
                                        />
                                    )
                                )}

                                {days.map(
                                    (
                                        item,
                                        index
                                    ) => {
                                        const date =
                                            getDateFromItem(
                                                item
                                            );

                                        const isToday =
                                            isSameDate(
                                                date,
                                                today
                                            );

                                        const isSelected =
                                            selectedIndex ===
                                            index;

                                        const hasHoliday =
                                            Array.isArray(
                                                item
                                                    ?.hijri
                                                    ?.holidays
                                            ) &&
                                            item
                                                .hijri
                                                .holidays
                                                .length >
                                            0;

                                        return (
                                            <button
                                                key={`${item?.gregorian?.date}-${index}`}
                                                onClick={() =>
                                                    setSelectedIndex(
                                                        index
                                                    )
                                                }
                                                className={`relative min-h-[58px] rounded-xl flex flex-col items-center justify-center transition-all border ${isSelected
                                                        ? isDarkMode
                                                            ? "bg-[#E5C158] text-gray-900 border-[#E5C158] shadow-md"
                                                            : "bg-[#D4AF37] text-white border-[#D4AF37] shadow-md"
                                                        : isToday
                                                            ? isDarkMode
                                                                ? "bg-[#E5C158]/10 border-[#E5C158]/40 text-[#E5C158]"
                                                                : "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#B18A17]"
                                                            : isDarkMode
                                                                ? "bg-gray-900/40 border-gray-700 text-gray-200 hover:border-[#E5C158]/40"
                                                                : "bg-[#FDFBF7] border-[#F0EBE1] text-gray-700 hover:border-[#D4AF37]/40"
                                                    }`}
                                            >
                                                <span className="text-sm font-bold leading-none">
                                                    {Number(
                                                        item
                                                            ?.gregorian
                                                            ?.day ||
                                                        0
                                                    )}
                                                </span>

                                                <span
                                                    className={`text-[9px] mt-1 ${isSelected
                                                            ? "opacity-90"
                                                            : "text-gray-500"
                                                        }`}
                                                >
                                                    {
                                                        item
                                                            ?.hijri
                                                            ?.day
                                                    }
                                                </span>

                                                {hasHoliday && (
                                                    <span
                                                        className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${isSelected
                                                                ? "bg-current"
                                                                : "bg-emerald-500"
                                                            }`}
                                                    />
                                                )}
                                            </button>
                                        );
                                    }
                                )}
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-gray-500">
                                <span>
                                    {isAr
                                        ? "الرقم الكبير ميلادي"
                                        : "Large number: Gregorian"}
                                </span>

                                <span>
                                    {isAr
                                        ? "الرقم الصغير هجري"
                                        : "Small number: Hijri"}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {selectedDay && (
                    <div
                        className={`rounded-[1.6rem] border p-4 mt-3 ${isDarkMode
                                ? "bg-gray-800 border-gray-700"
                                : "bg-white border-[#F0EBE1]"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isDarkMode
                                        ? "bg-[#E5C158]/10 text-[#E5C158]"
                                        : "bg-[#D4AF37]/10 text-[#D4AF37]"
                                    }`}
                            >
                                <CalendarDays
                                    size={21}
                                />
                            </div>

                            <div className="min-w-0">
                                <p
                                    className={`font-bold text-sm ${isDarkMode
                                            ? "text-gray-100"
                                            : "text-gray-800"
                                        }`}
                                >
                                    {
                                        selectedGregorianText
                                    }
                                </p>

                                <p
                                    className={`text-xs mt-1 ${isDarkMode
                                            ? "text-[#E5C158]"
                                            : "text-[#B18A17]"
                                        }`}
                                >
                                    {
                                        selectedHijriText
                                    }
                                </p>
                            </div>
                        </div>

                        {selectedHolidays.length >
                            0 ? (
                            <div className="mt-4 space-y-2">
                                {selectedHolidays.map(
                                    (
                                        holiday,
                                        index
                                    ) => (
                                        <div
                                            key={`${holiday}-${index}`}
                                            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${isDarkMode
                                                    ? "bg-emerald-500/10 text-emerald-300"
                                                    : "bg-emerald-50 text-emerald-700"
                                                }`}
                                        >
                                            <Sparkles
                                                size={
                                                    16
                                                }
                                                className="shrink-0"
                                            />

                                            <span className="text-xs font-bold">
                                                {normalizeHoliday(
                                                    holiday,
                                                    isAr
                                                )}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 mt-4">
                                {isAr
                                    ? "لا توجد مناسبة إسلامية مسجلة في هذا اليوم."
                                    : "No Islamic occasion is listed for this day."}
                            </p>
                        )}
                    </div>
                )}

                {usingFallback && (
                    <div
                        className={`rounded-2xl p-3 mt-3 text-[10px] leading-5 ${isDarkMode
                                ? "bg-gray-800/60 text-gray-400"
                                : "bg-gray-50 text-gray-500"
                            }`}
                    >
                        {isAr
                            ? "يتم الآن استخدام حساب هجري محلي تقريبي لحين عودة الاتصال."
                            : "A local approximate Hijri calculation is being used until the network is available."}
                    </div>
                )}
            </div>
        </div>
    );
}
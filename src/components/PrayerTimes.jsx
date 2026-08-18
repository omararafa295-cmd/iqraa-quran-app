import { useState, useEffect, useContext, useMemo, useRef } from "react";
import axios from "axios";
import {
  Search,
  MapPin,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Star,
  Clock3,
  Navigation,
  WifiOff,
  RefreshCw,
  Calendar,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import { AppContext } from "../App";

export default function PrayerTimes() {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === "ar";

  const [city, setCity] = useState(
    () => localStorage.getItem("userCity") || ""
  );
  const [country, setCountry] = useState(
    () => localStorage.getItem("userCountry") || ""
  );
  const [searchInput, setSearchInput] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const searchTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [timings, setTimings] = useState(() => {
    try {
      const saved = localStorage.getItem("userPrayerTimings");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [dateInfo, setDateInfo] = useState(() => {
    try {
      const saved = localStorage.getItem("userPrayerDate");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(() => {
    try {
      return !localStorage.getItem("userPrayerTimings");
    } catch {
      return true;
    }
  });

  const [fetchError, setFetchError] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const t = {
    title: isAr ? "مواقيت الصلاة" : "Prayer Times",
    search: isAr ? "ابحث عن مدينتك..." : "Search for your city...",
    loading: isAr
      ? "جاري تحديد الموقع والمواقيت..."
      : "Locating & loading timings...",
    offlineErr: isAr
      ? "أنت أوفلاين ولا توجد مواقيت محفوظة"
      : "You are offline and no cached timings found",
    retry: isAr ? "إعادة المحاولة" : "Retry",
    next: isAr ? "الصلاة القادمة" : "Next Prayer",
    remaining: isAr ? "متبقٍ" : "remaining",
    now: isAr ? "الآن" : "Now",
    hourShort: isAr ? "س" : "h",
    minShort: isAr ? "د" : "m",
    location: isAr ? "موقعي" : "My Location",
    searchError: isAr ? "حدث خطأ أثناء البحث" : "Search error occurred",
    noResults: isAr ? "لم يتم العثور على نتائج" : "No results found",
    prayers: {
      Fajr: isAr ? "الفجر" : "Fajr",
      Sunrise: isAr ? "الشروق" : "Sunrise",
      Dhuhr: isAr ? "الظهر" : "Dhuhr",
      Asr: isAr ? "العصر" : "Asr",
      Maghrib: isAr ? "المغرب" : "Maghrib",
      Isha: isAr ? "العشاء" : "Isha",
    },
  };

  const saveTimings = (fetchedTimings, fetchedDate) => {
    setTimings(fetchedTimings);
    setDateInfo(fetchedDate);

    localStorage.setItem(
      "userPrayerTimings",
      JSON.stringify(fetchedTimings)
    );

    localStorage.setItem(
      "userPrayerDate",
      JSON.stringify(fetchedDate)
    );

    localStorage.setItem(
      "userPrayerTimingsUpdatedAt",
      new Date().toISOString()
    );
  };

  const loadCachedTimings = () => {
    try {
      const savedTimings = localStorage.getItem("userPrayerTimings");
      const savedDate = localStorage.getItem("userPrayerDate");

      if (!savedTimings) {
        setFetchError(true);
        setLoading(false);
        return false;
      }

      const parsedTimings = JSON.parse(savedTimings);

      setTimings(parsedTimings);

      if (savedDate) {
        setDateInfo(JSON.parse(savedDate));
      }

      setFetchError(false);
      setLoading(false);
      return true;
    } catch {
      setFetchError(true);
      setLoading(false);
      return false;
    }
  };

  const fetchTimingsByCoordinates = async (lat, lon) => {
    setLoading(true);
    setFetchError(false);

    try {
      const response = await axios.get(
        `https://api.aladhan.com/v1/timings?latitude=${encodeURIComponent(
          lat
        )}&longitude=${encodeURIComponent(lon)}&method=5`,
        {
          timeout: 8000,
        }
      );

      const data = response.data?.data;

      if (!data?.timings || !data?.date) {
        throw new Error("Invalid prayer timings response");
      }

      saveTimings(data.timings, data.date);
      setFetchError(false);
    } catch {
      loadCachedTimings();
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const bdcRes = await axios.get(
        "https://api.bigdatacloud.net/data/reverse-geocode-client",
        {
          params: {
            latitude: lat,
            longitude: lon,
            localityLanguage: isAr ? "ar" : "en",
          },
          timeout: 6000,
        }
      );

      const bdcData = bdcRes.data || {};

      const detectedCity =
        bdcData.city ||
        bdcData.locality ||
        bdcData.principalSubdivision ||
        bdcData.countryName ||
        "";

      const detectedCountry = bdcData.countryName || "";

      if (detectedCity) {
        setCity(detectedCity);
        localStorage.setItem("userCity", detectedCity);

        if (detectedCountry) {
          setCountry(detectedCountry);
          localStorage.setItem("userCountry", detectedCountry);
        }

        return;
      }
    } catch {}

    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/reverse",
        {
          params: {
            lat,
            lon,
            format: "jsonv2",
            addressdetails: 1,
            zoom: 18,
            "accept-language": isAr ? "ar" : "en",
          },
          timeout: 6000,
        }
      );

      const address = response.data?.address || {};

      const detectedCity =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        address.state ||
        response.data?.name ||
        "";

      const detectedCountry = address.country || "";

      if (detectedCity) {
        setCity(detectedCity);
        localStorage.setItem("userCity", detectedCity);
      }

      if (detectedCountry) {
        setCountry(detectedCountry);
        localStorage.setItem("userCountry", detectedCountry);
      }
    } catch {
      const savedCity = localStorage.getItem("userCity");
      const savedCountry = localStorage.getItem("userCountry");

      if (savedCity) {
        setCity(savedCity);
      } else {
        setCity(isAr ? "موقعي الحالي" : "Current Location");
      }

      if (savedCountry) {
        setCountry(savedCountry);
      }
    }
  };

  const fetchLocationByIP = async () => {
    try {
      const res = await axios.get(
        "https://api.bigdatacloud.net/data/reverse-geocode-client",
        {
          params: {
            localityLanguage: isAr ? "ar" : "en",
          },
          timeout: 6000,
        }
      );

      const data = res.data;

      if (
        data &&
        data.latitude != null &&
        data.longitude != null
      ) {
        return {
          lat: Number(data.latitude),
          lon: Number(data.longitude),
          city:
            data.city ||
            data.locality ||
            data.principalSubdivision ||
            data.countryName ||
            "",
          country: data.countryName || "",
        };
      }
    } catch {}

    try {
      const res2 = await axios.get(
        "https://ipapi.co/json/",
        {
          timeout: 6000,
        }
      );

      if (
        res2.data &&
        res2.data.latitude != null &&
        res2.data.longitude != null
      ) {
        return {
          lat: Number(res2.data.latitude),
          lon: Number(res2.data.longitude),
          city: res2.data.city || "",
          country: res2.data.country_name || "",
        };
      }
    } catch {}

    return null;
  };

  const handleOfflineFallback = () => {
    const savedLocation = localStorage.getItem("userLocation");
    const savedCity = localStorage.getItem("userCity");
    const savedCountry = localStorage.getItem("userCountry");

    if (savedCity) {
      setCity(savedCity);
    }

    if (savedCountry) {
      setCountry(savedCountry);
    }

    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);

        if (
          typeof location.lat === "number" &&
          typeof location.lon === "number"
        ) {
          localStorage.setItem(
            "userLocation",
            JSON.stringify({
              lat: location.lat,
              lon: location.lon,
            })
          );
        }
      } catch {}
    }

    loadCachedTimings();
  };

  const getUserLocation = async (forceRefresh = false) => {
    setLocationLoading(true);
    setFetchError(false);

    if (!navigator.onLine) {
      handleOfflineFallback();
      setLocationLoading(false);
      return;
    }

    let coords = null;

    if (forceRefresh) {
      localStorage.removeItem("userLocation");
      localStorage.removeItem("userCity");
      localStorage.removeItem("userCountry");
    }

    if ("geolocation" in navigator) {
      const getPosition = (options) =>
        new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            options
          );
        });

      try {
        const position = await getPosition({
          enableHighAccuracy: true,
          timeout: forceRefresh ? 15000 : 12000,
          maximumAge: 0,
        });

        if (
          position?.coords &&
          Number.isFinite(position.coords.latitude) &&
          Number.isFinite(position.coords.longitude)
        ) {
          coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
        }
      } catch {}
    }

    if (coords) {
      localStorage.setItem(
        "userLocation",
        JSON.stringify({
          lat: coords.lat,
          lon: coords.lon,
        })
      );

      try {
        await reverseGeocode(
          coords.lat,
          coords.lon
        );
      } catch {}

      try {
        await fetchTimingsByCoordinates(
          coords.lat,
          coords.lon
        );

        setFetchError(false);
      } catch {
        loadCachedTimings();
      } finally {
        setLocationLoading(false);
      }

      return;
    }

    const ipLocation = await fetchLocationByIP();

    if (ipLocation) {
      localStorage.setItem(
        "userLocation",
        JSON.stringify({
          lat: ipLocation.lat,
          lon: ipLocation.lon,
        })
      );

      if (ipLocation.city) {
        setCity(ipLocation.city);
        localStorage.setItem(
          "userCity",
          ipLocation.city
        );
      }

      if (ipLocation.country) {
        setCountry(ipLocation.country);
        localStorage.setItem(
          "userCountry",
          ipLocation.country
        );
      }

      try {
        await fetchTimingsByCoordinates(
          ipLocation.lat,
          ipLocation.lon
        );

        setFetchError(false);
      } catch {
        loadCachedTimings();
      } finally {
        setLocationLoading(false);
      }

      return;
    }

    setLocationLoading(false);

    const hasCachedTimings =
      localStorage.getItem("userPrayerTimings");

    if (hasCachedTimings) {
      loadCachedTimings();
    } else {
      setFetchError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedLocation =
      localStorage.getItem("userLocation");

    if (!navigator.onLine) {
      handleOfflineFallback();
      return;
    }

    if (savedLocation) {
      try {
        const { lat, lon } = JSON.parse(savedLocation);

        if (
          typeof lat === "number" &&
          typeof lon === "number" &&
          Number.isFinite(lat) &&
          Number.isFinite(lon)
        ) {
          fetchTimingsByCoordinates(lat, lon);

          const savedCity =
            localStorage.getItem("userCity");

          if (!savedCity) {
            reverseGeocode(lat, lon);
          }

          return;
        }
      } catch {}
    }

    getUserLocation(true);
  }, []);

  const getSearchResults = async (query) => {
    const cleanQuery = query.trim();

    if (cleanQuery.length < 2 || !navigator.onLine) {
      setSearchSuggestions([]);
      setSearchLoading(false);
      return [];
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setSearchLoading(true);
    setSearchError(false);

    try {
      const savedLocation =
        localStorage.getItem("userLocation");

      const params = {
        q: cleanQuery,
        format: "jsonv2",
        addressdetails: 1,
        limit: 8,
        "accept-language": isAr ? "ar" : "en",
      };

      if (savedLocation) {
        try {
          const { lat, lon } = JSON.parse(savedLocation);

          if (
            typeof lat === "number" &&
            typeof lon === "number"
          ) {
            params.lat = lat;
            params.lon = lon;
            params.zoom = 8;
          }
        } catch {}
      }

      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params,
          timeout: 7000,
          signal: controller.signal,
        }
      );

      const results = [];
      const seen = new Set();

      const getPlaceName = (item) => {
        const address = item.address || {};

        return (
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          address.county ||
          address.state ||
          item.name ||
          ""
        );
      };

      response.data.forEach((item) => {
        const address = item.address || {};
        const placeName = getPlaceName(item);
        const countryName = address.country || "";

        if (!placeName) return;

        const stateName =
          address.state ||
          address.region ||
          address.county ||
          "";

        const separator = isAr ? "، " : ", ";

        const label = [
          placeName,
          stateName,
          countryName,
        ]
          .filter(Boolean)
          .filter(
            (value, index, array) =>
              array.indexOf(value) === index
          )
          .join(separator);

        const key =
          `${placeName}|${stateName}|${countryName}`.toLowerCase();

        if (seen.has(key)) return;

        seen.add(key);

        results.push({
          id:
            item.place_id ||
            `${item.lat}-${item.lon}-${placeName}`,
          name: label,
          cityName: placeName,
          countryName,
          stateName,
          lat: Number(item.lat),
          lon: Number(item.lon),
          type: item.type || "",
          importance: item.importance || 0,
        });
      });

      results.sort((a, b) => {
        const aExact =
          a.cityName.toLowerCase() ===
          cleanQuery.toLowerCase()
            ? 1
            : 0;

        const bExact =
          b.cityName.toLowerCase() ===
          cleanQuery.toLowerCase()
            ? 1
            : 0;

        if (aExact !== bExact) {
          return bExact - aExact;
        }

        return (
          (b.importance || 0) -
          (a.importance || 0)
        );
      });

      const finalResults =
        results.slice(0, 5);

      setSearchSuggestions(finalResults);

      return finalResults;
    } catch (error) {
      if (
        error?.code !== "ERR_CANCELED" &&
        error?.name !== "CanceledError" &&
        error?.name !== "AbortError"
      ) {
        setSearchSuggestions([]);
        setSearchError(true);
      }

      return [];
    } finally {
      if (
        abortControllerRef.current ===
        controller
      ) {
        abortControllerRef.current = null;
        setSearchLoading(false);
      }
    }
  };

  const handleSearchInput = (value) => {
    setSearchInput(value);
    setIsSearchOpen(true);
    setSearchError(false);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    const cleanValue = value.trim();

    if (cleanValue.length < 2) {
      setSearchSuggestions([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    searchTimerRef.current = setTimeout(() => {
      getSearchResults(cleanValue);
    }, 450);
  };

  const selectSearchResult = (result) => {
    const selectedCity =
      result.cityName || result.name;
    const selectedCountry =
      result.countryName || "";

    setSearchInput(result.name);
    setCity(selectedCity);
    setCountry(selectedCountry);
    setSearchSuggestions([]);
    setIsSearchOpen(false);
    setSearchError(false);

    localStorage.setItem(
      "userCity",
      selectedCity
    );
    localStorage.setItem(
      "userCountry",
      selectedCountry
    );

    if (
      typeof result.lat === "number" &&
      typeof result.lon === "number"
    ) {
      localStorage.setItem(
        "userLocation",
        JSON.stringify({
          lat: result.lat,
          lon: result.lon,
        })
      );

      fetchTimingsByCoordinates(
        result.lat,
        result.lon
      );
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const cleanQuery =
      searchInput.trim();

    if (!cleanQuery) return;

    if (searchSuggestions.length > 0) {
      selectSearchResult(
        searchSuggestions[0]
      );
      return;
    }

    const results =
      await getSearchResults(
        cleanQuery
      );

    if (results.length > 0) {
      selectSearchResult(
        results[0]
      );
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchSuggestions([]);
    setIsSearchOpen(false);
    setSearchError(false);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const formatTime12Hour = (time) => {
    if (!time) return "--:--";

    const match = String(time).match(
      /(\d{1,2}):(\d{2})/
    );

    if (!match) return time;

    const hours = parseInt(
      match[1],
      10
    );
    const minutes = match[2];
    const isPM = hours >= 12;
    const hour12 =
      hours % 12 || 12;

    if (isAr) {
      const period = isPM
        ? "مساءً"
        : "صباحاً";

      return (
        <span
          className="inline-flex items-center gap-1.5"
          dir="rtl"
        >
          <span className="font-sans font-bold">
            {hour12}:{minutes}
          </span>
          <span className="text-sm font-semibold">
            {period}
          </span>
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1"
        dir="ltr"
      >
        <span className="font-sans font-bold">
          {hour12}:{minutes}
        </span>
        <span className="text-sm font-semibold">
          {isPM ? "PM" : "AM"}
        </span>
      </span>
    );
  };

  const getNightPortions = (
    maghrib,
    fajr
  ) => {
    if (!maghrib || !fajr) return null;

    let [mH, mM] =
      maghrib.split(":").map(Number);
    let [fH, fM] =
      fajr.split(":").map(Number);

    let maghribMins =
      mH * 60 + mM;
    let fajrMins =
      fH * 60 + fM;

    if (fajrMins < maghribMins) {
      fajrMins += 24 * 60;
    }

    const duration =
      fajrMins - maghribMins;
    const midnight =
      maghribMins + duration / 2;
    const lastThird =
      maghribMins +
      (duration * 2) / 3;

    const format = (minutes) => {
      let hours =
        Math.floor(minutes / 60) %
        24;
      const mins = Math.round(
        minutes % 60
      );
      const isPM = hours >= 12;
      const hour12 =
        hours % 12 || 12;
      const formattedMins =
        mins < 10
          ? `0${mins}`
          : mins;

      if (isAr) {
        const period = isPM
          ? "مساءً"
          : "صباحاً";

        return (
          <span
            className="inline-flex items-center gap-1.5"
            dir="rtl"
          >
            <span className="font-sans font-bold">
              {hour12}:{formattedMins}
            </span>
            <span className="text-sm font-normal">
              {period}
            </span>
          </span>
        );
      }

      return (
        <span
          className="inline-flex items-center gap-1"
          dir="ltr"
        >
          <span className="font-sans font-bold">
            {hour12}:{formattedMins}
          </span>
          <span className="text-sm font-normal">
            {isPM ? "PM" : "AM"}
          </span>
        </span>
      );
    };

    return {
      midnight: format(midnight),
      lastThird: format(lastThird),
    };
  };

  const prayers = [
    {
      id: "Fajr",
      name: t.prayers.Fajr,
      icon: Moon,
    },
    {
      id: "Sunrise",
      name: t.prayers.Sunrise,
      icon: Sunrise,
    },
    {
      id: "Dhuhr",
      name: t.prayers.Dhuhr,
      icon: Sun,
    },
    {
      id: "Asr",
      name: t.prayers.Asr,
      icon: Sun,
    },
    {
      id: "Maghrib",
      name: t.prayers.Maghrib,
      icon: Sunset,
    },
    {
      id: "Isha",
      name: t.prayers.Isha,
      icon: Moon,
    },
  ];

  const toMinutes = (str) => {
    if (!str) return null;

    const match = String(str).match(
      /(\d{1,2}):(\d{2})/
    );

    if (!match) return null;

    return (
      parseInt(match[1], 10) * 60 +
      parseInt(match[2], 10)
    );
  };

  const arcData = useMemo(() => {
    if (!timings) return null;

    const fajrMin = toMinutes(
      timings.Fajr
    );
    let ishaMin = toMinutes(
      timings.Isha
    );

    if (
      fajrMin === null ||
      ishaMin === null
    ) {
      return null;
    }

    if (ishaMin <= fajrMin) {
      ishaMin += 24 * 60;
    }

    const span =
      ishaMin - fajrMin;

    const points = prayers
      .map((prayer) => {
        let mins = toMinutes(
          timings[prayer.id]
        );

        if (mins === null) return null;

        if (mins < fajrMin) {
          mins += 24 * 60;
        }

        const progress = Math.min(
          1,
          Math.max(
            0,
            (mins - fajrMin) /
              span
          )
        );

        return {
          ...prayer,
          name:
            t.prayers[
              prayer.id
            ],
          mins,
          progress,
        };
      })
      .filter(Boolean);

    const nowMins0 =
      now.getHours() * 60 +
      now.getMinutes();

    let nowMins = nowMins0;

    if (nowMins < fajrMin) {
      nowMins += 24 * 60;
    }

    const nowProgress =
      Math.min(
        1,
        Math.max(
          0,
          (nowMins - fajrMin) /
            span
        )
      );

    const isNight =
      nowMins0 >=
        ishaMin %
          (24 * 60) ||
      nowMins0 < fajrMin;

    let nextIndex =
      points.findIndex(
        (point) =>
          point.mins > nowMins
      );

    let currentIndex =
      nextIndex === -1
        ? points.length - 1
        : nextIndex - 1;

    if (nextIndex === -1) {
      nextIndex = 0;
    }

    const nextPrayer =
      points[nextIndex];

    if (!nextPrayer) return null;

    let minsToNext =
      nextPrayer.mins -
      nowMins;

    if (minsToNext < 0) {
      minsToNext += 24 * 60;
    }

    const hoursLeft =
      Math.floor(
        minsToNext / 60
      );

    const minsLeft =
      Math.round(
        minsToNext % 60
      );

    return {
      points,
      nowProgress,
      currentIndex,
      nextIndex,
      nextPrayer,
      hoursLeft,
      minsLeft,
      isNight,
    };
  }, [
    timings,
    now,
    isAr,
    lang,
  ]);

  const arcY = (progress) =>
    -Math.sin(
      progress * Math.PI
    ) * 46;

  const arcPath = useMemo(() => {
    if (!arcData) return "";

    const steps = 40;
    let path = "";

    for (
      let i = 0;
      i <= steps;
      i++
    ) {
      const progress =
        i / steps;
      const x =
        progress * 100;
      const y =
        60 +
        arcY(progress);

      path += `${
        i === 0
          ? "M"
          : "L"
      } ${x} ${y} `;
    }

    return path;
  }, [arcData]);

  const nightTimes = timings
    ? getNightPortions(
        timings.Maghrib,
        timings.Fajr
      )
    : null;

  return (
    <div
      className="max-w-4xl mx-auto px-4 md:px-6 pt-2 md:pt-6 pb-32"
      dir={isAr ? "rtl" : "ltr"}
    >
      <style>{`
        @keyframes riseIn {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.25;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(212,163,115,0.45);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(212,163,115,0);
          }
        }

        @keyframes drawArc {
          from {
            stroke-dashoffset: 400;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .rise-in {
          animation: riseIn 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
      `}</style>

      <div className="mb-6 mt-4 rise-in relative z-40">
        <div className="flex items-center justify-center gap-3 mb-6">
          <h2
            className={`text-3xl font-bold text-center ${
              isAr
                ? "font-quran"
                : "font-serif tracking-wide"
            } ${
              isDarkMode
                ? "text-[#E5C158]"
                : "text-[#D4AF37]"
            }`}
          >
            {t.title}
          </h2>
        </div>

        <form
          onSubmit={handleSearch}
          className="relative mb-6 z-50"
        >
          <div className="relative">
            <input
              type="text"
              placeholder={t.search}
              value={searchInput}
              onChange={(e) =>
                handleSearchInput(
                  e.target.value
                )
              }
              onFocus={() => {
                if (
                  searchInput.trim()
                    .length >= 2
                ) {
                  setIsSearchOpen(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setIsSearchOpen(false);
                }, 200);
              }}
              className={`w-full p-4 ${
                isAr
                  ? "pr-12 pl-11"
                  : "pl-12 pr-11"
              } rounded-2xl border focus:outline-none shadow-sm transition-all focus:shadow-md ${
                !isAr
                  ? "font-sans"
                  : ""
              } ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-gray-200 focus:border-[#E5C158]"
                  : "bg-white border-[#F0EBE1] text-gray-700 focus:border-[#D4AF37]"
              }`}
              dir="ltr"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
            />

            <Search
              className={`absolute ${
                isAr
                  ? "right-4"
                  : "left-4"
              } top-1/2 -translate-y-1/2 text-gray-400`}
              size={20}
            />

            {searchLoading && (
              <Loader2
                size={18}
                className={`absolute ${
                  isAr
                    ? "left-4"
                    : "right-4"
                } top-1/2 -translate-y-1/2 animate-spin ${
                  isDarkMode
                    ? "text-[#E5C158]"
                    : "text-[#D4AF37]"
                }`}
              />
            )}

            {searchInput &&
              !searchLoading && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className={`absolute ${
                    isAr
                      ? "left-4"
                      : "right-4"
                  } top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500`}
                >
                  <X size={18} />
                </button>
              )}
          </div>

          {isSearchOpen &&
            (searchInput ||
              searchLoading) && (
              <div
                className={`absolute top-full left-0 right-0 mt-2 z-[999] overflow-hidden rounded-2xl border shadow-2xl ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-[#F0EBE1]"
                }`}
                dir="ltr"
              >
                {searchLoading ? (
                  <div className="p-5 flex items-center justify-center">
                    <Loader2
                      size={22}
                      className={`animate-spin ${
                        isDarkMode
                          ? "text-[#E5C158]"
                          : "text-[#D4AF37]"
                      }`}
                    />
                  </div>
                ) : searchError ? (
                  <div className="p-4 text-center text-red-500 text-sm font-bold">
                    {t.searchError}
                  </div>
                ) : searchSuggestions.length >
                  0 ? (
                  <>
                    <div className="max-h-72 overflow-y-auto">
                      {searchSuggestions.map(
                        (result) => (
                          <button
                            key={result.id}
                            type="button"
                            onMouseDown={(e) =>
                              e.preventDefault()
                            }
                            onTouchStart={(e) =>
                              e.stopPropagation()
                            }
                            onClick={() =>
                              selectSearchResult(
                                result
                              )
                            }
                            className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                              isDarkMode
                                ? "hover:bg-gray-700 active:bg-gray-700"
                                : "hover:bg-[#FDFBF7] active:bg-[#FDFBF7]"
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isDarkMode
                                  ? "bg-[#E5C158]/10 text-[#E5C158]"
                                  : "bg-[#D4AF37]/10 text-[#D4AF37]"
                              }`}
                            >
                              <MapPin size={17} />
                            </div>

                            <div className="min-w-0">
                              <p
                                className={`font-bold text-sm truncate ${
                                  isDarkMode
                                    ? "text-gray-100"
                                    : "text-gray-800"
                                }`}
                              >
                                {result.cityName}
                              </p>

                              <p className="text-xs text-gray-400 truncate mt-0.5">
                                {[
                                  result.stateName,
                                  result.countryName,
                                ]
                                  .filter(Boolean)
                                  .filter(
                                    (
                                      value,
                                      index,
                                      array
                                    ) =>
                                      array.indexOf(
                                        value
                                      ) === index
                                  )
                                  .join(", ")}
                              </p>
                            </div>
                          </button>
                        )
                      )}
                    </div>

                    <div
                      className={`px-4 py-2 text-[10px] border-t ${
                        isDarkMode
                          ? "border-gray-700 text-gray-500"
                          : "border-gray-100 text-gray-400"
                      }`}
                    >
                      © OpenStreetMap contributors · Nominatim
                    </div>
                  </>
                ) : searchInput ? (
                  <div className="p-4 text-center text-gray-500 text-sm font-bold">
                    {t.noResults}
                  </div>
                ) : null}
              </div>
            )}
        </form>

        {city && (
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex items-center justify-center gap-2 font-bold ${
                isDarkMode
                  ? "text-[#E5C158]"
                  : "text-[#D4AF37]"
              }`}
            >
              <MapPin size={20} />

              <span>
                {city}
                {country
                  ? `, ${country}`
                  : ""}
              </span>

              <button
                onClick={() =>
                  getUserLocation(true)
                }
                disabled={locationLoading}
                className={`p-1.5 rounded-full transition-colors ${
                  isDarkMode
                    ? "hover:bg-gray-800 text-gray-400"
                    : "hover:bg-gray-100 text-gray-500"
                }`}
                title={t.location}
                type="button"
              >
                {locationLoading ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Navigation
                    size={16}
                  />
                )}
              </button>
            </div>

            {dateInfo && (
              <div
                className={`flex flex-wrap items-center justify-center gap-2 text-xs font-bold mt-1 px-3.5 py-1.5 rounded-full border shadow-sm ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 text-gray-300"
                    : "bg-white border-[#F0EBE1] text-gray-600"
                }`}
              >
                <Calendar
                  size={14}
                  className={
                    isDarkMode
                      ? "text-[#E5C158]"
                      : "text-[#D4AF37]"
                  }
                />

                {(dateInfo.hijri
                  ?.weekday ||
                  dateInfo.gregorian
                    ?.weekday) && (
                  <span>
                    {isAr
                      ? dateInfo.hijri
                          ?.weekday
                          ?.ar ||
                        dateInfo.gregorian
                          ?.weekday
                          ?.en
                      : dateInfo.gregorian
                          ?.weekday
                          ?.en ||
                        dateInfo.hijri
                          ?.weekday
                          ?.en}
                  </span>
                )}

                <span>•</span>

                <span>
                  {dateInfo.gregorian?.date}
                </span>

                {dateInfo.hijri && (
                  <span>
                    (
                    {
                      dateInfo.hijri
                        .day
                    }{" "}
                    {
                      dateInfo.hijri
                        .month?.[
                        isAr
                          ? "ar"
                          : "en"
                      ]
                    }{" "}
                    {
                      dateInfo.hijri
                        .year
                    }
                    )
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div
          className={`text-center py-10 font-bold ${
            isDarkMode
              ? "text-[#E5C158]"
              : "text-[#D4AF37]"
          }`}
        >
          {t.loading}
        </div>
      ) : fetchError &&
        !timings ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              isDarkMode
                ? "bg-gray-800 text-[#E5C158]"
                : "bg-red-50 text-red-500"
            }`}
          >
            <WifiOff size={32} />
          </div>

          <p
            className={`font-bold mb-6 max-w-xs ${
              isDarkMode
                ? "text-gray-300"
                : "text-gray-600"
            }`}
          >
            {t.offlineErr}
          </p>

          <button
            onClick={() =>
              getUserLocation(true)
            }
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md ${
              isDarkMode
                ? "bg-[#E5C158] text-gray-900"
                : "bg-[#D4AF37] text-white"
            }`}
            type="button"
          >
            <RefreshCw size={18} />
            {t.retry}
          </button>
        </div>
      ) : (
        <>
          {arcData && (
            <div
              className={`relative z-10 overflow-hidden rounded-[2rem] p-6 pb-5 mb-5 shadow-lg rise-in ${
                arcData.isNight
                  ? "bg-gradient-to-br from-[#241a12] to-[#171009] border border-[#3a2b1c]"
                  : isDarkMode
                    ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
                    : "bg-gradient-to-br from-[#FFF9F0] to-[#FBEFDC] border border-[#F0DFC0]"
              }`}
            >
              {arcData.isNight && (
                <>
                  {[...Array(14)].map(
                    (_, i) => (
                      <span
                        key={i}
                        className="absolute rounded-full bg-[#E5C158]"
                        style={{
                          width: "2px",
                          height: "2px",
                          left: `${
                            (i * 37) %
                            100
                          }%`,
                          top: `${
                            (i * 53) %
                            60
                          }%`,
                          animation: `twinkle ${
                            2 + (i % 4)
                          }s ease-in-out infinite`,
                          animationDelay: `${
                            i * 0.2
                          }s`,
                          opacity: 0.5,
                        }}
                      />
                    )
                  )}
                </>
              )}

              <div className="relative z-10 flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold uppercase tracking-wide ${
                    arcData.isNight
                      ? "text-[#D9BB63]"
                      : isDarkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                  }`}
                >
                  {t.next}
                </span>

                <span
                  className={`flex items-center gap-1 text-xs font-bold ${
                    arcData.isNight
                      ? "text-[#E5C158]"
                      : isDarkMode
                        ? "text-[#E5C158]"
                        : "text-[#B8942E]"
                  }`}
                >
                  <Sparkles size={12} />
                  {t.now}
                </span>
              </div>

              <div className="relative z-10 flex items-end justify-between mb-4">
                <h3
                  className={`text-3xl font-bold ${
                    isAr
                      ? "font-quran"
                      : "font-serif"
                  } ${
                    arcData.isNight
                      ? "text-white"
                      : isDarkMode
                        ? "text-white"
                        : "text-[#3a2a1a]"
                  }`}
                >
                  {t.prayers[
                    arcData.nextPrayer
                      .id
                  ] ||
                    arcData.nextPrayer
                      .name}
                </h3>

                <div
                  className={`text-sm font-bold ${
                    arcData.isNight
                      ? "text-[#E5C158]"
                      : isDarkMode
                        ? "text-[#E5C158]"
                        : "text-[#B8942E]"
                  }`}
                >
                  {isAr ? (
                    <div
                      className="inline-flex items-center gap-1"
                      dir="rtl"
                    >
                      <span className="opacity-70 font-medium">
                        {t.remaining}
                      </span>

                      {arcData.hoursLeft >
                        0 && (
                        <span>
                          {
                            arcData.hoursLeft
                          }
                          {t.hourShort}
                        </span>
                      )}

                      <span>
                        {
                          arcData.minsLeft
                        }
                        {t.minShort}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="inline-flex items-center gap-1"
                      dir="ltr"
                    >
                      {arcData.hoursLeft >
                        0 && (
                        <span>
                          {
                            arcData.hoursLeft
                          }
                          {t.hourShort}
                        </span>
                      )}

                      <span>
                        {
                          arcData.minsLeft
                        }
                        {t.minShort}
                      </span>

                      <span className="opacity-70 font-medium">
                        {t.remaining}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative z-10 h-24 mt-2">
                <svg
                  viewBox="0 0 100 60"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full overflow-visible"
                >
                  <path
                    d={arcPath}
                    fill="none"
                    stroke={
                      arcData.isNight
                        ? "rgba(230,185,129,0.35)"
                        : isDarkMode
                          ? "rgba(230,185,129,0.35)"
                          : "rgba(181,121,58,0.3)"
                    }
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeDasharray="400"
                    style={{
                      animation:
                        "drawArc 1.2s ease-out both",
                    }}
                  />
                </svg>

                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear"
                  style={{
                    left: `${
                      arcData.nowProgress *
                      100
                    }%`,
                    top: `${
                      ((60 +
                        arcY(
                          arcData.nowProgress
                        )) /
                        60) *
                      100
                    }%`,
                  }}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      arcData.isNight
                        ? "bg-[#E5C158]"
                        : "bg-[#D4AF37]"
                    }`}
                    style={{
                      animation:
                        "glowPulse 2s ease-in-out infinite",
                    }}
                  />
                </div>

                {arcData.points.map(
                  (point, index) => {
                    const Icon =
                      point.icon;
                    const isCurrent =
                      index ===
                      arcData.currentIndex;
                    const isNext =
                      index ===
                      arcData.nextIndex;

                    return (
                      <div
                        key={point.id}
                        className="absolute -translate-x-1/2 flex flex-col items-center gap-1"
                        style={{
                          left: `${
                            point.progress *
                            100
                          }%`,
                          top: `${
                            ((60 +
                              arcY(
                                point.progress
                              )) /
                              60) *
                            100
                          }%`,
                          transform:
                            "translate(-50%, -50%)",
                        }}
                      >
                        <div
                          className={`flex items-center justify-center rounded-full transition-all ${
                            isNext
                              ? `${
                                  arcData.isNight
                                    ? "bg-[#E5C158] text-[#241a12]"
                                    : "bg-[#D4AF37] text-white"
                                } w-7 h-7 shadow-md`
                              : isCurrent
                                ? `${
                                    arcData.isNight
                                      ? "bg-[#3a2b1c] text-[#E5C158] border border-[#E5C158]"
                                      : isDarkMode
                                        ? "bg-gray-700 text-[#E5C158] border border-[#E5C158]"
                                        : "bg-white text-[#D4AF37] border border-[#D4AF37]"
                                  } w-6 h-6`
                                : `${
                                    arcData.isNight
                                      ? "bg-[#2a1f16] text-[#7a6a55]"
                                      : isDarkMode
                                        ? "bg-gray-700 text-gray-500"
                                        : "bg-white text-gray-400"
                                  } w-5 h-5 opacity-70`
                          }`}
                        >
                          <Icon
                            size={
                              isNext
                                ? 14
                                : 11
                            }
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            {prayers.map(
              (
                prayer,
                index
              ) => {
                const Icon =
                  prayer.icon;

                const isCurrent =
                  arcData &&
                  index ===
                    arcData.currentIndex;

                const isNext =
                  arcData &&
                  index ===
                    arcData.nextIndex;

                return (
                  <div
                    key={prayer.id}
                    className={`relative p-5 rounded-2xl shadow-sm border flex flex-col items-center justify-center gap-2 transition-all duration-300 rise-in ${
                      isNext
                        ? `${
                            isDarkMode
                              ? "bg-gray-800 border-[#E5C158] shadow-[0_0_0_1px_rgba(230,185,129,0.3)]"
                              : "bg-white border-[#D4AF37] shadow-[0_4px_20px_rgba(212,163,115,0.25)]"
                          } scale-[1.03]`
                        : isDarkMode
                          ? "bg-gray-800 border-gray-700 hover:border-[#E5C158]"
                          : "bg-white border-[#F0EBE1] hover:border-[#D4AF37]"
                    }`}
                    style={{
                      animationDelay: `${
                        120 +
                        index * 60
                      }ms`,
                    }}
                  >
                    {isNext && (
                      <span
                        className={`absolute -top-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isDarkMode
                            ? "bg-[#E5C158] text-gray-900"
                            : "bg-[#D4AF37] text-white"
                        }`}
                      >
                        {t.next}
                      </span>
                    )}

                    <div
                      className={
                        isCurrent ||
                        isNext
                          ? isDarkMode
                            ? "text-[#E5C158]"
                            : "text-[#D4AF37]"
                          : isDarkMode
                            ? "text-gray-500"
                            : "text-gray-400"
                      }
                    >
                      <Icon size={26} />
                    </div>

                    <h3
                      className={`font-bold text-sm ${
                        isDarkMode
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      {prayer.name}
                    </h3>

                    <div
                      className={`text-xl font-bold ${
                        isDarkMode
                          ? "text-gray-100"
                          : "text-gray-800"
                      }`}
                    >
                      {formatTime12Hour(
                        timings?.[
                          prayer.id
                        ]
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {nightTimes && (
            <div
              className={`relative p-6 rounded-3xl shadow-lg border overflow-hidden rise-in ${
                isDarkMode
                  ? "bg-gradient-to-br from-gray-900 to-[#1a1c23] border-[#E5C158]/30"
                  : "bg-gradient-to-br from-[#2a1f18] to-[#1e1510] border-[#D4AF37]"
              }`}
            >
              {[...Array(10)].map(
                (_, index) => (
                  <span
                    key={index}
                    className="absolute rounded-full bg-white"
                    style={{
                      width: "2px",
                      height: "2px",
                      left: `${
                        (index * 41 +
                          5) %
                        95
                      }%`,
                      top: `${
                        (index * 29 +
                          8) %
                        85
                      }%`,
                      animation: `twinkle ${
                        2.5 +
                        (index % 3)
                      }s ease-in-out infinite`,
                      animationDelay: `${
                        index * 0.3
                      }s`,
                    }}
                  />
                )
              )}

              <div className="absolute -top-4 -left-4 opacity-10">
                <Star
                  size={100}
                  className="text-[#E5C158]"
                />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Moon
                    size={22}
                    className="text-[#E5C158]"
                  />

                  <h3 className="text-xl font-bold font-quran text-[#E5C158]">
                    {isAr
                      ? "حاسبة قيام الليل"
                      : "Tahajjud Calculator"}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs font-bold mb-1">
                      {isAr
                        ? "منتصف الليل (نهاية وقت العشاء)"
                        : "Midnight"}
                    </span>

                    <div className="flex items-center gap-2 text-white font-bold text-lg">
                      <Clock3
                        size={16}
                        className="text-[#E5C158]"
                      />

                      {nightTimes.midnight}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs font-bold mb-1">
                      {isAr
                        ? "الثلث الأخير (أفضل وقت للدعاء)"
                        : "Last Third"}
                    </span>

                    <div className="flex items-center gap-2 text-[#E5C158] font-bold text-lg">
                      <Star size={16} />

                      {nightTimes.lastThird}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
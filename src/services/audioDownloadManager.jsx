const CACHE_NAME = "quran-audio-cache";
const MAX_ACTIVE_RECITERS = 2;
const REQUESTS_PER_RECITER = 3;
const UI_UPDATE_INTERVAL = 250;
const MANIFEST_SAVE_INTERVAL = 20;

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
  "ar.shaatree": "Abu_Bakr_Ash-Shaatree_128kbps",
};

const getAudioUrl = (
  reciterId,
  surahNumber,
  ayahNumberInSurah,
  globalAyahNumber
) => {
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
const jobKey = (id) => `offline_audio_job_${id}`;

const surahKey = (surahNumber, reciterId) =>
  `offline_audio_saved_${surahNumber}_${reciterId}`;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);

    return raw
      ? JSON.parse(raw)
      : fallback;
  } catch {
    return fallback;
  }
};

class AudioDownloadManager {
  constructor() {
    this.jobs = {};
    this.listeners = new Set();
    this.controllers = {};
    this.paused = new Set();
    this.running = new Set();
    this.manifests = {};
  }

  subscribe(listener) {
    this.listeners.add(listener);

    listener(this.getSnapshot());

    return () => {
      this.listeners.delete(listener);
    };
  }

  emit() {
    const snapshot =
      this.getSnapshot();

    this.listeners.forEach(
      (listener) => {
        listener(snapshot);
      }
    );
  }

  getSnapshot() {
    return {
      jobs: {
        ...this.jobs,
      },
      activeDownloadsCount:
        this.running.size,
    };
  }

  persistManifest(id) {
    const manifest =
      this.manifests[id];

    if (!manifest) return;

    try {
      localStorage.setItem(
        manifestKey(id),
        JSON.stringify([
          ...manifest,
        ])
      );
    } catch {}
  }

  persistJob(id) {
    const job =
      this.jobs[id];

    if (!job) return;

    try {
      localStorage.setItem(
        jobKey(id),
        JSON.stringify({
          downloadedBytes:
            job.downloadedBytes || 0,
          estimatedTotalBytes:
            job.estimatedTotalBytes || 0,
          measuredBytes:
            job.measuredBytes || 0,
          sizedFiles:
            job.sizedFiles || 0,
          progress:
            job.progress || 0,
          completed:
            job.completed || 0,
          total:
            job.total || 0,
          status:
            job.status || "idle",
          updatedAt:
            Date.now(),
        })
      );
    } catch {}
  }

  initializeReciter(
    id,
    total = 0
  ) {
    if (this.jobs[id]) {
      if (
        total &&
        this.jobs[id].total !== total
      ) {
        const completed =
          this.manifests[id]?.size ||
          this.jobs[id].completed ||
          0;

        this.jobs[id] = {
          ...this.jobs[id],
          total,
          completed,
          progress:
            this.jobs[id].status === "complete"
              ? 100
              : Math.min(
                  100,
                  Math.round(
                    (completed / total) * 100
                  )
                ),
        };
      }

      return;
    }

    const isComplete =
      localStorage.getItem(
        fullKey(id)
      ) === "true";

    const manifest =
      new Set(
        readJson(
          manifestKey(id),
          []
        )
      );

    const savedJob =
      readJson(
        jobKey(id),
        {}
      );

    this.manifests[id] =
      manifest;

    this.jobs[id] = {
      status: isComplete
        ? "complete"
        : manifest.size > 0
        ? "paused"
        : "idle",

      progress: isComplete
        ? 100
        : savedJob.progress || 0,

      completed:
        manifest.size,

      total:
        total ||
        savedJob.total ||
        0,

      downloadedBytes:
        savedJob.downloadedBytes ||
        0,

      estimatedTotalBytes:
        savedJob.estimatedTotalBytes ||
        0,

      measuredBytes:
        savedJob.measuredBytes ||
        0,

      sizedFiles:
        savedJob.sizedFiles ||
        0,

      etaSeconds: null,
      speedBps: 0,
      failed: 0,
    };
  }

  initializeReciters(
    ids,
    total = 0
  ) {
    ids.forEach((id) => {
      this.initializeReciter(
        id,
        total
      );
    });

    this.emit();
  }

  setQuranTotal(total) {
    Object.keys(
      this.jobs
    ).forEach((id) => {
      const completed =
        this.manifests[id]?.size ||
        this.jobs[id]?.completed ||
        0;

      this.jobs[id] = {
        ...this.jobs[id],

        total,

        completed,

        progress:
          this.jobs[id]?.status === "complete"
            ? 100
            : total
            ? Math.min(
                100,
                Math.round(
                  (completed / total) * 100
                )
              )
            : 0,
      };
    });

    this.emit();
  }

  isSurahDownloaded(
    reciterId,
    surahNumber,
    ayahs
  ) {
    if (
      !reciterId ||
      !surahNumber ||
      !ayahs?.length
    ) {
      return false;
    }

    if (
      localStorage.getItem(
        fullKey(reciterId)
      ) === "true"
    ) {
      return true;
    }

    if (
      localStorage.getItem(
        surahKey(
          surahNumber,
          reciterId
        )
      ) === "true"
    ) {
      return true;
    }

    if (
      !this.manifests[
        reciterId
      ]
    ) {
      this.manifests[
        reciterId
      ] = new Set(
        readJson(
          manifestKey(
            reciterId
          ),
          []
        )
      );
    }

    const manifest =
      this.manifests[
        reciterId
      ];

    const downloaded =
      ayahs.every(
        (ayah) => {
          const url =
            getAudioUrl(
              reciterId,
              surahNumber,
              ayah.numberInSurah,
              ayah.number
            );

          return manifest.has(
            url
          );
        }
      );

    if (downloaded) {
      localStorage.setItem(
        surahKey(
          surahNumber,
          reciterId
        ),
        "true"
      );
    }

    return downloaded;
  }

  buildSurahStats(
    reciterId,
    quranAyahs,
    manifest
  ) {
    const stats = {};

    quranAyahs.forEach(
      (ayah) => {
        const surahNumber =
          ayah.surahNumber;

        if (
          !stats[
            surahNumber
          ]
        ) {
          stats[
            surahNumber
          ] = {
            total: 0,
            downloaded: 0,
            completed: false,
          };
        }

        stats[
          surahNumber
        ].total += 1;

        const url =
          getAudioUrl(
            reciterId,
            surahNumber,
            ayah.numberInSurah,
            ayah.number
          );

        if (
          manifest.has(url)
        ) {
          stats[
            surahNumber
          ].downloaded += 1;
        }
      }
    );

    Object.entries(
      stats
    ).forEach(
      ([
        surahNumber,
        stat,
      ]) => {
        if (
          stat.total > 0 &&
          stat.downloaded ===
            stat.total
        ) {
          stat.completed =
            true;

          localStorage.setItem(
            surahKey(
              surahNumber,
              reciterId
            ),
            "true"
          );
        }
      }
    );

    return stats;
  }

  markAyahDownloaded(
    reciterId,
    ayah,
    url,
    manifest,
    surahStats
  ) {
    if (
      manifest.has(url)
    ) {
      return false;
    }

    manifest.add(url);

    const surahNumber =
      ayah.surahNumber;

    const stat =
      surahStats[
        surahNumber
      ];

    if (stat) {
      stat.downloaded += 1;

      if (
        !stat.completed &&
        stat.total > 0 &&
        stat.downloaded >=
          stat.total
      ) {
        stat.completed =
          true;

        localStorage.setItem(
          surahKey(
            surahNumber,
            reciterId
          ),
          "true"
        );
      }
    }

    return true;
  }

  syncCompletedSurahs(
    reciterId,
    quranAyahs
  ) {
    if (
      !quranAyahs?.length
    ) {
      return;
    }

    if (
      !this.manifests[
        reciterId
      ]
    ) {
      this.manifests[
        reciterId
      ] = new Set(
        readJson(
          manifestKey(
            reciterId
          ),
          []
        )
      );
    }

    this.buildSurahStats(
      reciterId,
      quranAyahs,
      this.manifests[
        reciterId
      ]
    );
  }

  pause(id) {
    if (
      !this.running.has(id)
    ) {
      return;
    }

    this.paused.add(id);

    this.controllers[
      id
    ]?.forEach(
      (controller) => {
        controller.abort();
      }
    );

    this.persistManifest(id);

    this.jobs[id] = {
      ...this.jobs[id],
      status: "paused",
      etaSeconds: null,
      speedBps: 0,
    };

    this.persistJob(id);
    this.emit();
  }

  async start(
    reciter,
    quranAyahs
  ) {
    const id =
      reciter.id;

    if (
      !navigator.onLine
    ) {
      throw new Error(
        "offline"
      );
    }

    if (
      !quranAyahs?.length ||
      !("caches" in window)
    ) {
      throw new Error(
        "unavailable"
      );
    }

    if (
      this.running.has(id)
    ) {
      return;
    }

    if (
      this.running.size >=
      MAX_ACTIVE_RECITERS
    ) {
      throw new Error(
        "max-active"
      );
    }

    this.initializeReciter(
      id,
      quranAyahs.length
    );

    this.paused.delete(id);

    this.running.add(id);

    this.controllers[id] =
      new Set();

    const total =
      quranAyahs.length;

    const manifest =
      this.manifests[id] ||
      new Set(
        readJson(
          manifestKey(id),
          []
        )
      );

    this.manifests[id] =
      manifest;

    const surahStats =
      this.buildSurahStats(
        id,
        quranAyahs,
        manifest
      );

    const storedJob =
      readJson(
        jobKey(id),
        {}
      );

    let downloadedBytes =
      storedJob.downloadedBytes ||
      this.jobs[id]?.downloadedBytes ||
      0;

    let measuredBytes =
      storedJob.measuredBytes ||
      this.jobs[id]?.measuredBytes ||
      0;

    let sizedFiles =
      storedJob.sizedFiles ||
      this.jobs[id]?.sizedFiles ||
      0;

    let estimatedTotalBytes =
      storedJob.estimatedTotalBytes ||
      this.jobs[id]?.estimatedTotalBytes ||
      0;

    let failed = 0;
    let cursor = 0;
    let manifestChanges = 0;
    let runBytes = 0;
    let runFiles = 0;
    let lastUiUpdate = 0;
    let fatalError = null;

    const startedAt =
      performance.now();

    this.jobs[id] = {
      ...this.jobs[id],

      status: "preparing",

      total,

      completed:
        manifest.size,

      progress:
        Math.round(
          (manifest.size /
            total) *
            100
        ),

      etaSeconds: null,

      speedBps: 0,

      failed: 0,
    };

    this.emit();

    const publish = (
      force = false
    ) => {
      const now =
        performance.now();

      if (
        !force &&
        now -
          lastUiUpdate <
          UI_UPDATE_INTERVAL
      ) {
        return;
      }

      lastUiUpdate =
        now;

      const completed =
        manifest.size;

      const progress =
        Math.min(
          100,
          Math.round(
            (completed /
              total) *
              100
          )
        );

      if (
        sizedFiles >= 10 &&
        measuredBytes > 0
      ) {
        estimatedTotalBytes =
          (measuredBytes /
            sizedFiles) *
          total;
      }

      const elapsed =
        Math.max(
          (now -
            startedAt) /
            1000,
          0.1
        );

      const speedBps =
        runBytes > 0
          ? runBytes /
            elapsed
          : 0;

      let etaSeconds =
        null;

      if (
        speedBps > 0 &&
        estimatedTotalBytes >
          downloadedBytes
      ) {
        etaSeconds =
          (estimatedTotalBytes -
            downloadedBytes) /
          speedBps;
      } else if (
        runFiles > 0
      ) {
        const filesPerSecond =
          runFiles /
          elapsed;

        if (
          filesPerSecond >
          0
        ) {
          etaSeconds =
            Math.max(
              total -
                completed,
              0
            ) /
            filesPerSecond;
        }
      }

      this.jobs[id] = {
        status:
          "downloading",

        progress,

        completed,

        total,

        downloadedBytes,

        estimatedTotalBytes,

        measuredBytes,

        sizedFiles,

        etaSeconds,

        speedBps,

        failed,
      };

      this.persistJob(
        id
      );

      this.emit();
    };

    try {
      const cache =
        await caches.open(
          CACHE_NAME
        );

      this.jobs[id] = {
        ...this.jobs[id],
        status:
          "downloading",
      };

      this.emit();

      const worker =
        async () => {
          while (true) {
            if (
              this.paused.has(
                id
              ) ||
              fatalError
            ) {
              return;
            }

            const index =
              cursor++;

            if (
              index >=
              total
            ) {
              return;
            }

            const ayah =
              quranAyahs[
                index
              ];

            const url =
              getAudioUrl(
                id,
                ayah.surahNumber,
                ayah.numberInSurah,
                ayah.number
              );

            if (
              manifest.has(
                url
              )
            ) {
              publish();
              continue;
            }

            try {
              const cached =
                await cache.match(
                  url
                );

              if (cached) {
                const added =
                  this.markAyahDownloaded(
                    id,
                    ayah,
                    url,
                    manifest,
                    surahStats
                  );

                if (added) {
                  manifestChanges +=
                    1;
                }

                if (
                  manifestChanges >=
                  MANIFEST_SAVE_INTERVAL
                ) {
                  this.persistManifest(
                    id
                  );

                  manifestChanges =
                    0;
                }

                publish();

                continue;
              }
            } catch {}

            let success =
              false;

            for (
              let attempt = 0;
              attempt < 3 &&
              !success;
              attempt += 1
            ) {
              if (
                this.paused.has(
                  id
                ) ||
                fatalError
              ) {
                return;
              }

              const controller =
                new AbortController();

              this.controllers[
                id
              ].add(
                controller
              );

              try {
                const response =
                  await fetch(
                    url,
                    {
                      signal:
                        controller.signal,
                      cache:
                        "no-store",
                    }
                  );

                if (
                  !response.ok
                ) {
                  throw new Error(
                    `HTTP ${response.status}`
                  );
                }

                const sizeResponse =
                  response.clone();

                const contentLength =
                  Number(
                    sizeResponse.headers.get(
                      "content-length"
                    ) || 0
                  );

                await cache.put(
                  url,
                  response
                );

                let fileBytes =
                  contentLength;

                if (
                  !fileBytes
                ) {
                  try {
                    const blob =
                      await sizeResponse.blob();

                    fileBytes =
                      blob.size;
                  } catch {
                    fileBytes =
                      0;
                  }
                }

                if (
                  fileBytes > 0
                ) {
                  downloadedBytes +=
                    fileBytes;

                  measuredBytes +=
                    fileBytes;

                  sizedFiles +=
                    1;

                  runBytes +=
                    fileBytes;
                }

                runFiles +=
                  1;

                const added =
                  this.markAyahDownloaded(
                    id,
                    ayah,
                    url,
                    manifest,
                    surahStats
                  );

                if (added) {
                  manifestChanges +=
                    1;
                }

                success =
                  true;

                if (
                  manifestChanges >=
                  MANIFEST_SAVE_INTERVAL
                ) {
                  this.persistManifest(
                    id
                  );

                  manifestChanges =
                    0;
                }

                publish();
              } catch (
                err
              ) {
                if (
                  err?.name ===
                    "AbortError" &&
                  this.paused.has(
                    id
                  )
                ) {
                  return;
                }

                const message =
                  String(
                    err?.message ||
                      ""
                  ).toLowerCase();

                if (
                  err?.name ===
                    "QuotaExceededError" ||
                  message.includes(
                    "quota"
                  )
                ) {
                  fatalError =
                    "quota";

                  this.controllers[
                    id
                  ]?.forEach(
                    (
                      activeController
                    ) => {
                      activeController.abort();
                    }
                  );

                  return;
                }

                if (
                  attempt < 2 &&
                  !this.paused.has(
                    id
                  )
                ) {
                  await sleep(
                    450 *
                      2 **
                        attempt +
                      Math.floor(
                        Math.random() *
                          250
                      )
                  );
                }
              } finally {
                this.controllers[
                  id
                ].delete(
                  controller
                );
              }
            }

            if (
              !success &&
              !this.paused.has(
                id
              ) &&
              !fatalError
            ) {
              failed += 1;

              publish();
            }
          }
        };

      await Promise.all(
        Array.from(
          {
            length:
              REQUESTS_PER_RECITER,
          },
          () => worker()
        )
      );

      this.persistManifest(
        id
      );

      this.buildSurahStats(
        id,
        quranAyahs,
        manifest
      );

      if (
        fatalError ===
        "quota"
      ) {
        this.jobs[id] = {
          ...this.jobs[id],

          status:
            "paused",

          completed:
            manifest.size,

          progress:
            Math.round(
              (manifest.size /
                total) *
                100
            ),

          downloadedBytes,

          estimatedTotalBytes,

          measuredBytes,

          sizedFiles,

          etaSeconds: null,

          speedBps: 0,
        };

        this.persistJob(
          id
        );

        this.emit();

        throw new Error(
          "quota"
        );
      }

      if (
        this.paused.has(
          id
        )
      ) {
        this.jobs[id] = {
          ...this.jobs[id],

          status:
            "paused",

          completed:
            manifest.size,

          progress:
            Math.round(
              (manifest.size /
                total) *
                100
            ),

          downloadedBytes,

          estimatedTotalBytes,

          measuredBytes,

          sizedFiles,

          etaSeconds: null,

          speedBps: 0,
        };

        this.persistJob(
          id
        );

        this.emit();

        return;
      }

      if (
        manifest.size ===
          total &&
        failed === 0
      ) {
        localStorage.setItem(
          fullKey(id),
          "true"
        );

        for (
          let surahNumber = 1;
          surahNumber <= 114;
          surahNumber += 1
        ) {
          localStorage.setItem(
            surahKey(
              surahNumber,
              id
            ),
            "true"
          );
        }

        this.jobs[id] = {
          status:
            "complete",

          progress:
            100,

          completed:
            total,

          total,

          downloadedBytes,

          estimatedTotalBytes:
            downloadedBytes ||
            estimatedTotalBytes,

          measuredBytes,

          sizedFiles,

          etaSeconds: 0,

          speedBps: 0,

          failed: 0,
        };
      } else {
        localStorage.removeItem(
          fullKey(id)
        );

        this.jobs[id] = {
          status:
            "paused",

          progress:
            Math.round(
              (manifest.size /
                total) *
                100
            ),

          completed:
            manifest.size,

          total,

          downloadedBytes,

          estimatedTotalBytes,

          measuredBytes,

          sizedFiles,

          etaSeconds: null,

          speedBps: 0,

          failed,
        };
      }

      this.persistJob(
        id
      );

      this.emit();
    } finally {
      this.running.delete(
        id
      );

      this.controllers[
        id
      ] = new Set();

      this.emit();
    }
  }

  async remove(id) {
    this.paused.add(id);

    this.controllers[
      id
    ]?.forEach(
      (controller) => {
        controller.abort();
      }
    );

    const cache =
      await caches.open(
        CACHE_NAME
      );

    const manifest =
      this.manifests[id] ||
      new Set(
        readJson(
          manifestKey(id),
          []
        )
      );

    await Promise.all(
      [...manifest].map(
        (url) =>
          cache.delete(url)
      )
    );

    localStorage.removeItem(
      manifestKey(id)
    );

    localStorage.removeItem(
      fullKey(id)
    );

    localStorage.removeItem(
      jobKey(id)
    );

    for (
      let surah = 1;
      surah <= 114;
      surah += 1
    ) {
      localStorage.removeItem(
        surahKey(
          surah,
          id
        )
      );
    }

    this.manifests[id] =
      new Set();

    this.jobs[id] = {
      status:
        "idle",

      progress: 0,

      completed: 0,

      total:
        this.jobs[id]?.total ||
        0,

      downloadedBytes: 0,

      estimatedTotalBytes: 0,

      measuredBytes: 0,

      sizedFiles: 0,

      etaSeconds: null,

      speedBps: 0,

      failed: 0,
    };

    this.paused.delete(
      id
    );

    this.running.delete(
      id
    );

    this.emit();
  }
}

const audioDownloadManager =
  new AudioDownloadManager();

export default audioDownloadManager;
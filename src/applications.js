(function (root) {
  const STATUSES = [
    { id: "applied", label: "Applied" },
    { id: "rejected", label: "Rejected" },
    { id: "interview", label: "Interview" },
    { id: "accepted", label: "Accepted" },
  ];

  const STATUS_IDS = new Set(STATUSES.map((item) => item.id));

  function clip(value, max) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function createId() {
    if (root.crypto?.randomUUID) return root.crypto.randomUUID();
    return `af${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }

  function canonicalUrl(value) {
    let raw = String(value || "").trim();
    if (!raw) return "";
    if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
      if (!/^[^\s]+\.[^\s]+$/.test(raw)) return "";
      raw = `https://${raw}`;
    }
    try {
      const url = new URL(raw);
      if (url.protocol !== "http:" && url.protocol !== "https:") return "";
      url.hash = "";
      url.hostname = url.hostname.toLowerCase();
      if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
      for (const key of [...url.searchParams.keys()]) {
        if (/^(utm_|fbclid$|gclid$|mc_|gh_src$|ref$|trk$|source$)/i.test(key)) url.searchParams.delete(key);
      }
      url.searchParams.sort();
      return url.href;
    } catch {
      return "";
    }
  }

  function storedUrl(value) {
    const safe = canonicalUrl(value);
    if (safe) return safe;
    const raw = clip(value, 500);
    if (!raw || /^(javascript|data|file|blob):/i.test(raw)) return "";
    return raw;
  }

  function create(partial = {}) {
    const status = STATUS_IDS.has(partial.status) ? partial.status : "applied";
    return {
      id: String(partial.id || createId()),
      title: clip(partial.title, 180),
      company: clip(partial.company, 120),
      location: clip(partial.location, 160),
      date: clip(partial.date, 40),
      posted: clip(partial.posted, 40),
      term: clip(partial.term, 80),
      url: storedUrl(partial.url),
      notes: clip(partial.notes, 2000),
      status,
      addedAt: String(partial.addedAt || new Date().toISOString()),
    };
  }

  function normalize(list) {
    if (!Array.isArray(list)) return [];
    return list.filter((item) => item && typeof item === "object").map((item) => create(item));
  }

  function positionKey(item) {
    const title = clip(item?.title, 180).toLowerCase();
    const company = clip(item?.company, 120).toLowerCase();
    if (!title || !company) return "";
    return `${title}|${company}`;
  }

  function findByUrl(list, url) {
    const key = canonicalUrl(url);
    if (!key) return null;
    return normalize(list).find((item) => canonicalUrl(item.url) === key) || null;
  }

  function findExisting(list, partial) {
    const apps = normalize(list);
    const byUrl = findByUrl(apps, partial?.url);
    if (byUrl) return byUrl;
    const key = positionKey(partial);
    if (!key) return null;
    return apps.find((item) => positionKey(item) === key) || null;
  }

  function mergeReview(existing, scanned) {
    const prior = existing ? create(existing) : null;
    const found = scanned || {};
    return create({
      id: prior?.id,
      addedAt: prior?.addedAt,
      title: found.title || prior?.title || "",
      company: found.company || prior?.company || "",
      location: found.location || prior?.location || "",
      date: prior?.date || found.date || "",
      posted: found.posted || prior?.posted || "",
      term: found.term || prior?.term || "",
      url: found.url || prior?.url || "",
      notes: prior?.notes || found.notes || "",
      status: prior?.status || "applied",
    });
  }

  function upsert(list, partial) {
    const apps = normalize(list);
    const draft = create(partial);
    let index = apps.findIndex((item) => item.id && item.id === draft.id);
    if (index < 0) {
      const existing = findExisting(apps, draft);
      if (existing) index = apps.findIndex((item) => item.id === existing.id);
    }
    if (index >= 0) {
      const prior = apps[index];
      apps[index] = create({
        ...prior,
        ...draft,
        id: prior.id,
        addedAt: prior.addedAt,
        date: draft.date || prior.date,
        notes: partial?.notes != null ? draft.notes : prior.notes,
        status: draft.status || prior.status,
      });
      return apps;
    }
    apps.unshift(draft);
    return apps;
  }

  root.ApplyFillApplications = {
    STATUSES,
    create,
    normalize,
    findByUrl,
    findExisting,
    positionKey,
    mergeReview,
    upsert,
    canonicalUrl,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

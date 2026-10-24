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
      url.hostname = url.hostname.toLowerCase();
      if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
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

  function findByUrl(list, url) {
    const key = canonicalUrl(url);
    if (!key) return null;
    return normalize(list).find((item) => canonicalUrl(item.url) === key) || null;
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
    const byId = apps.findIndex((item) => item.id === draft.id);
    if (byId >= 0) {
      apps[byId] = create({ ...apps[byId], ...draft, id: apps[byId].id, addedAt: apps[byId].addedAt });
      return apps;
    }
    const key = canonicalUrl(draft.url);
    if (key) {
      const byUrl = apps.findIndex((item) => canonicalUrl(item.url) === key);
      if (byUrl >= 0) {
        apps[byUrl] = create({ ...apps[byUrl], ...draft, id: apps[byUrl].id, addedAt: apps[byUrl].addedAt });
        return apps;
      }
    }
    apps.unshift(draft);
    return apps;
  }

  root.ApplyFillApplications = {
    STATUSES,
    create,
    normalize,
    findByUrl,
    mergeReview,
    upsert,
    canonicalUrl,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

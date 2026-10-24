(function (root) {
  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function todayISO(now) {
    const date = now instanceof Date ? now : new Date();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  }

  const MONTHS = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  };

  function parseHumanDate(value) {
    const raw = clean(value);
    if (!raw) return "";
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const named = raw.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(20\d{2})\b/i);
    if (named) {
      return `${named[3]}-${MONTHS[named[1].toLowerCase()]}-${String(named[2]).padStart(2, "0")}`;
    }
    const slash = raw.match(/\b(0?[1-9]|1[0-2])[/\-.](0?[1-9]|[12]\d|3[01])[/\-.](20\d{2})\b/);
    if (slash) return `${slash[3]}-${slash[1].padStart(2, "0")}-${slash[2].padStart(2, "0")}`;
    return "";
  }

  function textOf(el) {
    if (!el) return "";
    return clean(el.innerText || el.textContent || "");
  }

  function metaContent(doc, selector) {
    return clean(doc.querySelector(selector)?.getAttribute("content") || "");
  }

  function flattenJson(data, out) {
    if (!data || typeof data !== "object") return;
    if (Array.isArray(data)) {
      data.forEach((item) => flattenJson(item, out));
      return;
    }
    out.push(data);
    if (data["@graph"]) flattenJson(data["@graph"], out);
  }

  function isJobPosting(node) {
    const type = node?.["@type"];
    const types = Array.isArray(type) ? type : [type];
    return types.some((item) => String(item || "").toLowerCase().replace(/\s+/g, "") === "jobposting");
  }

  function readJsonLd(doc) {
    const nodes = [];
    for (const script of doc.querySelectorAll("script[type='application/ld+json']")) {
      try {
        flattenJson(JSON.parse(script.textContent), nodes);
      } catch {
        // Broken JSON-LD should not block the rest of the scan.
      }
    }
    return nodes.find(isJobPosting) || null;
  }

  function hiringName(org) {
    if (!org) return "";
    if (typeof org === "string") return clean(org);
    if (Array.isArray(org)) return hiringName(org[0]);
    return clean(org.name || "");
  }

  function placeName(loc) {
    if (!loc) return "";
    if (typeof loc === "string") return clean(loc);
    if (Array.isArray(loc)) return loc.map(placeName).filter(Boolean).join(" · ");
    if (loc.name && !loc.address) return clean(loc.name);
    const addr = loc.address || loc;
    if (typeof addr === "string") return clean(addr);
    const country = addr.addressCountry;
    const countryName = typeof country === "string" ? country : country?.name || "";
    return clean([addr.addressLocality, addr.addressRegion, countryName].filter(Boolean).join(", "));
  }

  function firstText(doc, selectors) {
    for (const selector of selectors) {
      for (const node of doc.querySelectorAll(selector)) {
        const text = textOf(node);
        if (text && text.length <= 180) return text;
      }
    }
    return "";
  }

  const GENERIC_TITLE = /^(careers|jobs|job search|application|apply|search|home|open positions|internships)$/i;

  function stripSiteSuffix(value) {
    return clean(value)
      .replace(/\s*[|\-–—]\s*(greenhouse|lever|workday|linkedin|indeed|handshake|ashby|tesla careers|careers)\s*$/i, "")
      .replace(/^job application for\s+/i, "");
  }

  function splitRoleAtCompany(value) {
    const text = clean(value);
    const match = text.match(/^(.+?)\s+at\s+(.+)$/i);
    if (!match) return { title: text, company: "" };
    if (match[1].length < 4 || match[1].length > 120 || match[2].length > 80) return { title: text, company: "" };
    if (/^(greenhouse|lever|linkedin|indeed)$/i.test(match[2])) return { title: text, company: "" };
    return { title: clean(match[1]), company: clean(match[2]) };
  }

  function titleCaseSlug(slug) {
    return clean(decodeURIComponent(slug).replace(/[-_]+/g, " "))
      .split(" ")
      .filter(Boolean)
      .map((part) => (part.length <= 2 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
      .join(" ");
  }

  function companyFromHost(href) {
    let url;
    try {
      url = new URL(href);
    } catch {
      return "";
    }
    const host = url.hostname.replace(/^www\./, "");
    const forParam = url.searchParams.get("for");
    if (forParam) return titleCaseSlug(forParam);
    const path = url.pathname.split("/").filter(Boolean);
    const slugHosts = [/greenhouse\.io$/i, /lever\.co$/i, /ashbyhq\.com$/i];
    if (slugHosts.some((test) => test.test(host)) && path[0] && !/^(jobs|job|embed|job_app|v)$/i.test(path[0])) {
      return titleCaseSlug(path[0]);
    }
    const employers = [
      [/tesla\.com$/i, "Tesla"],
      [/spacex\.com$/i, "SpaceX"],
      [/nvidia\.com$/i, "NVIDIA"],
    ];
    for (const [test, name] of employers) {
      if (test.test(host)) return name;
    }
    return "";
  }

  function companyFromBanner(text) {
    const parts = clean(text).split(/\s+[·|]\s+/);
    if (parts.length < 2) return "";
    if (parts[0].length < 2 || parts[0].length > 80) return "";
    if (GENERIC_TITLE.test(parts[0])) return "";
    return parts[0];
  }

  function companyFromDocumentTitle(docTitle, heading) {
    const raw = stripSiteSuffix(docTitle);
    const headingText = clean(heading);
    if (!raw || !headingText) return "";
    const parts = raw.split(/\s+[|–—]\s+|\s+-\s+/).map(clean).filter(Boolean);
    if (parts.length < 2) return "";
    const role = parts.find((part) => {
      const lower = part.toLowerCase();
      const head = headingText.toLowerCase();
      return lower === head || lower.includes(head) || head.includes(lower);
    });
    const company = parts.find((part) => part !== role);
    if (!company || /greenhouse|lever|linkedin|indeed|jobs|careers|handshake|ashby/i.test(company)) return "";
    return company;
  }

  function pickTitle(doc, job) {
    const fromLd = clean(job?.title);
    if (fromLd && !GENERIC_TITLE.test(fromLd)) return fromLd.slice(0, 160);
    const heading = firstText(doc, [
      "[data-automation-id='jobPostingHeader']",
      "[data-testid='job-title']",
      "[data-qa='posting-name']",
      ".posting-headline h2",
      ".jobsearch-JobInfoHeader-title",
      "h1.job-title",
      ".job-title",
      "header h1",
      "h1",
    ]);
    if (heading && !GENERIC_TITLE.test(heading)) return heading.slice(0, 160);
    const og = splitRoleAtCompany(stripSiteSuffix(metaContent(doc, "meta[property='og:title']") || doc.title || ""));
    return og.title.slice(0, 160);
  }

  function pickCompany(doc, href, job, title) {
    const fromLd = hiringName(job?.hiringOrganization);
    if (fromLd) return fromLd.slice(0, 120);
    const labeled = firstText(doc, [
      "[data-company]",
      "[data-company-name]",
      "[data-testid='company-name']",
      "[data-qa='company-name']",
      ".company-name",
      ".posting-headline .company",
    ]);
    if (labeled && !GENERIC_TITLE.test(labeled)) return labeled.slice(0, 120);
    const banner = companyFromBanner(textOf(doc.querySelector("header.banner p, header .company, .banner .kicker")));
    if (banner) return banner.slice(0, 120);
    const fromTitle = companyFromDocumentTitle(doc.title, title);
    if (fromTitle) return fromTitle.slice(0, 120);
    const og = splitRoleAtCompany(stripSiteSuffix(metaContent(doc, "meta[property='og:title']") || ""));
    if (og.company) return og.company.slice(0, 120);
    const site = metaContent(doc, "meta[property='og:site_name']");
    if (site && !/greenhouse|lever|workday|linkedin|indeed|handshake|ashby/i.test(site)) return site.slice(0, 120);
    return companyFromHost(href).slice(0, 120);
  }

  function pickLocation(doc, job) {
    const fromLd = placeName(job?.jobLocation);
    if (fromLd) return fromLd.slice(0, 160);
    if (/TELECOMMUTE/i.test(String(job?.jobLocationType || ""))) return "Remote";
    const labeled = firstText(doc, [
      "[data-automation-id='locations']",
      "[data-testid='job-location']",
      "[data-qa='posting-location']",
      ".job-location",
      ".location",
      ".posting-categories .location",
    ]);
    if (labeled && !/^location$/i.test(labeled)) return labeled.slice(0, 160);
    const blob = textOf(doc.body).slice(0, 5000);
    const match = blob.match(/\bLocation\s*[:\-]\s*([^\n.]{2,80})/i);
    return match ? clean(match[1]).slice(0, 160) : "";
  }

  function pickPosted(doc, job) {
    const fromLd = parseHumanDate(job?.datePosted);
    if (fromLd) return fromLd;
    const timeEl = doc.querySelector("time[datetime]");
    const fromTime = parseHumanDate(timeEl?.getAttribute("datetime") || textOf(timeEl));
    if (fromTime) return fromTime;
    const blob = textOf(doc.body).slice(0, 8000);
    const match = blob.match(/\b(?:posted|date posted|published)\s*(?:on)?\s*[:\-]?\s*([A-Za-z]+\s+\d{1,2},?\s+20\d{2}|\d{4}-\d{2}-\d{2})/i);
    return match ? parseHumanDate(match[1]) : "";
  }

  function pickDeadline(job) {
    return parseHumanDate(job?.validThrough);
  }

  function pickTerm(doc, job, title) {
    const type = job?.employmentType;
    const types = Array.isArray(type) ? type.join(" ") : String(type || "");
    const header = [title, textOf(doc.querySelector("header")).slice(0, 500), types].join(" ");
    const season = header.match(/\b(summer|fall|autumn|winter|spring)\s+(20\d{2})\b/i);
    if (season) {
      const word = season[1].toLowerCase() === "autumn" ? "fall" : season[1].toLowerCase();
      return `${word.charAt(0).toUpperCase()}${word.slice(1)} ${season[2]}`;
    }
    if (/intern/i.test(types) || /\bintern(ship)?\b/i.test(title)) return "Internship";
    return "";
  }

  function scanPosting(doc, href, now) {
    const job = readJsonLd(doc);
    const title = pickTitle(doc, job);
    const pageUrl = href || doc.URL || "";
    const company = pickCompany(doc, pageUrl, job, title);
    const location = pickLocation(doc, job);
    const posted = pickPosted(doc, job);
    const deadline = pickDeadline(job);
    const term = pickTerm(doc, job, title);
    const notes = deadline ? `Deadline: ${deadline}` : "";
    return {
      title,
      company,
      location,
      date: todayISO(now || new Date()),
      posted,
      term,
      url: pageUrl,
      notes,
    };
  }

  root.ApplyFillScan = { scanPosting, parseHumanDate, todayISO };
})(typeof globalThis !== "undefined" ? globalThis : window);

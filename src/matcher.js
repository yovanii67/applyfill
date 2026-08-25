(function (root) {
  const AUTOCOMPLETE = {
    "given-name": "firstName",
    "additional-name": "middleName",
    "family-name": "lastName",
    "nickname": "preferredName",
    "name": "fullName",
    "email": "email",
    "tel": "phone",
    "tel-national": "phone",
    "street-address": "street",
    "address-line1": "street",
    "address-level2": "city",
    "address-level1": "state",
    "postal-code": "zip",
    "country": "country",
    "country-name": "country",
    "organization": "school",
    "url": "website",
  };

  const ALIASES = {
    firstName: [
      "first name", "firstname", "first_name", "given name", "given names", "givenname", "fname",
      "legal first", "legal first name", "preferred first", "forename", "legalname first", "applicant first",
    ],
    middleName: ["middle name", "middlename", "middle_name", "middle initial", "mi"],
    lastName: [
      "last name", "lastname", "last_name", "family name", "family names", "surname", "lname",
      "legal last", "legal last name", "familyname",
    ],
    preferredName: ["preferred name", "preferredname", "nick name", "nickname", "goes by", "chosen name"],
    fullName: [
      "full name", "fullname", "legal name", "your name", "applicant name", "candidate name",
      "print your name", "signature name",
    ],
    pronouns: ["pronouns", "personal pronouns"],
    email: ["email", "e-mail", "email address", "work email", "school email", "contact email"],
    phone: ["phone", "telephone", "mobile", "cell", "phone number", "mobile number", "cell phone"],
    street: [
      "street", "address", "address 1", "address line 1", "address line one",
      "street address", "home address", "address line1",
    ],
    city: ["city", "town", "locality"],
    state: ["state", "province", "region", "state/province", "state or region"],
    zip: ["zip", "zip code", "postal", "postal code", "postcode", "zip postal"],
    country: [
      "country", "country/region", "country region of residence", "nation", "select country",
      "country of residence", "home country",
    ],
    school: [
      "school", "university", "college", "institution", "current school",
      "education institution", "university name", "current university", "school name",
    ],
    degree: ["degree", "degree type", "qualification", "degree name"],
    major: ["major", "field of study", "area of study", "concentration", "discipline", "study field", "primary major"],
    minor: ["minor"],
    gpa: ["gpa", "grade point", "cumulative gpa", "current gpa"],
    classYear: ["class year", "academic standing", "year in school", "classification", "freshman", "sophomore", "junior", "senior", "year of study"],
    campus: ["which campus", "campus location", "university campus", "preferred campus"],
    gradMonth: ["graduation month", "grad month"],
    gradYear: ["graduation year", "grad year", "year of graduation", "expected year"],
    graduationDate: [
      "graduation date", "grad date", "expected graduation", "graduation",
      "date of graduation", "anticipated graduation", "anticipated graduation date",
      "expected grad", "when do you graduate",
    ],
    linkedin: ["linkedin", "linked in", "linkedin url", "linkedin profile"],
    github: ["github", "git hub", "github url"],
    portfolio: ["portfolio", "portfolio url", "personal portfolio", "behance"],
    website: ["website", "personal website", "homepage", "personal url", "other website"],
    workAuth: [
      "authorized to work", "work authorization", "legally authorized", "eligible to work",
      "work authorised", "us work", "right to work", "lawfully authorized",
      "authorized to work lawfully", "legally authorized to work in the united states",
    ],
    sponsorship: [
      "sponsorship", "require sponsorship", "need sponsorship", "visa sponsorship",
      "will you now or in the future require", "immigration sponsorship",
      "immigration sponsorship for employment", "require visa", "future require sponsorship",
      "sponsorship for employment visa",
    ],
    startDate: [
      "start date", "available date", "earliest start", "availability date", "when can you start",
      "earliest available", "available to start",
    ],
    internStartDate: [
      "available to start an internship", "when are you available to start an internship",
      "start an internship",
    ],
    internMonths: [
      "how many months are you available", "months are you available for an internship",
      "at least three months", "internship must be at least", "internship duration",
      "length of internship", "how long can you intern", "available for an internship",
    ],
    internFullTime: [
      "available for a full-time internship", "full-time internship", "only full-time positions",
      "intern full time", "full time intern",
    ],
    internThesis: ["thesis or report", "write a thesis", "report for your university"],
    internTerm: ["internship term", "which term", "summer intern", "fall intern", "spring intern", "winter intern", "internship season", "internship period"],
    hoursPerWeek: ["hours per week", "how many hours", "weekly hours", "hours a week", "expected hours"],
    noticePeriod: ["availability or notice period", "notice period", "when are you available"],
    over18: ["18 years of age", "18 years or older", "at least 18", "over 18", "are you 18"],
    previouslyApplied: ["previously applied", "applied before", "applied to this company", "applied to this position"],
    teslaOtherJobs: [
      "consider me for other job", "other job opportunities", "next 36 months",
      "within tesla in addition",
    ],
    teslaPreviouslyEmployed: ["previously been employed by tesla", "previously been employed"],
    teslaFormerIntern: [
      "former/current intern", "former current intern", "intern or contractor",
      "former current intern or contractor",
    ],
    currentStudent: [
      "are you a current university student", "current university student",
      "enrolled in an academic program during the internship", "currently enrolled",
      "are you a student", "current student", "student status",
    ],
    smsConsent: [
      "consent to receiving text", "receiving text messages", "text messages throughout your application",
    ],
    eeoAcknowledge: [
      "equal employee opportunities", "acknowledge that i have read",
    ],
    teslaTerms: [
      "accept them as conditions of employment", "conditions of employment",
      "statements above and accept", "read and understand the statements above",
    ],
    agreeTerms: [
      "i have read and agree", "agree to the terms", "terms and conditions",
      "privacy policy", "i certify that the information", "acknowledge and agree",
    ],
    gender: ["gender", "gender identity", "sex"],
    veteranStatus: ["veteran status", "protected veteran"],
    raceEthnicity: ["race/ethnicity", "race or ethnicity", "ethnicity"],
    disability: [
      "disability", "do not have a disability", "have not had one in the past",
    ],
    phoneType: ["contact phone type", "phone type", "phone device type", "select type", "contact phone"],
    desiredRole: ["desired role", "job title", "role applying", "desired title"],
    locationPref: ["preferred location", "desired location", "location preference", "job location"],
    howHeard: ["how did you hear", "how you heard", "referral source", "hear about", "how did you hear about this job", "how did you hear about us"],
    referralName: ["referral name", "referred by", "who referred", "employee referral", "name of referrer"],
    relocate: ["relocate", "willing to relocate", "open to relocation"],
    languages: ["languages spoken", "language proficiency", "languages"],
    summary: ["summary", "about you", "cover note", "additional information", "bio", "tell us about"],
  };

  const PRIORITY = [
    "email", "phone", "phoneType", "firstName", "lastName", "fullName", "linkedin", "github",
    "internMonths", "internFullTime", "internThesis", "internTerm", "noticePeriod", "over18",
    "teslaOtherJobs", "sponsorship", "teslaPreviouslyEmployed", "teslaFormerIntern", "currentStudent",
    "smsConsent", "eeoAcknowledge", "teslaTerms", "agreeTerms", "gender", "veteranStatus", "raceEthnicity", "disability",
    "gpa", "workAuth", "classYear", "campus", "hoursPerWeek", "previouslyApplied", "referralName", "languages",
  ];

  const ATS_HOSTS = [
    { id: "tesla", test: /tesla\.com/i, label: "Tesla" },
    { id: "greenhouse", test: /greenhouse\.io|boards\.greenhouse/i, label: "Greenhouse" },
    { id: "lever", test: /lever\.co|jobs\.lever/i, label: "Lever" },
    { id: "workday", test: /myworkdayjobs\.com|workday\.com/i, label: "Workday" },
    { id: "ashby", test: /ashbyhq\.com/i, label: "Ashby" },
    { id: "icims", test: /icims\.com/i, label: "iCIMS" },
    { id: "smartrecruiters", test: /smartrecruiters\.com/i, label: "SmartRecruiters" },
    { id: "jobvite", test: /jobvite\.com/i, label: "Jobvite" },
    { id: "taleo", test: /taleo\.net/i, label: "Taleo" },
    { id: "linkedin", test: /linkedin\.com/i, label: "LinkedIn" },
    { id: "indeed", test: /indeed\.com/i, label: "Indeed" },
    { id: "handshake", test: /joinhandshake\.com|handshake/i, label: "Handshake" },
    { id: "workable", test: /workable\.com/i, label: "Workable" },
    { id: "breezy", test: /breezy\.hr/i, label: "Breezy" },
    { id: "rippling", test: /rippling\.com/i, label: "Rippling" },
    { id: "gem", test: /gem\.com/i, label: "Gem" },
    { id: "eightfold", test: /eightfold\.ai/i, label: "Eightfold" },
  ];

  function splitIdent(value) {
    return String(value || "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .replace(/([a-zA-Z])(\d)/g, "$1 $2")
      .replace(/(\d)([a-zA-Z])/g, "$1 $2");
  }

  function normalize(value) {
    return splitIdent(value)
      .toLowerCase()
      .replace(/[_./#:[\]()]+/g, " ")
      .replace(/[^a-z0-9+ ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function detectPlatform(href) {
    const url = href || (typeof location !== "undefined" ? location.href : "");
    const hit = ATS_HOSTS.find((item) => item.test.test(url));
    return hit || { id: "generic", label: "This site", test: /./ };
  }

  function stripYesNo(text) {
    return String(text || "")
      .replace(/\b(yes|no)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function usefulQuestion(text) {
    const t = stripYesNo(text);
    if (t.length < 6 || t.length > 420) return "";
    return t.slice(0, 320);
  }

  function shortCaption(text) {
    const t = stripYesNo(String(text || "").split("\n")[0]);
    if (t.length >= 3 && t.length <= 48) return t;
    return "";
  }

  function yesNoCount(node) {
    const bits = [...node.querySelectorAll("input[type='radio'], [role='radio'], label, button, span")];
    let count = 0;
    for (const item of bits) {
      const cap = (item.value || item.getAttribute("aria-label") || item.innerText || "").replace(/\s+/g, " ").trim();
      if (/^(yes|no)$/i.test(cap)) count += 1;
    }
    return count;
  }

  function nearbyQuestion(el) {
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const joined = labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.innerText || "").join(" ");
      const t = shortCaption(joined) || usefulQuestion(joined);
      if (t) return t;
    }

    let node = el;
    for (let i = 0; i < 10 && node && node !== document.body; i += 1) {
      const prev = node.previousElementSibling;
      if (prev && !prev.matches("input, select, textarea")) {
        const t = shortCaption(prev.innerText) || usefulQuestion(prev.innerText);
        if (t && prev.innerText.length < 480) return t;
      }
      const parent = node.parentElement;
      if (parent) {
        for (const child of parent.children) {
          if (child === node) break;
          if (child.contains(el)) continue;
          const t = shortCaption(child.innerText) || usefulQuestion(child.innerText);
          if (t && child.innerText.length < 480) return t;
        }
      }
      node = parent;
    }

    node = el.parentElement;
    for (let i = 0; i < 8 && node && node !== document.body; i += 1) {
      const choices = yesNoCount(node);
      const text = usefulQuestion(node.innerText);
      if (text && node.innerText.length < 520 && choices > 0 && choices <= 4) return text;
      node = node.parentElement;
    }
    return "";
  }

  function ancestorHints(el) {
    const bits = [];
    let node = el;
    for (let i = 0; i < 8 && node && node !== document.body; i += 1) {
      bits.push(node.getAttribute("data-automation-id"));
      bits.push(node.getAttribute("data-automation-label"));
      bits.push(node.getAttribute("data-uxi-element-id"));
      bits.push(node.id);
      node = node.parentElement;
    }
    return bits.filter(Boolean).join(" ");
  }

  function blobFor(el) {
    const id = el.id || "";
    const labelledBy = el.getAttribute("aria-labelledby");
    const labelledText = labelledBy
      ? labelledBy.split(/\s+/).map((item) => document.getElementById(item)?.innerText || "").join(" ")
      : "";
    const labelNode = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
    const wrappingLabel = el.closest("label");
    const wrapText = wrappingLabel ? usefulQuestion(wrappingLabel.innerText) : "";
    return normalize([
      el.getAttribute("autocomplete"),
      el.getAttribute("name"),
      el.id,
      el.getAttribute("placeholder"),
      el.getAttribute("aria-label"),
      el.getAttribute("data-automation-id"),
      ancestorHints(el),
      el.getAttribute("data-testid"),
      el.title,
      shortCaption(labelledText),
      usefulQuestion(labelledText),
      labelNode ? shortCaption(labelNode.innerText) : "",
      labelNode ? usefulQuestion(labelNode.innerText) : "",
      wrappingLabel ? shortCaption(wrappingLabel.innerText) : "",
      wrapText,
      nearbyQuestion(el),
    ].join(" "));
  }

  function sectionFor(el) {
    const fieldset = el.closest("fieldset");
    const legend = fieldset?.querySelector("legend");
    if (legend?.innerText.trim()) return legend.innerText.trim();

    const group = el.closest("[aria-label][role='group'], [data-automation-id*='section' i], section");
    const groupLabel = group?.getAttribute("aria-label") || group?.querySelector("h1,h2,h3,h4,legend,.section-header")?.innerText;
    if (groupLabel) return groupLabel.trim().slice(0, 48);

    let node = el.parentElement;
    for (let i = 0; i < 8 && node; i += 1) {
      const heading = node.querySelector(":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > .section-title, :scope > legend");
      if (heading?.innerText.trim()) return heading.innerText.trim().slice(0, 48);
      node = node.parentElement;
    }
    if (/tesla\.com/i.test(typeof location !== "undefined" ? location.href : "")) return "Tesla";
    return "Application";
  }

  function hasNeedle(haystack, n) {
    if (haystack === n) return true;
    if (n.length <= 8) {
      const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(?:^| )${escaped}(?: |$)`).test(haystack);
    }
    return haystack.includes(n);
  }

  function score(haystack, needle) {
    const n = normalize(needle);
    if (!haystack || !n) return 0;
    if (haystack === n) return 120;
    if (hasNeedle(haystack, n)) return 80 + Math.min(24, n.length);
    const parts = n.split(" ").filter(Boolean);
    if (parts.length > 1 && parts.every((part) => hasNeedle(haystack, part))) return 58 + Math.min(12, n.length);
    return 0;
  }

  const LABEL_HINTS = [
    { key: "firstName", test: /\b(given name|given names|first name|legal first)\b/ },
    { key: "lastName", test: /\b(family name|family names|last name|legal last|surname)\b/ },
    { key: "middleName", test: /\b(middle name|middle initial)\b/ },
    { key: "street", test: /\b(address line 1|address line one|address 1|street address)\b/ },
    { key: "email", test: /\b(e ?mail|email address)\b/ },
    { key: "phone", test: /\b(phone number|telephone|mobile number|cell phone)\b/ },
    { key: "zip", test: /\b(zip code|postal code|postcode)\b/ },
    { key: "fullName", test: /\b(full name|legal name)\b/ },
  ];

  const AUTOMATION_HINTS = [
    { key: "firstName", test: /firstName|givenName|legalName--firstName|legalNameSection--firstName/i },
    { key: "lastName", test: /lastName|familyName|legalName--lastName|legalNameSection--lastName/i },
    { key: "middleName", test: /middleName|legalName--middleName/i },
    { key: "street", test: /addressLine1|addressLineOne|address--addressLine1/i },
    { key: "city", test: /address--city|(?:--|-)city$/i },
    { key: "state", test: /countryRegion|stateProvince|address--countryRegion/i },
    { key: "zip", test: /postalCode|zipCode|address--postalCode/i },
    { key: "country", test: /countryDropdown|address--country(?!Region)|(?:--|-)country(?:--|\s|$)/i },
    { key: "email", test: /emailAddress|(?:--|-)email$/i },
    { key: "phone", test: /phoneNumber|phone--phoneNumber/i },
  ];

  function hintFromLabel(haystack) {
    if (!haystack) return null;
    if (/\baddress line (2|two|3|three)\b/.test(haystack)) return null;
    if (/\bcountry of birth\b/.test(haystack)) return null;
    for (const hint of LABEL_HINTS) {
      if (!hint.test.test(haystack)) continue;
      if (hint.key === "street" && /\bemail\b/.test(haystack)) continue;
      if (hint.key === "fullName" && /\b(given|first|last|family)\b/.test(haystack)) continue;
      if (hint.key === "country" && /\b(birth|citizenship)\b/.test(haystack)) continue;
      return hint.key;
    }
    if (/\baddress\b/.test(haystack) && !/\b(email|line 2|line two|country)\b/.test(haystack)) return "street";
    return null;
  }

  function hintFromAutomation(el) {
    const blob = ancestorHints(el);
    if (!blob) return null;
    if (/addressLine2|addressLineTwo|address--addressLine2/i.test(blob)) return null;
    for (const hint of AUTOMATION_HINTS) {
      if (hint.test.test(blob)) return hint.key;
    }
    return null;
  }

  const DATE_KEYS = new Set(["internStartDate", "graduationDate", "startDate"]);
  const DROPDOWN_KEYS = new Set([
    "phoneType", "country", "internMonths", "internFullTime", "noticePeriod",
    "internTerm", "classYear", "gender", "veteranStatus", "raceEthnicity", "disability", "workAuth",
    "howHeard", "relocate",
  ]);
  const YES_NO_KEYS = new Set([
    "internThesis", "teslaOtherJobs", "teslaPreviouslyEmployed", "teslaFormerIntern",
    "currentStudent", "smsConsent", "eeoAcknowledge", "teslaTerms", "agreeTerms",
    "sponsorship", "workAuth", "relocate", "over18", "previouslyApplied",
  ]);
  const AGREEMENT_KEYS = new Set(["eeoAcknowledge", "teslaTerms", "agreeTerms"]);

  function classText(el) {
    return `${el.className || ""} ${el.getAttribute("class") || ""}`.toString().toLowerCase();
  }

  function isRadioLike(el) {
    const role = (el.getAttribute("role") || "").toLowerCase();
    const type = (el.type || "").toLowerCase();
    if (type === "radio" || type === "checkbox") return true;
    if (role === "radio" || role === "checkbox") return true;
    return false;
  }

  function isYesNoChoice(el) {
    if (isRadioLike(el)) return true;
    const cap = (el.value || el.getAttribute("aria-label") || el.innerText || "").replace(/\s+/g, " ").trim();
    if (/^(yes|no)$/i.test(cap) && (el.closest("label") || el.tagName === "LABEL" || el.tagName === "BUTTON")) return true;
    return false;
  }

  function isChooser(el) {
    if (isRadioLike(el)) return false;
    const role = (el.getAttribute("role") || "").toLowerCase();
    const popup = (el.getAttribute("aria-haspopup") || "").toLowerCase();
    const cls = classText(el);
    if (role === "combobox" || role === "listbox") return true;
    if (popup === "listbox" || popup === "menu" || popup === "true") return true;
    if (el.getAttribute("aria-expanded") != null && el.tagName !== "INPUT") return true;
    if (/dropdown|combobox|select-input|tds-select|form-select|react-select/.test(cls)) return true;
    const autoId = el.getAttribute("data-automation-id") || "";
    if (/dropdown|selectOne|promptSelection/i.test(autoId) && el.tagName !== "INPUT") return true;
    if (isSelectPlaceholder(el)) return true;
    return false;
  }

  function isSelectPlaceholder(el) {
    const t = `${el.innerText || ""} ${el.value || ""} ${el.placeholder || ""}`.replace(/\s+/g, " ").trim();
    if (t.length > 48) return false;
    return /^[-–—\s]*select\b/i.test(t);
  }

  function isHiddenish(el) {
    const style = el.ownerDocument?.defaultView?.getComputedStyle(el);
    if (!style) return false;
    if (style.opacity === "0" || style.fontSize === "0px") return true;
    if (style.position === "absolute" && (el.offsetWidth < 4 || el.offsetHeight < 4)) return true;
    if (/rect\(\s*0|inset\(50%/.test(`${style.clip || ""} ${style.clipPath || ""}`)) return true;
    return false;
  }

  function isAgreeWidget(el) {
    if (!el || isChooser(el) || el.tagName === "SELECT" || el.tagName === "TEXTAREA") return false;
    const type = (el.type || "").toLowerCase();
    if (["text", "email", "tel", "url", "number", "password"].includes(type)) return false;
    if (type === "checkbox" || (el.getAttribute("role") || "").toLowerCase() === "checkbox") return true;
    if (/checkbox|check-box|form-check/i.test(classText(el))) return true;
    if (el.tagName === "LABEL") return true;
    return false;
  }

  function isDateControl(el) {
    const type = (el.type || "").toLowerCase();
    if (["date", "datetime-local", "month"].includes(type)) return true;
    const cls = classText(el);
    const hint = `${cls} ${el.getAttribute("placeholder") || ""} ${el.getAttribute("aria-label") || ""}`.toLowerCase();
    if (/datepicker|date-picker|date_picker|calendar/.test(hint)) return true;
    const wrap = el.closest("[class*='date' i], [class*='calendar' i]");
    if (wrap && /date|calendar/.test(classText(wrap))) return true;
    if (el.parentElement?.querySelector("[class*='calendar' i], [aria-label*='calendar' i], [aria-label*='choose date' i]")) return true;
    return false;
  }

  function matchField(el) {
    if (!el || el.disabled) return null;
    const type = (el.type || "").toLowerCase();
    const chooser = isChooser(el);
    const dateLike = isDateControl(el);
    const radioLike = isRadioLike(el);
    if (dateLike || DATE_KEYS.has(el.getAttribute("data-applyfill") || "")) return null;
    if (el.readOnly && !chooser && !radioLike) return null;
    if (["hidden", "password", "file", "submit", "image", "reset", "search", "color"].includes(type)) {
      return null;
    }
    if ((type === "button" || el.tagName === "BUTTON") && !chooser && !dateLike && !radioLike) {
      const text = (el.innerText || "").trim();
      if (/^(next|submit|previous|cancel|select file|add profile|save)$/i.test(text)) return null;
      if (!/dropdown|select/.test(classText(el)) && el.getAttribute("aria-haspopup") == null) return null;
    }

    const haystack = blobFor(el);
    if (/\baddress line (2|two|3|three)\b/.test(haystack)) return null;

    const autoKey = hintFromAutomation(el);
    if (autoKey) return { key: autoKey, via: "automation", section: sectionFor(el) };

    const labelKey = hintFromLabel(haystack);
    if (labelKey) return { key: labelKey, via: "label", section: sectionFor(el) };

    if (/\blegal name\b/.test(haystack) && !/\b(legal first|legal last|given name|family name)\b/.test(haystack)) {
      return { key: "fullName", via: "label", section: sectionFor(el) };
    }
    if (/\b(e-?mail)\b/.test(haystack) && !/\b(email type|phone type)\b/.test(haystack) && (type === "email" || type === "text" || type === "" && el.tagName === "INPUT")) {
      return { key: "email", via: "label", section: sectionFor(el) };
    }

    const auto = (el.getAttribute("autocomplete") || "").toLowerCase().split(" ").pop();
    if (AUTOCOMPLETE[auto]) {
      return {
        key: AUTOCOMPLETE[auto],
        via: "autocomplete",
        section: sectionFor(el),
      };
    }
    if (type === "email") return { key: "email", via: "type", section: sectionFor(el) };
    if (type === "tel") return { key: "phone", via: "type", section: sectionFor(el) };
    if (/e-?mail/i.test(`${el.getAttribute("name") || ""} ${el.id || ""}`) && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
      return { key: "email", via: "name", section: sectionFor(el) };
    }

    if (!haystack) return null;

    if ((chooser || el.tagName === "SELECT") && /\b(contact phone type|phone type|select type)\b/.test(haystack) && !/\b(email|gender|veteran|disability)\b/.test(haystack)) {
      return { key: "phoneType", via: "label", section: sectionFor(el) };
    }

    if ((chooser || el.tagName === "SELECT") && /\bgender\b/.test(haystack) && !/\b(veteran|race|ethnicity|disability)\b/.test(haystack)) {
      return { key: "gender", via: "label", section: sectionFor(el) };
    }

    let best = null;
    for (const [key, aliases] of Object.entries(ALIASES)) {
      if (key === "internStartDate") continue;
      if (key === "street" && /\baddress line (2|two|3|three)\b/.test(haystack)) continue;
      if (AGREEMENT_KEYS.has(key) && !isAgreeWidget(el)) continue;
      for (const alias of aliases) {
        const value = score(haystack, alias);
        if (value && (!best || value > best.score || (value === best.score && PRIORITY.indexOf(key) < PRIORITY.indexOf(best.key)))) {
          best = { key, score: value, via: "label", section: sectionFor(el) };
        }
      }
    }
    if (!best || best.score < 55) return null;
    return best;
  }

  function collectPlaceholderSelects(doc) {
    const hits = [];
    const nodes = doc.querySelectorAll("div, button, span, input, select, p");
    for (const el of nodes) {
      if (!isSelectPlaceholder(el)) continue;
      if ([...el.querySelectorAll("div, button, span, input, select")].some((child) => isSelectPlaceholder(child))) continue;
      hits.push(el);
    }
    return hits;
  }

  function controlRank(el) {
    const role = (el.getAttribute("role") || "").toLowerCase();
    const type = (el.type || "").toLowerCase();
    if (type === "radio" || type === "checkbox" || role === "radio" || role === "checkbox") return 5;
    if (el.tagName === "SELECT" || role === "combobox") return 4;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return 4;
    if (isChooser(el)) return 3;
    if (isDateControl(el)) return 2;
    return 1;
  }

  function preferControls(nodes) {
    const unique = [...new Set(nodes)];
    return unique.filter((el) => {
      if (unique.some((other) => other !== el && el.contains(other) && controlRank(other) >= controlRank(el))) {
        return false;
      }
      if (unique.some((other) => other !== el && other.contains(el) && controlRank(other) > controlRank(el))) {
        return false;
      }
      return true;
    });
  }

  function collectFields(doc) {
    const nodes = [
      ...doc.querySelectorAll([
        "input",
        "textarea",
        "select",
        "[role='combobox']",
        "[role='radio']",
        "[role='checkbox']",
        "label",
        "[aria-haspopup='listbox']",
        "[aria-haspopup='menu']",
        "[class*='dropdown' i]",
        "[class*='Dropdown']",
        "[class*='tds-form-input']",
        "[class*='react-select']",
        "[class*='checkbox' i]",
        "[class*='Checkbox']",
        "[data-automation-id*='Dropdown']",
        "[data-automation-id*='selectOneMenu']",
        "[data-automation-id*='promptSelection']",
      ].join(",")),
      ...collectPlaceholderSelects(doc),
    ].filter((el) => {
      if (/promptOption|prompt-option|menuItem/i.test(el.getAttribute("data-automation-id") || "")) return false;
      if (el.id === "applyfill-host" || el.closest("#applyfill-host")) return false;
      if (isDateControl(el)) return false;
      if (isHiddenish(el) && !isRadioLike(el)) return false;
      const aria = (el.getAttribute("aria-label") || "").toLowerCase();
      if (el.tagName === "BUTTON" && /calendar|previous month|next month|choose date/.test(aria) && !isRadioLike(el)) return false;
      const label = (el.innerText || el.value || "").trim();
      if (/^(next|submit|previous|cancel|select file)$/i.test(label) && el.tagName === "BUTTON" && !isRadioLike(el)) return false;
      if (el.tagName === "LABEL") {
        const cap = label.replace(/\s+/g, " ");
        const agree = /conditions of employment|equal employee opportunities|read and understand/i.test(cap);
        if (!agree && !/^(yes|no)$/i.test(cap) && !el.querySelector("input[type='radio'], input[type='checkbox'], [role='radio'], [role='checkbox']")) return false;
      }
      const style = doc.defaultView?.getComputedStyle(el);
      if (!style) return true;
      if (style.display === "none" || style.visibility === "hidden") return false;
      if (el.getAttribute("aria-hidden") === "true" && !isRadioLike(el)) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0 && !["radio", "checkbox", "hidden"].includes((el.type || "").toLowerCase()) && el.tagName !== "SELECT") {
        return false;
      }
      return true;
    });
    return preferControls(nodes);
  }

  root.ApplyFillMatcher = {
    detectPlatform, matchField, collectFields, sectionFor, isChooser, isDateControl, isRadioLike, isYesNoChoice,
    isSelectPlaceholder, isHiddenish, isAgreeWidget, DATE_KEYS, DROPDOWN_KEYS, YES_NO_KEYS, ALIASES, ATS_HOSTS,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

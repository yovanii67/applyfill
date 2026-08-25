(function (root) {
  const SECTIONS = {
    identity: "Identity",
    contact: "Contact",
    education: "Education",
    intern: "Internship basics",
    links: "Links",
    work: "Work authorization",
    tesla: "Tesla Easy Apply",
    agreements: "Terms & agreements",
    answers: "Saved answers",
  };

  const SECTION_NOTES = {
    intern: "These answers are reused on Greenhouse, Handshake, Lever, Workday, and ordinary intern forms. Workday often says “Given Name(s)” or “Address Line 1” — those still use First name and Street address from this profile.",
    tesla: "Tesla-only questions. Dropdowns should match Tesla’s wording (for example “7 months or more”). Calendar dates are skipped.",
    agreements: "Set to Yes only after you have read those documents. ApplyFill will not submit the application for you.",
  };

  const FIELDS = [
    { key: "firstName", label: "First name", section: "identity", placeholder: "Alex" },
    { key: "middleName", label: "Middle name", section: "identity", placeholder: "" },
    { key: "lastName", label: "Last name", section: "identity", placeholder: "Rivera" },
    { key: "preferredName", label: "Preferred name", section: "identity", placeholder: "Alex" },
    { key: "fullName", label: "Full / legal name", section: "identity", placeholder: "Alex Rivera" },
    { key: "pronouns", label: "Pronouns", section: "identity", placeholder: "they/them" },
    { key: "email", label: "Email", section: "contact", type: "email", placeholder: "you@school.edu" },
    { key: "phone", label: "Phone", section: "contact", type: "tel", placeholder: "(555) 010-1234" },
    { key: "street", label: "Street address", section: "contact", placeholder: "123 Campus Ave" },
    { key: "city", label: "City", section: "contact", placeholder: "Your city" },
    { key: "state", label: "State / region", section: "contact", placeholder: "CA" },
    { key: "zip", label: "ZIP / postal code", section: "contact", placeholder: "90001" },
    { key: "country", label: "Country", section: "contact", placeholder: "United States of America" },
    { key: "school", label: "School / university", section: "education", placeholder: "Your university" },
    { key: "degree", label: "Degree", section: "education", placeholder: "Bachelor of Science" },
    { key: "major", label: "Major", section: "education", placeholder: "Mechanical Engineering" },
    { key: "minor", label: "Minor", section: "education", placeholder: "" },
    { key: "gpa", label: "GPA", section: "education", placeholder: "3.70" },
    { key: "classYear", label: "Class year / standing", section: "education", placeholder: "Junior" },
    { key: "campus", label: "Campus (if asked)", section: "education", placeholder: "" },
    { key: "gradMonth", label: "Graduation month", section: "education", placeholder: "May" },
    { key: "gradYear", label: "Graduation year", section: "education", placeholder: "2027" },
    { key: "graduationDate", label: "Graduation date", section: "education", placeholder: "May 2027" },
    { key: "currentStudent", label: "Current university student?", section: "intern", placeholder: "Yes" },
    { key: "over18", label: "Are you 18 or older?", section: "intern", placeholder: "Yes" },
    { key: "internTerm", label: "Internship term / season", section: "intern", placeholder: "Summer 2027" },
    { key: "internMonths", label: "Months available (internship)", section: "intern", placeholder: "7 months or more" },
    { key: "internFullTime", label: "Available for a full-time internship?", section: "intern", placeholder: "Yes" },
    { key: "hoursPerWeek", label: "Hours per week (if asked)", section: "intern", placeholder: "40" },
    { key: "internThesis", label: "Need to write a thesis/report?", section: "intern", placeholder: "No" },
    { key: "noticePeriod", label: "Availability / notice period", section: "intern", placeholder: "More than 12 weeks" },
    { key: "phoneType", label: "Contact phone type", section: "intern", placeholder: "Mobile" },
    { key: "previouslyApplied", label: "Applied to this company before?", section: "intern", placeholder: "No" },
    { key: "languages", label: "Languages", section: "intern", placeholder: "English" },
    { key: "linkedin", label: "LinkedIn URL", section: "links", type: "url", placeholder: "https://linkedin.com/in/you" },
    { key: "github", label: "GitHub URL", section: "links", type: "url", placeholder: "https://github.com/you" },
    { key: "portfolio", label: "Portfolio URL", section: "links", type: "url", placeholder: "https://you.dev" },
    { key: "website", label: "Personal website", section: "links", type: "url", placeholder: "" },
    { key: "workAuth", label: "Work authorized in the US?", section: "work", placeholder: "Yes" },
    { key: "sponsorship", label: "Will you need sponsorship?", section: "work", placeholder: "No" },
    { key: "startDate", label: "Earliest start date", section: "work", placeholder: "June 2027" },
    { key: "desiredRole", label: "Desired role / title", section: "work", placeholder: "Engineering Intern" },
    { key: "locationPref", label: "Preferred location", section: "work", placeholder: "Your city, ST" },
    { key: "teslaOtherJobs", label: "Consider me for other Tesla jobs (36 months)?", section: "tesla", placeholder: "Yes" },
    { key: "teslaPreviouslyEmployed", label: "Previously employed by Tesla?", section: "tesla", placeholder: "No" },
    { key: "teslaFormerIntern", label: "Former/current intern or contractor?", section: "tesla", placeholder: "No" },
    { key: "smsConsent", label: "Consent to application text messages?", section: "tesla", placeholder: "Yes" },
    { key: "eeoAcknowledge", label: "Acknowledge Tesla EEO statement?", section: "tesla", placeholder: "Yes" },
    { key: "gender", label: "Gender (EEO, optional)", section: "tesla", placeholder: "Copy the form option" },
    { key: "veteranStatus", label: "Veteran status (EEO, optional)", section: "tesla", placeholder: "Copy the form option" },
    { key: "raceEthnicity", label: "Race / ethnicity (EEO, optional)", section: "tesla", placeholder: "Copy the form option" },
    { key: "disability", label: "Disability (EEO, optional)", section: "tesla", placeholder: "Copy the form option" },
    { key: "teslaTerms", label: "Accept Tesla terms / conditions of employment?", section: "agreements", placeholder: "Yes" },
    { key: "agreeTerms", label: "Agree to generic terms / privacy boxes?", section: "agreements", placeholder: "Yes" },
    { key: "howHeard", label: "How did you hear about us?", section: "answers", placeholder: "University career portal" },
    { key: "referralName", label: "Referral name (if asked)", section: "answers", placeholder: "" },
    { key: "relocate", label: "Willing to relocate?", section: "answers", placeholder: "Yes" },
    { key: "summary", label: "Short bio / summary", section: "answers", type: "textarea", placeholder: "Optional 2–3 sentence intro you reuse. Do not paste cover letters you have not written." },
  ];

  const DEFAULTS = Object.fromEntries(FIELDS.map((field) => [field.key, ""]));

  const DEFAULT_SETTINGS = {
    autoFillAts: false,
    skipFilled: true,
    showFab: true,
  };

  function derive(profile) {
    const next = { ...DEFAULTS, ...profile };
    const first = (next.firstName || "").trim();
    const last = (next.lastName || "").trim();
    if (!next.fullName.trim() && (first || last)) {
      next.fullName = [first, next.middleName, last].filter(Boolean).join(" ").replace(/\s+/g, " ");
    }
    if (!next.website.trim() && next.portfolio.trim()) next.website = next.portfolio;
    if (!next.graduationDate.trim() && (next.gradMonth || next.gradYear)) {
      next.graduationDate = [next.gradMonth, next.gradYear].filter(Boolean).join(" ");
    }
    const country = next.country.trim().toLowerCase().replace(/\.+$/g, "");
    if (/^(us|usa|u s a|united states)$/.test(country) || (country.startsWith("united states") && !/outlying|virgin|samoa|puerto|guam|mariana/.test(country))) {
      next.country = "United States of America";
    }
    return next;
  }

  function completeness(profile) {
    const filled = FIELDS.filter((field) => String(profile[field.key] || "").trim()).length;
    return { filled, total: FIELDS.length };
  }

  root.ApplyFillProfile = { SECTIONS, SECTION_NOTES, FIELDS, DEFAULTS, DEFAULT_SETTINGS, derive, completeness };
})(typeof globalThis !== "undefined" ? globalThis : window);

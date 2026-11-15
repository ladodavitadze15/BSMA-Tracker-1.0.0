const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const BASE_URL = 'https://study.bsma.edu.ge';

const ROMAN_WEEKS = [
  { num: 1, roman: 'I', aliases: ['I'] },
  { num: 2, roman: 'II', aliases: ['II'] },
  { num: 3, roman: 'III', aliases: ['III'] },
  { num: 4, roman: 'IV', aliases: ['IV'] },
  { num: 5, roman: 'V', aliases: ['V'] },
  { num: 6, roman: 'VI', aliases: ['VI'] },
  { num: 7, roman: 'VII', aliases: ['VII', 'YII'] },
  { num: 8, roman: 'VIII', aliases: ['VIII', 'YIII'] },
  { num: 9, roman: 'IX', aliases: ['IX'] },
  { num: 10, roman: 'X', aliases: ['X'] },
  { num: 11, roman: 'XI', aliases: ['XI'] },
  { num: 12, roman: 'XII', aliases: ['XII'] },
  { num: 13, roman: 'XIII', aliases: ['XIII'] },
  { num: 14, roman: 'XIV', aliases: ['XIV'] },
  { num: 15, roman: 'XV', aliases: ['XV'] },
];

const ROMAN_TO_NUM = Object.fromEntries(
  ROMAN_WEEKS.flatMap((w) => w.aliases.map((a) => [a, w.num]))
);

const TEST_PATTERNS = [
  { key: 'midterm', regex: /შუალედურ[იოა]?(\s+(გამოცდა|შეფასება|ტესტ))?/i },
  { key: 'rating', regex: /რეიტინგულ[იოა]?\s+შეფასება/i },
  { key: 'test', regex: /(კომპიუტერული\s+)?ტესტ(ურ[იოა]?|ირებ[აი]|ი)?/i },
  { key: 'quiz', regex: /ქვიზ[იო]?|quiz/i },
  { key: 'written', regex: /წერით[იო]?\s+(დავალება|სამუშაო|გამოკითხვა)/i },
  { key: 'presentation', regex: /პრეზენტაცი[აიე]/i },
  { key: 'colloquium', regex: /კოლოკვიუმ[იო]?|საკონტროლო/i },
  { key: 'final', regex: /დასკვნით[იო]?\s+გამოცდა|final\s+exam/i },
];

async function getSyllabusLinks(token, bookId) {
  const res = await fetch(`${BASE_URL}/student/download/syllabus/?bookId=${encodeURIComponent(bookId)}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) {
    const err = new Error('Session expired. Please sign in again.');
    err.code = 'TOKEN_EXPIRED';
    throw err;
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch syllabus links (HTTP ${res.status})`);
  }
  const data = await res.json();
  const links = Array.isArray(data?.link) ? data.link : [];
  return links.map((l) => ({
    name: l.name || `syllabus-${bookId}.pdf`,
    address: l.address,
    url: l.address.startsWith('http') ? l.address : `${BASE_URL}${encodeURI(l.address)}`,
  }));
}

async function fetchPdfBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download syllabus file (HTTP ${res.status})`);
  }
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

function cleanPdfText(rawText) {
  const lines = rawText.replace(/\r/g, '').split('\n');
  const cleaned = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Strip standard BSMA page headers/footers
    if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line)) continue;
    if (/^საჯარო სამართლის იურიდიული პირი$/i.test(line)) continue;
    if (/^სასწავლო უნივერსიტეტი$/i.test(line)) continue;
    if (/^ბათუმის სახელმწიფო საზღვაო აკადემია$/i.test(line)) continue;
    if (/^(ND|AF)\s*-?\s*\d+/i.test(line)) continue;
    cleaned.push(line);
  }
  return cleaned.join('\n');
}

function detectAssessments(text) {
  const hits = [];
  for (const p of TEST_PATTERNS) {
    const m = text.match(p.regex);
    if (m) hits.push(m[0]);
  }
  return Array.from(new Set(hits));
}

function parseWeeklyPlanAndLiterature(rawText) {
  const text = cleanPdfText(rawText);
  const lines = text.split('\n');

  // Find start of weekly table (usually after "კვ." / "თემის დასახელება")
  let tableStartIdx = lines.findIndex((l) => /თემის\s+დასახელება/.test(l));
  if (tableStartIdx === -1) tableStartIdx = 0;

  // Locate literature section & learning outcomes end marker
  const mainLitIdx = lines.findIndex((l, idx) => idx > tableStartIdx && /ძირითადი\s*$/i.test(l) && lines[idx + 1]?.includes('ლიტერატურა'));
  const altLitIdx = lines.findIndex((l, idx) => idx > tableStartIdx && /ძირითადი\s+ლიტერატურა/i.test(l));
  const litStartIdx = mainLitIdx !== -1 ? mainLitIdx : altLitIdx;

  const extraLitIdx = lines.findIndex((l, idx) => idx > tableStartIdx && (/დამატებითი\s*$/i.test(l) && lines[idx + 1]?.includes('ლიტერატურა') || /დამატებითი\s+ლიტერატურა/i.test(l)));
  const outcomesIdx = lines.findIndex((l, idx) => idx > (litStartIdx !== -1 ? litStartIdx : tableStartIdx) && /^(სწავლების\s+შედეგები|შეფასების\s+ფორმები)/i.test(l));

  const weekSearchEnd = litStartIdx !== -1 ? litStartIdx : lines.length;

  // Sequentially match weeks I..XV in order so stray Roman numerals inside text don't break order
  const weekMarkers = [];
  let cursor = tableStartIdx;
  for (const w of ROMAN_WEEKS) {
    const pattern = w.aliases.join('|');
    const exactOrPrefix = new RegExp(`^(?:${pattern})(?:\\s+(.*))?$`);
    let found = -1;
    for (let i = cursor; i < weekSearchEnd; i++) {
      const m = lines[i].match(exactOrPrefix);
      if (m) {
        found = i;
        cursor = i + 1;
        break;
      }
    }
    if (found !== -1) {
      weekMarkers.push({ num: w.num, roman: w.roman, pattern, lineIdx: found });
    }
  }

  // Fallback to Arabic 1..15 if Roman markers weren't found
  if (weekMarkers.length < 5) {
    weekMarkers.length = 0;
    cursor = tableStartIdx;
    for (let num = 1; num <= 15; num++) {
      const re = new RegExp(`^${num}(?:\\s+(.*))?$`);
      for (let i = cursor; i < weekSearchEnd; i++) {
        if (re.test(lines[i])) {
          weekMarkers.push({ num, roman: ROMAN_WEEKS[num - 1].roman, pattern: ROMAN_WEEKS[num - 1].roman, lineIdx: i });
          cursor = i + 1;
          break;
        }
      }
    }
  }

  const weeks = [];
  for (let i = 0; i < weekMarkers.length; i++) {
    const start = weekMarkers[i].lineIdx;
    const end = i + 1 < weekMarkers.length ? weekMarkers[i + 1].lineIdx : weekSearchEnd;
    const blockLines = [];
    for (let j = start; j < end; j++) {
      let line = lines[j];
      if (j === start) {
        line = line.replace(new RegExp(`^(?:${weekMarkers[i].pattern}|${weekMarkers[i].num})\\s*`), '').trim();
      }
      // Remove pure hour-count lines like "1 -", "- 1", "1 2"
      if (/^[-–0-9\s]{1,6}$/.test(line)) continue;
      line = line.replace(/\s+(1|-)\s+(1|-)$/, '').trim();
      if (line) blockLines.push(line);
    }

    const content = blockLines.join(' ').replace(/\s{2,}/g, ' ').trim();
    const assessmentHits = detectAssessments(content);
    weeks.push({
      week: weekMarkers[i].num,
      roman: weekMarkers[i].roman,
      content,
      hasTest: assessmentHits.length > 0,
      assessmentHits,
    });
  }

  // Also check rating-assessment schedule table (e.g. "სასწავლო კვირა / შეფასების კვირა ... III V VII ... or 3 5 7 ...")
  for (let idx = 0; idx < lines.length; idx++) {
    if (!/((სასა?წა?ვლო|შეფასების)\s+კვირა|რეიტინგულ[ი]?\s+შეფასებებს\s+ახორციელებს|რეიტინგული\s+შეფასება\s+ხორციელდება)/i.test(lines[idx])) {
      continue;
    }
    const schedWindow = lines.slice(idx, Math.min(lines.length, idx + 25));
    const scheduledWeekNums = [];
    for (let k = 0; k < schedWindow.length; k++) {
      const cleanLine = schedWindow[k].replace(/\s+ჯამი$/i, '').trim();
      const tokens = cleanLine.split(/[\s,;]+/).filter(Boolean);
      const isRomanRow = tokens.length >= 2 && tokens.every((t) => ROMAN_TO_NUM[t]);
      const isSingleRoman = tokens.length === 1 && ROMAN_TO_NUM[tokens[0]] && ROMAN_TO_NUM[tokens[0]] >= 2;
      const nums = tokens.map((t) => (/^\d{1,2}$/.test(t) ? Number(t) : NaN));
      const isArabicWeekRow =
        tokens.length >= 3 &&
        nums.every((n) => n >= 1 && n <= 15) &&
        nums.every((n, p) => p === 0 || n > nums[p - 1]);

      if (isRomanRow) {
        tokens.forEach((t) => scheduledWeekNums.push(ROMAN_TO_NUM[t]));
      } else if (isSingleRoman) {
        scheduledWeekNums.push(ROMAN_TO_NUM[tokens[0]]);
      } else if (isArabicWeekRow) {
        nums.forEach((n) => scheduledWeekNums.push(n));
      }
    }
    const uniqueSchedWeeks = Array.from(new Set(scheduledWeekNums));
    if (uniqueSchedWeeks.length >= 2) {
      const schedActivityHits = detectAssessments(schedWindow.join(' '));
      for (const wNum of uniqueSchedWeeks) {
        const wObj = weeks.find((w) => w.week === wNum);
        if (wObj && !wObj.hasTest) {
          wObj.hasTest = true;
          wObj.assessmentHits = schedActivityHits.length
            ? schedActivityHits.slice(0, 3)
            : ['რეიტინგული შეფასება'];
        }
      }
    }
  }

  const mainLiterature = [];
  if (litStartIdx !== -1) {
    const end = extraLitIdx !== -1 ? extraLitIdx : (outcomesIdx !== -1 ? outcomesIdx : Math.min(lines.length, litStartIdx + 40));
    for (let i = litStartIdx; i < end; i++) {
      const l = lines[i];
      if (/^(ძირითადი|ლიტერატურა)$/i.test(l) || /^ძირითადი\s+ლიტერატურა$/i.test(l)) continue;
      mainLiterature.push(l);
    }
  }

  const extraLiterature = [];
  if (extraLitIdx !== -1) {
    const end = outcomesIdx !== -1 ? outcomesIdx : Math.min(lines.length, extraLitIdx + 50);
    for (let i = extraLitIdx; i < end; i++) {
      const l = lines[i];
      if (/^(დამატებითი|ლიტერატურა)$/i.test(l) || /^დამატებითი\s+ლიტერატურა$/i.test(l)) continue;
      extraLiterature.push(l);
    }
  }

  return {
    weeks,
    mainLiterature: mergeNumberedList(mainLiterature),
    extraLiterature: mergeNumberedList(extraLiterature),
    rawExcerpt: text.slice(0, 4000),
  };
}

function mergeNumberedList(lines) {
  const items = [];
  for (const l of lines) {
    if (/^\d+\./.test(l) || items.length === 0) {
      items.push(l);
    } else {
      items[items.length - 1] += ' ' + l;
    }
  }
  return items;
}

class SyllabusService {
  constructor(cacheDir) {
    this.cacheDir = cacheDir;
    this.memoryCache = new Map();
    if (this.cacheDir && !fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  getCachePath(bookId) {
    return path.join(this.cacheDir, `syllabus-${bookId}.json`);
  }

  async getParsedSyllabus(token, bookId, forceRefresh = false) {
    const key = String(bookId);
    if (!forceRefresh && this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    const cacheFile = this.getCachePath(bookId);
    if (!forceRefresh && fs.existsSync(cacheFile)) {
      try {
        const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        this.memoryCache.set(key, cached);
        return cached;
      } catch {
        // Ignore corrupted cache
      }
    }

    const links = await getSyllabusLinks(token, bookId);
    if (links.length === 0) {
      const empty = { bookId, links: [], weeks: [], mainLiterature: [], extraLiterature: [], hasPdf: false };
      this.memoryCache.set(key, empty);
      return empty;
    }

    const pdfLink = links.find((l) => l.name.toLowerCase().endsWith('.pdf')) || links[0];
    let parsed = { weeks: [], mainLiterature: [], extraLiterature: [] };
    let parseError = null;

    if (pdfLink.name.toLowerCase().endsWith('.pdf')) {
      try {
        const buf = await fetchPdfBuffer(pdfLink.url);
        const parser = new PDFParse({ data: new Uint8Array(buf) });
        const textRes = await parser.getText();
        parsed = parseWeeklyPlanAndLiterature(textRes.text || '');
      } catch (err) {
        parseError = err.message;
      }
    }

    const result = {
      bookId,
      hasPdf: pdfLink.name.toLowerCase().endsWith('.pdf'),
      links,
      weeks: parsed.weeks,
      mainLiterature: parsed.mainLiterature,
      extraLiterature: parsed.extraLiterature,
      parseError,
      cachedAt: new Date().toISOString(),
    };

    this.memoryCache.set(key, result);
    try {
      fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2), 'utf8');
    } catch {
      // Non-fatal
    }
    return result;
  }

  async downloadFile(token, bookId, targetPath) {
    const links = await getSyllabusLinks(token, bookId);
    if (!links.length) throw new Error('No syllabus file found for this subject.');
    const buf = await fetchPdfBuffer(links[0].url);
    fs.writeFileSync(targetPath, buf);
    return { filePath: targetPath, fileName: links[0].name };
  }

  async ensureLocalFile(token, bookId) {
    const links = await getSyllabusLinks(token, bookId);
    if (!links.length) throw new Error('No syllabus file found for this subject.');
    const safeName = links[0].name.replace(/[<>:"/\\|?*]/g, '_');
    const localPath = path.join(this.cacheDir, `${bookId}-${safeName}`);
    if (!fs.existsSync(localPath)) {
      const buf = await fetchPdfBuffer(links[0].url);
      fs.writeFileSync(localPath, buf);
    }
    return localPath;
  }
}

module.exports = {
  SyllabusService,
  parseWeeklyPlanAndLiterature,
};

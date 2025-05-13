
'use server'; 

import fs from 'fs';
import path from 'path';
import type { Paper } from '@/types/paper';
import { getTermSortOrder, getSemesterSortOrder, getProgrammeSortOrder } from './paperUtils'; 

const ignoredUrlPatterns = [
    '/Publication%20List',
    '/Policy%20Rules',
    '/Plagarisim', 
    '/Membership/', 
    '/Open%20Access/', 
    'Certificate%20format', 
];

const ignoredNameKeywords = [
    'policy',
    'publication',
    'membership',
    'plagiarism',
    'certificate',
    'rules',
    'regulations',
    'guidelines',
    'format',
    'sop', 
];

function normalizeBranch(branch: string | undefined): string | undefined {
    if (!branch) return undefined;
    const lowerBranch = branch.toLowerCase().trim();

    if (lowerBranch.includes('electrical') && lowerBranch.includes('electronic')) return 'EEE';
    if (lowerBranch.includes('electronic') && lowerBranch.includes('communication')) return 'ECE';
    if (lowerBranch.includes('computer') && lowerBranch.includes('science')) return 'CSE';
    if (lowerBranch.includes('information') && lowerBranch.includes('tech')) return 'IT'; 
    if (lowerBranch.includes('mech') && !lowerBranch.includes('mechatronic')) return 'Mech'; 
    if (lowerBranch.includes('aero')) return 'Aero';
    if (lowerBranch.includes('civil')) return 'Civil';
    if (lowerBranch.includes('chem')) return 'Chemical';
    if (lowerBranch.includes('bio') && lowerBranch.includes('tech')) return 'Biotech';
    if (lowerBranch.includes('mechatronic')) return 'Mechatronics';
    if (lowerBranch.includes('industr') && lowerBranch.includes('prod')) return 'Industrial & Production Engg'; 
    if (lowerBranch.includes('architec')) return 'Architecture Engg';
    if (lowerBranch.includes('automobile')) return 'Automobile Engg';
    if (lowerBranch.includes('instrumentation') && lowerBranch.includes('control')) return 'Instrumentation & Control Engg';
    if (lowerBranch.includes('print') && lowerBranch.includes('media')) return 'Printing & Media Engg';

    const knownBranches = [
        'Aeronautical', 'Automobile', 'Biomedical', 'Biotechnology', 'Chemical',
        'Civil', 'Computer & Communication', 'Computer Science', 'Electrical & Electronics',
        'Electronics & Communication', 'Industrial & Production', 'Information Technology',
        'Instrumentation & Control', 'Mechanical', 'Mechatronics', 'Printing & Media'
    ];
    const cleanedLowerBranch = lowerBranch.replace(/ engg| engineering/g, '');
    for (const known of knownBranches) {
        if (cleanedLowerBranch === known.toLowerCase()) {
             const standardCapitalization = knownBranches.find(kb => kb.toLowerCase() === cleanedLowerBranch);
             return standardCapitalization || branch; 
        }
    }

    return branch
        .split(/[\s-]+/) 
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function deriveMetadata(filePath: string[], rawName: string): Partial<Paper> {
    const derived: Partial<Paper> = {};

    if (!filePath || filePath.length < 2) {
        return {}; 
    }

    derived.year = filePath[0];
    if (!/^\d{4}$/.test(derived.year)) {
        return {}; 
    }

    derived.term = filePath[1]?.replace(/\s{2,}/g, ' ').trim(); 
    if (!derived.term || derived.term.length < 3) { 
         return {}; 
    }

    let semesterStr: string | undefined = undefined;
    let programmeStr: string | undefined = undefined;
    let branchStr: string | undefined = undefined;
    const potentialBranchElements: string[] = []; 

    for (let i = 2; i < filePath.length; i++) {
        const element = filePath[i]?.trim();
        if (!element) continue; 

        const elementLower = element.toLowerCase();

        const semMatch = element.match(/\b(VIII|VII|VI|V|IV|III|II|I)\s*Sem\b/i);
        if (semMatch && !semesterStr) {
            semesterStr = `${semMatch[1].toUpperCase()} Sem`;
            continue; 
        }

        if (elementLower.includes('m.tech') || elementLower.includes('m tech')) {
             if(!programmeStr) programmeStr = 'M.Tech'; 
             continue; 
        }
         if (elementLower.includes('b.tech') || elementLower.includes('b tech')) {
             if(!programmeStr) programmeStr = 'B.Tech'; 
             continue; 
        }

        potentialBranchElements.push(element);
    }

    if (!programmeStr) {
        if (semesterStr) {
             programmeStr = 'B.Tech'; 
        }
    }

    if (potentialBranchElements.length > 0) {
        branchStr = normalizeBranch(potentialBranchElements[potentialBranchElements.length - 1]);

        if (potentialBranchElements[potentialBranchElements.length - 1].toUpperCase() === 'CSE') {
            branchStr = 'CSE';
        }

        if ((!branchStr || branchStr.toUpperCase() === 'SEM') && potentialBranchElements.length > 1) {
             const secondLastBranch = normalizeBranch(potentialBranchElements[potentialBranchElements.length - 2]);
             if (secondLastBranch && secondLastBranch !== branchStr) {
                 branchStr = secondLastBranch;
             }
        }
    }

    if (programmeStr) derived.programme = programmeStr;
    if (semesterStr) derived.semester = semesterStr;
    if (branchStr) derived.branch = branchStr;

    const nameWithoutExamType = rawName
        ?.replace(/\b(mid sem|midterm|end sem|endterm|final|sessional|make up|makeup|quiz|test|exam|paper)\b/gi, '') 
        .replace(/\.pdf$/i, '') 
        .trim();

    const cleanedRawName = nameWithoutExamType?.replace(/\s{2,}/g, ' ').trim(); 

    if (!cleanedRawName || cleanedRawName.length < 1) {
        return {}; 
    }
    derived.name = cleanedRawName;

    const codeMatch = derived.name.match(/(\(|\[)\s*([A-Z]{2,}[-\s]?\d{3,})\s*(\)|\])/);
    const parenMatch = derived.name.match(/\(/); 
    const bracketMatch = derived.name.match(/\[/); 

    let firstSeparatorIndex = -1;
    if (codeMatch?.index !== undefined) {
        firstSeparatorIndex = codeMatch.index;
    } else if (parenMatch?.index !== undefined && bracketMatch?.index !== undefined) {
        firstSeparatorIndex = Math.min(parenMatch.index, bracketMatch.index);
    } else if (parenMatch?.index !== undefined) {
        firstSeparatorIndex = parenMatch.index;
    } else if (bracketMatch?.index !== undefined) {
        firstSeparatorIndex = bracketMatch.index;
    }

    let potentialSubject = (firstSeparatorIndex > 0 ? derived.name.substring(0, firstSeparatorIndex) : derived.name).trim();

    potentialSubject = potentialSubject
        .replace(/\[.*?\]/g, '') 
        .replace(/\(.*\)/g, '') 
        .replace(/[-_]+$/, '') 
        .replace(/\s{2,}/g, ' ') 
        .replace(/[()\[\]]/g, '') 
        .trim();

    const isJustCode = /^\s*([A-Z]{2,}[-\s]?\d{3,}\s*)+$/.test(potentialSubject); 
    const isGeneric = /^(rcs)$/i.test(potentialSubject); 
    const isShort = potentialSubject.length <= 3;

    if (potentialSubject && !isJustCode && !isGeneric && !isShort && potentialSubject.toLowerCase() !== derived.name.toLowerCase()) {
        derived.subject = potentialSubject;
    } else if (!derived.subject && codeMatch && codeMatch[2]) {
    }

    return derived;
}

let cachedPapers: Paper[] | null = null;
let isLoading = false; 
let loadTimestamp: number | null = null;
const CACHE_TTL = 10 * 60 * 1000; 

async function loadAndProcessPapers(): Promise<Paper[]> {
  const dataDirectory = path.join(process.cwd(), 'data');
  const dataFilePath = path.join(dataDirectory, 'all_papers.json'); 

  console.log(`[papersLoader.ts] Reading paper data from file: ${dataFilePath}`);
  let processedPapers: Paper[] = [];
  let idCounter = 0;

  if (!fs.existsSync(dataFilePath)) {
    console.error(`[papersLoader.ts] Data file not found: ${dataFilePath}`);
    return [];
  }

  try {
    const fileContents = fs.readFileSync(dataFilePath, 'utf8');
    const papersDataRaw: { path: string[], name: string, url: string }[] = JSON.parse(fileContents);
    const originalCount = papersDataRaw.length;
    console.log(`[papersLoader.ts] Raw entries read: ${originalCount}`);

    if (!Array.isArray(papersDataRaw)) {
      console.warn(`[papersLoader.ts] Skipping ${dataFilePath}: Content is not a JSON array.`);
      return [];
    }
    if (papersDataRaw.length === 0) {
       console.warn(`[papersLoader.ts] Data file ${dataFilePath} is empty.`);
       return [];
    }

    let skippedUrl = 0;
    let skippedNameKeyword = 0; 
    let skippedUnnamed = 0; 
    let skippedPath = 0;
    let skippedMetadata = 0;

    processedPapers = papersDataRaw
      .map((rawPaper): Paper | null => {
        if (!rawPaper.url || ignoredUrlPatterns.some(pattern => rawPaper.url.includes(pattern))) {
          skippedUrl++; return null;
        }
        const lowerRawName = rawPaper.name?.toLowerCase() || '';
        if (rawPaper.name && ignoredNameKeywords.some(keyword => lowerRawName.includes(keyword))) {
          skippedNameKeyword++; return null;
        }
         if (!rawPaper.name || rawPaper.name.trim().length === 0 || rawPaper.name.trim() === '.pdf') {
             skippedUnnamed++; return null;
         }
        if (!rawPaper.path || rawPaper.path.length < 2) {
          skippedPath++; return null;
        }

        const metadata = deriveMetadata(rawPaper.path, rawPaper.name);
        if (!metadata.year || !metadata.term || !metadata.name ) {
          skippedMetadata++;
          return null;
        }

        idCounter++;
        return {
          path: rawPaper.path,
          url: rawPaper.url,
          ...metadata,
          id: `paper-${idCounter}`,
        } as Paper; 
      })
      .filter((paper): paper is Paper => paper !== null); 

    const addedCount = processedPapers.length;
    console.log(`[papersLoader.ts] -> Processed ${originalCount} entries. Added ${addedCount} valid papers.`);
    console.log(`[papersLoader.ts] -> Skipped Counts: URL=${skippedUrl}, Name Keyword=${skippedNameKeyword}, Unnamed=${skippedUnnamed}, Path=${skippedPath}, Metadata=${skippedMetadata}`);

     processedPapers.sort((a, b) => {
       if (a.year !== b.year) return b.year.localeCompare(a.year); 

       const termAOrder = getTermSortOrder(a.term);
       const termBOrder = getTermSortOrder(b.term);
       if (termAOrder !== termBOrder) return termAOrder - termBOrder; 
       if (a.term !== b.term) return a.term.localeCompare(b.term); 

       const progAOrder = getProgrammeSortOrder(a.programme);
       const progBOrder = getProgrammeSortOrder(b.programme);
       if (progAOrder !== progBOrder) return progAOrder - progBOrder; 
       if (a.programme && b.programme && a.programme !== b.programme) return a.programme.localeCompare(b.programme); 
       if (a.programme && !b.programme) return -1; 
       if (!a.programme && b.programme) return 1;  

       const semAOrder = getSemesterSortOrder(a.semester);
       const semBOrder = getSemesterSortOrder(b.semester);
       if (semAOrder !== semBOrder) return semAOrder - semBOrder; 
       if (a.semester && b.semester && a.semester !== b.semester) return a.semester.localeCompare(b.semester); 
       if (a.semester && !b.semester) return -1; 
       if (!a.semester && b.semester) return 1; 

       if (a.branch && !b.branch) return -1;
       if (!a.branch && b.branch) return 1;
       if (a.branch && b.branch && a.branch !== b.branch) return a.branch.localeCompare(b.branch); 

       return a.name.localeCompare(b.name); 
     });

     console.log(`[papersLoader.ts] Total papers loaded, processed, and sorted: ${processedPapers.length}`);
     return processedPapers;

  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`[papersLoader.ts] Error parsing JSON in file ${dataFilePath}:`, error.message);
    } else {
      console.error(`[papersLoader.ts] Error processing file ${dataFilePath}:`, error);
    }
     return [];
  }
}

export async function getCachedPapers(): Promise<Paper[]> {
  const now = Date.now();

  if (cachedPapers && loadTimestamp && (now - loadTimestamp < CACHE_TTL)) {
    return [...cachedPapers]; 
  }

  while (isLoading) {
    await new Promise(resolve => setTimeout(resolve, 150)); 

    if (cachedPapers && loadTimestamp && (now - loadTimestamp < CACHE_TTL)) {
      return [...cachedPapers];
    }
  }

  isLoading = true;
  try {
    console.log("[papersLoader.ts] Cache miss or expired. Loading papers...");
    cachedPapers = await loadAndProcessPapers();
    loadTimestamp = Date.now(); 
    console.log(`[papersLoader.ts] Papers loaded and cached. Count: ${cachedPapers.length}. Timestamp: ${loadTimestamp}`);
  } catch (error) {
    console.error("[papersLoader.ts] Failed to load and cache papers:", error);
    cachedPapers = []; 
    loadTimestamp = null; 
  } finally {
    isLoading = false;
  }

  return [...(cachedPapers || [])];
}

export async function getAvailableFilterOptions(): Promise<{
    years: string[],
    programmes: string[],
    terms: string[],
    semesters: string[],
    branches: string[]
}> {
    console.log("[papersLoader.ts] Generating initial filter options from cached papers...");
    const papers = await getCachedPapers(); 

    const years = new Set<string>();
    const programmes = new Set<string>();
    const terms = new Set<string>();
    const semesters = new Set<string>();
    const branches = new Set<string>();

    papers.forEach(paper => {
        if (paper.year) years.add(paper.year);
        if (paper.programme) programmes.add(paper.programme);
        if (paper.term) terms.add(paper.term);
        if (paper.semester) semesters.add(paper.semester);
        if (paper.branch) branches.add(paper.branch);
    });

     console.log(`[papersLoader.ts] Unique values found - Years: ${years.size}, Programmes: ${programmes.size}, Terms: ${terms.size}, Semesters: ${semesters.size}, Branches: ${branches.size}`);

    const sortedYears = Array.from(years).sort((a, b) => parseInt(b, 10) - parseInt(a, 10)); 
    const sortedProgrammes = Array.from(programmes).sort((a, b) => { 
        const orderA = getProgrammeSortOrder(a);
        const orderB = getProgrammeSortOrder(b);
        if (orderA !== orderB) return orderA - orderB;
        return a.localeCompare(b);
    });
    const sortedTerms = Array.from(terms).sort((a, b) => {
        const orderA = getTermSortOrder(a);
        const orderB = getTermSortOrder(b);
        if (orderA !== orderB) return orderA - orderB;
        return a.localeCompare(b);
    });
    const sortedSemesters = Array.from(semesters).sort((a, b) => {
        const orderA = getSemesterSortOrder(a);
        const orderB = getSemesterSortOrder(b);
        if (orderA !== orderB) return orderA - orderB;
        return a.localeCompare(b);
    });
    const sortedBranches = Array.from(branches).sort((a, b) => a.localeCompare(b)); 

    console.log("[papersLoader.ts] Finished generating and sorting initial filter options.");

    return {
        years: sortedYears,
        programmes: sortedProgrammes,
        terms: sortedTerms,
        semesters: sortedSemesters,
        branches: sortedBranches
    };
}

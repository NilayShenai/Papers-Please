
import { NextResponse } from 'next/server';
import { getCachedPapers } from '@/lib/papersLoader';
import { getTermSortOrder, getSemesterSortOrder, getProgrammeSortOrder } from '@/lib/paperUtils';
import type { Paper } from '@/types/paper';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const level = url.searchParams.get('level') as keyof Paper | null;

    if (!level || !['year', 'programme', 'term', 'semester', 'branch'].includes(level)) {
      return NextResponse.json({ error: 'Invalid or missing level parameter' }, { status: 400 });
    }

    const allPapers = await getCachedPapers();

    const selectedYear = url.searchParams.get('year');
    const selectedProgramme = url.searchParams.get('programme');
    const selectedTerm = url.searchParams.get('term');
    const selectedSemester = url.searchParams.get('semester');
    const selectedBranch = url.searchParams.get('branch');

    let papersForOptionsDerivation: Paper[] = allPapers;

    if (level !== 'year' && selectedYear && selectedYear !== 'all') {
      papersForOptionsDerivation = papersForOptionsDerivation.filter(p => p.year === selectedYear);
    }
    if (level !== 'programme' && selectedProgramme && selectedProgramme !== 'all') {
      papersForOptionsDerivation = papersForOptionsDerivation.filter(p => p.programme === selectedProgramme);
    }
    if (level !== 'term' && selectedTerm && selectedTerm !== 'all') {
      papersForOptionsDerivation = papersForOptionsDerivation.filter(p => p.term === selectedTerm);
    }
    if (level !== 'semester' && selectedSemester && selectedSemester !== 'all') {
      papersForOptionsDerivation = papersForOptionsDerivation.filter(p => p.semester === selectedSemester);
    }
    if (level !== 'branch' && selectedBranch && selectedBranch !== 'all') {
      papersForOptionsDerivation = papersForOptionsDerivation.filter(p => p.branch === selectedBranch);
    }

    let optionsSet: Set<string>;
    switch (level) {
      case 'year':
        optionsSet = new Set(papersForOptionsDerivation.map(p => p.year).filter(Boolean) as string[]);
        break;
      case 'programme':
        optionsSet = new Set(papersForOptionsDerivation.map(p => p.programme).filter(Boolean) as string[]);
        break;
      case 'term':
        optionsSet = new Set(papersForOptionsDerivation.map(p => p.term).filter(Boolean) as string[]);
        break;
      case 'semester':
        optionsSet = new Set(papersForOptionsDerivation.map(p => p.semester).filter(Boolean) as string[]);
        break;
      case 'branch':
        optionsSet = new Set(papersForOptionsDerivation.map(p => p.branch).filter(Boolean) as string[]);
        break;
      default:
        return NextResponse.json({ error: 'Invalid level processing' }, { status: 400 });
    }

    let sortedOptions = Array.from(optionsSet);
    switch (level) {
      case 'year':
        sortedOptions.sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
        break;
      case 'programme':
        sortedOptions.sort((a, b) => {
          const orderA = getProgrammeSortOrder(a);
          const orderB = getProgrammeSortOrder(b);
          if (orderA !== orderB) return orderA - orderB;
          return a.localeCompare(b);
        });
        break;
      case 'term':
        sortedOptions.sort((a, b) => {
          const orderA = getTermSortOrder(a);
          const orderB = getTermSortOrder(b);
          if (orderA !== orderB) return orderA - orderB;
          return a.localeCompare(b);
        });
        break;
      case 'semester':
        sortedOptions.sort((a, b) => {
          const orderA = getSemesterSortOrder(a);
          const orderB = getSemesterSortOrder(b);
          if (orderA !== orderB) return orderA - orderB;
          return a.localeCompare(b);
        });
        break;
      case 'branch':
        sortedOptions.sort((a, b) => a.localeCompare(b));
        break;
    }

    return NextResponse.json({ options: sortedOptions });

  } catch (error) {
    console.error(`[API /filter-options Error for level ${new URL(req.url).searchParams.get('level')}]:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

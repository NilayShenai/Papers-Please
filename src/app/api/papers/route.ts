
import { NextResponse } from 'next/server';
import { getCachedPapers } from '@/lib/papersLoader';
import type { Paper } from '@/types/paper';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const year = url.searchParams.get('year') || '';
    const programme = url.searchParams.get('programme') || '';
    const term = url.searchParams.get('term') || '';
    const semester = url.searchParams.get('semester') || '';
    const branch = url.searchParams.get('branch') || '';

    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize)); 

    const allPapers = await getCachedPapers();
    console.log(`[API /api/papers] Start filtering ${allPapers.length} papers.`);

    let filtered: Paper[] = allPapers;

    if (year && year !== 'all') {
      filtered = filtered.filter(p => p.year === year);
      console.log(`[API /api/papers] Filtered by Year (${year}): ${filtered.length} papers left.`);
    }
    if (programme && programme !== 'all') { 
      filtered = filtered.filter(p => p.programme === programme);
      console.log(`[API /api/papers] Filtered by Programme (${programme}): ${filtered.length} papers left.`);
    }
    if (term && term !== 'all') {
      filtered = filtered.filter(p => p.term === term);
      console.log(`[API /api/papers] Filtered by Term (${term}): ${filtered.length} papers left.`);
    }
    if (semester && semester !== 'all') {
      filtered = filtered.filter(p => p.semester === semester);
       console.log(`[API /api/papers] Filtered by Semester (${semester}): ${filtered.length} papers left.`);
    }
    if (branch && branch !== 'all') {
      filtered = filtered.filter(p => p.branch === branch);
       console.log(`[API /api/papers] Filtered by Branch (${branch}): ${filtered.length} papers left.`);
    }
    if (search) {
      const searchTermLower = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTermLower) ||
        (p.subject && p.subject.toLowerCase().includes(searchTermLower))
      );
       console.log(`[API /api/papers] Filtered by Search (${search}): ${filtered.length} papers left.`);
    }

    const total = filtered.length;
    console.log(`[API /api/papers] Total filtered count: ${total}`);

    const startIndex = (validPage - 1) * validPageSize;
    const paginatedResults = filtered.slice(startIndex, startIndex + validPageSize);
    console.log(`[API /api/papers] Returning page ${validPage} with ${paginatedResults.length} papers (pageSize: ${validPageSize}).`);

    return NextResponse.json({
      total,
      page: validPage,
      pageSize: validPageSize,
      totalPages: Math.ceil(total / validPageSize),
      results: paginatedResults,
    });

  } catch (error) {
    console.error("[API /api/papers Error]:", error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 

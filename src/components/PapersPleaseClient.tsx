
"use client";

import type { Paper } from '@/types/paper';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Filters } from './Filters';
import { PaperList } from './PaperList';
import { Input } from "@/components/ui/input";
import { Search, Github, Loader2, RotateCcw } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PapersApiResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  results: Paper[];
}

interface FilterOptionsApiResponse {
  options: string[];
}

interface AvailableFilters {
  years: string[];
  programmes: string[];
  terms: string[];
  semesters: string[];
  branches: string[];
}

interface PapersPleaseClientProps {
  initialFilterOptions: AvailableFilters;
}

type ActiveFilterKeys = keyof AvailableFilters;

const DEFAULT_PAGE_SIZE = 24;

export function PapersPleaseClient({ initialFilterOptions }: PapersPleaseClientProps) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPapers, setTotalPapers] = useState(0);
  const [isLoadingPapers, setIsLoadingPapers] = useState(true);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeFilters, setActiveFilters] = useState<Record<ActiveFilterKeys, string>>({
    years: 'all',
    programmes: 'all',
    terms: 'all',
    semesters: 'all',
    branches: 'all',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 700);

  const [availableYears, setAvailableYears] = useState<string[]>(initialFilterOptions.years);
  const [availableProgrammes, setAvailableProgrammes] = useState<string[]>(initialFilterOptions.programmes);
  const [availableTerms, setAvailableTerms] = useState<string[]>(initialFilterOptions.terms);
  const [availableSemesters, setAvailableSemesters] = useState<string[]>(initialFilterOptions.semesters);
  const [availableBranches, setAvailableBranches] = useState<string[]>(initialFilterOptions.branches);
  
  const isFirstRenderRef = useRef(true);

  const fetchPapers = useCallback(async (page: number, search: string, currentActiveFilters: typeof activeFilters) => {
    setIsLoadingPapers(true);
    setError(null);
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: DEFAULT_PAGE_SIZE.toString(),
    });
    if (search) params.set('search', search);
    Object.entries(currentActiveFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        let apiKey = key.slice(0, -1); 
        if (key === 'branches') apiKey = 'branch';
        else if (key === 'programmes') apiKey = 'programme';
        
        params.set(apiKey, value);
      }
    });

    try {
      const response = await fetch(`/api/papers?${params.toString()}`);
      if (!response.ok) {
         const errorData = await response.text();
         console.error(`[Client] API Error Response (papers): ${response.status} ${response.statusText}`, errorData);
        throw new Error(`API error fetching papers: ${response.status} ${response.statusText}.`);
      }
      const data: PapersApiResponse = await response.json();
      setPapers(data.results);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotalPapers(data.total);
    } catch (err) {
      console.error("[Client] Error fetching papers:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch papers.");
      setPapers([]);
      setTotalPages(1);
      setTotalPapers(0);
    } finally {
      setIsLoadingPapers(false);
    }
  }, []);

  const clientFetchFilterOptions = useCallback(async (
    level: ActiveFilterKeys, 
    currentActiveFilters: typeof activeFilters
  ): Promise<string[] | undefined> => {
    
    const apiLevelQueryParamValue = level === 'years' ? 'year' :
                                  level === 'programmes' ? 'programme' :
                                  level === 'terms' ? 'term' :
                                  level === 'semesters' ? 'semester' :
                                  level === 'branches' ? 'branch' : '';

    if (!apiLevelQueryParamValue) {
        console.error(`[Client] Invalid level for fetching filter options: ${level}`);
        return undefined;
    }
    
    const queryParams = new URLSearchParams({ level: apiLevelQueryParamValue });
    
    (Object.keys(activeFilters) as ActiveFilterKeys[]).forEach(key => {
        if (key !== level && currentActiveFilters[key] && currentActiveFilters[key] !== 'all') {
            const apiKeyForQuery = key === 'years' ? 'year' :
                                 key === 'programmes' ? 'programme' :
                                 key === 'terms' ? 'term' :
                                 key === 'semesters' ? 'semester' :
                                 key === 'branches' ? 'branch' : '';
            if (apiKeyForQuery) {
                queryParams.set(apiKeyForQuery, currentActiveFilters[key]);
            }
        }
    });
    
    try {
      const response = await fetch(`/api/filter-options?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`[Client] API Error Response (filter-options - ${level}): ${response.status} ${response.statusText}`, errorData);
        throw new Error(`API error fetching options for ${level}: ${response.status} ${response.statusText}.`);
      }
      const data: FilterOptionsApiResponse = await response.json();
      return data.options && data.options.length > 0 ? data.options : [];
    } catch (err) {
      console.error(`[Client] Error fetching ${level} options:`, err);
      switch(level) {
        case 'years': return initialFilterOptions.years;
        case 'programmes': return initialFilterOptions.programmes;
        case 'terms': return initialFilterOptions.terms;
        case 'semesters': return initialFilterOptions.semesters;
        case 'branches': return initialFilterOptions.branches;
        default: return [];
      }
    }
  }, [initialFilterOptions, activeFilters]);


  const updateAllFilterOptions = useCallback(async (currentFilters: typeof activeFilters) => {
    setIsLoadingOptions(true);
    
    const newAvailableOptions = {
        years: [...(currentFilters.years === 'all' ? initialFilterOptions.years : availableYears)],
        programmes: [...(currentFilters.programmes === 'all' ? initialFilterOptions.programmes : availableProgrammes)],
        terms: [...(currentFilters.terms === 'all' ? initialFilterOptions.terms : availableTerms)],
        semesters: [...(currentFilters.semesters === 'all' ? initialFilterOptions.semesters : availableSemesters)],
        branches: [...(currentFilters.branches === 'all' ? initialFilterOptions.branches : availableBranches)],
    };

    const filtersToUpdate: ActiveFilterKeys[] = ['years', 'programmes', 'terms', 'semesters', 'branches'];
    
    try {
        const optionPromises = filtersToUpdate.map(level =>
            clientFetchFilterOptions(level, currentFilters)
        );
        
        const results = (await Promise.all(optionPromises)) as (string[] | undefined)[];
        
        results.forEach((options, index) => {
            const level = filtersToUpdate[index];
            if (options) { 
                newAvailableOptions[level] = options;
            }
        });

        setAvailableYears(newAvailableOptions.years);
        setAvailableProgrammes(newAvailableOptions.programmes);
        setAvailableTerms(newAvailableOptions.terms);
        setAvailableSemesters(newAvailableOptions.semesters);
        setAvailableBranches(newAvailableOptions.branches);

    } catch (error) {
        console.error("Error updating all filter options:", error);
        setAvailableYears(initialFilterOptions.years);
        setAvailableProgrammes(initialFilterOptions.programmes);
        setAvailableTerms(initialFilterOptions.terms);
        setAvailableSemesters(initialFilterOptions.semesters);
        setAvailableBranches(initialFilterOptions.branches);
    } finally {
        setIsLoadingOptions(false);
    }
  }, [clientFetchFilterOptions, initialFilterOptions, availableYears, availableProgrammes, availableTerms, availableSemesters, availableBranches]);


  useEffect(() => {
    if (isFirstRenderRef.current) {
        fetchPapers(1, '', activeFilters); 
        isFirstRenderRef.current = false;
    } else {
      fetchPapers(currentPage, debouncedSearchTerm, activeFilters);
    }
    updateAllFilterOptions(activeFilters);
  }, [activeFilters, debouncedSearchTerm, currentPage]);


  const handleFilterChange = (filterName: ActiveFilterKeys, value: string) => {
    setActiveFilters(prev => {
        const newActiveFilters = {...prev, [filterName]: value};
        const filterOrder: ActiveFilterKeys[] = ['years', 'programmes', 'terms', 'semesters', 'branches'];
        const currentIndex = filterOrder.indexOf(filterName);

        if (currentIndex !== -1) {
            for (let i = currentIndex + 1; i < filterOrder.length; i++) {
                newActiveFilters[filterOrder[i]] = 'all';
            }
        }
        return newActiveFilters;
    });
    setCurrentPage(1); 
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage && !isLoadingPapers) {
        setCurrentPage(newPage);
    }
  };

  const handleResetFilters = () => {
    setActiveFilters({
        years: 'all',
        programmes: 'all',
        terms: 'all',
        semesters: 'all',
        branches: 'all',
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const isLoading = isLoadingPapers || isLoadingOptions;
  const isAnyFilterSelected = Object.values(activeFilters).some(val => val !== 'all') || searchTerm !== '';

  return (
     <TooltipProvider>
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl relative">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        href="https://github.com/NilayShenai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-4 right-4 md:top-6 md:right-6 text-muted-foreground hover:text-foreground transition-colors duration-200 z-10"
                        aria-label="GitHub Profile"
                    >
                        <Github className="h-5 w-5 md:h-6 md:w-6" />
                    </Link>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Open profile</p>
                </TooltipContent>
            </Tooltip>

        <header className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
            Papers, Please
            </h1>
             <Link
                href="https://github.com/NilayShenai/Papers-Please"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Project Repository on GitHub"
                className="text-md text-muted-foreground hover:text-primary hover:underline transition-colors"
            >
                MIT Manipal Library: Revamped
            </Link>
        </header>

        <div className="mb-8 space-y-5">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                type="text"
                aria-label="Search papers"
                placeholder={`Search ${isLoadingPapers && !totalPapers ? '...' : totalPapers} papers by name or subject...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border-input focus:ring-primary focus:border-primary rounded-md shadow-none h-9"
                disabled={isLoading}
                />
                {searchTerm && isLoadingPapers && (
                    <Loader2 className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin" />
                )}
            </div>

             <div className="flex flex-col md:flex-row md:items-end md:gap-3">
                 <div className="flex-grow mb-3 md:mb-0">
                     <Filters
                         years={availableYears}
                         programmes={availableProgrammes}
                         terms={availableTerms}
                         semesters={availableSemesters}
                         branches={availableBranches}
                         activeFilters={activeFilters}
                         onFilterChange={handleFilterChange}
                         isLoadingOptions={isLoadingOptions}
                     />
                 </div>
                 <Tooltip>
                     <TooltipTrigger asChild>
                         <Button
                             variant="ghost"
                             size="sm"
                             onClick={handleResetFilters}
                             className={`h-9 px-3 text-muted-foreground hover:text-primary transition-opacity duration-200 ${
                                 isAnyFilterSelected ? 'opacity-100' : 'opacity-50 pointer-events-none'
                             }`}
                             disabled={isLoading || !isAnyFilterSelected}
                             aria-label="Reset all filters"
                         >
                             <RotateCcw className="h-4 w-4" />
                         </Button>
                     </TooltipTrigger>
                     <TooltipContent>
                         <p>Reset Filters</p>
                     </TooltipContent>
                 </Tooltip>
             </div>
        </div>

        <Separator className="mb-8" />

        {isLoadingPapers && papers.length === 0 && !error && (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading papers...</span>
            </div>
        )}

        {error && !isLoadingPapers && (
            <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                {error} Please try refreshing the page or adjusting filters.
                </AlertDescription>
            </Alert>
        )}

        {(!isLoadingPapers || papers.length > 0) && !error && (
            <>
            <PaperList papers={papers} />

                {totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1 || isLoadingPapers}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages} ({totalPapers} results)
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages || isLoadingPapers}
                    >
                        Next
                    </Button>
                </div>
                )}

                {!isLoadingPapers && papers.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-transparent rounded-lg border border-dashed mt-8">
                    <p className="text-base font-normal">No papers found matching your criteria.</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                )}
            </>
        )}
        </div>
     </TooltipProvider>
  );
}


import { getAvailableFilterOptions } from '@/lib/papersLoader'; 
import { PapersPleaseClient } from '@/components/PapersPleaseClient'; 
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Github } from 'lucide-react';

function LoadingSkeleton() {
  return (
     <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl relative"> 
       <div className="mb-8 text-center">
          <Skeleton className="h-8 w-1/3 mx-auto mb-2 rounded-md" /> 
          <Skeleton className="h-4 w-1/2 mx-auto rounded-md" /> 
       </div>
       <Skeleton className="absolute top-4 right-4 md:top-6 md:right-6 h-6 w-6 rounded-md" />

       <div className="mb-8 space-y-5">
            <Skeleton className="h-9 w-full rounded-md" /> 
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 items-end">
                <Skeleton className="h-9 w-full rounded-md" /> 
                <Skeleton className="h-9 w-full rounded-md" /> 
                <Skeleton className="h-9 w-full rounded-md" /> 
                <Skeleton className="h-9 w-full rounded-md" /> 
                <Skeleton className="h-9 w-full rounded-md" /> 
            </div>
       </div>

        <Separator className="mb-8" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           {[...Array(9)].map((_, i) => ( 
             <div key={i} className="h-full bg-card rounded-lg border border-border p-4 flex flex-col"> 
                <div className="pb-2">
                   <Skeleton className="h-4 w-3/4 mb-1.5 rounded" /> 
                   <Skeleton className="h-3 w-1/2 mb-2 rounded" /> 
                </div>
                <div className="flex-grow pt-0 flex flex-wrap gap-1.5 mt-1">
                   <Skeleton className="h-4 w-12 rounded-md" /> 
                   <Skeleton className="h-4 w-14 rounded-md" /> 
                   <Skeleton className="h-4 w-16 rounded-md" /> 
                   <Skeleton className="h-4 w-14 rounded-md" /> 
                   <Skeleton className="h-4 w-14 rounded-md" /> 
                </div>
             </div>
           ))}
        </div>
     </div>
  );
}


export default async function Home() {
  console.log("[page.tsx] Fetching initial filter options...");
  
  const initialFilterOptions = await getAvailableFilterOptions();
  console.log("[page.tsx] Initial filter options fetched:", initialFilterOptions);

  return (
     <Suspense fallback={<LoadingSkeleton />}>
       <PapersPleaseClient initialFilterOptions={initialFilterOptions} /> 
     </Suspense>
  );
}

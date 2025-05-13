
"use client";

import type { Dispatch, SetStateAction } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

interface AvailableFilters {
  years: string[];
  programmes: string[];
  terms: string[];
  semesters: string[];
  branches: string[];
}
type ActiveFilterKeys = keyof AvailableFilters;


interface FiltersProps extends AvailableFilters {
  activeFilters: Record<ActiveFilterKeys, string>;
  onFilterChange: (filterName: ActiveFilterKeys, value: string) => void;
  isLoadingOptions: boolean; 
}

export function Filters({
  years,
  programmes,
  terms,
  semesters,
  branches,
  activeFilters,
  onFilterChange,
  isLoadingOptions,
}: FiltersProps) {

  const filterConfigs: { level: ActiveFilterKeys, placeholderLabel: string, options: string[] }[] = [
    { level: 'years', placeholderLabel: 'Year', options: years },
    { level: 'programmes', placeholderLabel: 'Programme', options: programmes },
    { level: 'terms', placeholderLabel: 'Term', options: terms },
    { level: 'semesters', placeholderLabel: 'Semester', options: semesters },
    { level: 'branches', placeholderLabel: 'Branch', options: branches },
  ];

  const renderSelect = (
    level: ActiveFilterKeys,
    options: string[],
    placeholderLabel: string,
  ) => {
    const currentValue = activeFilters[level];
    const isDisabled = isLoadingOptions; 

    let triggerPlaceholderText: string;
    if (placeholderLabel === 'Year') {
      triggerPlaceholderText = 'All Years';
    } else if (placeholderLabel === 'Branch') {
      triggerPlaceholderText = 'All Branches';
    } else {
      triggerPlaceholderText = `All ${placeholderLabel}s`;
    }


    return (
      <div className="relative" key={level}>
         <Select 
            value={currentValue} 
            onValueChange={(value) => onFilterChange(level, value)} 
            disabled={isDisabled}
          >
           <SelectTrigger
              aria-label={`${placeholderLabel} Filter`}
              className="w-full transition-colors duration-150 ease-in-out hover:border-primary/50 focus:ring-primary bg-background rounded-md shadow-none text-sm py-1.5 h-9 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <SelectValue placeholder={triggerPlaceholderText} />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">{triggerPlaceholderText}</SelectItem>
             {options.map((option) => (
               <SelectItem key={option} value={option}>
                 {option}
               </SelectItem>
             ))}
             {!isLoadingOptions && options.length === 0 && <SelectItem value="no-options" disabled>No options available</SelectItem>}
           </SelectContent>
         </Select>
          {isLoadingOptions && ( 
             <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 items-end">
      {filterConfigs.map(config => renderSelect(config.level, config.options, config.placeholderLabel))}
    </div>
  );
}

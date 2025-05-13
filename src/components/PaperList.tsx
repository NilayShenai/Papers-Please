
"use client";

import type { Paper } from '@/types/paper';
import { FileText, Calendar, Tag, BookOpen, GitBranch, GraduationCap } from 'lucide-react'; 
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PaperListProps {
  papers: Paper[]; 
}

export function PaperList({ papers }: PaperListProps) {

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'tween', ease: 'easeOut', duration: 0.3 },
     },
  };


  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[300px]" 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      key={papers.map(p => p.id).join('-')} 
    >
      {papers.map((paper) => (
        <motion.div
          key={paper.id} 
          variants={itemVariants}
          layout 
        >
          <Card className="h-full transition-colors duration-200 ease-in-out hover:border-primary/40 border bg-card flex flex-col shadow-none rounded-lg">
             <CardHeader className="p-4 pb-2">
               <CardTitle className="text-sm font-medium leading-snug flex items-start gap-2">
                 <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                 <Link href={paper.url} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">
                    {paper.name}
                 </Link>
               </CardTitle>
               {paper.subject && paper.subject !== paper.name && (
                  <CardDescription className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5 pl-[22px]">
                      <Tag className="w-3 h-3"/> {paper.subject}
                  </CardDescription>
                )}
             </CardHeader>
             <CardContent className="flex-grow p-4 pt-1">
                <div className="flex flex-wrap gap-1.5 mt-1.5 pl-[22px]">
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs font-normal px-1.5 py-0.5 rounded-md">
                        <Calendar className="w-3 h-3" /> {paper.year}
                    </Badge>
                    {paper.programme && ( 
                       <Badge variant="secondary" className="flex items-center gap-1 text-xs font-normal px-1.5 py-0.5 rounded-md">
                         <GraduationCap className="w-3 h-3" /> {paper.programme}
                       </Badge>
                     )}
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs font-normal px-1.5 py-0.5 rounded-md">
                        <Calendar className="w-3 h-3" /> {paper.term}
                    </Badge>
                     {paper.semester && (
                       <Badge variant="secondary" className="flex items-center gap-1 text-xs font-normal px-1.5 py-0.5 rounded-md">
                         <BookOpen className="w-3 h-3" /> {paper.semester}
                       </Badge>
                     )}
                     {paper.branch && (
                       <Badge variant="secondary" className="flex items-center gap-1 text-xs font-normal px-1.5 py-0.5 rounded-md">
                         <GitBranch className="w-3 h-3" /> {paper.branch}
                       </Badge>
                     )}
                </div>
             </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

export interface Paper {
  path: string[];
  name: string; // Derived from filename, cleaned
  url: string;
  // Derived properties
  year: string;
  term: string;
  programme?: string; // e.g., B.Tech, M.Tech
  semester?: string; // e.g., "I Sem", "V Sem", optional string representing the semester
  branch?: string; // Optional string representing the branch (e.g., "Computer Science")
  subject?: string; // Derived from name/filename
  id: string; // Unique identifier for React keys
}

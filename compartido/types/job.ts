export interface Job {
  id: number;
  title: string;
  company: string;
  city: string;
  mode: "Remoto" | "Híbrido" | "Presencial";
  salary: string;
  category: string;
  seniority: "Junior" | "Mid" | "Senior";
  featured: boolean;
  description?: string;
  requirements?: string[];
  postedAt?: string;
}

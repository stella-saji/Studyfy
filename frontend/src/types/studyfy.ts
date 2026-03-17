export interface Material {
  id: string;
  filename: string;
  subject: string;
  uploadDate: string;
  size: number;
  fileDataURL: string;
}

export interface StudyfyData {
  subjects: string[];
  materials: Material[];
}

export type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";

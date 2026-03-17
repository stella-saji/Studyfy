import { Material, StudyfyData } from "@/types/studyfy";

const STORAGE_KEY = "studyfy_data";

const DEFAULT_SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "History", "English"];

export function loadData(): StudyfyData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StudyfyData;
      return parsed;
    }
  } catch {
    // corrupt data, reset
  }
  const initial: StudyfyData = { subjects: [...DEFAULT_SUBJECTS], materials: [] };
  saveData(initial);
  return initial;
}

export function saveData(data: StudyfyData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("Storage quota exceeded:", e);
    return false;
  }
}

export function addSubject(data: StudyfyData, name: string): StudyfyData {
  const trimmed = name.trim();
  if (!trimmed || data.subjects.includes(trimmed)) return data;
  const updated = { ...data, subjects: [...data.subjects, trimmed] };
  saveData(updated);
  return updated;
}

export function addMaterial(data: StudyfyData, material: Material): StudyfyData {
  const updated = { ...data, materials: [...data.materials, material] };
  const saved = saveData(updated);
  if (!saved) throw new Error("Storage full");
  return updated;
}

export function deleteMaterial(data: StudyfyData, id: string): StudyfyData {
  const updated = { ...data, materials: data.materials.filter((m) => m.id !== id) };
  saveData(updated);
  return updated;
}

export function deleteSubject(data: StudyfyData, name: string): StudyfyData {
  const updated = {
    subjects: data.subjects.filter((s) => s !== name),
    materials: data.materials.filter((m) => m.subject !== name),
  };
  saveData(updated);
  return updated;
}

export function deleteAllMaterials(data: StudyfyData, subject?: string | null): StudyfyData {
  const updated = {
    ...data,
    materials: subject ? data.materials.filter((m) => m.subject !== subject) : [],
  };
  saveData(updated);
  return updated;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toUpperCase() || "FILE";
}

export function getFileTypeColor(filename: string): { bg: string; text: string } {
  const ext = getFileExtension(filename).toLowerCase();
  if (ext === "pdf") return { bg: "bg-red-100", text: "text-red-600" };
  if (["jpg", "jpeg", "png"].includes(ext)) return { bg: "bg-green-100", text: "text-green-600" };
  if (["doc", "docx"].includes(ext)) return { bg: "bg-blue-100", text: "text-blue-600" };
  if (["pptx", "ppt"].includes(ext)) return { bg: "bg-orange-100", text: "text-orange-600" };
  if (["xlsx", "xls"].includes(ext)) return { bg: "bg-emerald-100", text: "text-emerald-600" };
  return { bg: "bg-gray-100", text: "text-gray-600" };
}

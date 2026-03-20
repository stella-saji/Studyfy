import { StudyfyData } from "@/types/studyfy";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.toString().trim();
const API_BASE = (() => {
  if (!rawBaseUrl) return "";
  try {
    const url = new URL(rawBaseUrl);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    if (import.meta.env.PROD && url.protocol === "http:") {
      console.warn("[Studyfy] Insecure HTTP API URL blocked in production.");
      return "";
    }
    return url.origin;
  } catch {
    return "";
  }
})();

function toApiUrl(path: string): string {
  if (!API_BASE) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(toApiUrl(path), {
      ...init,
      credentials: "include",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...((() => {
          try {
            const token = localStorage.getItem("studyfy_auth_token");
            return token ? { Authorization: `Bearer ${token}` } : {};
          } catch {
            return {};
          }
        })()),
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Studyfy API Error] ${response.status}:`, text);
      throw new Error(`Request failed. Please try again. (${response.status})`);
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function loadData(): Promise<StudyfyData> {
  const response = await apiFetch("/api/data", { method: "GET" });
  return response.json() as Promise<StudyfyData>;
}

export async function addSubject(name: string): Promise<void> {
  await apiFetch("/api/subjects", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function uploadMaterial(
  file: File,
  subject: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const MAX_BYTES = 50 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      reject(new Error("File exceeds the 50 MB limit."));
      return;
    }
    xhr.open("POST", toApiUrl("/api/materials"));
    try {
      const token = localStorage.getItem("studyfy_auth_token");
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    } catch {
      // Ignore localStorage access errors (privacy mode or storage restrictions).
    }
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onerror = () => reject(new Error("Network error while uploading"));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      reject(new Error(xhr.responseText || `Upload failed with ${xhr.status}`));
    };

    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("file", file);
    xhr.send(formData);
  });
}

export async function deleteMaterial(id: string): Promise<void> {
  await apiFetch(`/api/materials/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function deleteSubject(name: string): Promise<void> {
  await apiFetch(`/api/subjects/${encodeURIComponent(name)}`, { method: "DELETE" });
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

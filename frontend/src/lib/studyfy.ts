import { StudyfyData } from "@/types/studyfy";

export interface UploadFailure {
  filename: string;
  error: string;
}

export interface UploadBatchResult {
  failed: UploadFailure[];
}

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

export const TRUSTED_DOWNLOAD_ORIGINS = (() => {
  const origins = new Set<string>();

  if (typeof window !== "undefined") {
    origins.add(window.location.origin);
  }

  if (API_BASE) {
    origins.add(API_BASE);
  }

  return origins;
})();

function toApiUrl(path: string): string {
  if (!API_BASE) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  const authHeaders = (() => {
    try {
      const token = localStorage.getItem("studyfy_auth_token");
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  })();
  const contentTypeHeaders = typeof init?.body === "string" ? { "Content-Type": "application/json" } : {};

  try {
    const response = await fetch(toApiUrl(path), {
      ...init,
      credentials: "include",
      signal: controller.signal,
      headers: {
        ...contentTypeHeaders,
        ...authHeaders,
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
  files: File[],
  subject: string,
  onProgress?: (percent: number) => void,
): Promise<UploadBatchResult> {
  return new Promise<UploadBatchResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const MAX_BYTES = 50 * 1024 * 1024;
    if (files.length === 0) {
      reject(new Error("At least one file is required."));
      return;
    }
    if (files.some((file) => file.size > MAX_BYTES)) {
      reject(new Error("One or more files exceed the 50 MB limit."));
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
        try {
          const parsed = JSON.parse(xhr.responseText || "{}") as { failed?: UploadFailure[] };
          resolve({ failed: Array.isArray(parsed.failed) ? parsed.failed : [] });
        } catch {
          resolve({ failed: [] });
        }
        return;
      }
      reject(new Error(xhr.responseText || `Upload failed with ${xhr.status}`));
    };

    const formData = new FormData();
    formData.append("subject", subject);
    for (const file of files) {
      formData.append("files", file);
    }
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

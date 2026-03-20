import { useState, useRef, useCallback } from "react";
import { Upload, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.docx,.doc,.txt,.pptx,.xlsx";
const ACCEPTED_TYPES = ["pdf", "jpg", "jpeg", "png", "docx", "doc", "txt", "pptx", "xlsx"];
const MAX_FILE_BYTES = 50 * 1024 * 1024;

interface UploadCardProps {
  subjects: string[];
  onUpload: (files: File[], subject: string) => Promise<File[]>;
  uploading: boolean;
  progress: number;
  onInvalidFile?: (message: string) => void;
}

export function UploadCard({ subjects, onUpload, uploading, progress, onInvalidFile }: UploadCardProps) {
  const [subject, setSubject] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [hasFailedBatch, setHasFailedBatch] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (candidate: File) => {
      const ext = candidate.name.split(".").pop()?.toLowerCase() || "";
      if (!ACCEPTED_TYPES.includes(ext)) {
        const message = "File type not supported.";
        if (onInvalidFile) onInvalidFile(message);
        else window.alert(message);
        return false;
      }
      if (candidate.size > MAX_FILE_BYTES) {
        const message = "File exceeds the 50 MB limit.";
        if (onInvalidFile) onInvalidFile(message);
        else window.alert(message);
        return false;
      }
      return true;
    },
    [onInvalidFile],
  );

  const validateFiles = useCallback((selectedFiles: File[]) => {
    for (const selectedFile of selectedFiles) {
      if (!validateFile(selectedFile)) return false;
    }
    return true;
  }, [validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length === 0 || !validateFiles(dropped)) return;
    setFiles(dropped);
    setHasFailedBatch(false);
  }, [validateFiles]);

  const handleSubmit = async () => {
    if (files.length > 0 && subject && !uploading) {
      const failedFiles = await onUpload(files, subject);
      setFiles(failedFiles);
      setHasFailedBatch(failedFiles.length > 0);
      if (failedFiles.length === 0) {
        setSubject("");
      }
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold font-display text-foreground">Upload Material</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger>
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-4 transition-colors",
            dragOver ? "border-burnt-orange bg-accent" : "border-border hover:border-muted-foreground"
          )}
        >
          <FileUp className="mb-1 h-5 w-5 text-muted-text" />
          <span className="text-xs text-muted-text">
            {files.length === 0
              ? "Drop files or click to browse"
              : files.length === 1
                ? files[0].name
                : `${files.length} files selected`}
          </span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => {
              const selected = Array.from(e.target.files || []);
              if (selected.length === 0) {
                setFiles([]);
                return;
              }
              if (!validateFiles(selected)) {
                e.target.value = "";
                setFiles([]);
                setHasFailedBatch(false);
                return;
              }
              setFiles(selected);
              setHasFailedBatch(false);
            }}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={files.length === 0 || !subject || uploading}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading
            ? "Uploading..."
            : hasFailedBatch
              ? `Retry Failed (${files.length})`
              : "Upload"}
        </Button>
      </div>

      {uploading && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-burnt-orange transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

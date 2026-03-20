import { Material } from "@/types/studyfy";
import { getFileExtension } from "@/lib/studyfy";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface PreviewModalProps {
  material: Material | null;
  open: boolean;
  onClose: () => void;
  onDownload: (m: Material) => void;
}

export function PreviewModal({ material, open, onClose, onDownload }: PreviewModalProps) {
  if (!material) return null;

  const ext = getFileExtension(material.filename).toLowerCase();
  const isImage = ["jpg", "jpeg", "png"].includes(ext);
  const isPdf = ext === "pdf";
  const hasPreviewUrl = Boolean(material.filePreviewURL);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6 font-display">
            {material.filename}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {isImage && hasPreviewUrl && (
            <img src={material.filePreviewURL} alt={material.filename} className="mx-auto max-h-[60vh] rounded-md object-contain" />
          )}
          {isPdf && hasPreviewUrl && (
            <iframe
              src={material.filePreviewURL}
              sandbox="allow-scripts allow-same-origin"
              referrerPolicy="no-referrer"
              className="h-[60vh] w-full rounded-md"
              title={material.filename}
            />
          )}
          {((!isImage && !isPdf) || !hasPreviewUrl) && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-text">
              <p className="text-sm">Preview not available for this file.</p>
              <p className="text-xs mt-1">Download the file to open it.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onDownload(material)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

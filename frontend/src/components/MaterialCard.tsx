import { Eye, Download, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Material } from "@/types/studyfy";
import { formatFileSize, getFileExtension, getFileTypeColor } from "@/lib/studyfy";

interface MaterialCardProps {
  material: Material;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export function MaterialCard({ material, onView, onDownload, onDelete }: MaterialCardProps) {
  const ext = getFileExtension(material.filename);
  const colors = getFileTypeColor(material.filename);
  const date = new Date(material.uploadDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group flex flex-col rounded-lg border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className={`flex items-center gap-3 rounded-t-lg p-4 ${colors.bg}`}>
        <FileText className={`h-8 w-8 ${colors.text}`} />
        <span className={`text-xs font-bold uppercase ${colors.text}`}>{ext}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 truncate text-sm font-semibold text-foreground" title={material.filename}>
          {material.filename}
        </p>
        <p className="mb-2 text-xs text-muted-text">
          {date} · {formatFileSize(material.size)}
        </p>
        <span className="mb-3 inline-block w-fit rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">
          {material.subject}
        </span>
        <div className="mt-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={onView} className="flex-1 text-xs">
            <Eye className="mr-1 h-3 w-3" /> View
          </Button>
          <Button variant="outline" size="sm" onClick={onDownload} className="flex-1 text-xs">
            <Download className="mr-1 h-3 w-3" /> Save
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

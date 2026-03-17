import { useState } from "react";
import { Plus, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StudyfyData } from "@/types/studyfy";
import { cn } from "@/lib/utils";

interface SidebarProps {
  data: StudyfyData;
  activeSubject: string | null;
  onSelectSubject: (subject: string | null) => void;
  onAddSubject: (name: string) => void;
  onDeleteSubject: (name: string) => void;
  className?: string;
}

export function AppSidebar({ data, activeSubject, onSelectSubject, onAddSubject, onDeleteSubject, className }: SidebarProps) {
  const [newSubject, setNewSubject] = useState("");
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);

  const handleAdd = () => {
    if (newSubject.trim()) {
      onAddSubject(newSubject.trim());
      setNewSubject("");
    }
  };

  const countForSubject = (subject: string) =>
    data.materials.filter((m) => m.subject === subject).length;

  const filesToDelete = subjectToDelete ? countForSubject(subjectToDelete) : 0;

  return (
    <aside className={cn("w-60 flex-shrink-0 flex-col border-r bg-surface", className ?? "hidden md:flex")}>
      <div className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-text">Subjects</p>
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => onSelectSubject(null)}
            className={cn(
              "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeSubject === null
                ? "border-l-2 border-burnt-orange bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              All Materials
            </span>
            <span className="text-xs text-muted-text">{data.materials.length}</span>
          </button>
          {data.subjects.map((subject) => (
            <div
              key={subject}
              className={cn(
                "group flex items-center justify-between rounded-md pr-1 text-sm font-medium transition-colors",
                activeSubject === subject
                  ? "border-l-2 border-burnt-orange bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              <button
                onClick={() => onSelectSubject(subject)}
                className="flex flex-1 items-center justify-between truncate px-3 py-2"
              >
                <span className="truncate">{subject}</span>
                <span className="text-xs text-muted-text">{countForSubject(subject)}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSubjectToDelete(subject);
                }}
                className="hidden rounded p-1 text-muted-text hover:text-destructive group-hover:block"
                title={`Delete ${subject}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-text">Add Subject</p>
        <div className="flex gap-2">
          <Input
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Subject name"
            className="h-8 text-sm"
          />
          <Button
            size="sm"
            onClick={handleAdd}
            className="h-8 bg-teal text-teal-foreground hover:bg-teal/90"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <AlertDialog open={!!subjectToDelete} onOpenChange={(open) => !open && setSubjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subject?</AlertDialogTitle>
            <AlertDialogDescription>
              {subjectToDelete
                ? `Delete "${subjectToDelete}"? This will also remove ${filesToDelete} file${filesToDelete !== 1 ? "s" : ""}.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (subjectToDelete) onDeleteSubject(subjectToDelete);
                setSubjectToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}

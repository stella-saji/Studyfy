import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, FolderOpen, SlidersHorizontal, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { UploadCard } from "@/components/UploadCard";
import { MaterialCard } from "@/components/MaterialCard";
import { PreviewModal } from "@/components/PreviewModal";
import { DeleteModal } from "@/components/DeleteModal";
import { loadData, addSubject, uploadMaterial, deleteMaterial, deleteSubject } from "@/lib/studyfy";
import { Material, StudyfyData, SortOption } from "@/types/studyfy";

const EMPTY_DATA: StudyfyData = { subjects: [], materials: [] };

export default function Index() {
  const [data, setData] = useState<StudyfyData>(EMPTY_DATA);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const refreshData = useCallback(async () => {
    const next = await loadData();
    setData(next);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        await refreshData();
      } catch {
        toast({
          title: "Server unavailable",
          description: "Could not load materials from backend.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [refreshData, toast]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAddSubject = useCallback((name: string) => {
    const run = async () => {
      try {
        await addSubject(name);
        await refreshData();
      } catch {
        toast({
          title: "Could not add subject",
          description: "Try a different name or try again.",
          variant: "destructive",
        });
      }
    };
    void run();
  }, [refreshData, toast]);

  const handleDeleteSubject = useCallback((name: string) => {
    const run = async () => {
      try {
        await deleteSubject(name);
        if (activeSubject === name) setActiveSubject(null);
        await refreshData();
        toast({ title: "Subject deleted", description: `"${name}" and its materials were removed.` });
      } catch {
        toast({
          title: "Delete failed",
          description: "Could not delete subject.",
          variant: "destructive",
        });
      }
    };
    void run();
  }, [activeSubject, refreshData, toast]);

  const handleUpload = useCallback((file: File, subject: string) => {
    const run = async () => {
      setUploading(true);
      setProgress(0);
      try {
        await uploadMaterial(file, subject, setProgress);
        await refreshData();
        toast({ title: "Upload successful", description: `${file.name} has been added.` });
      } catch {
        toast({
          title: "Upload failed",
          description: "Could not upload the file.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
        setProgress(0);
      }
    };
    void run();
  }, [refreshData, toast]);

  const handleDelete = useCallback(() => {
    if (!deletingMaterial) return;
    const run = async () => {
      try {
        await deleteMaterial(deletingMaterial.id);
        await refreshData();
        toast({ title: "File deleted", description: `${deletingMaterial.filename} was removed.` });
      } catch {
        toast({
          title: "Delete failed",
          description: "Could not delete file.",
          variant: "destructive",
        });
      }
      setDeletingMaterial(null);
    };
    void run();
  }, [deletingMaterial, refreshData, toast]);

  const handleDownload = useCallback((m: Material) => {
    if (!m.fileDownloadURL) return;
    try {
      const url = new URL(m.fileDownloadURL, window.location.origin);
      const ALLOWED_ORIGINS = [window.location.origin];
      if (!["http:", "https:"].includes(url.protocol) || !ALLOWED_ORIGINS.includes(url.origin)) {
        toast({
          title: "Download blocked",
          description: "This file's download URL is not trusted.",
          variant: "destructive",
        });
        return;
      }
      const a = document.createElement("a");
      a.href = url.href;
      a.download = m.filename;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      toast({
        title: "Download failed",
        description: "Invalid download URL.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const filtered = useMemo(() => {
    let items = data.materials;
    if (activeSubject) items = items.filter((m) => m.subject === activeSubject);
    if (debouncedSearch) items = items.filter((m) => m.filename.toLowerCase().includes(debouncedSearch.toLowerCase()));
    switch (sort) {
      case "newest": return [...items].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      case "oldest": return [...items].sort((a, b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime());
      case "name-asc": return [...items].sort((a, b) => a.filename.localeCompare(b.filename));
      case "name-desc": return [...items].sort((a, b) => b.filename.localeCompare(a.filename));
      default: return items;
    }
  }, [data.materials, activeSubject, debouncedSearch, sort]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header data={data} />
      <div className="flex flex-1">
        {!isMobile && (
          <AppSidebar
            data={data}
            activeSubject={activeSubject}
            onSelectSubject={setActiveSubject}
            onAddSubject={handleAddSubject}
            onDeleteSubject={handleDeleteSubject}
          />
        )}

        {/* Mobile sidebar toggle */}
        {isMobile && (
          <div className="fixed bottom-4 left-4 z-40">
          <Button
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-full bg-ink text-primary-foreground shadow-lg"
          >
            <Menu className="h-5 w-5" />
          </Button>
          </div>
        )}

        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-72 p-0 sm:max-w-none">
              <AppSidebar
                data={data}
                activeSubject={activeSubject}
                onSelectSubject={(s) => { setActiveSubject(s); setSidebarOpen(false); }}
                onAddSubject={handleAddSubject}
                onDeleteSubject={handleDeleteSubject}
                className="flex h-full w-full border-r-0"
              />
            </SheetContent>
          </Sheet>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <UploadCard
            subjects={data.subjects}
            onUpload={handleUpload}
            uploading={uploading}
            progress={progress}
            onInvalidFile={(message) => toast({ title: "Unsupported file", description: message, variant: "destructive" })}
          />

          <div className="mt-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold font-display text-foreground">
                  {activeSubject || "All Materials"}
                </h2>
                <p className="text-sm text-muted-text">{filtered.length} file{filtered.length !== 1 ? "s" : ""}</p>
              </div>
              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="w-44">
                  <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-text" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="name-asc">Name A–Z</SelectItem>
                  <SelectItem value="name-desc">Name Z–A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-text" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files..."
                className="pl-9"
                disabled={loading}
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 rounded-lg border bg-card animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-text">
                <FolderOpen className="mb-3 h-12 w-12" />
                <p className="text-sm font-medium">
                  {search ? "No matching files" : "No materials yet"}
                </p>
                <p className="text-xs mt-1">
                  {search ? "Try a different search term" : "Upload your first study material above"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                {filtered.map((m) => (
                  <MaterialCard
                    key={m.id}
                    material={m}
                    onView={() => setPreviewMaterial(m)}
                    onDownload={() => handleDownload(m)}
                    onDelete={() => setDeletingMaterial(m)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <PreviewModal
        material={previewMaterial}
        open={!!previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        onDownload={handleDownload}
      />
      <DeleteModal
        material={deletingMaterial}
        open={!!deletingMaterial}
        onClose={() => setDeletingMaterial(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

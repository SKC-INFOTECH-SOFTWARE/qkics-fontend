import { useState } from "react";
import { useSelector } from "react-redux";
import { FaPlus } from "react-icons/fa6";
import Document from "./document";
import MyDownloads from "../components/Documents/MyDownloads";
import UploadDocumentModal from "../components/Documents/UploadDocumentModal";
import { PageHeader, SearchInput, Button } from "../components/ui";

const TABS = [
  { key: "all", label: "All" },
  { key: "free", label: "Free" },
  { key: "premium", label: "Premium" },
  { key: "downloads", label: "My Downloads" },
];

export default function DocumentsPage() {
  const { theme } = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">

        <PageHeader
          title={<>Resource <span className="text-primary">Library</span></>}
          description="Access curated professional intelligence, technical documentation, and your personal asset collective."
          align="end"
        >
          <div className="flex w-full flex-col items-stretch gap-4 md:w-auto md:items-end">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search Documents..."
              />
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                className="shrink-0 rounded-full uppercase tracking-wide"
              >
                <FaPlus size={14} /> Upload
              </Button>
            </div>

            {/* Segmented control tabs */}
            <div className="inline-flex flex-wrap gap-1 self-start rounded-2xl border border-border bg-muted/50 p-1.5 md:self-end">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap rounded-xl px-5 py-2 text-2xs font-black uppercase tracking-widest transition-all ${activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </PageHeader>

        {/* Page Content */}
        <div className="animate-fadeIn">
          {activeTab !== "downloads" ? (
            <Document theme={theme} searchQuery={searchQuery} filter={activeTab} refreshTrigger={refreshTrigger} />
          ) : (
            <div className="mx-auto max-w-6xl">
              <MyDownloads theme={theme} searchQuery={searchQuery} />
            </div>
          )}
        </div>
      </div>

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        theme={theme}
        onSuccess={() => {
          setRefreshTrigger((prev) => prev + 1);
          setIsUploadModalOpen(false);
        }}
      />
    </div>
  );
}

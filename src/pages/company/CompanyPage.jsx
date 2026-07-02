import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import axiosSecure from "../../components/utils/axiosSecure";
import CompanyPostCard from "./components/CompanyPostCard";
import CompanyCard from "./components/CompanyCard"; 
import { useAlert } from "../../context/AlertContext";
import { FaBuilding, FaThList, FaRegNewspaper, FaArrowLeft } from "react-icons/fa";
import SponsorCard from "../../components/ui/SponsorCard";
import ConfirmationAlert from "../../components/ui/ConfirmationAlert";
import { useNavigate } from "react-router-dom";

export default function CompanyPage() {
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const isDark = theme === "dark";
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  /* ----------------------------
      TABS STATE
  ----------------------------- */
  const [activeTab, setActiveTab] = useState(
    sessionStorage.getItem("companyActiveTab") || "posts"
  );

  useEffect(() => {
    sessionStorage.setItem("companyActiveTab", activeTab);
  }, [activeTab]);

  /* ----------------------------
      POSTS STATE
  ----------------------------- */
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [pagePosts, setPagePosts] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postIdToDelete, setPostIdToDelete] = useState(null);
  const [myCompanyIds, setMyCompanyIds] = useState([]);

  /* ----------------------------
      COMPANIES STATE
  ----------------------------- */
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [hasMoreCompanies, setHasMoreCompanies] = useState(true);
  const [pageCompanies, setPageCompanies] = useState(1);

  /* ----------------------------
      OBSERVER (INFINITE SCROLL)
  ----------------------------- */
  const observer = useRef();
  const lastElementRef = useCallback(
    (node) => {
      const loading = activeTab === "posts" ? loadingPosts : loadingCompanies;
      const hasMore = activeTab === "posts" ? hasMorePosts : hasMoreCompanies;
      
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          if (activeTab === "posts") {
            setPagePosts((prev) => prev + 1);
          } else {
            setPageCompanies((prev) => prev + 1);
          }
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingPosts, loadingCompanies, hasMorePosts, hasMoreCompanies, activeTab]
  );

  /* ----------------------------
      FETCHING LOGIC
  ----------------------------- */
  const fetchGlobalCompanyPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await axiosSecure.get("/v1/companies/posts/", {
        params: { page: pagePosts },
      });
      const data = res.data?.results || res.data || [];
      const newPosts = Array.isArray(data) ? data : [];
      setPosts((prev) => (pagePosts === 1 ? newPosts : [...prev, ...newPosts]));
      setHasMorePosts(!!res.data.next);
    } catch (err) {
      console.error("Error fetching global company posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchCompaniesList = async () => {
    try {
      setLoadingCompanies(true);
      const res = await axiosSecure.get("/v1/companies/list/", {
        params: { page: pageCompanies },
      });
      const data = res.data?.results || res.data || [];
      const newCompanies = Array.isArray(data) ? data : [];
      setCompanies((prev) => (pageCompanies === 1 ? newCompanies : [...prev, ...newCompanies]));
      setHasMoreCompanies(!!res.data.next);
    } catch (err) {
      console.error("Error fetching companies list:", err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchMyCompanies = async () => {
    try {
      const res = await axiosSecure.get("/v1/companies/my/");
      const results = res.data?.results || [];
      setMyCompanyIds(results.map(c => c.id));
    } catch (err) {
      console.error("Error fetching my companies:", err);
    }
  };

  useEffect(() => {
    fetchMyCompanies();
  }, []);

  useEffect(() => {
    if (activeTab === "posts") {
      fetchGlobalCompanyPosts();
    }
  }, [pagePosts, activeTab]);

  useEffect(() => {
    if (activeTab === "companies") {
      fetchCompaniesList();
    }
  }, [pageCompanies, activeTab]);

  /* ----------------------------
      DELETE LOGIC
  ----------------------------- */
  const handleDeleteClick = (postId) => {
    setPostIdToDelete(postId);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePost = async () => {
    if (!postIdToDelete) return;
    try {
      await axiosSecure.delete(`/v1/companies/posts/${postIdToDelete}/delete/`);
      setPosts((prev) => prev.filter((p) => p.id !== postIdToDelete));
      showAlert("Post deleted successfully!", "success");
    } catch (err) {
      console.error("Error deleting post:", err);
      showAlert("Error deleting post", "error");
    } finally {
      setShowDeleteConfirm(false);
      setPostIdToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER & TABS SELECTOR */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-fadeIn">
          <div className="max-w-xl">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              Company <span className="text-primary">Discovery</span>
            </h1>
            <p className="text-sm font-medium leading-relaxed text-muted-foreground">
              Explore insights, updates, and innovations from across the organization. Track and manage your expert intelligence exchange.
            </p>
          </div>

          {/* Segmented control tabs */}
          <div className="inline-flex shrink-0 self-start gap-1 rounded-2xl border border-border bg-muted/50 p-1.5 md:self-end">
            {[
              { id: "posts", label: "Posts", icon: <FaRegNewspaper size={14} /> },
              { id: "companies", label: "Companies", icon: <FaThList size={14} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 rounded-xl px-6 py-2.5 text-2xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="animate-fadeIn">
          {/* POSTS TAB */}
          {activeTab === "posts" && (
            <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-8 lg:grid-cols-3">
              {/* MAIN FEED */}
              <div className="space-y-6 lg:col-span-2">
                {posts.length > 0 ? (
                  posts.map((post, index) => {
                    const nodeRef = posts.length === index + 1 ? lastElementRef : null;
                    return (
                      <div ref={nodeRef} key={post.id}>
                        <CompanyPostCard post={post} isDark={isDark} />
                      </div>
                    );
                  })
                ) : (
                  !loadingPosts && (
                    <div className="rounded-2xl border border-dashed border-border py-24 text-center animate-fadeIn">
                      <FaRegNewspaper size={44} className="mx-auto mb-5 text-muted-foreground/30" />
                      <p className="text-base font-bold text-foreground">No company posts discovered yet.</p>
                      <p className="mt-2 text-2xs font-black uppercase tracking-widest text-muted-foreground/60">Post insights to start the conversation</p>
                    </div>
                  )
                )}
                {loadingPosts && (
                  <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
                    <p className="text-2xs font-black uppercase tracking-widest text-muted-foreground">Synchronizing Posts...</p>
                  </div>
                )}
              </div>

              {/* RIGHT SIDEBAR (ADS) */}
              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-8">
                  <SponsorCard isDark={isDark} />
                </div>
              </aside>
            </div>
          )}

          {/* COMPANIES TAB */}
          {activeTab === "companies" && (
            <div className="animate-fadeIn">
              {companies.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {companies.map((company, index) => {
                    const nodeRef = companies.length === index + 1 ? lastElementRef : null;
                    return (
                      <div ref={nodeRef} key={company.id}>
                        <CompanyCard company={company} isDark={isDark} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                !loadingCompanies && (
                  <div className="rounded-2xl border border-dashed border-border py-24 text-center animate-fadeIn">
                    <FaBuilding size={44} className="mx-auto mb-5 text-muted-foreground/30" />
                    <p className="text-base font-bold text-foreground">No organizations discovered yet.</p>
                    <p className="mt-2 text-2xs font-black uppercase tracking-widest text-muted-foreground/60">Be the first to list your company</p>
                  </div>
                )
              )}
              {loadingCompanies && (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
                  <p className="text-2xs font-black uppercase tracking-widest text-muted-foreground">Gathering Intelligence...</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {showDeleteConfirm && (
        <ConfirmationAlert
          title="Delete Post"
          message="Are you sure you want to delete this post? This action cannot be undone."
          confirmText="Delete"
          onConfirm={confirmDeletePost}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setPostIdToDelete(null);
          }}
        />
      )}
    </div>
  );
}


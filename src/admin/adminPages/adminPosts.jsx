import { useEffect, useState } from "react";
import { MdFeed } from "react-icons/md";
import {
  FaEye, FaTrash, FaEyeSlash, FaRegEye, FaThumbsUp, FaRegComment, FaBookOpen,
} from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import ConfirmationAlert from "../../components/ui/ConfirmationAlert";
import { PageHeader, SearchInput, Button, Badge, AdminModal } from "../../components/ui";
import { AdminTable, FIELD_CLASS, LABEL_CLASS } from "../adminComponents/adminUi";

export default function AdminPosts() {
  const { showAlert } = useAlert();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterHidden, setFilterHidden] = useState(""); // "", "false", "true"
  const [nextCursor, setNextCursor] = useState(null);
  const [prevCursor, setPrevCursor] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const [viewModal, setViewModal] = useState({ isOpen: false, post: null });
  const [moderateModal, setModerateModal] = useState({ isOpen: false, post: null });
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, postId: null });

  // comments (loaded inside the post view modal)
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentBusy, setCommentBusy] = useState(null);
  const [commentDelete, setCommentDelete] = useState({ isOpen: false, commentId: null });

  const extractCursor = (url) => {
    if (!url) return null;
    try {
      return new URL(url, window.location.origin).searchParams.get("cursor");
    } catch {
      const match = url.match(/[?&]cursor=([^&]+)/);
      return match ? match[1] : null;
    }
  };

  const fetchPosts = async (cursor = null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (cursor) params.append("cursor", cursor);
      if (searchText) params.append("search", searchText);
      if (filterHidden !== "") params.append("is_hidden", filterHidden);

      const res = await axiosSecure.get("/v1/admin/community/posts/?" + params.toString());
      const data = res.data?.results || (Array.isArray(res.data) ? res.data : []);
      setPosts(data);
      setNextCursor(extractCursor(res.data?.next));
      setPrevCursor(extractCursor(res.data?.previous));
      setTotalCount(res.data?.count || data.length);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load posts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchPosts(), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, filterHidden]);

  const fetchComments = async (postId) => {
    try {
      setLoadingComments(true);
      const res = await axiosSecure.get(`/v1/admin/community/comments/?post=${postId}`);
      const data = res.data?.results || (Array.isArray(res.data) ? res.data : []);
      setComments(data);
    } catch (err) {
      console.error(err);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const openView = (post) => {
    setComments([]);
    setViewModal({ isOpen: true, post });
    fetchComments(post.id);
  };

  const toggleComment = async (c) => {
    setCommentBusy(c.id);
    try {
      await axiosSecure.patch(`/v1/admin/community/comments/${c.id}/moderate/`, {
        is_hidden: !c.is_hidden,
      });
      setComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_hidden: !x.is_hidden } : x)));
      fetchPosts(); // keep the list's comment counts in sync
    } catch (err) {
      console.error(err);
      showAlert("Failed to update comment", "error");
    } finally {
      setCommentBusy(null);
    }
  };

  const confirmCommentDelete = async () => {
    try {
      await axiosSecure.delete(`/v1/admin/community/comments/${commentDelete.commentId}/delete/`);
      setComments((prev) => prev.filter((x) => x.id !== commentDelete.commentId));
      setCommentDelete({ isOpen: false, commentId: null });
      showAlert("Comment deleted", "success");
      fetchPosts();
    } catch (err) {
      console.error(err);
      showAlert("Failed to delete comment", "error");
    }
  };

  const openModerate = (post) => {
    setReason(post.moderation_reason || "");
    setModerateModal({ isOpen: true, post });
  };

  const submitModerate = async (e) => {
    e?.preventDefault();
    const post = moderateModal.post;
    if (!post) return;
    const nextHidden = !post.is_hidden; // toggle
    setSubmitting(true);
    try {
      await axiosSecure.patch(`/v1/admin/community/posts/${post.id}/moderate/`, {
        is_hidden: nextHidden,
        reason: nextHidden ? reason : "",
      });
      showAlert(nextHidden ? "Post hidden from feed" : "Post restored to feed", "success");
      setModerateModal({ isOpen: false, post: null });
      setReason("");
      fetchPosts();
    } catch (err) {
      console.error(err);
      showAlert("Failed to update post", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await axiosSecure.delete(`/v1/admin/community/posts/${deleteConfirm.postId}/delete/`);
      showAlert("Post deleted permanently", "success");
      setDeleteConfirm({ isOpen: false, postId: null });
      fetchPosts();
    } catch (err) {
      console.error(err);
      showAlert("Failed to delete post", "error");
    }
  };

  const authorName = (a) => a?.username || a?.email || "Unknown";
  const snippet = (p) =>
    (p.preview_content || p.content || "").trim().slice(0, 120) || "—";

  const columns = [
    { key: "post", label: "Post" },
    { key: "author", label: "Author" },
    { key: "engagement", label: "Engagement", align: "center" },
    { key: "status", label: "Status", align: "center" },
    { key: "actions", label: "Actions", align: "center" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<MdFeed />}
        title="Posts Management"
        subtitle="Moderate community feed posts"
        breadcrumb={[{ label: "Dashboard", to: "/admin" }, { label: "Posts" }]}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <SearchInput value={searchText} onChange={setSearchText} placeholder="Search posts, author…" />
        <select
          value={filterHidden}
          onChange={(e) => setFilterHidden(e.target.value)}
          className="rounded-full border border-input bg-muted px-4 py-2.5 text-sm font-bold text-foreground outline-none hover:bg-muted/70 focus:border-primary"
        >
          <option value="">All Posts</option>
          <option value="false">Visible</option>
          <option value="true">Hidden</option>
        </select>
      </div>

      <AdminTable
        columns={columns}
        rows={posts}
        loading={loading}
        loadingLabel="Loading posts…"
        empty={{ icon: <MdFeed />, title: "No posts found", description: "Try adjusting your search or filter." }}
        renderRow={(post) => (
          <>
            <td className="py-3 px-5 max-w-md">
              <p className="font-bold text-foreground truncate">{post.title || "Untitled post"}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{snippet(post)}</p>
            </td>
            <td className="py-3 px-5 text-xs font-medium text-foreground">{authorName(post.author)}</td>
            <td className="py-3 px-5">
              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><FaThumbsUp className="opacity-60" /> {post.total_likes ?? 0}</span>
                <span className="flex items-center gap-1"><FaRegComment className="opacity-60" /> {post.total_comments ?? 0}</span>
                {post.knowledge_hub && (
                  <span className="flex items-center gap-1 text-primary" title="Knowledge Hub post"><FaBookOpen /></span>
                )}
              </div>
            </td>
            <td className="py-3 px-5 text-center">
              <Badge variant={post.is_hidden ? "danger" : "success"}>
                {post.is_hidden ? "Hidden" : "Visible"}
              </Badge>
            </td>
            <td className="py-3 px-5">
              <div className="flex items-center justify-center gap-1">
                <button onClick={() => openView(post)} title="View & Moderate Comments"
                  className="p-2 rounded-lg text-primary hover:bg-primary-soft transition-colors">
                  <FaEye size={14} />
                </button>
                <button onClick={() => openModerate(post)} title={post.is_hidden ? "Restore to feed" : "Hide from feed"}
                  className={`p-2 rounded-lg transition-colors ${post.is_hidden ? "text-green-600 hover:bg-green-500/10" : "text-amber-600 hover:bg-amber-500/10"}`}>
                  {post.is_hidden ? <FaRegEye size={14} /> : <FaEyeSlash size={14} />}
                </button>
                <button onClick={() => setDeleteConfirm({ isOpen: true, postId: post.id })} title="Delete Permanently"
                  className="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors">
                  <FaTrash size={14} />
                </button>
              </div>
            </td>
          </>
        )}
        footer={
          (prevCursor || nextCursor) && !loading ? (
            <div className="px-5 py-4 border-t border-border bg-muted/40 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total: {totalCount} Posts
              </p>
              <div className="flex gap-2">
                <button onClick={() => fetchPosts(prevCursor)} disabled={!prevCursor}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none">
                  Previous
                </button>
                <button onClick={() => fetchPosts(nextCursor)} disabled={!nextCursor}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none">
                  Next
                </button>
              </div>
            </div>
          ) : null
        }
      />

      {/* VIEW MODAL */}
      {viewModal.isOpen && viewModal.post && (
        <AdminModal
          open
          onClose={() => setViewModal({ isOpen: false, post: null })}
          size="lg"
          icon={<MdFeed />}
          title={viewModal.post.title || "Untitled post"}
          subtitle={`by ${authorName(viewModal.post.author)}`}
          headerExtra={<Badge variant={viewModal.post.is_hidden ? "danger" : "success"}>{viewModal.post.is_hidden ? "Hidden" : "Visible"}</Badge>}
          footer={<Button variant="outline" onClick={() => setViewModal({ isOpen: false, post: null })}>Close</Button>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Detail label="Author" value={authorName(viewModal.post.author)} />
            <Detail label="Created" value={viewModal.post.created_at ? new Date(viewModal.post.created_at).toLocaleString() : "—"} />
            <Detail label="Likes" value={viewModal.post.total_likes ?? 0} />
            <Detail label="Comments" value={viewModal.post.total_comments ?? 0} />
            <Detail label="Knowledge Hub" value={viewModal.post.knowledge_hub ? "Yes" : "No"} />
            {viewModal.post.is_hidden && (
              <>
                <Detail label="Hidden By" value={authorName(viewModal.post.hidden_by)} />
                <div className="md:col-span-2">
                  <p className={LABEL_CLASS}>Moderation Reason</p>
                  <div className="p-3 rounded-xl border border-danger/30 bg-danger/5 text-sm text-foreground">
                    {viewModal.post.moderation_reason || "No reason recorded."}
                  </div>
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <p className={LABEL_CLASS}>Content</p>
              <div className="p-4 rounded-xl border border-border bg-muted/40 text-sm leading-relaxed text-foreground whitespace-pre-wrap max-h-[240px] overflow-y-auto custom-scrollbar">
                {viewModal.post.content || viewModal.post.preview_content || "No content."}
              </div>
            </div>

            {/* COMMENTS MODERATION */}
            <div className="md:col-span-2">
              <p className={`${LABEL_CLASS} mb-2`}>
                Comments ({comments.length}){loadingComments && " · loading…"}
              </p>
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {comments.map((c) => (
                  <CommentRow
                    key={c.id}
                    comment={c}
                    busy={commentBusy === c.id}
                    onToggle={() => toggleComment(c)}
                    onDelete={() => setCommentDelete({ isOpen: true, commentId: c.id })}
                    authorName={authorName}
                  />
                ))}
                {comments.length === 0 && !loadingComments && (
                  <p className="text-xs text-muted-foreground italic">No comments on this post.</p>
                )}
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {commentDelete.isOpen && (
        <ConfirmationAlert
          title="Delete Comment"
          message="Permanently delete this comment and its replies? This cannot be undone. To remove it reversibly, use Hide instead."
          confirmText="Delete Permanently"
          onConfirm={confirmCommentDelete}
          onCancel={() => setCommentDelete({ isOpen: false, commentId: null })}
        />
      )}

      {/* MODERATE (hide / unhide) MODAL */}
      {moderateModal.isOpen && moderateModal.post && (
        <AdminModal
          open
          onClose={() => setModerateModal({ isOpen: false, post: null })}
          size="md"
          icon={moderateModal.post.is_hidden ? <FaRegEye /> : <FaEyeSlash />}
          title={moderateModal.post.is_hidden ? "Restore Post" : "Hide Post"}
          subtitle={moderateModal.post.is_hidden
            ? "This post will become visible in the public feed again."
            : "This post will be removed from the public feed (reversible)."}
          footer={
            <>
              <Button variant="outline" onClick={() => setModerateModal({ isOpen: false, post: null })}>Cancel</Button>
              <Button type="submit" form="moderate-form" loading={submitting}
                variant={moderateModal.post.is_hidden ? "primary" : "danger"}>
                {moderateModal.post.is_hidden ? "Restore to Feed" : "Hide from Feed"}
              </Button>
            </>
          }
        >
          <form id="moderate-form" onSubmit={submitModerate} className="space-y-4">
            <div className="p-3 rounded-xl border border-border bg-muted/40">
              <p className="text-xs font-bold text-foreground truncate">{moderateModal.post.title || "Untitled post"}</p>
              <p className="text-2xs text-muted-foreground line-clamp-2 mt-1">{snippet(moderateModal.post)}</p>
            </div>
            {!moderateModal.post.is_hidden && (
              <div>
                <label className={LABEL_CLASS}>Reason (optional)</label>
                <textarea rows="3" value={reason} onChange={(e) => setReason(e.target.value)}
                  className={`${FIELD_CLASS} resize-none`} maxLength={300}
                  placeholder="e.g. Spam, harassment, off-topic…" />
                <p className="text-2xs mt-1 text-muted-foreground">Stored for the audit trail. Max 300 characters.</p>
              </div>
            )}
          </form>
        </AdminModal>
      )}

      {deleteConfirm.isOpen && (
        <ConfirmationAlert
          title="Delete Post"
          message="Permanently delete this post along with its comments and likes? This cannot be undone. To remove it from the feed reversibly, use Hide instead."
          confirmText="Delete Permanently"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ isOpen: false, postId: null })}
        />
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="block text-2xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function CommentRow({ comment, busy, onToggle, onDelete, authorName }) {
  const text = (comment.content || comment.preview_content || "").trim() || "—";
  return (
    <div
      className={`flex items-start justify-between gap-3 p-3 rounded-xl border ${comment.is_hidden ? "border-danger/30 bg-danger/5" : "border-border bg-muted/40"} ${comment.is_reply ? "ml-6" : ""}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-foreground truncate">{authorName(comment.author)}</span>
          {comment.is_reply && <Badge variant="neutral">reply</Badge>}
          {comment.is_hidden && <Badge variant="danger">Hidden</Badge>}
        </div>
        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-words">{text}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          title={comment.is_hidden ? "Restore comment" : "Hide comment"}
          className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${comment.is_hidden ? "text-green-600 hover:bg-green-500/10" : "text-amber-600 hover:bg-amber-500/10"}`}
        >
          {busy ? (
            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin block" />
          ) : comment.is_hidden ? (
            <FaRegEye size={12} />
          ) : (
            <FaEyeSlash size={12} />
          )}
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Delete comment"
          className="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors"
        >
          <FaTrash size={12} />
        </button>
      </div>
    </div>
  );
}

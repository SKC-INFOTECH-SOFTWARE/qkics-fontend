import { useState } from "react";
import axiosSecure from "../utils/axiosSecure";
import { FiX, FiUpload, FiFileText } from "react-icons/fi";
import useModalEscape from "../hooks/useModalEscape";

export default function UploadDocumentModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        file: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useModalEscape(onClose, isOpen);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "file") {
            setFormData((prev) => ({ ...prev, file: files[0] }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.file) {
            setError("Please select a file to upload.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const data = new FormData();
            data.append("title", formData.title);
            data.append("description", formData.description);
            data.append("file", formData.file);
            data.append("access_type", "FREE");

            await axiosSecure.post("/v1/documents/upload/", data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (onSuccess) {
                onSuccess();
            }
            onClose();
            setFormData({ title: "", description: "", file: null });
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data?.error || "Failed to upload document. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const fieldClass =
        "w-full px-3.5 py-2.5 rounded-xl border border-input bg-muted text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary";
    const labelClass = "block text-2xs font-bold uppercase tracking-wider mb-1.5 text-muted-foreground";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-card text-foreground border border-border">
                <div className="relative flex items-center gap-3 px-5 py-4 border-b border-border">
                    <div className="h-9 w-9 shrink-0 rounded-xl bg-primary-soft flex items-center justify-center text-primary">
                        <FiUpload className="text-lg" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-base font-bold leading-tight">Add New Resource</h3>
                        <p className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">Upload Document</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-auto p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
                    >
                        <FiX className="text-lg" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3.5">
                    <div>
                        <label className={labelClass}>Title</label>
                        <input
                            type="text"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter document title"
                            className={fieldClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Description</label>
                        <textarea
                            name="description"
                            required
                            rows={2}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter document description"
                            className={`${fieldClass} resize-none`}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>File</label>
                        <div className="relative w-full rounded-xl border-2 border-dashed border-border bg-muted/40 flex flex-col items-center justify-center p-4 transition-all hover:border-primary">
                            <input
                                type="file"
                                name="file"
                                required
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={handleChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center gap-1.5 text-center pointer-events-none">
                                <div className="p-2.5 rounded-full bg-primary-soft text-primary">
                                    <FiFileText className="text-lg" />
                                </div>
                                {formData.file ? (
                                    <span className="text-sm font-semibold text-foreground break-all">{formData.file.name}</span>
                                ) : (
                                    <>
                                        <span className="text-sm font-semibold text-foreground">Click to upload or drag and drop</span>
                                        <span className="text-2xs text-muted-foreground">PDF, DOC, DOCX up to 10MB</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-2xs font-medium text-muted-foreground">
                        <span className="text-3xs font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">FREE</span>
                        Documents uploaded here are always set to FREE access.
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg border border-danger/20 bg-danger/10 text-danger text-sm flex items-center gap-2 animate-shake">
                            <FiX className="flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 font-bold text-sm rounded-xl border border-border text-foreground hover:bg-muted transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.file}
                            className="flex-[2] px-4 py-2.5 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {isSubmitting ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <FiUpload className="text-base" />
                            )}
                            {isSubmitting ? "Uploading..." : "Upload Document"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

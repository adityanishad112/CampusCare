import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  ComplaintDetail, DuplicateSuggestionResult, Department
} from "../types";
import {
  ArrowLeft, Clock, Shield, MapPin, User, MessageSquare,
  FileText, Download, Star, RefreshCw, CheckCircle2,
  AlertTriangle, Lock, Sparkles, Link2, Send, CornerDownRight,
  Camera, Mic, Image as ImageIcon, ZoomIn, Plus, Radio, Volume2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Select } from "../components/ui/Select";
import { StatusTimeline } from "../components/ui/StatusTimeline";
import { formatDate } from "../lib/utils";
import { AudioPlayer } from "../components/media/AudioPlayer";
import { ImageLightboxModal } from "../components/media/ImageLightboxModal";
import { PhotoUploader } from "../components/media/PhotoUploader";
import { VoiceRecorder } from "../components/media/VoiceRecorder";

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const complaintId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lightbox & Additional Evidence Modal states
  const [activeLightbox, setActiveLightbox] = useState<{
    url: string;
    title: string;
    downloadUrl?: string;
  } | null>(null);
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
  const [evidencePhotos, setEvidencePhotos] = useState<File[]>([]);
  const [evidenceVoice, setEvidenceVoice] = useState<File | null>(null);
  const [evidenceTab, setEvidenceTab] = useState<"photos" | "voice">("photos");
  const [evidenceUploading, setEvidenceUploading] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  // Comments state
  const [commentText, setCommentText] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("In Progress");
  const [statusRemarks, setStatusRemarks] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignDeptId, setReassignDeptId] = useState<number | undefined>(undefined);
  const [reassignRemarks, setReassignRemarks] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);

  // Duplicate detection state (for staff/admin)
  const [duplicates, setDuplicates] = useState<DuplicateSuggestionResult | null>(null);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);

  const fetchComplaint = async () => {
    try {
      const data = await api.getComplaint(complaintId);
      setComplaint(data);
      if (user?.role === "staff" || user?.role === "admin") {
        fetchDuplicates();
      }
    } catch (err: any) {
      setError(err.message || "Failed to load complaint details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDuplicates = async () => {
    setLoadingDuplicates(true);
    try {
      const dups = await api.getDuplicateSuggestions(complaintId);
      setDuplicates(dups);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDuplicates(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
    if (user?.role === "admin") {
      api.getDepartments().then(setDepartments).catch(console.error);
    }
  }, [complaintId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      await api.addComment(complaintId, {
        content: commentText.trim(),
        is_internal: isInternalComment,
      });
      setCommentText("");
      setIsInternalComment(false);
      fetchComplaint();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleClaim = async () => {
    try {
      await api.claimComplaint(complaintId);
      fetchComplaint();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.transitionStatus(complaintId, {
        new_status: newStatus,
        remarks: statusRemarks,
        resolution_notes: resolutionNotes || undefined,
      });
      setShowStatusModal(false);
      setStatusRemarks("");
      setResolutionNotes("");
      fetchComplaint();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;
    try {
      await api.reopenComplaint(complaintId, { reopened_reason: reopenReason });
      setShowReopenModal(false);
      setReopenReason("");
      fetchComplaint();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitFeedback(complaintId, { rating, comments: feedbackComment });
      setShowFeedbackModal(false);
      fetchComplaint();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignRemarks.trim()) return;
    try {
      await api.reassignComplaint(complaintId, {
        department_id: reassignDeptId,
        remarks: reassignRemarks,
      });
      setShowReassignModal(false);
      setReassignRemarks("");
      fetchComplaint();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLinkDuplicate = async (dupId: number) => {
    try {
      await api.linkDuplicate(complaintId, {
        primary_complaint_id: complaintId,
        duplicate_complaint_id: dupId,
        notes: "Linked manually by authorized department staff.",
      });
      fetchComplaint();
      fetchDuplicates();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUploadAdditionalEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvidenceError(null);
    if (evidencePhotos.length === 0 && !evidenceVoice) {
      setEvidenceError("Please choose at least one photo or record a voice note.");
      return;
    }

    setEvidenceUploading(true);
    try {
      if (evidencePhotos.length > 0) {
        for (const photo of evidencePhotos) {
          await api.uploadAttachment(complaintId, photo);
        }
      }
      if (evidenceVoice) {
        await api.uploadAttachment(complaintId, evidenceVoice);
      }
      setEvidencePhotos([]);
      setEvidenceVoice(null);
      setShowAddEvidenceModal(false);
      await fetchComplaint();
    } catch (err: any) {
      setEvidenceError(err.message || "Failed to upload attachments.");
    } finally {
      setEvidenceUploading(false);
    }
  };

  const handleCommentDictation = (transcript: string) => {
    setCommentText((prev) => (prev ? `${prev.trim()} ${transcript.trim()}` : transcript.trim()));
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading complaint details...</div>;
  }

  if (error || !complaint) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Button>
        <Alert variant="error">{error || "Complaint not found."}</Alert>
      </div>
    );
  }

  const isStudent = user?.role === "student";
  const isStaff = user?.role === "staff";
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      {/* Back button & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to list
        </button>

        {/* Role Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Student Actions */}
          {isStudent && (
            <>
              {["Resolved", "Closed"].includes(complaint.status) && (
                <Button variant="destructive" size="sm" onClick={() => setShowReopenModal(true)}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Reopen Complaint
                </Button>
              )}
              {["Resolved", "Closed"].includes(complaint.status) && !complaint.feedback && (
                <Button variant="teal" size="sm" onClick={() => setShowFeedbackModal(true)}>
                  <Star className="w-3.5 h-3.5 mr-1.5" />
                  Rate Resolution
                </Button>
              )}
              {complaint.status === "Resolved" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    api.transitionStatus(complaintId, { new_status: "Closed", remarks: "Confirmed closed by student." }).then(fetchComplaint)
                  }
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Confirm & Close
                </Button>
              )}
            </>
          )}

          {/* Staff Actions */}
          {isStaff && (
            <>
              {complaint.status === "Submitted" && !complaint.assigned_staff_id && (
                <Button variant="primary" size="sm" onClick={handleClaim}>
                  Claim Complaint
                </Button>
              )}
              {complaint.status !== "Closed" && (
                <Button variant="outline" size="sm" onClick={() => setShowStatusModal(true)}>
                  Update Status
                </Button>
              )}
            </>
          )}

          {/* Admin Actions */}
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowReassignModal(true)}>
                Reassign Department
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowStatusModal(true)}>
                Admin Status Update
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Complaint Title Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-sm font-black text-primary px-2.5 py-0.5 bg-blue-50 rounded-md border border-blue-200">
              {complaint.tracking_number}
            </span>
            <Badge variant="status" status={complaint.status} />
            <Badge variant="priority" priority={complaint.priority} />
            <Badge variant="category">{complaint.category}</Badge>
            {complaint.is_low_confidence && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Admin Review Flagged
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
            {complaint.title}
          </h1>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Location: <strong>{complaint.location}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Reported by: <strong>{complaint.student_name}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono">{formatDate(complaint.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Left Column (Details, Attachments, Comments) | Right Column (Timeline, AI Rules, Routing) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Description & Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                {complaint.description}
              </p>

              {/* Reopened reason alert */}
              {complaint.reopened_reason && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs">
                  <div className="font-bold text-rose-800 mb-0.5 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                    Student Reopen Reason:
                  </div>
                  <p className="text-rose-700 leading-relaxed">{complaint.reopened_reason}</p>
                </div>
              )}

              {/* Resolution notes */}
              {complaint.resolution_notes && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                  <div className="font-bold text-emerald-800 mb-0.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Resolution Summary:
                  </div>
                  <p className="text-emerald-700 leading-relaxed">{complaint.resolution_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Media & Attachments Card */}
          {(() => {
            const isPhoto = (att: any) =>
              att.content_type?.startsWith("image/") ||
              /\.(png|jpg|jpeg|webp|gif)$/i.test(att.original_name);

            const isAudio = (att: any) =>
              att.content_type?.startsWith("audio/") ||
              /\.(mp3|wav|webm|ogg|m4a|aac)$/i.test(att.original_name);

            const photoAttachments = complaint.attachments?.filter(isPhoto) || [];
            const audioAttachments = complaint.attachments?.filter(isAudio) || [];
            const docAttachments =
              complaint.attachments?.filter((a) => !isPhoto(a) && !isAudio(a)) || [];
            const totalAttachments = complaint.attachments?.length || 0;

            const canAddEvidence =
              (isStudent && complaint.student_id === user?.id && complaint.status !== "Closed") ||
              (isStaff && complaint.department_id === user?.department_id && complaint.status !== "Closed") ||
              isAdmin;

            return (
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Camera className="w-4 h-4 text-primary" />
                      Evidence & Media Attachments ({totalAttachments})
                    </CardTitle>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Photos, audio voice recordings, and evidence files
                    </p>
                  </div>

                  {canAddEvidence && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEvidenceError(null);
                        setEvidencePhotos([]);
                        setEvidenceVoice(null);
                        setShowAddEvidenceModal(true);
                      }}
                      className="text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Evidence
                    </Button>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  {totalAttachments === 0 ? (
                    <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-primary flex items-center justify-center mx-auto mb-2">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">No photos or voice recordings attached yet</p>
                      {canAddEvidence && (
                        <button
                          type="button"
                          onClick={() => setShowAddEvidenceModal(true)}
                          className="mt-2 text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Attach Photo or Voice Note
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Photo Evidence Gallery */}
                      {photoAttachments.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <ImageIcon className="w-3.5 h-3.5 text-primary" />
                            <span>Photo Evidence ({photoAttachments.length})</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {photoAttachments.map((att) => {
                              const photoUrl = api.getAttachmentUrl(att.download_url);
                              return (
                                <div
                                  key={att.id}
                                  className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-2xs"
                                >
                                  <img
                                    src={photoUrl}
                                    alt={att.original_name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] text-white/90 font-mono">
                                        {(att.file_size / 1024).toFixed(0)} KB
                                      </span>
                                      <a
                                        href={photoUrl}
                                        download
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1 text-white hover:text-primary-light bg-slate-800/80 rounded transition-colors"
                                        title="Download photo"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveLightbox({
                                          url: photoUrl,
                                          title: att.original_name,
                                          downloadUrl: photoUrl,
                                        })
                                      }
                                      className="w-full py-1 text-center text-[11px] font-semibold text-white bg-primary/90 hover:bg-primary rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <ZoomIn className="w-3 h-3" />
                                      <span>Enlarge</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Voice Notes Audio Players */}
                      {audioAttachments.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                            <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Voice Notes & Audio ({audioAttachments.length})</span>
                          </div>

                          <div className="grid grid-cols-1 gap-2.5">
                            {audioAttachments.map((att) => (
                              <AudioPlayer
                                key={att.id}
                                src={api.getAttachmentUrl(att.download_url)}
                                title={att.original_name}
                                fileSize={att.file_size}
                                downloadUrl={api.getAttachmentUrl(att.download_url)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other Documents */}
                      {docAttachments.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>Documents & Files ({docAttachments.length})</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {docAttachments.map((att) => {
                              const docUrl = api.getAttachmentUrl(att.download_url);
                              return (
                                <div
                                  key={att.id}
                                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <FileText className="w-4 h-4 text-primary shrink-0" />
                                    <div className="truncate">
                                      <span className="font-semibold text-slate-800 truncate block">
                                        {att.original_name}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        {(att.file_size / 1024).toFixed(1)} KB
                                      </span>
                                    </div>
                                  </div>
                                  <a
                                    href={docUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 text-primary hover:bg-white rounded-lg transition-colors shrink-0"
                                    title="Download File"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Student Feedback Card (if exists) */}
          {complaint.feedback && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-amber-900">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  Student Resolution Rating: {complaint.feedback.rating} / 5 Stars
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= complaint.feedback!.rating
                          ? "fill-amber-400 text-amber-500"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                {complaint.feedback.comments && (
                  <p className="text-xs text-slate-700 italic">
                    "{complaint.feedback.comments}"
                  </p>
                )}
                <p className="text-[10px] text-slate-400 font-mono mt-2">
                  Submitted by {complaint.feedback.student_name} on {formatDate(complaint.feedback.created_at)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Duplicate Suggestions Panel (Staff/Admin Only) */}
          {(isStaff || isAdmin) && duplicates && duplicates.has_potential_duplicates && (
            <Card className="border-indigo-200 bg-indigo-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Potentially Related / Duplicate Complaints
                </CardTitle>
                <p className="text-[11px] text-slate-500">
                  AI detected high textual or location similarity with active complaints. Authorized staff can link records.
                </p>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {duplicates.suggestions.map((dup) => (
                  <div
                    key={dup.complaint_id}
                    className="p-3 bg-white rounded-lg border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-indigo-700">
                          {dup.tracking_number}
                        </span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-bold">
                          {(dup.similarity_score * 100).toFixed(0)}% Match
                        </span>
                        <span className="text-[10px] text-slate-400">{dup.location}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-0.5">
                        {dup.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLinkDuplicate(dup.complaint_id)}
                      >
                        <Link2 className="w-3 h-3 mr-1" />
                        Link Duplicate
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Linked Duplicates */}
          {complaint.duplicates && complaint.duplicates.length > 0 && (
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Linked Duplicates ({complaint.duplicates.length}): </span>
              {complaint.duplicates.map((d) => (
                <span key={d.id} className="font-mono font-semibold text-primary mr-2">
                  {d.duplicate_tracking_number}
                </span>
              ))}
            </div>
          )}

          {/* Comments & Discussion */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Comments & Activity ({complaint.comments.length})
              </CardTitle>
              {(isStaff || isAdmin) && (
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Staff Internal Notes Visible
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {complaint.comments.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No comments on this complaint yet.</p>
              ) : (
                <div className="space-y-3">
                  {complaint.comments.map((cm) => (
                    <div
                      key={cm.id}
                      className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                        cm.is_internal
                          ? "bg-amber-50/70 border-amber-200"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          <span>{cm.author_name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({cm.author_role})
                          </span>
                          {cm.is_internal && (
                            <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-200/60 px-1.5 py-0.2 rounded">
                              <Lock className="w-2.5 h-2.5" /> Staff Note
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDate(cm.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-700">{cm.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Add Discussion Note</span>
                  <button
                    type="button"
                    onClick={() => {
                      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
                      if (!SpeechRec) {
                        alert("Speech recognition is not supported in this browser.");
                        return;
                      }
                      const rec = new SpeechRec();
                      rec.lang = "en-US";
                      rec.onresult = (ev: any) => {
                        const transcript = ev.results[0][0].transcript;
                        handleCommentDictation(transcript);
                      };
                      rec.start();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    title="Speak into microphone to type comment"
                  >
                    <Mic className="w-3 h-3" />
                    <span>Voice Dictation</span>
                  </button>
                </div>
                <Textarea
                  placeholder="Type a comment or response (or use Voice Dictation above)..."
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  {(isStaff || isAdmin) ? (
                    <label className="flex items-center gap-2 text-xs text-amber-800 font-medium cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      Internal staff note (hidden from student)
                    </label>
                  ) : <div />}

                  <Button type="submit" size="sm" isLoading={commentSubmitting}>
                    <Send className="w-3.5 h-3.5 mr-1.5" /> Post Comment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Timeline & Metadata */}
        <div className="space-y-6">
          {/* Department & Staff Assignment Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-700 font-bold">
                Assignment & Routing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">DEPARTMENT</span>
                <span className="font-bold text-slate-900">{complaint.department_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">ASSIGNED STAFF</span>
                <span className="font-bold text-slate-900">
                  {complaint.assigned_staff_name || "Unassigned (In Department Queue)"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">LAST UPDATED</span>
                <span className="font-mono text-slate-600">{formatDate(complaint.updated_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* AI Decision Rationale Card */}
          <Card className="border-blue-200 bg-blue-50/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-primary font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI Classification Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Predicted Category:</span>
                <span className="font-bold text-slate-900">{complaint.suggested_category}</span>
                {complaint.ai_confidence != null && (
                  <span className="ml-2 text-[10px] font-bold text-blue-700">
                    ({(complaint.ai_confidence * 100).toFixed(1)}% confidence)
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Priority Suggestion Rationale:</span>
                <p className="text-[11px] text-slate-700 mt-0.5 leading-relaxed bg-white p-2 rounded border border-blue-100">
                  {complaint.priority_reason || "Evaluated via rule-based safety criteria."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lifecycle Stepper & Audit Log */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-700 font-bold">
                Complaint Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline currentStatus={complaint.status} history={complaint.status_history} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL: Status Transition */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Complaint Status"
        description={`Current status: ${complaint.status}`}
      >
        <form onSubmit={handleStatusTransition} className="space-y-4">
          <Select
            label="New Target Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            options={[
              { value: "Assigned", label: "Assigned" },
              { value: "In Progress", label: "In Progress" },
              { value: "Resolved", label: "Resolved" },
              { value: "Closed", label: "Closed" },
            ]}
          />

          {newStatus === "Resolved" && (
            <Textarea
              label="Resolution Explanation"
              required
              rows={3}
              placeholder="Explain how the issue was fixed (e.g. Replaced faulty circuit breaker and tested voltage)..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          )}

          <Textarea
            label="Activity Remarks / Audit Note"
            rows={2}
            placeholder="Reason or note for this transition..."
            value={statusRemarks}
            onChange={(e) => setStatusRemarks(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Status Update
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Reopen Complaint */}
      <Modal
        isOpen={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        title="Reopen Resolved Complaint"
        description="Please provide the exact reason why the resolution was incomplete or recurred."
      >
        <form onSubmit={handleReopen} className="space-y-4">
          <Textarea
            label="Reopening Reason"
            required
            rows={4}
            placeholder="e.g. The Wi-Fi is still dropping after 2 hours; the access point red light came back on..."
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowReopenModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" size="sm">
              Reopen & Return to Staff Queue
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Feedback & Rating */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="Rate Resolution Quality"
        description="Your feedback helps improve campus facility services."
      >
        <form onSubmit={handleFeedback} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Rating (1 to 5 Stars)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1.5 rounded-lg hover:bg-amber-50 cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? "fill-amber-400 text-amber-500" : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Comments or Appreciation (Optional)"
            rows={3}
            placeholder="Was the staff prompt and courteous? Any feedback?"
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowFeedbackModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="teal" size="sm">
              Submit Feedback
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Admin Reassign */}
      <Modal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        title="Reassign Department"
        description="Transfer this complaint to another department queue."
      >
        <form onSubmit={handleReassign} className="space-y-4">
          <Select
            label="Select Target Department"
            value={reassignDeptId || ""}
            onChange={(e) => setReassignDeptId(Number(e.target.value))}
            options={departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))}
          />
          <Textarea
            label="Reassignment Reason"
            required
            rows={3}
            placeholder="e.g. Issue involves electrical wiring rather than plumbing..."
            value={reassignRemarks}
            onChange={(e) => setReassignRemarks(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowReassignModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Reassignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Add Evidence (Photos & Voice) */}
      <Modal
        isOpen={showAddEvidenceModal}
        onClose={() => {
          if (!evidenceUploading) {
            setShowAddEvidenceModal(false);
            setEvidencePhotos([]);
            setEvidenceVoice(null);
          }
        }}
        title="Attach Evidence to Complaint"
        description="Upload additional photos of the issue or record a voice note update."
      >
        <form onSubmit={handleUploadAdditionalEvidence} className="space-y-4">
          {evidenceError && <Alert variant="error">{evidenceError}</Alert>}

          {/* Media Mode Tabs */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEvidenceTab("photos")}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                evidenceTab === "photos"
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Photos ({evidencePhotos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setEvidenceTab("voice")}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                evidenceTab === "voice"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Note {evidenceVoice ? "✓" : ""}</span>
            </button>
          </div>

          {evidenceTab === "photos" ? (
            <PhotoUploader
              photos={evidencePhotos}
              onPhotosChange={setEvidencePhotos}
              maxPhotos={5}
              disabled={evidenceUploading}
            />
          ) : (
            <VoiceRecorder
              recordedFile={evidenceVoice}
              onAudioRecorded={setEvidenceVoice}
              disabled={evidenceUploading}
            />
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={evidenceUploading}
              onClick={() => {
                setShowAddEvidenceModal(false);
                setEvidencePhotos([]);
                setEvidenceVoice(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={evidenceUploading}
              disabled={evidencePhotos.length === 0 && !evidenceVoice}
            >
              Upload Evidence ({evidencePhotos.length + (evidenceVoice ? 1 : 0)} files)
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lightbox Modal */}
      {activeLightbox && (
        <ImageLightboxModal
          isOpen={true}
          onClose={() => setActiveLightbox(null)}
          imageUrl={activeLightbox.url}
          title={activeLightbox.title}
          downloadUrl={activeLightbox.downloadUrl}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { AIPredictionResult, PrioritySuggestionResult } from "../types";
import {
  Sparkles, Upload, X, ShieldAlert, ArrowRight, CheckCircle2,
  Info, AlertTriangle, FileText, Image as ImageIcon, Mic, Camera
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { PhotoUploader } from "../components/media/PhotoUploader";
import { VoiceRecorder } from "../components/media/VoiceRecorder";

const CATEGORIES = [
  "IT and Wi-Fi",
  "Electrical",
  "Plumbing",
  "Hostel maintenance",
  "Classroom and laboratory equipment",
  "Sanitation",
  "Other",
];

const LOCATION_PRESETS = [
  "Hostel 1 (Boys), Room 102",
  "Hostel 4 (Girls), 3rd Floor",
  "Academic Block A, 2nd Floor",
  "Central Library, Reading Hall",
  "Computer Science Lab 2",
  "Main Seminar Auditorium 1",
  "Campus Canteen Dining Area",
  "Sports Complex Pavilion",
];

export const NewComplaintPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("IT and Wi-Fi");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [priorityReason, setPriorityReason] = useState("");

  // AI & Automation state
  const [aiPrediction, setAiPrediction] = useState<AIPredictionResult | null>(null);
  const [prioritySuggestion, setPrioritySuggestion] = useState<PrioritySuggestionResult | null>(null);
  const [predicting, setPredicting] = useState(false);

  // Photo & Voice Media Attachment state
  const [photos, setPhotos] = useState<File[]>([]);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [activeMediaTab, setActiveMediaTab] = useState<"photos" | "voice">("photos");

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitStatusText, setSubmitStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Debounced AI Prediction when user types title or description
  useEffect(() => {
    if (title.trim().length < 5 || description.trim().length < 10) {
      setAiPrediction(null);
      setPrioritySuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPredicting(true);
      try {
        const [catResult, prioResult] = await Promise.all([
          api.predictCategory({ title, description, location }),
          api.suggestPriority(title, description, category),
        ]);

        setAiPrediction(catResult);
        setPrioritySuggestion(prioResult);

        // Auto-select category if not yet manually changed and high confidence
        if (catResult.confidence > 0.65) {
          setCategory(catResult.suggested_category);
        }
        if (prioResult.suggested_priority) {
          setPriority(prioResult.suggested_priority);
          setPriorityReason(prioResult.reason);
        }
      } catch (err) {
        console.error("AI service error:", err);
      } finally {
        setPredicting(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [title, description]);

  const handleSpeechTranscript = (text: string) => {
    setDescription((prev) => (prev ? `${prev.trim()} ${text.trim()}` : text.trim()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !location.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    setSubmitting(true);
    setSubmitStatusText("Submitting complaint details...");
    try {
      // 1. Create Complaint
      const complaint = await api.submitComplaint({
        title,
        description,
        category,
        location,
        suggested_category: aiPrediction?.suggested_category,
        ai_confidence: aiPrediction?.confidence,
        priority,
        priority_reason: priorityReason,
      });

      // 2. Upload photos if selected
      if (photos.length > 0) {
        setSubmitStatusText(`Uploading ${photos.length} photo evidence file(s)...`);
        for (const photo of photos) {
          try {
            await api.uploadAttachment(complaint.id, photo);
          } catch (uploadErr) {
            console.error("Photo upload failed:", uploadErr);
          }
        }
      }

      // 3. Upload voice note if recorded
      if (voiceFile) {
        setSubmitStatusText("Uploading voice recording...");
        try {
          await api.uploadAttachment(complaint.id, voiceFile);
        } catch (voiceErr) {
          console.error("Voice note upload failed:", voiceErr);
        }
      }

      // Navigate to newly created complaint detail
      navigate(`/complaints/${complaint.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
      setSubmitStatusText("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Report a Campus Issue
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Submit details below. Our AI model analyzes your text to route complaints to the responsible department.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Issue Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Complaint Title"
                required
                placeholder="e.g. Wi-Fi drops continuously on Hostel 4 3rd floor"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="detailed-description" className="block text-xs font-semibold text-slate-700">
                    Detailed Description <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Tip: You can speak your complaint using the Voice tab below
                  </span>
                </div>
                <Textarea
                  id="detailed-description"
                  required
                  rows={5}
                  placeholder="Please describe what is happening, exact symptoms, and when the issue started..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Select
                    label="Facility Category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Editable: verify or modify the AI suggested category before submission.
                  </p>
                </div>

                <div>
                  <Select
                    label="Priority Assessment"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    options={[
                      { value: "Low", label: "Low Priority" },
                      { value: "Medium", label: "Medium Priority (Standard)" },
                      { value: "High", label: "High Priority (Hazard / Academic Emergency)" },
                    ]}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    System suggests priority based on safety and academic urgency rules.
                  </p>
                </div>
              </div>

              <div>
                <Input
                  label="Campus Location / Room"
                  required
                  placeholder="e.g. Hostel 4, Room 302 or Academic Block A 2nd floor"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-semibold mr-1">Quick presets:</span>
                  {LOCATION_PRESETS.slice(0, 4).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLocation(preset)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photo & Voice Evidence Section */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Complaint Evidence & Attachments</CardTitle>
                <div className="flex items-center gap-1.5">
                  {photos.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-primary font-bold text-[10px]">
                      {photos.length} Photo{photos.length > 1 ? "s" : ""}
                    </span>
                  )}
                  {voiceFile && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                      Voice Note
                    </span>
                  )}
                </div>
              </div>

              {/* Media Mode Tabs */}
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setActiveMediaTab("photos")}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeMediaTab === "photos"
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Send Photos ({photos.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMediaTab("voice")}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeMediaTab === "voice"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Send Voice Note {voiceFile ? "✓" : ""}</span>
                </button>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {activeMediaTab === "photos" ? (
                <PhotoUploader
                  photos={photos}
                  onPhotosChange={setPhotos}
                  maxPhotos={5}
                  disabled={submitting}
                />
              ) : (
                <VoiceRecorder
                  recordedFile={voiceFile}
                  onAudioRecorded={setVoiceFile}
                  onSpeechTranscript={handleSpeechTranscript}
                  disabled={submitting}
                />
              )}
            </CardContent>
          </Card>

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={submitting}>
            {submitStatusText || "Submit Complaint"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        {/* Right 1 Col: AI Assistant & Rule Reasoning Panel */}
        <div className="space-y-4">
          <Card className="border-blue-200 bg-gradient-to-b from-blue-50/50 to-white shadow-card">
            <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-blue-100">
              <div className="flex items-center gap-1.5 font-bold text-xs text-primary-dark">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>AI Classification Assistant</span>
              </div>
              {predicting && (
                <span className="text-[10px] text-slate-400 animate-pulse">Analyzing text...</span>
              )}
            </CardHeader>

            <CardContent className="space-y-4 pt-3">
              {aiPrediction ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Model Suggestion:</span>
                    <div className="flex items-center justify-between mt-1">
                      <strong className="text-slate-900 text-sm font-bold">
                        {aiPrediction.suggested_category}
                      </strong>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          aiPrediction.confidence >= 0.70
                            ? "bg-emerald-100 text-emerald-800"
                            : aiPrediction.confidence >= 0.50
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {(aiPrediction.confidence * 100).toFixed(1)}% confidence
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${aiPrediction.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  {aiPrediction.is_low_confidence && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Low Confidence (&lt;60%):</strong> This complaint will automatically be sent to the <em>Administrator Review Queue</em> for verified departmental routing.
                      </span>
                    </div>
                  )}

                  {/* Top alternatives */}
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Candidate Probabilities:</span>
                    <div className="space-y-1 mt-1">
                      {aiPrediction.top_categories.map((tc) => (
                        <div key={tc.category} className="flex justify-between text-[11px] text-slate-600">
                          <span>{tc.category}</span>
                          <span className="font-mono font-semibold">
                            {(tc.probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 leading-relaxed">
                  Type at least a brief title and description to see real-time AI category prediction and confidence metrics.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Priority Rules Explanation Box */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-1.5 text-slate-800 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Rule-Based Priority Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {prioritySuggestion ? (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Assessed Priority:</span>
                    <Badge variant="priority" priority={prioritySuggestion.suggested_priority} />
                  </div>
                  <p className="text-[11px] text-slate-700 font-medium mt-1 leading-relaxed">
                    {prioritySuggestion.reason}
                  </p>
                  <div className="text-[10px] text-slate-400 font-semibold mt-1">
                    * Evaluated deterministically via transparent campus safety rules.
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Keywords indicating safety risks, power failures, or ongoing examinations automatically raise priority to <strong>High</strong>.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

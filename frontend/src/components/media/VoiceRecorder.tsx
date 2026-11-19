import React, { useState, useRef, useEffect } from "react";
import {
  Mic, MicOff, Square, Play, Pause, Trash2, RotateCcw,
  Volume2, Upload, AlertCircle, CheckCircle2, Sparkles, Radio
} from "lucide-react";

// SpeechRecognition type declarations for browser support
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceRecorderProps {
  onAudioRecorded: (file: File | null) => void;
  recordedFile: File | null;
  onSpeechTranscript?: (text: string) => void;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onAudioRecorded,
  recordedFile,
  onSpeechTranscript,
  disabled = false,
}) => {
  // Audio Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [recorderError, setRecorderError] = useState<string | null>(null);

  // Speech Recognition (Voice-to-Text) states
  const [isDictating, setIsDictating] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechInterim, setSpeechInterim] = useState("");

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check speech recognition capability on mount
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      setSpeechSupported(true);
    }
  }, []);

  // Sync audioUrl with recordedFile
  useEffect(() => {
    if (recordedFile) {
      const url = URL.createObjectURL(recordedFile);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioUrl(null);
    }
  }, [recordedFile]);

  // Clean up timer and media streams on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 1. Start Voice Note Recording
  const startRecording = async () => {
    setRecorderError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine best audio mimeType
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "audio/wav",
      ];
      let selectedMimeType = "";
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      const options = selectedMimeType ? { mimeType: selectedMimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mime = selectedMimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        const extension = mime.includes("ogg")
          ? "ogg"
          : mime.includes("mp4")
          ? "m4a"
          : mime.includes("wav")
          ? "wav"
          : "webm";
        const file = new File([audioBlob], `voice_complaint_${Date.now()}.${extension}`, {
          type: mime,
        });

        onAudioRecorded(file);
        setIsRecording(false);
        setIsPaused(false);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250); // Collect slice every 250ms
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);

      // Start duration counter
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 180) {
            // Max 3 minutes
            stopRecording();
            return 180;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setRecorderError(
        err.name === "NotAllowedError"
          ? "Microphone permission denied. Please allow microphone access in your browser settings."
          : err.message || "Failed to access microphone."
      );
    }
  };

  // 2. Pause / Resume Recording
  const togglePauseResume = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // 3. Stop Recording
  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  // 4. Discard / Delete Recording
  const discardRecording = () => {
    if (isRecording) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      setIsRecording(false);
      setIsPaused(false);
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
    setRecordingDuration(0);
    onAudioRecorded(null);
  };

  // 5. Audio Playback controls
  const togglePlayAudio = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioElementRef.current) return;
    setCurrentTime(audioElementRef.current.currentTime);
  };

  const handleAudioLoadedMetadata = () => {
    if (!audioElementRef.current) return;
    setAudioDuration(audioElementRef.current.duration);
  };

  const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // 6. Audio File Upload handler
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("audio/")) {
        setRecorderError("Please upload a valid audio file.");
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setRecorderError("Audio file exceeds 25 MB limit.");
        return;
      }
      setRecorderError(null);
      onAudioRecorded(file);
      e.target.value = "";
    }
  };

  // 7. Live Voice-to-Text (Speech Recognition)
  const toggleSpeechDictation = () => {
    if (!speechSupported) {
      setRecorderError("Speech-to-Text is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isDictating) {
      // Stop dictation
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
      setIsDictating(false);
      setSpeechInterim("");
    } else {
      // Start dictation
      try {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRec();
        speechRecognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsDictating(true);
          setRecorderError(null);
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          setSpeechInterim(interimTranscript);

          if (finalTranscript && onSpeechTranscript) {
            onSpeechTranscript(finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error !== "no-speech") {
            setRecorderError(`Speech recognition error: ${event.error}`);
          }
          setIsDictating(false);
        };

        recognition.onend = () => {
          setIsDictating(false);
          setSpeechInterim("");
        };

        recognition.start();
      } catch (err: any) {
        console.error("Speech recognition start failed:", err);
        setRecorderError("Failed to initiate Speech Recognition.");
        setIsDictating(false);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Error display */}
      {recorderError && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{recorderError}</span>
        </div>
      )}

      {/* Voice Options Container */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
        {/* Header & Quick Action Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Voice Note & Speech Dictation</h4>
              <p className="text-[11px] text-slate-500">
                Record your voice or use live speech-to-text to describe the issue
              </p>
            </div>
          </div>

          {/* Speech-to-Text Live Dictation Button */}
          {speechSupported && onSpeechTranscript && (
            <button
              type="button"
              disabled={disabled || isRecording}
              onClick={toggleSpeechDictation}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border shadow-xs transition-all cursor-pointer ${
                isDictating
                  ? "bg-rose-500 text-white border-rose-600 animate-pulse ring-2 ring-rose-300"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Dictate your complaint using your microphone"
            >
              <Radio className={`w-3.5 h-3.5 ${isDictating ? "animate-spin" : "text-indigo-500"}`} />
              <span>{isDictating ? "Stop Dictating" : "Voice-to-Text (Dictate)"}</span>
            </button>
          )}
        </div>

        {/* Live Dictation Active Indicator */}
        {isDictating && (
          <div className="flex items-center justify-between p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-semibold text-rose-800">
                Listening... Speak your complaint clearly.
              </span>
            </div>
            {speechInterim && (
              <span className="text-[11px] text-rose-600 italic truncate max-w-xs">
                "{speechInterim}"
              </span>
            )}
          </div>
        )}

        {/* State 1: Currently Recording Voice Note */}
        {isRecording ? (
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 shadow-md animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                  {isPaused ? "Paused" : "Recording Voice Note"}
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-slate-200">
                {formatTime(recordingDuration)} / 03:00
              </span>
            </div>

            {/* Visualizer waveform bars */}
            <div className="flex items-center justify-center gap-1.5 h-10 py-1 bg-slate-950/60 rounded-lg px-4">
              {[12, 24, 38, 18, 42, 28, 50, 32, 16, 44, 26, 36, 14, 48, 22].map((height, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    isPaused ? "bg-slate-600" : "bg-primary animate-pulse"
                  }`}
                  style={{
                    height: isPaused ? "8px" : `${height * (0.5 + Math.random() * 0.5)}%`,
                    animationDelay: `${idx * 0.08}s`,
                  }}
                />
              ))}
            </div>

            {/* Recording Controls */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={discardRecording}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                title="Discard recording"
              >
                <Trash2 className="w-4 h-4" />
                <span>Cancel</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePauseResume}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                >
                  {isPaused ? "Resume" : "Pause"}
                </button>

                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Done</span>
                </button>
              </div>
            </div>
          </div>
        ) : recordedFile && audioUrl ? (
          /* State 2: Audio Recorded & Ready for Preview */
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-bold text-slate-800 truncate block">
                    Voice Note Attached
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {recordedFile.name} ({(recordedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={disabled}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-white transition-colors cursor-pointer"
                  title="Record again"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={discardRecording}
                  disabled={disabled}
                  className="p-1.5 text-slate-500 hover:text-red-600 rounded-md hover:bg-white transition-colors cursor-pointer"
                  title="Remove voice note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Custom Audio Player */}
            <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={togglePlayAudio}
                className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <div className="flex-1 space-y-1">
                <input
                  type="range"
                  min="0"
                  max={audioDuration || 100}
                  value={currentTime}
                  onChange={handleAudioSeek}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(audioDuration || recordingDuration)}</span>
                </div>
              </div>

              <audio
                ref={audioElementRef}
                src={audioUrl}
                onTimeUpdate={handleAudioTimeUpdate}
                onLoadedMetadata={handleAudioLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          /* State 3: Ready to Record or Upload Audio */
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={disabled || isDictating}
              onClick={startRecording}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic className="w-4 h-4" />
              <span>Record Voice Note</span>
            </button>

            <button
              type="button"
              disabled={disabled || isDictating}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Upload Audio File</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mp3,audio/wav,audio/webm,audio/ogg,audio/m4a,audio/aac,audio/*"
              className="hidden"
              onChange={handleAudioFileUpload}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
};

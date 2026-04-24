import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  FileVideo,
  FileImage,
  FileText,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────────────────────────

export interface UploadedFile {
  path: string;           // Supabase storage path  e.g. "{uid}/logos/1234-logo.png"
  publicUrl?: string;     // signed URL (valid 1h) or undefined
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;     // ISO string
}

export interface FileUploadProps {
  bucket: 'vett-uploads' | 'vett-creatives';
  /** Subfolder inside {user_id}/. Defaults to 'general'. */
  folder?: string;
  /** Passed directly to <input accept>. e.g. "image/*,video/*" */
  accept?: string;
  maxSizeMB?: number;
  onUpload?: (file: UploadedFile) => void;
  onRemove?: () => void;
  current?: UploadedFile | null;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

// ── Icon helper ──────────────────────────────────────────────────────────────

function FileIcon({ mimeType }: { mimeType: string }) {
  const [top] = mimeType.split('/');
  if (top === 'video') return <FileVideo className="w-5 h-5 text-[var(--lime)]" />;
  if (top === 'image') return <FileImage className="w-5 h-5 text-[var(--lime)]" />;
  return <FileText className="w-5 h-5 text-[var(--lime)]" />;
}

// ── Component ────────────────────────────────────────────────────────────────

export function FileUpload({
  bucket,
  folder = 'general',
  accept = 'image/*',
  maxSizeMB = 10,
  onUpload,
  onRemove,
  current,
  label = 'Upload file',
  hint,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ── Core upload logic ─────────────────────────────────────────────────────

  const handleFile = useCallback(
    async (file: File) => {
      // Client-side size guard
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File too large — max ${maxSizeMB} MB`);
        return;
      }

      // Auth check
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();
      if (authErr || !user) {
        toast.error('Please sign in to upload files');
        return;
      }

      setUploading(true);

      // Path: {user_id}/{folder}/{timestamp}-{safeName}
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
      const path = `${user.id}/${folder}/${Date.now()}-${safeName}`;

      const toastId = toast.loading(`Uploading ${file.name}…`);

      try {
        const { error: uploadErr } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          });

        if (uploadErr) {
          console.error('[FileUpload] storage error:', uploadErr);
          toast.error(uploadErr.message || 'Upload failed', { id: toastId });
          return;
        }

        // Generate signed URL (1 hour)
        const { data: signed } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 3600);

        const result: UploadedFile = {
          path,
          publicUrl: signed?.signedUrl,
          originalName: file.name,
          sizeBytes: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
        };

        toast.success('Uploaded', { id: toastId });
        onUpload?.(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[FileUpload] unexpected:', err);
        toast.error(`Upload failed: ${msg}`, { id: toastId });
      } finally {
        setUploading(false);
      }
    },
    [bucket, folder, maxSizeMB, onUpload],
  );

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ''; // allow re-selecting same file
  };

  const handleRemove = async () => {
    if (!current) return;
    try {
      await supabase.storage.from(bucket).remove([current.path]);
      toast.success('File removed');
      onRemove?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Could not delete: ${msg}`);
    }
  };

  // ── Render: current file preview ─────────────────────────────────────────

  if (current) {
    return (
      <div className="bg-[var(--bg2)] border border-[var(--b1)] rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--l20,rgba(190,242,100,.12))] flex items-center justify-center shrink-0">
          <FileIcon mimeType={current.mimeType} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-[var(--t1)]">
            {current.originalName}
          </p>
          <p className="text-xs text-[var(--t3)]">
            {(current.sizeBytes / 1024 / 1024).toFixed(2)} MB · Uploaded
          </p>
        </div>
        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
        {!disabled && (
          <button
            type="button"
            onClick={handleRemove}
            className="p-2 hover:bg-[var(--bg3)] rounded-lg text-[var(--t2)] hover:text-red-400 transition"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // ── Render: drop zone ─────────────────────────────────────────────────────

  const hintText =
    hint ??
    `Up to ${maxSizeMB} MB · ${accept
      .split(',')
      .map((a) => a.split('/')[1]?.toUpperCase() ?? a)
      .filter(Boolean)
      .join(', ')}`;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled && !uploading) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && !uploading && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      aria-label={label}
      className={[
        'border-2 border-dashed rounded-xl p-8 text-center transition select-none',
        isDragging
          ? 'border-[var(--lime)] bg-lime/5'
          : 'border-[var(--b1)] bg-[var(--bg2)] hover:border-[var(--b2)] hover:bg-[var(--bg3)]',
        disabled || uploading ? 'pointer-events-none opacity-60 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled || uploading}
      />
      <div className="flex flex-col items-center gap-2">
        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 text-[var(--lime)] animate-spin" />
            <p className="text-sm text-[var(--t1)]">Uploading…</p>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-[var(--t2)]" />
            <p className="text-sm font-medium text-[var(--t1)]">{label}</p>
            <p className="text-xs text-[var(--t3)]">{hintText}</p>
            <p className="text-xs text-[var(--t3)]">Drag & drop or click to browse</p>
          </>
        )}
      </div>
    </div>
  );
}

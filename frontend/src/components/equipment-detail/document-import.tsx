"use client";

import { useMutation } from "@tanstack/react-query";
import { FileText, Link2, UploadCloud, X } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import type { AssetOut } from "@/lib/api/types";
import {
  knowledgeCapabilities,
  uploadAssetDocument,
} from "@/lib/api/knowledge";

const acceptedExtensions = ["pdf", "txt", "md", "doc", "docx"];
const maxFileSize = 20 * 1024 * 1024;

interface DocumentImportProps {
  asset: AssetOut;
}

export function DocumentImport({ asset }: DocumentImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: uploadAssetDocument,
    onSuccess: () => {
      setFile(null);
      setTitle("");
    },
  });

  const validateAndSetFile = (candidate: File | undefined) => {
    if (!candidate) return;
    const extension = candidate.name.split(".").at(-1)?.toLowerCase();
    if (!extension || !acceptedExtensions.includes(extension)) {
      setValidationError("Format non accepté. Utilisez PDF, TXT, MD, DOC ou DOCX.");
      return;
    }
    if (candidate.size > maxFileSize) {
      setValidationError("Le document dépasse la limite frontend de 20 Mo.");
      return;
    }
    setValidationError(null);
    setFile(candidate);
    if (!title) setTitle(candidate.name.replace(/\.[^.]+$/, ""));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    validateAndSetFile(event.dataTransfer.files[0]);
  };

  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-panel">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-brand" aria-hidden="true" />
          <h2 className="text-sm font-bold text-slate-950">Documentation spécifique</h2>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          Associer un manuel ou une procédure à {asset.code}
        </p>
      </div>

      <div className="p-4">
        {!knowledgeCapabilities.documentUpload ? (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            <Link2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Connecteur documentaire en attente de sa route backend.
          </div>
        ) : null}

        <div
          className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center hover:border-blue-400 hover:bg-blue-50"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
          }}
        >
          <UploadCloud className="size-6 text-brand" aria-hidden="true" />
          <p className="mt-2 text-sm font-bold text-slate-900">
            Déposer un document ou parcourir
          </p>
          <p className="mt-1 text-xs text-slate-500">PDF, TXT, MD, DOC, DOCX · 20 Mo max.</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.txt,.md,.doc,.docx"
          onChange={handleFileChange}
        />

        {validationError ? (
          <p className="mt-2 text-xs font-semibold text-red-700">{validationError}</p>
        ) : null}

        {file ? (
          <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded bg-white text-brand">
                <FileText className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900">{file.name}</p>
                <p className="text-[11px] text-slate-500">
                  {(file.size / 1024 / 1024).toLocaleString("fr-FR", {
                    maximumFractionDigits: 2,
                  })}{" "}
                  Mo · Lié à {asset.code}
                </p>
              </div>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded text-slate-500 hover:bg-white hover:text-slate-900"
                onClick={() => setFile(null)}
                aria-label="Retirer le document"
                title="Retirer le document"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <label className="mt-3 block text-xs font-semibold text-slate-700">
              Titre du document
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500"
              />
            </label>
          </div>
        ) : null}

        {asset.manual_ref ? (
          <p className="mt-3 text-xs text-slate-600">
            Référence existante : <span className="font-semibold">{asset.manual_ref}</span>
          </p>
        ) : null}

        <button
          type="button"
          disabled={!file || !knowledgeCapabilities.documentUpload || upload.isPending}
          onClick={() => {
            if (file) upload.mutate({ assetId: asset.id, file, title });
          }}
          className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-brand px-3 text-xs font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <UploadCloud className="size-4" aria-hidden="true" />
          {upload.isPending ? "Import en cours…" : "Importer et indexer"}
        </button>

        {upload.isError ? (
          <p className="mt-2 text-xs font-semibold text-red-700">
            L’import n’a pas pu être terminé.
          </p>
        ) : null}
        {upload.data ? (
          <p className="mt-2 text-xs font-semibold text-blue-800">
            {upload.data.filename} · {upload.data.status}
          </p>
        ) : null}
      </div>
    </section>
  );
}

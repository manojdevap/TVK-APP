"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { parseVotersCsv, type CsvVoterRow } from "@/lib/csv-voters";

export function CsvImportPanel({
  dict,
  wardNumbers = [1, 2, 3],
}: {
  dict: Dictionary["csvImport"];
  wardNumbers?: number[];
}) {
  const [rows, setRows] = useState<CsvVoterRow[]>([]);
  const [errors, setErrors] = useState<{ line: number; message: string }[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFileName(file.name);
    const text = await file.text();
    const result = parseVotersCsv(text, wardNumbers);
    setRows(result.rows);
    setErrors(result.errors);
    setLoading(false);
  }

  return (
    <section className="mb-8 rounded-xl border border-dashed border-tvk-maroon/30 bg-tvk-yellow/5 p-6">
      <h2 className="text-lg font-semibold text-tvk-maroon-dark">{dict.title}</h2>
      <p className="mt-1 text-sm text-muted">{dict.description}</p>
      <p className="mt-2 text-xs text-muted">{dict.columns}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="btn-primary cursor-pointer">
          {loading ? dict.parsing : dict.chooseFile}
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
        </label>
        <a href="/sample-voters.csv" download className="btn-secondary">
          {dict.downloadSample}
        </a>
        <span className="text-sm text-muted">{fileName ?? dict.noFile}</span>
      </div>

      {(rows.length > 0 || errors.length > 0) && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">
            {dict.preview}: {rows.length + errors.length} {dict.rowsParsed} · {rows.length} {dict.validRows}
            {errors.length > 0 && ` · ${errors.length} ${dict.errors}`}
          </p>

          {errors.length > 0 && (
            <ul className="mt-2 text-xs text-red-600">
              {errors.slice(0, 5).map((err) => (
                <li key={`${err.line}-${err.message}`}>
                  {dict.rowError} {err.line}: {err.message}
                </li>
              ))}
            </ul>
          )}

          {rows.length > 0 && (
            <div className="table-wrap mt-3 border-0 shadow-none">
              <table className="min-w-0">
                <thead>
                  <tr>
                    <th>username</th>
                    <th>voterId</th>
                    <th>wardNumber</th>
                    <th>gender</th>
                    <th>isOurVote</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={`${row.voterId}-${i}`}>
                      <td>{row.username}</td>
                      <td className="font-mono text-xs">{row.voterId}</td>
                      <td>{row.wardNumber}</td>
                      <td>{row.gender}</td>
                      <td>{row.isOurVote ? "✓" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

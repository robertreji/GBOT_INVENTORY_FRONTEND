'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Download, FileSpreadsheet, ImagePlus, LoaderCircle, Upload, XCircle } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Select } from '@/src/components/ui/Select';
import { categoriesApi } from '@/src/api/categories.api';
import { componentsApi } from '@/src/api/components.api';
import { CategoryDTO } from '@/src/types/category.types';
import { useToast } from '@/src/context/ToastContext';

interface ImportRow {
  rowNumber: number;
  name: string;
  quantity: number;
  description: string;
  categoryName: string;
  imageName: string;
}

interface ImportResult {
  rowNumber: number;
  name: string;
  status: 'created' | 'failed';
  message?: string;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  row.push(value.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9]/g, '');
}

function fileBaseName(value: string): string {
  return value.split(/[\\/]/).pop()?.trim() ?? value.trim();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Upload failed. Please try again.';
}

export default function ImportComponentsPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [defaultCategoryId, setDefaultCategoryId] = useState('');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageOverrides, setImageOverrides] = useState<Record<number, string>>({});
  const [csvName, setCsvName] = useState('');
  const [csvError, setCsvError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    categoriesApi.listCategories()
      .then((availableCategories) => {
        if (!active) return;
        setCategories(availableCategories);
        setDefaultCategoryId(availableCategories[0]?.id ?? '');
      })
      .catch((error: unknown) => {
        if (active) setCsvError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    const nextPreviews: Record<string, string> = {};
    for (const file of imageFiles) nextPreviews[file.name] = URL.createObjectURL(file);
    setPreviews(nextPreviews);
    return () => Object.values(nextPreviews).forEach((url) => URL.revokeObjectURL(url));
  }, [imageFiles]);

  const filesByName = useMemo(() => {
    const indexed = new Map<string, File>();
    for (const file of imageFiles) {
      const key = normalize(file.name);
      if (key && !indexed.has(key)) indexed.set(key, file);
    }
    return indexed;
  }, [imageFiles]);

  const categoryByName = useMemo(() => {
    const indexed = new Map<string, CategoryDTO>();
    for (const category of categories) indexed.set(normalize(category.name), category);
    return indexed;
  }, [categories]);

  const getRowImage = (row: ImportRow): File | undefined => {
    const overrideName = imageOverrides[row.rowNumber];
    if (overrideName) return imageFiles.find((file) => file.name === overrideName);
    return row.imageName
      ? filesByName.get(normalize(fileBaseName(row.imageName)))
      : filesByName.get(normalize(row.name));
  };

  const handleCsv = async (file?: File) => {
    setCsvError('');
    setRows([]);
    setResults([]);
    setCsvName(file?.name ?? '');
    if (!file) return;

    try {
      const parsed = parseCsv((await file.text()).replace(/^\uFEFF/, ''));
      if (parsed.length < 2) throw new Error('The CSV needs a header and at least one component row.');

      const headers = parsed[0].map((header) => header.toLocaleLowerCase().replace(/[\s_-]/g, ''));
      const findColumn = (...names: string[]) => headers.findIndex((header) => names.includes(header));
      const nameIndex = findColumn('name', 'component', 'componentname');
      const quantityIndex = findColumn('quantity', 'available', 'availablequantity', 'count', 'stock');
      if (nameIndex === -1 || quantityIndex === -1) {
        throw new Error('CSV headers must include name and quantity. Optional headers: category, description, image.');
      }

      const categoryIndex = findColumn('category', 'categoryname');
      const descriptionIndex = findColumn('description');
      const imageIndex = findColumn('image', 'imagefile', 'photo', 'filename');
      const importedRows = parsed.slice(1).map((cells, index): ImportRow => {
        const name = cells[nameIndex] ?? '';
        const rawQuantity = cells[quantityIndex] ?? '';
        const quantity = /^\d+$/.test(rawQuantity) ? Number(rawQuantity) : Number.NaN;
        if (!name) throw new Error(`Row ${index + 2}: component name is empty.`);
        if (!Number.isSafeInteger(quantity) || quantity < 0) {
          throw new Error(`Row ${index + 2}: quantity must be a whole number of zero or more.`);
        }
        return {
          rowNumber: index + 2,
          name,
          quantity,
          categoryName: categoryIndex === -1 ? '' : (cells[categoryIndex] ?? ''),
          description: descriptionIndex === -1 ? '' : (cells[descriptionIndex] ?? ''),
          imageName: imageIndex === -1 ? '' : (cells[imageIndex] ?? ''),
        };
      });
      setRows(importedRows);
    } catch (error) {
      setCsvError(getErrorMessage(error));
    }
  };

  const handleImport = async () => {
    if (!defaultCategoryId) {
      toast.error('Create a category before importing components.');
      return;
    }
    const missingImages = rows.filter((row) => !getRowImage(row));
    if (missingImages.length > 0) {
      toast.error(`Choose an image for each component. ${missingImages.length} row(s) still need an image.`);
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setResults([]);
    const completed: ImportResult[] = [];

    for (const [index, row] of rows.entries()) {
      try {
        const file = getRowImage(row);
        if (!file) throw new Error('Choose an image file for this component.');
        const { imageUrl } = await componentsApi.uploadImage(file);
        const category = row.categoryName ? categoryByName.get(normalize(row.categoryName)) : undefined;
        await componentsApi.createComponent({
          name: row.name,
          categoryId: category?.id ?? defaultCategoryId,
          description: row.description || null,
          inventoryType: 'quantity_based',
          totalQuantity: row.quantity,
          imageUrl,
        });
        completed.push({ rowNumber: row.rowNumber, name: row.name, status: 'created' });
      } catch (error) {
        completed.push({ rowNumber: row.rowNumber, name: row.name, status: 'failed', message: getErrorMessage(error) });
      }
      setProgress(index + 1);
      setResults([...completed]);
    }

    const createdCount = completed.filter((result) => result.status === 'created').length;
    const failedCount = completed.length - createdCount;
    if (failedCount === 0) toast.success(`${createdCount} components imported.`);
    else toast.error(`${createdCount} imported; ${failedCount} failed. Review the results below.`);
    setIsImporting(false);
  };

  const downloadTemplate = () => {
    const content = 'name,quantity,category,description,image\n"Arduino Uno",5,"Boards","Microcontroller board","arduino-uno.jpg"\n';
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'components-import-template.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5">
      <Link href="/admin/components" className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Components
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Upload Component List</h1>
          <p className="text-xs text-zinc-500 mt-1">Import component names, available counts, and a photo for each item.</p>
        </div>
        <Button type="button" size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={downloadTemplate}>
          Download CSV Template
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> 1. Upload the list
          </div>
          <p className="text-xs text-zinc-500">CSV columns: <code>name</code>, <code>quantity</code>, then optional <code>category</code>, <code>description</code>, and <code>image</code>.</p>
          <label className="flex items-center justify-center gap-2 min-h-24 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:border-emerald-500">
            <Upload className="w-4 h-4" />
            <span>{csvName || 'Choose a .csv file'}</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => handleCsv(event.target.files?.[0])} />
          </label>
          <Select label="Default category" value={defaultCategoryId} onChange={(event) => setDefaultCategoryId(event.target.value)} disabled={isLoading || categories.length === 0}>
            {categories.length === 0 && <option value="">{isLoading ? 'Loading categories…' : 'No categories available'}</option>}
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
          {categories.length === 0 && !isLoading && <p className="text-xs text-amber-700 dark:text-amber-400">Create a category in Admin → Categories before importing.</p>}
        </Card>

        <Card className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <ImagePlus className="w-4 h-4 text-emerald-600" /> 2. Upload item photos
          </div>
          <p className="text-xs text-zinc-500">Choose multiple JPEG, PNG, or WebP photos. The <code>image</code> column can name each file; otherwise filenames are matched to component names.</p>
          <label className="flex items-center justify-center gap-2 min-h-24 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:border-emerald-500">
            <ImagePlus className="w-4 h-4" />
            <span>{imageFiles.length ? `${imageFiles.length} photo(s) selected` : 'Choose photos'}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => setImageFiles(Array.from(event.target.files ?? []))} />
          </label>
          <p className="text-xs text-zinc-400">Maximum 5 MB per photo. Image names can be selected individually in the preview below.</p>
        </Card>
      </div>

      {csvError && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{csvError}</div>}

      {rows.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Preview {rows.length} component(s)</h2>
              <p className="text-xs text-zinc-500 mt-1">Rows are imported as quantity-based stock. CSV category names use an existing match, otherwise the default category above.</p>
            </div>
            <Button type="button" variant="primary" size="sm" leftIcon={isImporting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} disabled={isImporting || rows.length === 0 || !defaultCategoryId} onClick={handleImport}>
              {isImporting ? `Importing ${progress} / ${rows.length}` : `Import ${rows.length} Components`}
            </Button>
          </div>

          <div className="max-h-[34rem] overflow-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 text-zinc-500">
                <tr><th className="px-4 py-3 font-semibold">Photo</th><th className="px-4 py-3 font-semibold">Component</th><th className="px-4 py-3 font-semibold">Available</th><th className="px-4 py-3 font-semibold">Category</th><th className="px-4 py-3 font-semibold">Image file</th><th className="px-4 py-3 font-semibold">Result</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {rows.map((row) => {
                  const file = getRowImage(row);
                  const result = results.find((entry) => entry.rowNumber === row.rowNumber);
                  const matchedCategory = row.categoryName ? categoryByName.get(normalize(row.categoryName)) : undefined;
                  return (
                    <tr key={row.rowNumber} className="align-middle">
                      <td className="px-4 py-2"><div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">{file && previews[file.name] ? <img src={previews[file.name]} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-4 h-4 text-zinc-400" />}</div></td>
                      <td className="px-4 py-2 font-semibold text-zinc-800 dark:text-zinc-200">{row.name}<div className="font-normal text-zinc-400">CSV row {row.rowNumber}</div></td>
                      <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{row.quantity}</td>
                      <td className="px-4 py-2 text-zinc-500">{matchedCategory?.name ?? categories.find((category) => category.id === defaultCategoryId)?.name ?? '—'}</td>
                      <td className="px-4 py-2">
                        <select aria-label={`Image for ${row.name}`} value={file?.name ?? ''} onChange={(event) => setImageOverrides((current) => ({ ...current, [row.rowNumber]: event.target.value }))} disabled={isImporting} className="max-w-48 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                          <option value="">Choose a photo…</option>
                          {imageFiles.map((imageFile) => <option key={imageFile.name} value={imageFile.name}>{imageFile.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">{result?.status === 'created' ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Added</span> : result?.status === 'failed' ? <span className="inline-flex items-center gap-1 text-rose-600" title={result.message}><XCircle className="w-3.5 h-3.5" /> Failed</span> : file ? <span className="text-zinc-400">Ready</span> : <span className="text-amber-600">Photo needed</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {results.some((result) => result.status === 'failed') && (
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-rose-600 space-y-1">
              {results.filter((result) => result.status === 'failed').map((result) => <p key={result.rowNumber}>Row {result.rowNumber} ({result.name}): {result.message}</p>)}
            </div>
          )}
        </Card>
      )}

      {rows.length === 0 && !csvError && (
        <div className="flex items-start gap-2 text-xs text-zinc-500"><AlertCircle className="w-4 h-4 shrink-0" />Import creates new catalog entries with the available count from the CSV. Review the preview before starting; completed rows are saved as they finish.</div>
      )}
    </div>
  );
}

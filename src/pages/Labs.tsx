import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { FlaskConical, Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, FileUp, X, FileText, Pencil } from 'lucide-react';
import type { LabReport, LabResult } from '../types';
import { getTodayString } from '../utils/date';
import { extractTextFromPdf, parseLabResults, type ParsedLabResult } from '../utils/pdfParser';
import { savePdf, getPdf, deletePdf } from '../utils/storageUtils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { generateLabReportAnalysis, type AIAnalysisResult } from '../services/gemini';
import { checkAndIncrementUsage } from '../services/db';
import { CONFIG } from '../config';
import { Sparkles, Loader2 } from 'lucide-react';



const Labs = () => {
    const { labReports, addLabReport, deleteLabReport: contextDeleteReport } = useHealth();

    // Wrapper to handle IDB deletion
    const handleDeleteReport = async (id: string) => {
        const report = labReports.find(r => r.id === id);
        if (report?.pdfStorageId) {
            await deletePdf(report.pdfStorageId);
        }
        contextDeleteReport(id);
    };
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingReportId, setEditingReportId] = useState<string | null>(null);

    // New Report State
    const [reportDate, setReportDate] = useState(getTodayString());
    const [reportTitle, setReportTitle] = useState('');
    const [results, setResults] = useState<LabResult[]>([]);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [existingPdfId, setExistingPdfId] = useState<string | undefined>(undefined);

    // Import State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [parsedResults, setParsedResults] = useState<ParsedLabResult[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [rawText, setRawText] = useState('');
    const [showRawText, setShowRawText] = useState(false);

    // View PDF State
    const [viewingPdf, setViewingPdf] = useState<string | null>(null);

    // New Result Item State
    const [testName, setTestName] = useState('');
    const [value, setValue] = useState('');
    const [unit, setUnit] = useState('');
    const [minRange, setMinRange] = useState('');
    const [maxRange, setMaxRange] = useState('');
    const [editingResultId, setEditingResultId] = useState<string | null>(null);

    const addOrUpdateResultItem = () => {
        if (!testName || !value) return;

        const newItem: LabResult = {
            id: editingResultId ? editingResultId : Date.now().toString(),
            testName,
            value: isNaN(Number(value)) ? value : Number(value), // Keep as string if not a number
            unit,
            minRange: Number(minRange),
            maxRange: Number(maxRange)
        };

        if (editingResultId) {
            setResults(results.map(r => r.id === editingResultId ? newItem : r));
            setEditingResultId(null);
        } else {
            setResults([...results, newItem]);
        }

        // Reset Item fields
        setTestName('');
        setValue('');
        setUnit('');
        setMinRange('');
        setMaxRange('');
    };

    const editResultItem = (item: LabResult) => {
        setTestName(item.testName || '');
        setValue(item.value !== undefined ? item.value.toString() : '');
        setUnit(item.unit || '');
        setMinRange(item.minRange !== undefined ? item.minRange.toString() : '');
        setMaxRange(item.maxRange !== undefined ? item.maxRange.toString() : '');
        setEditingResultId(item.id);
    };

    const removeResultItem = (id: string) => {
        setResults(results.filter(r => r.id !== id));
        if (editingResultId === id) {
            setEditingResultId(null);
            setTestName('');
            setValue('');
            setUnit('');
            setMinRange('');
            setMaxRange('');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        setPdfFile(file); // Store the file object itself

        // No need to read as DataURL anymore for storage
        /*
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setTestName('My Test'); // Fallback
            }
        };
        reader.readAsDataURL(file);
        */

        try {
            const lines = await extractTextFromPdf(file);
            setRawText(lines.join('\n'));
            const parsed = parseLabResults(lines);
            if (parsed.length === 0) {
                // Determine if we should show the modal anyway to show raw text
                const shouldShow = window.confirm('No automatic results found. Would you like to view the raw text to verify the PDF was read correctly?');
                if (shouldShow) {
                    setParsedResults([]);
                    setIsImportModalOpen(true);
                    setShowRawText(true);
                }
            } else {
                setParsedResults(parsed);
                setIsImportModalOpen(true);
                setShowRawText(false);
            }
        } catch (error) {
            console.error('PDF Parse Error:', error);
            alert('Failed to read PDF file.');
        } finally {
            setIsParsing(false);
            // Reset input
            e.target.value = '';
        }
    };

    const confirmImport = () => {
        const newResults: LabResult[] = parsedResults.map(p => ({
            id: Math.random().toString(36).substr(2, 9),
            testName: p.testName,
            value: p.value,
            unit: p.unit,
            minRange: p.minRange,
            maxRange: p.maxRange
        }));
        setResults([...results, ...newResults]);
        setIsImportModalOpen(false);
        setParsedResults([]);
    };

    const removeParsedItem = (index: number) => {
        setParsedResults(parsedResults.filter((_, i) => i !== index));
    };

    const updateParsedItem = (index: number, field: keyof ParsedLabResult, value: string | number) => {
        const updated = [...parsedResults];
        updated[index] = { ...updated[index], [field]: value };
        setParsedResults(updated);
    };

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (results.length === 0) {
            alert('Please add at least one test result.');
            return;
        }

        const reportId = editingReportId || Date.now().toString();
        let pdfStorageId: string | undefined = existingPdfId;

        if (pdfFile) {
            // Save new PDF Blob to IndexedDB
            pdfStorageId = `rep_${reportId}`;
            await savePdf(pdfStorageId, pdfFile);
        }

        const newReport: LabReport = {
            id: reportId,
            date: reportDate,
            title: reportTitle,
            results,
            pdfStorageId
        };

        // If editing and we didn't upload a new PDF but had an old one (handled by keeping existingPdfId)
        // Note: For now, if they edit, we update the existing record.
        // We need to 'delete' the old one if we want to replace it in Context, OR use an 'updateLabReport' method.
        // Since we only have add/delete, we delete the old one first if editing.

        if (editingReportId) {
            contextDeleteReport(editingReportId);
        }

        addLabReport(newReport);

        // Reset Form
        setIsFormOpen(false);
        setEditingReportId(null);
        setReportDate(getTodayString());
        setReportTitle('');
        setResults([]);
        setPdfFile(null);
        setExistingPdfId(undefined);
    };

    const handleEditReport = (report: LabReport) => {
        setEditingReportId(report.id);
        setReportDate(report.date);
        setReportTitle(report.title);
        setResults(report.results);
        setExistingPdfId(report.pdfStorageId);
        // We don't load the PDF data back into memory unless they view it, so pdfData remains undefined unless they upload a NEW one.
        setIsFormOpen(true);
        window.scrollTo(0, 0);
    };

    const getStatusText = (value: string | number, min: number, max: number) => {
        if (typeof value !== 'number') return null; // No status for strings
        if (min === 0 && max === 0) return null;
        if (value < min) return 'Low';
        if (value > max) return 'High';
        return 'Normal';
    };

    const sortedReports = [...labReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Lab Results</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Track your blood work and identify areas of concern.</p>
                </div>
                <Button
                    onClick={() => {
                        setIsFormOpen(!isFormOpen);
                        setEditingReportId(null);
                        setReportDate(getTodayString());
                        setReportTitle('');
                        setResults([]);
                        setPdfFile(null);
                        setExistingPdfId(undefined);
                        setEditingResultId(null);
                        setTestName('');
                        setValue('');
                        setUnit('');
                        setMinRange('');
                        setMaxRange('');
                    }}
                    variant={isFormOpen ? 'secondary' : 'primary'}
                    icon={<Plus size={20} style={{ transform: isFormOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />}
                >
                    {isFormOpen ? 'Cancel Report' : 'Add New Report'}
                </Button>
            </div>

            {isFormOpen && (
                <Card style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{editingReportId ? 'Edit Lab Report' : 'New Lab Report'}</h3>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileUpload}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                            />
                            <Button variant="outline" icon={<FileUp size={18} />}>
                                Upload PDF
                            </Button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <Input
                            label="Report Date"
                            type="date"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                        />
                        <Input
                            label="Report Title"
                            type="text"
                            placeholder="e.g. Annual Physical"
                            value={reportTitle}
                            onChange={(e) => setReportTitle(e.target.value)}
                        />
                    </div>

                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Add Test Result</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                            <Input placeholder="Test Name" value={testName} onChange={(e) => setTestName(e.target.value)} />
                            <Input placeholder="Value" type="number" value={value} onChange={(e) => setValue(e.target.value)} />
                            <Input placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
                            <Input placeholder="Min" type="number" value={minRange} onChange={(e) => setMinRange(e.target.value)} />
                            <Input placeholder="Max" type="number" value={maxRange} onChange={(e) => setMaxRange(e.target.value)} />
                            <Button
                                onClick={addOrUpdateResultItem}
                                variant={editingResultId ? 'warning' : 'primary'}
                                style={{ height: '46px', padding: '0 1.5rem' }}
                            >
                                {editingResultId ? 'Update' : 'Add'}
                            </Button>
                        </div>
                    </div>

                    {results.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h4 style={{ marginBottom: '1rem' }}>Added Results ({results.length})</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {results.map((r) => (
                                    <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr auto', gap: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 500 }}>{r.testName}</span>
                                        <span style={{ fontWeight: 600 }}>{r.value} <small style={{ color: 'var(--text-secondary)' }}>{r.unit}</small></span>
                                        <span>
                                            {getStatusText(r.value, r.minRange, r.maxRange) === 'High' && <span style={{ color: 'var(--accent-danger)', fontWeight: 600 }}>High</span>}
                                            {getStatusText(r.value, r.minRange, r.maxRange) === 'Low' && <span style={{ color: 'var(--accent-warning)', fontWeight: 600 }}>Low</span>}
                                            {getStatusText(r.value, r.minRange, r.maxRange) === 'Normal' && <span style={{ color: 'var(--accent-success)' }}>Normal</span>}
                                        </span>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ref: {r.minRange} - {r.maxRange}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Button variant="ghost" size="icon" onClick={() => editResultItem(r)} title="Edit"><Pencil size={18} /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => removeResultItem(r.id)} style={{ color: 'var(--accent-danger)' }} title="Remove"><Trash2 size={18} /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleSubmitReport} variant="success" size="lg">Save Complete Report</Button>
                    </div>
                </Card>
            )}

            {/* Import Modal */}
            {isImportModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <Card style={{
                        width: '90%',
                        maxWidth: '800px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        padding: 0
                    }}>
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Review Imported Results</h3>
                                <Button
                                    onClick={() => setShowRawText(!showRawText)}
                                    variant="ghost"
                                    size="sm"
                                    style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
                                >
                                    {showRawText ? 'Hide Raw Text' : 'Show Raw Text'}
                                </Button>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsImportModalOpen(false)} style={{ color: 'var(--text-muted)' }}><X size={24} /></Button>
                        </div>

                        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                            {showRawText && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Raw Extracted Text</label>
                                    <textarea
                                        readOnly
                                        value={rawText}
                                        style={{ width: '100%', height: '150px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem', borderRadius: 'var(--radius-sm)' }}
                                    />
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                        Check if your data appears correctly here. If not, the PDF format might be unsupported.
                                    </p>
                                </div>
                            )}

                            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                                We found {parsedResults.length} potential results. Please review and correct them before adding to your report.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {parsedResults.map((item, index) => (
                                    <div key={index} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                                        gap: '0.5rem',
                                        padding: '1rem',
                                        backgroundColor: 'var(--bg-primary)',
                                        borderRadius: 'var(--radius-md)'
                                    }}>
                                        <Input
                                            label="Test Name"
                                            value={item.testName}
                                            onChange={(e) => updateParsedItem(index, 'testName', e.target.value)}
                                            style={{ padding: '0.5rem' }}
                                        />
                                        <Input
                                            label="Value"
                                            value={item.value}
                                            onChange={(e) => updateParsedItem(index, 'value', Number(e.target.value))}
                                            style={{ padding: '0.5rem' }}
                                        />
                                        <Input
                                            label="Unit"
                                            value={item.unit}
                                            onChange={(e) => updateParsedItem(index, 'unit', e.target.value)}
                                            style={{ padding: '0.5rem' }}
                                        />
                                        <Input
                                            label="Min"
                                            value={item.minRange}
                                            onChange={(e) => updateParsedItem(index, 'minRange', Number(e.target.value))}
                                            style={{ padding: '0.5rem' }}
                                        />
                                        <Input
                                            label="Max"
                                            value={item.maxRange}
                                            onChange={(e) => updateParsedItem(index, 'maxRange', Number(e.target.value))}
                                            style={{ padding: '0.5rem' }}
                                        />
                                        <div style={{ display: 'flex', alignItems: 'end', paddingBottom: '1.25rem' }}>
                                            <Button variant="ghost" size="icon" onClick={() => removeParsedItem(index)} style={{ color: 'var(--accent-danger)' }} title="Remove">
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button onClick={() => setIsImportModalOpen(false)} variant="ghost">Cancel</Button>
                            <Button onClick={confirmImport} variant="success">Confirm & Add Results</Button>
                        </div>
                    </Card>
                </div>
            )}

            {isParsing && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Reading PDF...</h3>
                        <p>Hang tight while we extract the data.</p>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {sortedReports.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <FlaskConical size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>No lab reports added yet.</p>
                    </div>
                ) : (
                    sortedReports.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onDelete={handleDeleteReport}
                            onViewPdf={(data) => setViewingPdf(data)}
                            onEdit={handleEditReport}
                        />
                    ))
                )}
            </div>

            {/* PDF Viewer Modal */}
            {viewingPdf && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1500,
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#000' }}>
                        <button onClick={() => setViewingPdf(null)} style={{ color: '#fff' }}><X size={24} /></button>
                    </div>
                    {viewingPdf.startsWith('blob:') || viewingPdf.startsWith('data:') ? (
                        <iframe src={viewingPdf} style={{ flex: 1, border: 'none' }} title="PDF Results" />
                    ) : (
                        <div style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                            Loading PDF...
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

const ReportCard = ({ report, onDelete, onViewPdf, onEdit }: {
    report: LabReport,
    onDelete: (id: string) => void,
    onViewPdf: (data: string) => void,
    onEdit: (report: LabReport) => void
}) => {
    const [expanded, setExpanded] = useState(false);

    const abnormalities = report.results.filter(r => {
        if (typeof r.value !== 'number') return false; // Ignore text results for abnormality check
        if (r.minRange === 0 && r.maxRange === 0) return false;
        return r.value < r.minRange || r.value > r.maxRange;
    });

    // Group results by category
    const groupedResults = report.results.reduce((acc, r) => {
        let cat = r.category;

        // Frontend Grouping Fallback: If undefined/General, try one last lookup
        if (!cat || cat === 'General') {
            cat = 'General';
        }

        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r);
        return acc;
    }, {} as Record<string, LabResult[]>);

    const { userProfile } = useHealth(); // Get userProfile to access UID
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async (e: React.MouseEvent) => {
        e.stopPropagation();

        setExpanded(true);
        setLoading(true);
        setError(null);
        try {
            // Rate Limit Check
            const uid = userProfile?.uid;
            if (!uid) {
                throw new Error("You must be logged in to use this feature.");
            }
            const allowed = await checkAndIncrementUsage(uid, CONFIG.AI_DAILY_LIMIT);
            if (!allowed) {
                throw new Error(`Daily limit of ${CONFIG.AI_DAILY_LIMIT} requests reached. Please try again tomorrow.`);
            }

            const result = await generateLabReportAnalysis(report);
            setAiAnalysis(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card style={{ overflow: 'hidden', padding: 0 }}>
            <div
                onClick={() => setExpanded(!expanded)}
                style={{
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: expanded ? 'var(--bg-secondary)' : 'transparent'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        padding: '1rem',
                        borderRadius: '50%',
                        color: 'var(--text-primary)'
                    }}>
                        <FlaskConical size={24} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>{report.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{new Date(report.date).toDateString()}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button
                        onClick={handleAnalyze}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
                        icon={loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                    >
                        {loading ? 'Analyzing...' : 'Analyze with AI'}
                    </Button>
                    {(report.pdfData || report.pdfStorageId) && (
                        <Button
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (report.pdfData) {
                                    onViewPdf(report.pdfData);
                                } else if (report.pdfStorageId) {
                                    try {
                                        const stored = await getPdf(report.pdfStorageId);
                                        if (stored) {
                                            if (stored instanceof Blob) {
                                                const url = URL.createObjectURL(stored);
                                                onViewPdf(url);
                                            } else {
                                                onViewPdf(stored as string);
                                            }
                                        } else {
                                            alert('PDF file not found in storage.');
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        alert('Error loading PDF.');
                                    }
                                }
                            }}
                            variant="outline"
                            size="sm"
                            icon={<FileText size={16} />}
                        >
                            View PDF
                        </Button>
                    )}
                    {abnormalities.length > 0 ? (
                        <Badge variant="danger" icon={<AlertTriangle size={14} />}>
                            {abnormalities.length} Concerns
                        </Badge>
                    ) : (
                        <Badge variant="success" icon={<CheckCircle size={14} />}>
                            All Normal
                        </Badge>
                    )}
                    {expanded ? <ChevronUp size={24} color="var(--text-muted)" /> : <ChevronDown size={24} color="var(--text-muted)" />}
                </div>
            </div>

            {expanded && (
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">

                    <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>

                        {/* AI Results Section */}
                        {error && (
                            <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', borderRadius: 'var(--radius-md)' }}>
                                {error}
                            </div>
                        )}

                        {aiAnalysis && (
                            <div style={{ marginBottom: '2rem', backgroundColor: 'rgba(99, 102, 241, 0.05)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Sparkles size={16} /> AI Health Insights
                                </h4>
                                <div style={{ marginBottom: '1.5rem', whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                    {aiAnalysis.analysis}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <h5 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--accent-success)' }}>Recommended Foods</h5>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {aiAnalysis.foodsToEat.map((f, i) => (
                                                <Badge key={i} variant="success">{f}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h5 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--accent-danger)' }}>Limit / Avoid</h5>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {aiAnalysis.foodsToAvoid.map((f, i) => (
                                                <Badge key={i} variant="danger">{f}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', gap: '0.5rem' }}>
                            <Button
                                onClick={(e) => { e.stopPropagation(); onEdit(report); }}
                                variant="outline"
                                size="sm"
                                icon={<Pencil size={16} />}
                            >
                                Edit Results
                            </Button>
                            <Button
                                onClick={(e) => { e.stopPropagation(); onDelete(report.id); }}
                                variant="danger"
                                size="sm"
                                icon={<Trash2 size={16} />}
                            >
                                Delete
                            </Button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {Object.entries(groupedResults).map(([category, items]) => (
                                <div key={category} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                    <h4 style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        padding: '0.75rem 1rem',
                                        fontWeight: 600,
                                        borderBottom: '1px solid var(--border-subtle)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <FlaskConical size={16} style={{ opacity: 0.7 }} />
                                        {category}
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 'auto' }}>
                                            {items.length} tests
                                        </span>
                                    </h4>
                                    <div>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                            <tbody>
                                                {items.map(r => {
                                                    const isNumeric = typeof r.value === 'number';
                                                    const isLow = isNumeric && r.minRange !== 0 && (r.value as number) < r.minRange;
                                                    const isHigh = isNumeric && r.maxRange !== 0 && (r.value as number) > r.maxRange;
                                                    const isNormal = isNumeric && !isLow && !isHigh;

                                                    return (
                                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 500, width: '40%' }}>{r.testName}</td>
                                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                                                                {r.value} <small style={{ color: 'var(--text-secondary)' }}>{r.unit}</small>
                                                            </td>
                                                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                                {r.referenceRange ? r.referenceRange : (r.minRange || r.maxRange ? `${r.minRange} - ${r.maxRange}` : '')}
                                                            </td>
                                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                                {isLow && <Badge variant="warning" icon={<ChevronDown size={12} />}>Low</Badge>}
                                                                {isHigh && <Badge variant="danger" icon={<ChevronUp size={12} />}>High</Badge>}
                                                                {isNormal && isNumeric && <Badge variant="success" icon={<CheckCircle size={12} />}>Normal</Badge>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default Labs;

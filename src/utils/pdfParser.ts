import * as pdfjsLib from 'pdfjs-dist';

// Point to the worker file
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

import labStructure from './labStructure.json';

export interface ParsedLabResult {
    testName: string;
    value: string | number;
    unit: string;
    minRange: number;
    maxRange: number;
    referenceRange?: string;
    category?: string;
}

export const extractTextFromPdf = async (file: File): Promise<string[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let allLines: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items.map((item: any) => item.str.trim()).filter(s => s.length > 0);
        allLines = [...allLines, ...pageStrings];
    }

    return allLines;
};

export const parseLabResults = (lines: string[]): ParsedLabResult[] => {
    const results: ParsedLabResult[] = [];

    // Common units
    // Note: We check for units to confirm a value is a lab result
    const units = ['mg/dL', 'g/dL', 'mmol/L', '%', 'fl', 'pg', 'g/L', 'U/L', 'IU/L', '/uL', '10^3/uL', '10^6/uL', 'mm/hr', 'mili/cu.mm', 'ng/dL', 'mg/L', 'μL', '10^3/μL'];

    const isUnit = (str: string) => {
        return units.some(u => str.includes(u) || str.toLowerCase() === u.toLowerCase());
    };

    const isNumber = (str: string) => {
        return /^\d+(\.\d+)?$/.test(str);
    };

    // Skip generic headers
    const skipTerms = ['Test Name', 'Result', 'Unit', 'Bio. Ref', 'Bio. Ref. Interval', 'Method', 'Page', 'Report Status', 'Sample Type'];

    // Super normalize: remove all non-alphanumeric chars (keep only letters/numbers)
    const superNorm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Pre-sort keys by length (longest first) to ensure "Hemoglobin A1c" matches before "Hemoglobin"
    const mapping = labStructure as Record<string, string>;
    const sortedKeys = Object.keys(mapping).sort((a, b) => b.length - a.length);

    for (let i = 0; i < lines.length; i++) {
        const current = lines[i];

        // STRATEGY: Name-First Detection with support for Same-Line Values
        // Check if line contains any known key
        const currentLower = current.toLowerCase();

        // Find best matching key
        const matchedKey = sortedKeys.find(k => {
            // we use word boundary check if possible, or simple includes
            // simple includes is safer for now but might have false positives? 
            // e.g. "Age" vs "Image". 
            // Given the specific lab keys, likely ok.
            return currentLower.includes(k.toLowerCase());
        });

        if (matchedKey) {
            // FOUND A TEST NAME!
            const testName = matchedKey;
            const category = mapping[testName];

            // Determine separate Value/Unit
            // We need to see what's left on the line after removing the name
            // Regex replace using case-insensitive
            const remainder = current.replace(new RegExp(matchedKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '').trim();

            let value: string | number = '';
            let unit = '';
            let minRange = 0;
            let maxRange = 0;
            let referenceRange = '';

            let nextLineIndex = i + 1;

            // Helper to parse value/unit from a string
            const parseValueString = (str: string) => {
                // Check for number
                const numMatch = str.match(/(\d+(\.\d+)?)/);
                if (numMatch) {
                    // If the string starts with the number, great.
                    // If there's stuff before it, maybe not the value?
                    // Heuristic: Value usually comes early in remainder
                    const v = parseFloat(numMatch[0]);
                    // Check for unit in the REST of the string
                    const rest = str.replace(numMatch[0], '').trim();

                    // Try to find unit in 'rest'
                    const foundUnit = units.find(u => rest.includes(u));
                    return { val: v, valStr: numMatch[0], unit: foundUnit || '', rest };
                }
                return null;
            };

            // 1. Try Same Line
            let sameLineParsed = null;
            if (remainder.length > 0) {
                sameLineParsed = parseValueString(remainder);
            }

            if (sameLineParsed && sameLineParsed.valStr.length > 0) {
                // CAUTION: Ensure the number isn't just garbage (like "Page 1")
                // but we already filtered generic headers?
                value = sameLineParsed.val;
                if (sameLineParsed.unit) unit = sameLineParsed.unit;
            } else {
                // 2. Try Next Line
                if (nextLineIndex < lines.length) {
                    const nextLine = lines[nextLineIndex];
                    if (isNumber(nextLine)) {
                        value = parseFloat(nextLine);
                        nextLineIndex++; // Advance since we consumed this line
                    } else if (nextLine.length < 20) {
                        // Could be text value like "Negative" or "Yellow"
                        // But need to be careful not to consume next Test Name
                        const isNextTest = sortedKeys.some(k => nextLine.toLowerCase().includes(k.toLowerCase()));
                        if (!isNextTest) {
                            value = nextLine;
                            nextLineIndex++;
                        }
                    }
                }
            }

            // Check for explicit unit on next line if not found yet
            if (!unit && nextLineIndex < lines.length) {
                if (isUnit(lines[nextLineIndex])) {
                    unit = lines[nextLineIndex];
                    nextLineIndex++; // Consume unit line
                }
            }

            // Extract Range
            // Look ahead a few lines?
            // Usually range is after unit.
            if (nextLineIndex < lines.length) {
                const potentialRange = lines[nextLineIndex];
                const rangeMatch = potentialRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
                if (rangeMatch) {
                    minRange = parseFloat(rangeMatch[1]);
                    maxRange = parseFloat(rangeMatch[2]);
                    referenceRange = potentialRange; // simple capture
                }
            }

            // Only add if we found something meaningful (Value required? yes)
            if (value !== '') {
                // Check duplicate
                if (!results.some(r => r.testName === testName)) {
                    results.push({ testName, value, unit, minRange, maxRange, referenceRange, category });

                    // Optimization: Fast forward 'i' if we consumed lines?
                    // Actually better not to manipulate 'i' manually to avoid skipping nested things, 
                    // but here we just read. 'i' naturally increments.
                    // The risk is parsing "Hemoglobin" then in next iteration parsing "13.5" as a generic number.
                    // But generic number logic requires "Backtracking to find Name".
                    // If we add it here, the duplicate check prevents adding it again?
                    // No, Generic Logic will try to add "13.5" with name "Hemoglobin" (found by backtracking).
                    // So we should be safe due to duplicate check `!results.some(r => r.testName === testName)`.
                }
            }
            // Continue to next line?
            // If we matched "Hemoglobin", we should process this line as done.
            continue;
        }

        // Heuristic: Generic fallback for things NOT in the map?
        // ... (keep existing generic logic below for unknown tests?)
        // actually, user wants "All expected results". If it's not in map, maybe we don't care?
        // But generic logic is useful for "My Test" manual adds or new/unknown tests.
        // Let's keep it but skip if we already found this test.

        // Heuristic: Look for a Number
        if (isNumber(current)) {
            // But if we found a "Name-First" match earlier for this block, we might duplicate.
            // The duplicate check `results.some` handles it.
            // However, let's keep it for safety.

            // Context Check
            let nameIndex = i - 1;
            // Backtrack skipping garbage to find potential Name
            while (nameIndex >= 0 && (lines[nameIndex].length < 2 || skipTerms.some(term => lines[nameIndex].includes(term)))) {
                nameIndex--;
            }

            let isValid = false;
            let unit = '';
            let testName = '';

            // Validation Strategy 1: Known Unit
            let unitIndex = i + 1;
            if (unitIndex < lines.length && isUnit(lines[unitIndex])) {
                isValid = true;
                unit = lines[unitIndex];
            }

            // Validation Strategy 2: Known Test Name (from Structure)
            // If we found a potential name, check if it's in our known list
            if (nameIndex >= 0) {
                const potentialName = lines[nameIndex];
                const norm = (s: string) => s.trim().toLowerCase();
                const pNameLower = norm(potentialName);

                // Check if this name exists in our map (exact or contains key)
                const isKnownName = Object.keys(mapping).some(k => {
                    const kLower = norm(k);
                    return kLower === pNameLower || pNameLower.includes(kLower);
                });

                if (isKnownName) {
                    isValid = true;
                    testName = potentialName;
                    // If we didn't find a unit before, maybe it's the next line but wasn't in list, or maybe no unit
                    // specific check for some common non-standard units or just assume next non-empty might be it if it's short
                    // For now, leave empty if not strictly identified as unit to avoid noise
                } else if (isValid) {
                    // We had a valid unit, so we accept the name we found even if unknown
                    testName = potentialName;
                }
            }

            if (isValid && testName) {
                const value = parseFloat(current);
                let minRange = 0;
                let maxRange = 0;

                // Range is usually after the unit (or after value if no unit)
                // If we found a unit, range is likely at unitIndex + 1
                // If no unit, range might be at i + 1
                let rangeIndex = unit ? unitIndex + 1 : i + 1;

                if (rangeIndex < lines.length) {
                    const rangeStr = lines[rangeIndex];
                    const rangeMatch = rangeStr.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
                    if (rangeMatch) {
                        minRange = parseFloat(rangeMatch[1]);
                        maxRange = parseFloat(rangeMatch[2]);
                    } else {
                        const lessMatch = rangeStr.match(/<\s*(\d+)/);
                        if (lessMatch) {
                            maxRange = parseFloat(lessMatch[1]);
                        }
                    }
                }

                // Avoid duplicates
                if (!results.some(r => r.testName === testName) && !isNumber(testName)) {
                    // Lookup Category
                    let category = 'General';
                    const testNameClean = superNorm(testName);

                    // 1. Exact Match on Super Clean String
                    const matchedKey = Object.keys(mapping).find(k => superNorm(k) === testNameClean);
                    if (matchedKey) {
                        category = mapping[matchedKey];
                    }

                    // 2. Fallback: Contains match
                    if (category === 'General') {
                        const key = Object.keys(mapping).find(k => testNameClean.includes(superNorm(k)));
                        if (key) category = mapping[key];
                    }

                    results.push({ testName, value, unit, minRange, maxRange, category });
                }
            }
        }
    }

    return results;
};

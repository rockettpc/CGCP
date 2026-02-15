import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ConfiguratorInputs = {
    chord: number;
    height: number;
    depth: number;
    thickness: string;
    type: string;
    measurementType: string;
};

type ConfiguratorResults = {
    radius?: string;
    arcLength?: string;
    angle?: string;
    weight?: string;
};

type ConfiguratorProps = {
    template: { id: string; name: string };
    onSave: (inputs: ConfiguratorInputs, outputs: ConfiguratorResults) => void;
    onBack: () => void;
    user: { units: string } | null | undefined;
    initialData?: Partial<ConfiguratorInputs>;
};

const GLASS_THICKNESS_OPTIONS = [
    { label: '5/32" (4mm)', value: '0.15625', weight: 2.02 },
    { label: '3/16" (5mm)', value: '0.1875', weight: 2.43 },
    { label: '1/4" (6mm)', value: '0.25', weight: 3.24 },
    { label: '5/16" (8mm)', value: '0.3125', weight: 4.06 },
    { label: '3/8" (10mm)', value: '0.375', weight: 4.87 },
    { label: '1/2" (12mm)', value: '0.5', weight: 6.49 },
    { label: '5/8" (16mm)', value: '0.625', weight: 8.11 },
    { label: '3/4" (19mm)', value: '0.75', weight: 9.73 },
];

export default function Configurator({ template, onSave, onBack, user, initialData }: ConfiguratorProps) {
    const { register, watch, handleSubmit, reset } = useForm<ConfiguratorInputs>({
        defaultValues: (initialData as ConfiguratorInputs) || {
            chord: 1000,
            height: 100,
            depth: 1000,
            thickness: '0.25',
            type: 'clear',
            measurementType: 'outside', // outside, inside, center
        }
    });

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    const values = watch();
    const [results, setResults] = useState<ConfiguratorResults>({});
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const units = user?.units || "mm";
    const precision = 4;

    // Calculation Logic
    useEffect(() => {
        const chord = Number(values.chord);
        const height = Number(values.height);
        const thickness = Number(values.thickness);

        if (chord > 0 && height > 0) {
            // Radius calculation: R = (C^2 / 8H) + (H / 2)
            const radius = (Math.pow(chord, 2) / (8 * height)) + (height / 2);

            // Arc Length: L = 2 * R * asin(C / 2R)
            // Angle (radians): theta = 2 * asin(C / 2R)
            const angleRad = 2 * Math.asin(chord / (2 * radius));
            const arcLength = radius * angleRad;

            // Weight Calculation
            const depth = Number(values.depth) || 0;
            const selectedThickness = GLASS_THICKNESS_OPTIONS.find(opt => Math.abs(parseFloat(opt.value) - thickness) < 0.001);
            const weightPerSqFt = selectedThickness ? selectedThickness.weight : 0;

            let areaSqFt = 0;
            if (units === 'mm') {
                // Convert mm² to ft²: 1 ft² = 92903.04 mm²
                areaSqFt = (arcLength * depth) / 92903.04;
            } else {
                // Assume inches: 1 ft² = 144 in²
                areaSqFt = (arcLength * depth) / 144;
            }

            const totalWeight = areaSqFt * weightPerSqFt;

            setResults({
                radius: radius.toFixed(precision),
                arcLength: arcLength.toFixed(precision),
                angle: (angleRad * (180 / Math.PI)).toFixed(precision),
                weight: totalWeight.toFixed(2),
            });

            drawArc(chord, height, radius);
        }
    }, [values]);

    const drawArc = (chord: number, height: number, radius: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Scale to fit
        const padding = 40;
        const availWidth = canvas.width - padding * 2;
        const availHeight = canvas.height - padding * 2;

        // Determine scale
        const scaleX = availWidth / chord;
        const scale = Math.min(scaleX, availHeight / (height * 2)); // *2 just to be safe

        const centerX = canvas.width / 2;
        const startY = canvas.height - padding;

        ctx.beginPath();
        ctx.strokeStyle = '#2563eb'; // Blue-600
        ctx.lineWidth = 4;

        // Draw Chord Line (dashed)
        ctx.setLineDash([5, 5]);
        ctx.moveTo(centerX - (chord / 2) * scale, startY);
        ctx.lineTo(centerX + (chord / 2) * scale, startY);
        ctx.stroke();

        // Draw Arc
        ctx.setLineDash([]);
        ctx.beginPath();

        const circleCenterX = centerX;
        const circleCenterY = startY + (radius - height) * scale;

        const startAngle = 1.5 * Math.PI - (Math.asin(chord / (2 * radius)));
        const endAngle = 1.5 * Math.PI + (Math.asin(chord / (2 * radius)));

        ctx.arc(circleCenterX, circleCenterY, radius * scale, startAngle, endAngle);
        ctx.stroke();
    };

    const onSubmit = (data: ConfiguratorInputs) => {
        // Add calculated results to outputs
        onSave(data, results);
    };

    const handleExportPDF = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const pdf = new jsPDF();

        // Add Header
        pdf.setFontSize(20);
        pdf.text("Project Report", 20, 20);

        pdf.setFontSize(12);
        pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);

        // Add Specs
        pdf.text("Specifications:", 20, 45);
        pdf.text(`Chord: ${values.chord} ${units}`, 30, 55);
        pdf.text(`Height: ${values.height} ${units}`, 30, 65);
        pdf.text(`Depth: ${values.depth} ${units}`, 30, 75);
        pdf.text(`Thickness: ${values.thickness} ${units}`, 30, 85);
        pdf.text(`Glass Type: ${values.type}`, 30, 95);

        // Add Results
        pdf.text("Calculated Properties:", 100, 45);
        pdf.text(`Radius: ${results.radius} ${units}`, 110, 55);
        pdf.text(`Arc Length: ${results.arcLength} ${units}`, 110, 65);
        pdf.text(`Angle: ${results.angle}°`, 110, 75);
        pdf.text(`Est. Weight: ${results.weight} lbs`, 110, 85);

        // Add 3D/2D View (Canvas)
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 20, 110, 170, 100); // x, y, w, h

        // Add Cut Sheet Info
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text("2D Cut Sheet (Flat Pattern)", 20, 20);

        pdf.setFontSize(12);
        pdf.text(`Flat Width (Arc Length): ${results.arcLength} ${units}`, 20, 35);
        pdf.text(`Flat Height (Depth): ${values.depth} ${units}`, 20, 45);

        // Draw simple rectangle for cut sheet
        pdf.rect(20, 60, 170, 100); // Placeholder scale
        pdf.text(`${results.arcLength} ${units}`, 85, 55);
        pdf.text(`${values.depth} ${units}`, 10, 110, { angle: 90 });

        pdf.save("project-report.pdf");
    };

    const handleExportDXF = () => {
        // Simple DXF for a rectangle
        const width = parseFloat(results.arcLength || '0');
        const height = Number(values.depth);

        if (!width || !height) return;

        // Minimal DXF Header and Entities
        const dxf = `0
SECTION
2
ENTITIES
0
LWPOLYLINE
8
0
90
4
70
1
10
0.0
20
0.0
10
${width}
20
0.0
10
${width}
20
${height}
10
0.0
20
${height}
0
ENDSEC
0
EOF`;

        const blob = new Blob([dxf], { type: 'application/dxf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'cut-pattern.dxf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h2 className="text-xl font-semibold mb-4">Configure Glass</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Measurement Type</label>
                        <select {...register("measurementType")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="outside">Outside Dimensions</option>
                            <option value="inside">Inside Dimensions</option>
                            <option value="center">Center Line</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Chord ({units})</label>
                            <input type="number" step="0.0001" {...register("chord")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Depth (Rise) ({units})</label>
                            <input type="number" step="0.0001" {...register("height")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Height ({units})</label>
                            <input type="number" step="0.0001" {...register("depth")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Thickness</label>
                            <select {...register("thickness")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                {GLASS_THICKNESS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Glass Type</label>
                        <select {...register("type")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="clear">Clear Float</option>
                            <option value="tempered">Tempered</option>
                            <option value="laminated">Laminated</option>
                        </select>
                    </div>

                    <div className="pt-6 flex flex-col-reverse sm:flex-row sm:justify-between gap-4">
                        <button type="button" onClick={onBack} className="w-full sm:w-auto px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Back
                        </button>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <button type="button" onClick={handleExportPDF} className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium shadow-sm">
                                Export PDF
                            </button>
                            <button type="button" onClick={handleExportDXF} className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium shadow-sm">
                                Export DXF
                            </button>
                            <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium shadow-sm">
                                Save Calculation
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Preview & Results</h2>
                <div className="bg-gray-100 rounded-lg p-4 mb-4 flex justify-center items-center">
                    <canvas ref={canvasRef} width={400} height={300} className="bg-white rounded shadow-sm"></canvas>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="font-medium text-blue-900 mb-2">Calculated Properties</h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <dt className="text-blue-700">Radius:</dt>
                        <dd className="font-semibold text-blue-900">{results.radius || '-'} {units}</dd>

                        <dt className="text-blue-700">Arc Length:</dt>
                        <dd className="font-semibold text-blue-900">{results.arcLength || '-'} {units}</dd>

                        <dt className="text-blue-700">Angle:</dt>
                        <dd className="font-semibold text-blue-900">{results.angle || '-'}°</dd>

                        <dt className="text-blue-700">Est. Weight:</dt>
                        <dd className="font-semibold text-blue-900">{results.weight || '-'} lbs</dd>
                    </dl>
                </div>
            </div>
        </div>
    );
}

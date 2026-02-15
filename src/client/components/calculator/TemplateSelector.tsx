import React from 'react';
import { useQuery, getTemplates } from 'wasp/client/operations';

export default function TemplateSelector({ onSelect }: { onSelect: (template: any) => void }) {
    const { data: templates, isLoading, error } = useQuery(getTemplates);

    if (isLoading) return <div>Loading templates...</div>;
    if (error) return <div>Error loading templates</div>;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Select a Template</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates?.map((template: any) => (
                    <div
                        key={template.id}
                        onClick={() => onSelect(template)}
                        className="cursor-pointer border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
                    >
                        <div className="h-40 bg-gray-200 flex items-center justify-center">
                            {/* Placeholder for template image */}
                            <span className="text-gray-500">{template.name} Image</span>
                        </div>
                        <div className="p-4">
                            <h3 className="font-medium text-lg">{template.name}</h3>
                            <p className="text-gray-500 text-sm mt-1">{template.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

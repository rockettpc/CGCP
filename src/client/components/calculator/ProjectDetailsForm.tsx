import React from 'react';
import { useForm } from 'react-hook-form';

export default function ProjectDetailsForm({ onSubmit, initialData }: { onSubmit: (data: any) => void, initialData?: any }) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: initialData || {}
    });

    React.useEffect(() => {
        if (initialData) {
            // Format dates for input type="date" (YYYY-MM-DD)
            const formattedData = { ...initialData };
            if (formattedData.measureDate) {
                formattedData.measureDate = new Date(formattedData.measureDate).toISOString().split('T')[0];
            }
            if (formattedData.installDate) {
                formattedData.installDate = new Date(formattedData.installDate).toISOString().split('T')[0];
            }
            reset(formattedData);
        }
    }, [initialData, reset]);

    const onFormSubmit = (data: any) => {
        // Convert date strings back to Date objects for the server
        const submissionData = { ...data };
        if (submissionData.measureDate) {
            submissionData.measureDate = new Date(submissionData.measureDate);
        }
        if (submissionData.installDate) {
            submissionData.installDate = new Date(submissionData.installDate);
        }
        onSubmit(submissionData);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Project Name</label>
                    <input
                        type="text"
                        id="name"
                        {...register("name", { required: "Project name is required" })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>}
                </div>
                <div>
                    <label htmlFor="jobNumber" className="block text-sm font-medium text-gray-700">Job Number</label>
                    <input
                        type="text"
                        id="jobNumber"
                        {...register("jobNumber")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                <input
                    type="text"
                    id="address"
                    {...register("address")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                <div>
                    <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">Contact Name</label>
                    <input
                        type="text"
                        id="contactName"
                        {...register("contactName")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                        type="text"
                        id="contactPhone"
                        {...register("contactPhone")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        id="contactEmail"
                        {...register("contactEmail")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="measureDate" className="block text-sm font-medium text-gray-700">Measure Date</label>
                    <input
                        type="date"
                        id="measureDate"
                        {...register("measureDate")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="installDate" className="block text-sm font-medium text-gray-700">Install Date</label>
                    <input
                        type="date"
                        id="installDate"
                        {...register("installDate")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                    id="notes"
                    rows={3}
                    {...register("notes")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Next: Select Template
                </button>
            </div>
        </form>
    );
}

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// Actually Wasp exposes Link and routes.
// Let's assume standard React.
import { useAuth } from 'wasp/client/auth';
import { createProject, saveCalculation, getProject, updateProject, useQuery } from 'wasp/client/operations';
import ProjectDetailsForm from '../components/calculator/ProjectDetailsForm';
import TemplateSelector from '../components/calculator/TemplateSelector';
import Configurator from '../components/calculator/Configurator';

// Define the steps
enum Step {
    ProjectDetails,
    TemplateSelection,
    Configurator,
}

export default function CalculatorWizard() {
    const { data: user } = useAuth();
    const [currentStep, setCurrentStep] = useState<Step>(Step.ProjectDetails);
    const [projectData, setProjectData] = useState<any>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [calculationData, setCalculationData] = useState<any>(null);
    const [projectId, setProjectId] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Parse query params to check for projectId
    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get('projectId');
        setProjectId(id);
        if (!id) {
            setProjectData(null); // Clear project data if new project
            setSelectedTemplate(null);
            setCalculationData(null);
            setCurrentStep(Step.ProjectDetails);
        }
    }, [location.search]);

    const { data: fetchedProject, isLoading: isProjectLoading } = useQuery(getProject, { projectId: projectId! }, {
        enabled: !!projectId
    });

    React.useEffect(() => {
        if (fetchedProject) {
            setProjectData(fetchedProject);

            // Check if there are existing calculations
            const project = fetchedProject as any;
            if (project.calculations && project.calculations.length > 0) {
                const calc = project.calculations[0]; // Assuming one calculation for now
                if (calc.template) {
                    setSelectedTemplate(calc.template);
                }
                if (calc.inputs) {
                    setCalculationData(calc.inputs);
                }
            }
        }
    }, [fetchedProject]);

    const handleProjectSubmit = async (data: any) => {
        try {
            if (projectId) {
                // Update existing project
                await updateProject({ projectId, ...data });
                setProjectData({ ...projectData, ...data });

                // If we already have a selected template (from loading existing project), skip to configurator
                if (selectedTemplate) {
                    setCurrentStep(Step.Configurator);
                } else {
                    setCurrentStep(Step.TemplateSelection);
                }
            } else {
                // Create project on server
                const project = await createProject(data);
                setProjectId(project.id);
                setProjectData(data);
                setCurrentStep(Step.TemplateSelection);
            }
        } catch (error) {
            console.error("Failed to save project:", error);
            alert("Failed to save project. Please try again.");
        }
    };

    const handleTemplateSelect = (template: any) => {
        setSelectedTemplate(template);
        setCurrentStep(Step.Configurator);
    };

    const handleCalculationSave = async (inputs: any, outputs: any) => {
        if (!projectId || !selectedTemplate) return;
        try {
            await saveCalculation({
                projectId,
                templateId: selectedTemplate.id,
                inputs,
                outputs,
            });
            alert("Calculation saved!");
            navigate('/dashboard');
        } catch (error) {
            console.error("Failed to save calculation:", error);
            alert("Failed to save calculation.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">New Project</h1>
                    <div className="mt-4 flex items-center">
                        <div className={`flex items-center ${currentStep >= Step.ProjectDetails ? 'text-blue-600' : 'text-gray-400'}`}>
                            <span className="flex items-center justify-center w-8 h-8 border-2 rounded-full font-bold mr-2 border-current">1</span>
                            <span>Details</span>
                        </div>
                        <div className="w-12 h-1 bg-gray-300 mx-4"></div>
                        <div className={`flex items-center ${currentStep >= Step.TemplateSelection ? 'text-blue-600' : 'text-gray-400'}`}>
                            <span className="flex items-center justify-center w-8 h-8 border-2 rounded-full font-bold mr-2 border-current">2</span>
                            <span>Template</span>
                        </div>
                        <div className="w-12 h-1 bg-gray-300 mx-4"></div>
                        <div className={`flex items-center ${currentStep >= Step.Configurator ? 'text-blue-600' : 'text-gray-400'}`}>
                            <span className="flex items-center justify-center w-8 h-8 border-2 rounded-full font-bold mr-2 border-current">3</span>
                            <span>Calculate</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    {currentStep === Step.ProjectDetails && (
                        (projectId && isProjectLoading) ? <div>Loading project details...</div> :
                            <ProjectDetailsForm onSubmit={handleProjectSubmit} initialData={projectData} />
                    )}
                    {currentStep === Step.TemplateSelection && (
                        <TemplateSelector onSelect={handleTemplateSelect} />
                    )}
                    {currentStep === Step.Configurator && selectedTemplate && (
                        <Configurator
                            template={selectedTemplate}
                            onSave={handleCalculationSave}
                            onBack={() => setCurrentStep(Step.TemplateSelection)}
                            user={user}
                            initialData={calculationData}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

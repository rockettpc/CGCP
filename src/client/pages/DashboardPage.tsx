
import React, { useState } from 'react';
import { getOrganizationProjects, deleteProjects, getProjectStats, updateProject, inviteUserToOrganization } from 'wasp/client/operations';
import { useQuery } from 'wasp/client/operations';
import { Link } from 'wasp/client/router'; // Keep wasp/client/router for Link
import { useAuth } from 'wasp/client/auth';
import Chart from 'react-apexcharts';

export default function DashboardPage() {
    const { data: projects, isLoading, error, refetch } = useQuery(getOrganizationProjects);
    const { data: user } = useAuth();
    const { data: stats, isLoading: isStatsLoading } = useQuery(getProjectStats);
    const [inviteEmail, setInviteEmail] = useState('');
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
    const [newName, setNewName] = useState<string>("");

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await inviteUserToOrganization({ email: inviteEmail });
            alert('User invited successfully!');
            setInviteEmail('');
        } catch (err: any) {
            alert('Failed to invite user: ' + err.message);
        }
    };

    const toggleSelectAll = () => {
        if (selectedProjects.length === projects?.length) {
            setSelectedProjects([]);
        } else {
            setSelectedProjects(projects?.map((p: any) => p.id) || []);
        }
    };

    const toggleSelectProject = (id: string) => {
        if (selectedProjects.includes(id)) {
            setSelectedProjects(selectedProjects.filter(pId => pId !== id));
        } else {
            setSelectedProjects([...selectedProjects, id]);
        }
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedProjects.length} projects ? `)) return;
        try {
            await deleteProjects({ projectIds: selectedProjects });
            setSelectedProjects([]);
            refetch();
        } catch (err: any) {
            alert('Failed to delete projects: ' + err.message);
        }
    };

    const startRenaming = (project: any) => {
        setRenamingProjectId(project.id);
        setNewName(project.name);
    };

    const saveRenaming = async () => {
        if (!renamingProjectId) return;
        try {
            await updateProject({ projectId: renamingProjectId, name: newName });
            setRenamingProjectId(null);
            refetch();
        } catch (err: any) {
            alert('Failed to update project: ' + err.message);
        }
    };

    const chartOptions = {
        chart: {
            id: "project-status-bar",
            toolbar: { show: false },
        },
        xaxis: {
            categories: ["In Progress", "Quoted", "Completed"],
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
                distributed: true,
            }
        },
        colors: ['#3b82f6', '#f59e0b', '#10b981'],
        dataLabels: { enabled: false },
    };

    const chartSeries = [{
        name: "Projects",
        data: [stats?.InProgress || 0, stats?.Quoted || 0, stats?.Completed || 0]
    }];

    if (isLoading) return <div className="p-8">Loading dashboard...</div>;
    if (error) return <div className="p-8 text-red-600">Error loading dashboard</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <div className="space-x-2">
                            {selectedProjects.length > 0 && (
                                <button
                                    onClick={handleDeleteSelected}
                                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium"
                                >
                                    Delete Selected ({selectedProjects.length})
                                </button>
                            )}
                            <Link
                                to="/calculator"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                            >
                                + New Project
                            </Link>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
                                <dd className="mt-1 text-3xl font-semibold text-gray-900">{projects?.length || 0}</dd>
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Team Members</dt>
                                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                    1
                                </dd>
                                <form onSubmit={handleInvite} className="mt-4 flex">
                                    <input
                                        type="email"
                                        placeholder="Invite email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    />
                                    <button
                                        type="submit"
                                        className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Invite
                                    </button>
                                </form>
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Plan</dt>
                                <dd className="mt-1 text-3xl font-semibold text-gray-900 capitalize">
                                    {user?.subscriptionStatus === 'active' ? 'Pro' : 'Free'}
                                </dd>
                            </div>
                        </div>
                    </div>

                    {/* Project Statistics Chart */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Project Statistics</h2>
                        {isStatsLoading ? <div>Loading stats...</div> : (
                            <div className="bg-white p-4 rounded-lg shadow h-80">
                                <Chart
                                    options={chartOptions}
                                    series={chartSeries}
                                    type="bar"
                                    height="100%"
                                />
                            </div>
                        )}
                    </div>

                    {/* Projects List */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <input
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
                                checked={projects?.length > 0 && selectedProjects.length === projects?.length}
                                onChange={toggleSelectAll}
                            />
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex-grow">Recent Projects</h3>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {projects?.length === 0 ? (
                                <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                                    No projects yet. Create your first one!
                                </li>
                            ) : (
                                projects?.map((project: any) => (
                                    <li key={project.id}>
                                        <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition duration-150 ease-in-out flex items-center">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
                                                checked={selectedProjects.includes(project.id)}
                                                onChange={() => toggleSelectProject(project.id)}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    {renamingProjectId === project.id ? (
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="text"
                                                                value={newName}
                                                                onChange={(e) => setNewName(e.target.value)}
                                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                            />
                                                            <button onClick={saveRenaming} className="text-green-600 hover:text-green-900">Save</button>
                                                            <button onClick={() => setRenamingProjectId(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm font-medium text-blue-600 truncate flex items-center">
                                                            {project.name}
                                                            <button onClick={() => startRenaming(project)} className="ml-2 text-gray-400 hover:text-gray-600">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className="ml-2 flex-shrink-0 flex">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                            Active
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-2 sm:flex sm:justify-between">
                                                    <div className="sm:flex flex-col">
                                                        <p className="text-sm text-gray-500 truncate">
                                                            {project.address || 'No address'}
                                                        </p>
                                                        <div className="mt-2">
                                                            <select
                                                                value={project.status || 'InProgress'}
                                                                onChange={async (e) => {
                                                                    try {
                                                                        await updateProject({ projectId: project.id, status: e.target.value });
                                                                        refetch(); // Refetch projects to update status and stats
                                                                    } catch (err) {
                                                                        console.error("Failed to update status", err);
                                                                        alert("Failed to update status");
                                                                    }
                                                                }}
                                                                className="text-xs border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                                            >
                                                                <option value="InProgress">In Progress</option>
                                                                <option value="Quoted">Quoted</option>
                                                                <option value="Completed">Completed</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                        <p>
                                                            Created on <time dateTime={project.createdAt}>{new Date(project.createdAt).toLocaleDateString()}</time>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-2">
                                                    <Link to={`/calculator?projectId=${project.id}` as any} className="text-sm text-blue-600 hover:text-blue-900 mr-4">
                                                        Edit Project
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { type Project, type Calculation, type Template, type Organization } from "wasp/entities";
import { HttpError } from "wasp/server";
import { type CreateProject, type SaveCalculation, type GetTemplates, type GetProject, type GetOrganizationProjects } from "wasp/server/operations";

type CreateProjectInput = {
    name: string;
    address?: string;
    contactName?: string;
    contactInfo?: string;
    contactPhone?: string;
    contactEmail?: string;
    measureDate?: Date;
    installDate?: Date;
    notes?: string;
    jobNumber?: string;
};

export const createProject: CreateProject<CreateProjectInput, Project> = async (
    args,
    context
) => {
    if (!context.user) {
        throw new HttpError(401);
    }

    let organizationId = context.user.organizationId;

    if (!organizationId) {
        // Create a default organization for the user
        const newOrg = await context.entities.Organization.create({
            data: {
                name: `${context.user.email || "User"}'s Organization`,
                users: {
                    connect: { id: context.user.id },
                },
            },
        });
        organizationId = newOrg.id;
    }

    return context.entities.Project.create({
        data: {
            ...args,
            organization: {
                connect: { id: organizationId },
            },
        },
    });
};

export const deleteProjects = async (args: { projectIds: string[] }, context: any) => {
    if (!context.user) {
        throw new HttpError(401);
    }

    // Verify projects belong to user's org
    const projects = await context.entities.Project.findMany({
        where: {
            id: { in: args.projectIds },
            organizationId: context.user.organizationId,
        },
    });

    if (projects.length !== args.projectIds.length) {
        throw new HttpError(403, "Some projects do not belong to your organization");
    }

    return context.entities.Project.deleteMany({
        where: {
            id: { in: args.projectIds },
        },
    });
};

export const updateProject = async (args: {
    projectId: string;
    name?: string;
    address?: string;
    contactName?: string;
    contactInfo?: string;
    contactPhone?: string;
    contactEmail?: string;
    measureDate?: Date;
    installDate?: Date;
    notes?: string;
    jobNumber?: string;
    status?: string;
}, context: any) => {
    if (!context.user) {
        throw new HttpError(401);
    }

    const project = await context.entities.Project.findUnique({
        where: { id: args.projectId },
    });

    if (!project || project.organizationId !== context.user.organizationId) {
        throw new HttpError(403);
    }

    return context.entities.Project.update({
        where: { id: args.projectId },
        data: {
            name: args.name,
            address: args.address,
            contactName: args.contactName,
            contactInfo: args.contactInfo,
            contactPhone: args.contactPhone,
            contactEmail: args.contactEmail,
            measureDate: args.measureDate,
            installDate: args.installDate,
            notes: args.notes,
            jobNumber: args.jobNumber,
            status: args.status as any,
        },
    });
};

export const getProjectStats = async (_args: void, context: any) => {
    if (!context.user) {
        throw new HttpError(401);
    }

    const projects = await context.entities.Project.findMany({
        where: { organizationId: context.user.organizationId },
    });

    const stats = {
        InProgress: 0,
        Quoted: 0,
        Completed: 0,
    };

    projects.forEach((project: any) => {
        if (stats[project.status as keyof typeof stats] !== undefined) {
            stats[project.status as keyof typeof stats]++;
        }
    });

    return stats;
};

type SaveCalculationInput = {
    projectId: string;
    templateId: string;
    inputs: any;
    outputs: any;
};

export const saveCalculation: SaveCalculation<SaveCalculationInput, Calculation> = async (
    args,
    context
) => {
    if (!context.user) {
        throw new HttpError(401);
    }

    // Verify project belongs to user's org
    const project = await context.entities.Project.findUnique({
        where: { id: args.projectId },
    });

    if (!project || project.organizationId !== context.user.organizationId) {
        throw new HttpError(403);
    }

    return context.entities.Calculation.create({
        data: {
            project: { connect: { id: args.projectId } },
            template: { connect: { id: args.templateId } },
            inputs: args.inputs,
            outputs: args.outputs,
        },
    });
};

export const getTemplates: GetTemplates<void, Template[]> = async (_args, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.Template.findMany();
};

export const getOrganizationProjects: GetOrganizationProjects<void, Project[]> = async (_args, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    if (!context.user.organizationId) {
        return [];
    }
    return context.entities.Project.findMany({
        where: { organizationId: context.user.organizationId },
        orderBy: { createdAt: 'desc' },
        include: { calculations: true }
    });
};

export const getProject: GetProject<{ projectId: string }, Project> = async ({ projectId }, context) => {
    if (!context.user || !context.user.organizationId) {
        throw new HttpError(401);
    }

    const project = await context.entities.Project.findUnique({
        where: { id: projectId },
        include: {
            calculations: {
                include: { template: true },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!project || project.organizationId !== context.user.organizationId) {
        throw new HttpError(403);
    }

    return project;
};

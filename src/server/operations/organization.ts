import { type Organization, type User } from "wasp/entities";
import { HttpError } from "wasp/server";
import { type CreateOrganization, type InviteUserToOrganization, type GetOrganizationMembers } from "wasp/server/operations";

type CreateOrganizationInput = {
    name: string;
};

export const createOrganization: CreateOrganization<CreateOrganizationInput, Organization> = async (
    { name },
    context
) => {
    if (!context.user) {
        throw new HttpError(401);
    }

    const organization = await context.entities.Organization.create({
        data: {
            name,
            users: {
                connect: { id: context.user.id },
            },
        },
    });

    return organization;
};

type InviteUserToOrganizationInput = {
    email: string;
};

export const inviteUserToOrganization: InviteUserToOrganization<InviteUserToOrganizationInput, void> = async (
    { email },
    context
) => {
    if (!context.user || !context.user.organizationId) {
        throw new HttpError(401);
    }

    // In a real app, we would send an email invite.
    // For now, we'll just find the user and add them if they exist, or throw an error.
    // Or maybe we create a user placeholder?
    // Let's assume the user must exist for now to keep it simple, or we just skip this for the MVP if complex.
    // But the requirement says "setup more users".

    const user = await context.entities.User.findUnique({
        where: { email },
    });

    if (!user) {
        throw new HttpError(404, "User not found. They must sign up first.");
    }

    await context.entities.User.update({
        where: { id: user.id },
        data: {
            organization: {
                connect: { id: context.user.organizationId },
            },
        },
    });
};

export const getOrganizationMembers: GetOrganizationMembers<void, User[]> = async (
    _args,
    context
) => {
    if (!context.user || !context.user.organizationId) {
        throw new HttpError(401);
    }

    return context.entities.User.findMany({
        where: {
            organizationId: context.user.organizationId,
        },
    });
};

type UpdateOrganizationInput = {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
};

export const updateOrganization = async (
    args: UpdateOrganizationInput,
    context: any
) => {
    if (!context.user || !context.user.organizationId) {
        throw new HttpError(401);
    }

    return context.entities.Organization.update({
        where: { id: context.user.organizationId },
        data: args,
    });
};

export const getOrganization = async (_args: void, context: any) => {
    if (!context.user || !context.user.organizationId) {
        throw new HttpError(401);
    }
    return context.entities.Organization.findUnique({
        where: { id: context.user.organizationId },
    });
};

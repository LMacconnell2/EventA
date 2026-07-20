export const getRolesSchema = {
    querystring: {
        type: "object",
        additionalProperties: false,
        properties: {
            active: {
                type: "boolean",
                default: true,
            },
            limit: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 10,
            },
            offset: {
                type: "integer",
                minimum: 0,
                default: 0,
            },
            q: {
                type: "string",
                minLength: 1,
                maxLength: 100,
            },
            include_permissions: {
                type: "boolean",
                default: true,
            },
        },
    },
};

export const getRoleByIdSchema = {
    params: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
            id: {
                type: "string",
                pattern: "^[1-9][0-9]*$",
            },
        },
    },
};

export const createRoleSchema = {
    body: {
        type: "object",
        additionalProperties: false,
        required: ["role_name"],
        properties: {
            role_name: {
                type: "string",
                minLength: 1,
                maxLength: 50,
            },
            active: {
                type: "boolean",
                default: true,
            },
            permission_ids: {
                type: "array",
                uniqueItems: true,
                default: [],
                items: {
                    type: "integer",
                    minimum: 1,
                },
            },
        },
    },
};

export const updateRoleSchema = {
    params: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
            id: {
                type: "string",
                pattern: "^[1-9][0-9]*$",
            },
        },
    },
    body: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        properties: {
            role_name: {
                type: "string",
                minLength: 1,
                maxLength: 50,
            },
            active: {
                type: "boolean",
            },
            permission_ids: {
                type: "array",
                uniqueItems: true,
                items: {
                    type: "integer",
                    minimum: 1,
                },
            },
        },
    },
};

export const deleteRoleSchema = {
    params: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
            id: {
                type: "string",
                pattern: "^[1-9][0-9]*$",
            },
        },
    },
};
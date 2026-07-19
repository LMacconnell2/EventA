export const getPermissionsSchema = {
    querystring: {
        type: "object",
        additionalProperties: false,
        properties: {
            active: {
                type: "boolean",
                default: true,
            },
            q: {
                type: "string",
                minLength: 1,
                maxLength: 100,
            },
            group: {
                type: "string",
                minLength: 1,
                maxLength: 100,
            },
            limit: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 100,
            },
            offset: {
                type: "integer",
                minimum: 0,
                default: 0,
            },
        },
    },

    response: {
        200: {
            type: "object",
            additionalProperties: false,
            required: [
                "permissions",
                "groups",
                "pagination",
            ],
            properties: {
                permissions: {
                    type: "array",
                    items: {
                        type: "object",
                        additionalProperties: false,
                        required: [
                            "permission_id",
                            "permission_name",
                            "description",
                            "permission_group",
                            "permission_label",
                            "active",
                            "created_at",
                            "updated_at",
                        ],
                        properties: {
                            permission_id: {
                                type: "integer",
                            },
                            permission_name: {
                                type: "string",
                            },
                            description: {
                                anyOf: [
                                    { type: "string" },
                                    { type: "null" },
                                ],
                            },
                            permission_group: {
                                type: "string",
                            },
                            permission_label: {
                                type: "string",
                            },
                            active: {
                                type: "boolean",
                            },
                            created_at: {
                                type: "string",
                            },
                            updated_at: {
                                type: "string",
                            },
                        },
                    },
                },

                groups: {
                    type: "array",
                    items: {
                        type: "string",
                    },
                },

                pagination: {
                    type: "object",
                    additionalProperties: false,
                    required: [
                        "limit",
                        "offset",
                        "returned",
                        "total",
                    ],
                    properties: {
                        limit: {
                            type: "integer",
                        },
                        offset: {
                            type: "integer",
                        },
                        returned: {
                            type: "integer",
                        },
                        total: {
                            type: "integer",
                        },
                    },
                },
            },
        },
    },
} as const;
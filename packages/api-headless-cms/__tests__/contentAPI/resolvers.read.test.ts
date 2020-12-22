/* eslint-disable */
import { CmsContentModelGroupType } from "@webiny/api-headless-cms/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import * as helpers from "../utils/helpers";
import models from "./mocks/contentModels";

describe("READ - Resolvers", () => {
    let contentModelGroup: CmsContentModelGroupType;

    const readHandlerOpts = {
        path: "read/en-US"
    };

    const {
        documentClient,
        createContentModelMutation,
        updateContentModelMutation
    } = useContentGqlHandler(readHandlerOpts);

    beforeEach(async () => {
        contentModelGroup = await helpers.createContentModelGroup(documentClient);

        const category = models.find(m => m.modelId === "category");

        // TODO fix because this will not work sicne admin queries are not loaded in this test
        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: category.name,
                modelId: category.modelId,
                group: contentModelGroup.id
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [update] = await updateContentModelMutation({
            id: create.data.createContentModel.data.id,
            data: {
                fields: category.fields,
                layout: category.layout
            }
        });
    });

    test(`get entry by ID`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query GetCategory($id: ID!) {
                getCategory(where: { id: $id }) {
                    data {
                        id
                        title
                        slug
                    }
                    error {
                        code
                        message
                    }
                }
            }
        `;
    });

    test(`should return a NOT_FOUND error when getting by value from an unpublished revision`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query GetCategory($slug: String) {
                getCategory(where: { slug: $slug }) {
                    data {
                        id
                        title
                        slug
                    }
                    error {
                        code
                    }
                }
            }
        `;

        // expect(data.getCategory.data).toBeNull();
        // expect(data.getCategory.error.code).toBe("NOT_FOUND");
    });

    test(`list entries (no parameters)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            {
                listCategories {
                    data {
                        id
                        title
                        slug
                    }
                }
            }
        `;
    });

    test(`list entries (limit)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            {
                listCategories(limit: 1) {
                    data {
                        id
                    }
                    meta {
                        totalCount
                    }
                }
            }
        `;
    });

    test(`list entries (limit + after)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query ListCategories($after: String) {
                listCategories(after: $after, limit: 1) {
                    data {
                        title
                    }
                    meta {
                        cursor
                        hasMoreItems
                        totalCount
                    }
                }
            }
        `;
    });

    test(`list entries (sort ASC)`, async () => {
        const query = /* GraphQL */ `
            query ListCategories($sort: [CategoryListSorter]) {
                listCategories(sort: $sort) {
                    data {
                        title
                    }
                }
            }
        `;
    });

    test(`list entries (sort DESC)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query ListCategories($sort: [CategoryListSorter]) {
                listCategories(sort: $sort) {
                    data {
                        title
                    }
                }
            }
        `;
    });

    test(`list entries (contains, not_contains, in, not_in)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query ListCategories($where: CategoryListWhereInput) {
                listCategories(where: $where) {
                    data {
                        title
                    }
                    error {
                        message
                    }
                }
            }
        `;
    });
});

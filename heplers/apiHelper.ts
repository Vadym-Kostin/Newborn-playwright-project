import { APIRequestContext, request, expect } from "@playwright/test";

export class ApiHelper {
    private static context = async (): Promise<APIRequestContext> =>
        await request.newContext({timeout: 5000});

    static async getToken(data: object): Promise<string> {
        const context = await this.context();
        const response = await context.post("api/auth/login", {
            data,
            headers: {
                "Content-Type": "application/json"
            },
        });
        expect(response.ok()).toBeTruthy();
        const serializedResponse = await response.json();
        expect(serializedResponse).toHaveProperty("token");
        return serializedResponse.token;
    }

    static async createPosition(token: string, data: object): Promise<object> {
        const context = await this.context();
        const response = await context.post("api/position", {
            data,
            headers: {
                Authorization: token,
            },
        });
        expect(response.ok()).toBeTruthy();
        const serializedResponse = await response.json();
        return serializedResponse;
    }

    static async filterById(orderNumber: string): Promise<[]> {
        const context = await this.context();
        const response = await context.get("api/order", {
            params: {
                "order": orderNumber
            }
        });
        expect(response.ok()).toBeTruthy();
        expect(response.body.length).toEqual(1);
    }
}
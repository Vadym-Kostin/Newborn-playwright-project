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

    static async filterById(token: string, orderNumber: string): Promise<void> {
        const url = `api/order?order=${orderNumber}`;
        const context = await this.context();
        const response = await context.get(url, {
            headers: {
                Authorization: token,
            }
        });
        const serializedResponse = await response.json();
        expect(response.ok()).toBeTruthy();
        expect(serializedResponse).toHaveLength(1);
    }
}
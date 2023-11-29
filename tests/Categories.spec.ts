import { test, expect } from '@playwright/test';
import { ApiHelper } from '../heplers/apiHelper';
import { DbHelper } from '../heplers/dbHelper';

let token: string;
let categoryId: string;
let orderNumber: string

test.beforeAll(async () => {
    token = await ApiHelper.getToken({
        email: process.env.EMAIL,
        password: process.env.PASSWORD
    });
});

test.beforeEach(async ({ page }) => {
    page.addInitScript((value) => {
        window.localStorage.setItem("auth-token", value)
    }, token);
    await page.goto("/overview")
    await page.context().storageState({ path: "auth.json" });
});

test("Create a category and add positions", async ({ page }) => {
    const categoriesMenuItem = page.getByRole("listitem").filter({ hasText: "Асортимент" });
    const addCategoryBtn = page.getByText("Додати категорію");
    const categoryName = page.locator("#name");
    await categoriesMenuItem.click();
    await page.waitForLoadState("networkidle");
    await addCategoryBtn.click();
    await categoryName.fill("Test category");
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByText("Завантажити зображення").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles("Tesla-wrap-hero_large.jpg");
    const categoryResponsePromise = page.waitForResponse("/api/category");
    await page.getByText("Зберегти зміни").click();
    const categoryResponse = await categoryResponsePromise;
    const parsedCategoryResponse = await categoryResponse.json();
    categoryId = parsedCategoryResponse._id;
    await page.waitForLoadState("networkidle");
    const data = {
        name: "Test position",
        cost: 100,
        category: categoryId
    };
    await ApiHelper.createPosition(token, data);
    await ApiHelper.createPosition(token, data);
    await ApiHelper.createPosition(token, data);
  });

  test("Create an order", async ({ page }) => {
    const addOrderMenuItem = page.getByRole("listitem").filter({ hasText: "Додати замовлення" });
    const categoryCard = page.locator(".m0").filter({ hasText: "Test category" });
    await addOrderMenuItem.click();
    await page.waitForLoadState("networkidle");
    await categoryCard.click();
    await page.waitForLoadState("networkidle");
    for (let i = 0; i < 3; i++) {
        const randomNumber = Math.round(Math.random() * 100);
        const amount = page.locator("input[type='number']");
        const addBtn = page.locator("button").filter({ hasText: "Додати" });
        await amount.nth(i).clear();
        await amount.nth(i).fill(String(randomNumber));
        await addBtn.nth(i).click();
    }
    const completeBtn = page.locator("button").filter({ hasText: "Завершити" });
    await completeBtn.click();
    const orderResponsePromise = page.waitForResponse("/api/order");
    const acceptBtn = page.getByText("Підтвердити");
    await acceptBtn.click();
    const orderResponse = await orderResponsePromise;
    const parsedOrderResponse = await orderResponse.json();
    orderNumber = parsedOrderResponse.order;
  });

  test("Filter the order", async ({ page }) => {
    const historyMenuItem = page.getByRole("listitem").filter({ hasText: "Історія" });
    await historyMenuItem.click();
    await ApiHelper.filterById(token, orderNumber);
  });

test("Delete the created category and validate its absence in DB", async ({ page }) => {
    const categoriesMenuItem = page.getByRole("listitem").filter({ hasText: "Асортимент" });
    await categoriesMenuItem.click();
    const toast = page.locator(".toast");
    await page.waitForLoadState("networkidle");
    await page.locator(".collection-item").filter({ hasText: "Test category" }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForLoadState("domcontentloaded");
    page.on("dialog", dialog => dialog.accept());
    await page.getByRole("button").filter({ hasText: "delete" }).click();
    await page.waitForLoadState("domcontentloaded");
    await expect(toast).toBeVisible();
    const foundCategory = await DbHelper.findCategoryInDB(categoryId);
    expect(foundCategory).toBeFalsy();
});
import { test } from '@playwright/test';

test('create an account', async ({ page }) => {
    await page.goto('/');
    await page.goto('/login');
    await page.getByRole('link', { name: 'Créer un compte' }).click();
    await page.getByLabel('Nom et prénom').click();
    await page.getByLabel('Nom et prénom').fill('User ONE');
    await page.getByLabel('Nom et prénom').press('Tab');
    await page.getByLabel('Email').fill('user.one@mail.com');
    await page.getByLabel('Email').press('Tab');
    await page.getByLabel('Mot de passe', { exact: true }).fill('Us3r0ne$$$');
    await page.getByText('Je certifie avoir lu les conditions générales').click();
    await page.getByRole('button', { name: 'Créer mon compte' }).click();
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await page.getByLabel('Email').click();
    await page.getByLabel('Email').fill('user.one@mail.com');
    await page.getByLabel('Email').press('Tab');
    await page.getByLabel('Mot de passe', { exact: true }).fill('Us3r0ne$$$');
    await page.getByLabel('Mot de passe', { exact: true }).press('Enter');
    await page.getByRole('button', { name: 'Se connecter' }).click();
});
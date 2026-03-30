import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
await page.goto('http://127.0.0.1:5184/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(5000)
await page.getByRole('button', { name: /4\s*Rollers/ }).click()
await page.waitForTimeout(3000)
await page.screenshot({ path: 'screenshots/rollers.png' })
await browser.close()

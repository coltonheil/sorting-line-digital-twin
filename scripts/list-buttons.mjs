import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
await page.goto('http://127.0.0.1:5184/', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
const labels = await page.locator('button').allTextContents()
console.log(JSON.stringify(labels, null, 2))
await browser.close()

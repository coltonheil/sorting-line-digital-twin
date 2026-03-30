import { chromium } from 'playwright'
import fs from 'node:fs/promises'

const url = 'http://127.0.0.1:5184/'
const outDir = new URL('../screenshots/', import.meta.url)
await fs.mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const consoleMessages = []
page.on('console', (msg) => consoleMessages.push(`[${msg.type()}] ${msg.text()}`))
page.on('pageerror', (err) => consoleMessages.push(`[pageerror] ${err.stack || err.message}`))

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(5000)
await page.screenshot({ path: new URL('full-line.png', outDir).pathname })

const clickByText = async (match, file) => {
  const button = page.getByRole('button', { name: new RegExp(match) }).first()
  if (await button.count()) {
    await button.click()
    await page.waitForTimeout(2800)
    await page.screenshot({ path: new URL(file, outDir).pathname })
  }
}

await clickByText('3\\s*Star Wheels', 'star-wheels.png')
await clickByText('4\\s*Rollers', 'rollers.png')

await fs.writeFile(new URL('console.txt', outDir), consoleMessages.join('\n'))
await browser.close()

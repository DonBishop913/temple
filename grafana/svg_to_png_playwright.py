import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def svg_to_png(svg_path: str, output_path: str, width: int = 1200, height: int = 800):
    svg_file = Path(svg_path)
    if not svg_file.exists():
        raise FileNotFoundError(f"SVG file not found: {svg_path}")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        svg_content = svg_file.read_text(encoding='utf-8')

        html_content = f"""
        <html>
        <body style="margin:0; padding:0; display:flex; align-items:center; justify-content:center; background:transparent;">
        {svg_content}
        </body>
        </html>
        """

        await page.set_content(html_content, wait_until='load')
        await page.wait_for_timeout(500)
        await page.set_viewport_size({"width": width, "height": height})
        await page.screenshot(path=output_path, omit_background=True)
        await browser.close()

if __name__ == '__main__':
    svg = Path('grafana') / 'phase_v_plus_workflow.svg'
    sizes = [
        (400, 286, 'phase_v_plus_workflow_thumb.png'),
        (1400, 1000, 'phase_v_plus_workflow_hd.png'),
        (3840, 2160, 'phase_v_plus_workflow_4k.png'),
    ]
    for w, h, name in sizes:
        out = Path('grafana') / name
        asyncio.run(svg_to_png(str(svg), str(out), width=w, height=h))
        print(f"Saved PNG to {out}")

"""Target-machine browser gate, NOT passed in the build environment.
Run demo-campaign first in an expendable PI_TEST_DATA directory, then start that server.
No Pi/model invocation. Controls act on actual server records; no mocked HTTP responses.
"""
import os, json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
base = os.environ.get('PI_TEST_URL', 'http://127.0.0.1:4317')
data = Path(os.environ['PI_TEST_DATA'])
token = (data / 'access.token').read_text().strip()
out = Path(os.environ.get('PI_TEST_OUTPUT', 'test-results/campaign-browser'))
out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as pw:
    options = {'headless': True}
    if os.environ.get('PI_CHROMIUM_EXECUTABLE'):
        options['executable_path'] = os.environ['PI_CHROMIUM_EXECUTABLE']
    browser = pw.chromium.launch(**options)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(base + '/#token=' + token)
    page.get_by_role('button', name='研究活动', exact=True).click()
    expect(page.get_by_role('heading', name='研究活动', exact=True)).to_be_visible()
    expect(page.get_by_text('决策历史', exact=True)).to_be_visible()
    page.get_by_role('button', name='新建研究活动', exact=True).click()
    page.get_by_label('研究目标', exact=True).fill('浏览器真实状态验证，不调用模型')
    page.get_by_role('button', name='保存活动草案', exact=True).click()
    page.get_by_role('button', name='批准并启动活动', exact=True).click()
    expect(page.get_by_role('button', name='暂停活动', exact=True)).to_be_visible()
    page.get_by_role('button', name='登记本轮候选', exact=True).click()
    expect(page.get_by_text('结果通知与主会话分析', exact=True)).to_be_visible(timeout=15000)
    page.get_by_role('button', name='暂停活动', exact=True).click()
    page.reload()
    page.get_by_label('当前活动').select_option(label='浏览器真实状态验证，不调用模型')
    expect(page.get_by_role('button', name='恢复活动', exact=True)).to_be_visible()
    page.get_by_role('button', name='恢复活动', exact=True).click()
    page.screenshot(path=str(out/'campaign-desktop.png'), full_page=True)
    page.on('dialog', lambda d: d.accept())
    page.get_by_role('button', name='停止活动', exact=True).click()
    expect(page.get_by_text('停止原因：用户在工作台停止活动', exact=False)).to_be_visible()
    page.set_viewport_size({'width': 390, 'height': 844})
    page.screenshot(path=str(out/'campaign-mobile.png'), full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'mobile overflow'
    assert not errors, errors
    browser.close()
    (out/'result.json').write_text(json.dumps({'passed':True,'aiUsed':False,'pageErrors':errors,'flow':'existing real runs → new campaign → activate → enroll existing intent → observe → pause → reload → resume → stop'},ensure_ascii=False,indent=2))

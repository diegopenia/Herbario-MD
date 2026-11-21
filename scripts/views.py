import sys
from playwright.sync_api import sync_playwright
url='file://'+sys.argv[1]; out=sys.argv[2]; errs=[]
views = {
 'uniminuto': (116, 4, 3.14159, 0.36, 46),   # x, z, camYaw, pitch, dist
 'museo':     (-62, 27, 1.5708, 0.28, 34),
 'iglesia':   (-17, -70, 1.5708, 0.18, 14),
 'aerea':     (-10, 20, 0.6, 0.85, 120),
}
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1280,'height':760})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(url); pg.wait_for_timeout(2500); pg.click('#btn-start'); pg.wait_for_timeout(300)
    for _ in range(3): pg.keyboard.press('KeyE'); pg.wait_for_timeout(100)
    pg.evaluate("() => { for (const id of ['hud','tools','minimap','hint']) document.getElementById(id).style.display='none'; }")
    for name,(x,z,yaw,pitch,dist) in views.items():
        pg.evaluate(f"() => {{ const g=window.__game; g.st.pos.set({x},0,{z}); g.st.camYaw={yaw}; g.st.camPitch={pitch}; g.st.camDist={dist}; }}")
        pg.wait_for_timeout(1500)
        pg.screenshot(path=f'{out}/v-{name}.png')
    b.close()
print('errores:', errs or 'ninguno')

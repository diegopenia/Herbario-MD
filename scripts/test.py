# Prueba de humo: carga el juego, revisa errores, recorre y registra una muestra, toma capturas.
import sys, time
from playwright.sync_api import sync_playwright

url = 'file://' + sys.argv[1]
out = sys.argv[2]
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: errors.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
    pg.goto(url)
    pg.wait_for_timeout(2500)
    pg.screenshot(path=f'{out}/01-intro.png')
    pg.click('#btn-start')
    pg.wait_for_timeout(1500)
    pg.screenshot(path=f'{out}/02a-editor.png')
    pg.fill('#ed-name', 'Copetón veloz')
    pg.click('[data-tab="pelo"]'); pg.wait_for_timeout(300)
    pg.click('[data-k="pelo"][data-v="4"]'); pg.click('[data-k="colorPelo"][data-v="1"]'); pg.wait_for_timeout(1200)
    pg.screenshot(path=f'{out}/02b-editor-pelo.png')
    pg.click('[data-tab="ropa"]'); pg.click('[data-k="superior"][data-v="5"]'); pg.click('[data-k="colorSuperior"][data-v="8"]')
    pg.click('[data-tab="rol"]'); pg.click('[data-k="rol"][data-v="1"]'); pg.wait_for_timeout(1200)
    pg.screenshot(path=f'{out}/02c-editor-rol.png')
    pg.click('#ed-done'); pg.wait_for_timeout(1200)
    pg.screenshot(path=f'{out}/02-dialogo.png')
    for _ in range(3):
        pg.keyboard.press('KeyE'); pg.wait_for_timeout(150)
    # Teletransportar cerca de la palma de cera (muestra rara) y registrar
    info = pg.evaluate('''() => { const g = window.__game; const m = g.muestras.find(m => m.rara && g.zona.especies[m.esp].comun === 'Palma de cera');
      const a = g.zona.arboles[m.arbol]; g.st.pos.set(a.x + 2.2, 0, a.z + 1.2); g.st.camYaw = Math.atan2(2.2, 1.2); return g.zona.especies[m.esp].comun; }''')
    pg.wait_for_timeout(600)
    pg.screenshot(path=f'{out}/03-cerca-muestra.png')
    pg.keyboard.down('KeyE'); pg.wait_for_timeout(7000); pg.keyboard.up('KeyE')
    pg.wait_for_timeout(300)
    pg.screenshot(path=f'{out}/04-ficha.png')
    state = pg.evaluate('() => ({ nativas: window.__game.st.nativas, score: window.__game.st.score, ficha: !!window.__game.st.ficha })')
    pg.keyboard.press('KeyE'); pg.wait_for_timeout(200)
    # Vista general desde la plaza hacia la iglesia
    pg.evaluate('() => { const g = window.__game; g.st.pos.set(-30, 0, 5); g.st.camYaw = -0.2; g.st.camPitch = 0.55; g.st.camDist = 22; }')
    pg.wait_for_timeout(800)
    pg.screenshot(path=f'{out}/05-plaza-iglesia.png')
    # Caminar hacia adelante 2 s
    before = pg.evaluate('() => [window.__game.st.pos.x, window.__game.st.pos.z]')
    pg.keyboard.down('KeyW'); pg.wait_for_timeout(2000); pg.keyboard.up('KeyW')
    after = pg.evaluate('() => [window.__game.st.pos.x, window.__game.st.pos.z]')
    # Registrar 8 muestras y llegar al punto de encuentro
    pg.evaluate('''() => { const g = window.__game; for (const m of g.muestras.slice(0, 8)) { g.registrar(m.arbol); } g.st.ficha = null; document.getElementById('ficha').classList.remove('on');
      const pe = g.zona.puntoEncuentro; g.st.pos.set(pe.p[0], 0, pe.p[2]); }''')
    pg.wait_for_timeout(600)
    pg.screenshot(path=f'{out}/06-final.png')
    fin = pg.evaluate('() => ({ finished: window.__game.st.finished, score: window.__game.st.score })')
    cfg = pg.evaluate('() => ({ nombre: window.__game.playerCfg.nombre, pelo: window.__game.playerCfg.pelo, superior: window.__game.playerCfg.superior, rol: window.__game.playerCfg.rol, vecinos: window.__game.vecinos.length, titulo: document.getElementById("end-title").textContent })')
    # Móvil
    m = b.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    m.on('pageerror', lambda e: errors.append('mobile pageerror: ' + str(e)))
    m.goto(url); m.wait_for_timeout(2000)
    m.tap('#btn-start'); m.wait_for_timeout(1500)
    m.screenshot(path=f'{out}/07a-movil-editor.png')
    m.tap('#ed-random'); m.wait_for_timeout(800); m.tap('#ed-done'); m.wait_for_timeout(500)
    m.tap('#dialog'); m.tap('#dialog'); m.tap('#dialog'); m.wait_for_timeout(500)
    m.screenshot(path=f'{out}/07-movil.png')
    b.close()
print('muestra:', info, 'estado:', state)
print('caminar:', before, '->', after)
print('final:', fin)
print('jugador:', cfg)
print('errores:', errors[:20] if errors else 'ninguno')

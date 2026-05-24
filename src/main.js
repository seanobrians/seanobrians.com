import './style.css'
import { menuData, uiText } from './data.js'

// ── STATE ──────────────────────────────────────────────────────────────────
let currentLang = localStorage.getItem('sean-menu-lang') || 'es'
let activeSectionId = menuData[0].id
const carousels = new Map()

const view = document.getElementById('menu-view')
const nav  = document.getElementById('category-nav')

// ── HELPERS ────────────────────────────────────────────────────────────────
function t(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value[currentLang] || value.es || value.en || ''
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])
  )
}

// ── RENDER STATIC TEXT ─────────────────────────────────────────────────────
function renderStaticText() {
  document.documentElement.lang = currentLang
  document.querySelectorAll('[data-i18n]').forEach(node => {
    node.textContent = t(uiText[node.getAttribute('data-i18n')])
  })
  document.querySelectorAll('.lang-button').forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.dataset.lang === currentLang))
  })
}

// ── RENDER NAV ─────────────────────────────────────────────────────────────
function renderNav() {
  nav.innerHTML = menuData.map(s => `
    <button class="nav-tab ${s.id === activeSectionId ? 'is-active' : ''}" type="button" data-section="${esc(s.id)}">
      <span class="nav-label">${esc(t(s.nav))}</span>
    </button>
  `).join('')
}

function setActiveSection(id) {
  if (id === activeSectionId) return
  activeSectionId = id
  nav.querySelectorAll('[data-section]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.section === id)
  })
  nav.querySelector(`[data-section="${id}"]`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
}

// ── RENDER MOCKUPS ─────────────────────────────────────────────────────────
const MOCKUP_SHAPES = {
  pint: 'pint-glass', amber: 'pint-glass', wheat: 'pint-glass',
  bottle: 'bottle-body', gin: 'gin-bowl', rocks: 'rocks-glass',
  wine: 'wine-glass', coffee: 'coffee-cup', plate: 'plate-shape', shot: 'shot-glass',
}

function renderMockup(type) {
  const shape = MOCKUP_SHAPES[type] || 'pint-glass'
  return `
    <div class="mockup mockup-${esc(type)}" aria-hidden="true">
      <span class="spark one"></span>
      <span class="spark two"></span>
      <span class="spark three"></span>
      <span class="${shape}"></span>
    </div>`
}

// ── RENDER BANNER ──────────────────────────────────────────────────────────
function renderBanner(items, sectionId) {
  const slides = [...items, ...items, ...items]
  const dots = items.map((_, i) =>
    `<button class="banner-dot ${i === 0 ? 'is-active' : ''}" type="button" data-dot="${i}" aria-label="${i + 1}"></button>`
  ).join('')

  return `
    <section class="banner" id="banner-${esc(sectionId)}" aria-label="${esc(t(uiText.featured))}">
      <div class="banner-track">
        ${slides.map(item => `
          <article class="banner-slide">
            <div class="banner-copy">
              ${item.badge ? `<span class="banner-badge">${esc(t(item.badge))}</span>` : ''}
              <h3 class="banner-title">${esc(item.title)}</h3>
              <p class="banner-subtitle">${esc(t(item.subtitle))}</p>
            </div>
            ${renderMockup(item.mockup)}
          </article>
        `).join('')}
      </div>
      <div class="banner-rail">${dots}</div>
    </section>`
}

// ── RENDER PRICE PILL ──────────────────────────────────────────────────────
function renderPricePill(prod, col) {
  const raw = prod[col.key]
  if (!raw) return ''
  return `
    <span class="price-pill${raw === '—' ? ' is-muted' : ''}">
      <span class="price-label">${esc(t(col.label))}</span>
      <strong class="price-value">${esc(raw)}</strong>
    </span>`
}

// ── RENDER PRODUCT ─────────────────────────────────────────────────────────
function renderProduct(prod, group) {
  const cols = group.columns || [{ key: 'price', label: { es: 'Precio', en: 'Price' } }]
  const desc = t(prod.description || group.defaultDescription || '')
  return `
    <article class="product-card ${prod.highlighted ? 'is-highlighted' : ''}">
      <div class="product-main">
        <div class="product-heading">
          <h3 class="product-name">${esc(prod.name)}</h3>
          ${prod.badge ? `<span class="badge">${esc(t(prod.badge))}</span>` : ''}
        </div>
        <p class="description">${esc(desc)}</p>
      </div>
      <div class="price-stack">${cols.map(c => renderPricePill(prod, c)).join('')}</div>
    </article>`
}

// ── RENDER DEAL ────────────────────────────────────────────────────────────
function renderDeal(prod) {
  return `
    <article class="deal-card">
      <h3 class="product-name">${esc(prod.name)}</h3>
      ${prod.badge ? `<span class="badge" style="margin:0.35rem auto 0">${esc(t(prod.badge))}</span>` : ''}
      <strong class="deal-price">${esc(prod.price)}</strong>
    </article>`
}

// ── RENDER GROUP ───────────────────────────────────────────────────────────
function renderGroup(group) {
  const isDeals = group.layout === 'deals'
  return `
    <section class="group">
      <h2 class="group-title">${esc(t(group.name))}</h2>
      <div class="${isDeals ? 'deal-grid' : 'products'}">
        ${group.products.map(prod => isDeals ? renderDeal(prod) : renderProduct(prod, group)).join('')}
      </div>
    </section>`
}

// ── RENDER ALL SECTIONS ────────────────────────────────────────────────────
function renderAll() {
  carousels.forEach(c => c.destroy())
  carousels.clear()

  view.innerHTML = menuData.map(section => `
    <div class="section-wrapper" id="section-${esc(section.id)}" data-section-id="${esc(section.id)}">
      <div class="section-kicker">${esc(t(uiText.featured))}</div>
      <h1 class="section-heading">${esc(t(section.title))}</h1>
      <p class="section-subtitle">${esc(t(section.subtitle))}</p>
      ${renderBanner(section.bannerItems, section.id)}
      ${section.groups.map(renderGroup).join('')}
    </div>
  `).join('')

  renderNav()

  menuData.forEach(section => {
    const bannerEl = document.getElementById(`banner-${section.id}`)
    if (bannerEl) {
      carousels.set(section.id, new BannerMotion(bannerEl, section.bannerItems.length))
    }
  })
}

// ── BANNER CAROUSEL ────────────────────────────────────────────────────────
class BannerMotion {
  constructor(root, realSlideCount) {
    this.root = root
    this.track = root.querySelector('.banner-track')
    this.dots = [...root.querySelectorAll('.banner-dot')]
    this.realSlideCount = realSlideCount
    this.position = 0
    this.targetIndex = realSlideCount
    this.width = 1
    this.velocity = 0
    this.autoDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? Infinity : 4200
    this.nextAuto = performance.now() + this.autoDelay
    this.pointerDown = false
    this.dragged = false
    this.lastX = 0
    this.lastT = 0
    this.raf = 0
    this.lastFrame = performance.now()

    this.resize = this.resize.bind(this)
    this.frame  = this.frame.bind(this)
    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerUp   = this.onPointerUp.bind(this)

    this.resize()
    window.addEventListener('resize', this.resize)
    root.addEventListener('pointerdown',  this.onPointerDown)
    root.addEventListener('pointermove',  this.onPointerMove)
    root.addEventListener('pointerup',    this.onPointerUp)
    root.addEventListener('pointercancel',this.onPointerUp)
    root.addEventListener('pointerleave', this.onPointerUp)
    this.dots.forEach(dot => {
      dot.addEventListener('click', () => {
        this.targetIndex = this.realSlideCount + Number(dot.dataset.dot || 0)
        this.velocity = 0
        this.nextAuto = performance.now() + this.autoDelay
        this.apply()
      })
    })
    this.raf = requestAnimationFrame(this.frame)
  }

  resize() {
    this.width = this.root.clientWidth || 1
    this.position = this.targetIndex * this.width
    this.apply()
  }

  onPointerDown(e) {
    this.pointerDown = true
    this.dragged = false
    this.lastX = e.clientX
    this.lastT = performance.now()
    this.velocity = 0
    this.root.setPointerCapture?.(e.pointerId)
  }

  onPointerMove(e) {
    if (!this.pointerDown) return
    const now = performance.now()
    const dx  = e.clientX - this.lastX
    const dt  = Math.max(12, now - this.lastT)
    if (Math.abs(dx) > 1) this.dragged = true
    this.position -= dx
    this.velocity = (-dx / dt) * 16.7
    this.lastX = e.clientX
    this.lastT = now
    this.apply()
  }

  onPointerUp(e) {
    if (!this.pointerDown) return
    this.pointerDown = false
    this.root.releasePointerCapture?.(e.pointerId)
    const projected = this.position + (this.dragged ? this.velocity * 8 : 0)
    this.targetIndex = Math.round(projected / this.width)
    this.nextAuto = performance.now() + this.autoDelay
    this.normalizeIfNeeded()
  }

  frame(now) {
    const dt = Math.min(48, now - this.lastFrame)
    this.lastFrame = now

    if (!this.pointerDown) {
      const target   = this.targetIndex * this.width
      const distance = target - this.position
      const ts       = dt / 16.7
      this.velocity += distance * 0.045 * ts
      this.velocity *= Math.pow(0.78, ts)
      this.position += this.velocity * ts

      if (Math.abs(distance) < 0.45 && Math.abs(this.velocity) < 0.06) {
        this.position = target
        this.velocity = 0
        this.normalizeIfNeeded()
        if (now >= this.nextAuto) {
          this.targetIndex++
          this.nextAuto = now + this.autoDelay
        }
      }
      this.apply()
    }
    this.raf = requestAnimationFrame(this.frame)
  }

  apply() {
    if (!this.width) return
    this.track.style.transform = `translate3d(${-this.position}px,0,0)`
    const raw = Math.round(this.position / this.width)
    const ai  = ((raw % this.realSlideCount) + this.realSlideCount) % this.realSlideCount
    this.dots.forEach((d, i) => d.classList.toggle('is-active', i === ai))
  }

  normalizeIfNeeded() {
    if (!this.realSlideCount || !this.width) return
    if (this.targetIndex >= this.realSlideCount * 2) {
      this.targetIndex -= this.realSlideCount
      this.position    -= this.realSlideCount * this.width
    }
    if (this.targetIndex < this.realSlideCount) {
      this.targetIndex += this.realSlideCount
      this.position    += this.realSlideCount * this.width
    }
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.resize)
    this.root.removeEventListener('pointerdown',  this.onPointerDown)
    this.root.removeEventListener('pointermove',  this.onPointerMove)
    this.root.removeEventListener('pointerup',    this.onPointerUp)
    this.root.removeEventListener('pointercancel',this.onPointerUp)
    this.root.removeEventListener('pointerleave', this.onPointerUp)
  }
}

// ── EVENTS ─────────────────────────────────────────────────────────────────
nav.addEventListener('click', e => {
  const btn = e.target.closest('[data-section]')
  if (!btn) return
  document.getElementById(`section-${btn.dataset.section}`)
    ?.scrollIntoView({ behavior: 'smooth' })
})

document.querySelector('.top-actions').addEventListener('click', e => {
  const btn = e.target.closest('[data-lang]')
  if (!btn || btn.dataset.lang === currentLang) return
  currentLang = btn.dataset.lang
  localStorage.setItem('sean-menu-lang', currentLang)
  const scrollY = window.scrollY
  renderStaticText()
  renderAll()
  window.scrollTo(0, scrollY)
})

// ── ACTIVE SECTION ON SCROLL ───────────────────────────────────────────────
window.addEventListener('scroll', () => {
  let current = menuData[0].id
  const threshold = window.innerHeight * 0.4
  for (const section of menuData) {
    const el = document.getElementById(`section-${section.id}`)
    if (el && el.getBoundingClientRect().top <= threshold) {
      current = section.id
    }
  }
  setActiveSection(current)
}, { passive: true })

// ── SERVICE WORKER ─────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {})
  })
}

// ── INIT ───────────────────────────────────────────────────────────────────
renderStaticText()
renderAll()

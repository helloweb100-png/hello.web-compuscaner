/* =====================================================================
   PROYECTOS ESPECIALIZADOS | app.js

   Estructura
   1. CONFIG: único lugar que se edita (WhatsApp, correo, dirección, horario)
   2. Utilidades
   3. Loader
   4. Texto, reveal, contadores
   5. Header, menú, navegación
   6. Hero: red de partículas, tilt, foco de luz
   7. Interacciones: pestañas, FAQ, formulario, botón flotante
   8. Scroll suave (Lenis) y movimiento con scroll (GSAP + ScrollTrigger)
   9. Arranque

   Mejora progresiva: si GSAP o Lenis no cargan (sin conexión, bloqueadores),
   la página sigue funcionando con animaciones CSS e IntersectionObserver.
   ===================================================================== */
(() => {
    'use strict';

    /* =================================================================
       1. CONFIG: editar solo aquí
       ================================================================= */
    const CONFIG = {
        brand: 'Proyectos Especializados',
        // PENDIENTE: número de WhatsApp del negocio, con código de país y sin "+" ni espacios.
        // Ejemplo (México): '525512345678'
        whatsapp: '520000000000',
        // Opcionales: si se dejan vacíos, no se muestran en la página.
        email: '',
        address: '',
        hours: ''
    };

    // Mensajes que se envían a WhatsApp según el botón que se presione (data-wa="clave")
    const MESSAGES = {
        general: 'Hola, vi la página de Proyectos Especializados y me gustaría hablar con un experto sobre tecnología para mi empresa.',
        diagnostico: 'Hola, quiero solicitar un diagnóstico de TI para mi empresa.',
        videovigilancia: 'Hola, quiero cotizar un sistema de videovigilancia para mi negocio.',
        redes: 'Hola, necesito cotizar la instalación o el soporte de una red LAN (cableado, switches o conmutadores).',
        computo: 'Hola, quiero cotizar equipo de cómputo para mi empresa.',
        impresion: 'Hola, quiero cotizar impresoras o plotters.',
        escaneres: 'Hola, necesito escáneres, refacciones o consumibles.',
        datos: 'Hola, tengo un disco duro con problemas y quiero que evalúen mi caso para recuperar la información.',
        soporte: 'Hola, necesito soporte técnico o reparación de equipos.',
        empezar: 'Hola, estoy listo para empezar. Quiero una propuesta de tecnología para mi empresa.',
        duda: 'Hola, tengo una duda sobre sus servicios de TI.',
        oficinas: 'Hola, quiero armar la solución de TI para mi oficina o corporativo.',
        comercios: 'Hola, quiero proteger y conectar mi comercio o tienda.',
        escuelas: 'Hola, quiero equipar mi escuela o institución con tecnología.',
        industria: 'Hola, quiero asegurar la operación de mi industria o almacén con tecnología.'
    };

    /* =================================================================
       2. UTILIDADES
       ================================================================= */
    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const hasIO = 'IntersectionObserver' in window;
    const hasGSAP = () => typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

    let lenis = null; // instancia de Lenis (si carga)

    // Una falla en un módulo no debe romper el resto de la página
    const safe = (name, fn) => {
        try { return fn(); } catch (error) { console.error('[' + name + ']', error); return undefined; }
    };

    const isPlaceholderNumber = () => /^0+$/.test(CONFIG.whatsapp.slice(2));
    const waURL = (message) => 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(message);

    const formatPhone = () => {
        const digits = CONFIG.whatsapp.replace(/\D/g, '');
        if (isPlaceholderNumber()) return '';
        if (digits.length === 12 && digits.startsWith('52')) {
            return '+52 ' + digits.slice(2, 4) + ' ' + digits.slice(4, 8) + ' ' + digits.slice(8);
        }
        return '+' + digits;
    };

    /* =================================================================
       3. LOADER
       ================================================================= */
    function runLoader() {
        return new Promise((resolve) => {
            const loader = $('#loader');
            const finishReady = () => {
                document.documentElement.classList.remove('is-loading');
                document.body.classList.add('is-ready');
                resolve();
            };
            if (!loader) { finishReady(); return; }

            const pctEl = $('#loader-pct');
            const statusEl = $('#loader-status');
            const STATUS = [[0, 'Iniciando sistemas'], [30, 'Conectando red'], [65, 'Protegiendo datos'], [93, 'Todo listo']];
            const MIN_TIME = reduceMotion ? 350 : 2300;
            const MAX_TIME = 7000; // nunca bloquear la página más de 7 s

            const t0 = performance.now();
            let loaded = document.readyState === 'complete';
            if (!loaded) window.addEventListener('load', () => { loaded = true; }, { once: true });

            let shown = 0;
            const tick = (now) => {
                const elapsed = now - t0;
                const eased = 1 - Math.pow(1 - Math.min(elapsed / MIN_TIME, 1), 2.4);
                const target = (loaded && elapsed >= MIN_TIME) || elapsed >= MAX_TIME ? 1 : Math.min(eased, .92);
                shown += (target - shown) * .16;
                if (target === 1 && shown > .995) shown = 1;

                const pct = Math.round(shown * 100);
                loader.style.setProperty('--p', shown.toFixed(3));
                if (pctEl) pctEl.textContent = pct + '%';
                if (statusEl) {
                    const step = STATUS.filter((s) => pct >= s[0]).pop();
                    if (step && statusEl.textContent !== step[1]) statusEl.textContent = step[1];
                }

                if (shown < 1) { requestAnimationFrame(tick); return; }

                // 100%: pausa breve y se levanta la cortina
                setTimeout(() => {
                    loader.classList.add('is-done');
                    document.documentElement.classList.remove('is-loading');
                    setTimeout(finishReady, 380);
                    setTimeout(() => loader.remove(), 1400);
                }, 320);
            };
            requestAnimationFrame(tick);
        });
    }

    /* =================================================================
       4. TEXTO, REVEAL, CONTADORES
       ================================================================= */
    // Divide los titulares (.split) en palabras para animarlas desde una máscara
    function initSplitText() {
        $$('.split').forEach((root) => {
            let index = 0;
            const walk = (node) => {
                Array.from(node.childNodes).forEach((child) => {
                    if (child.nodeType === 3) {
                        const fragment = document.createDocumentFragment();
                        child.textContent.split(/(\s+)/).forEach((part) => {
                            if (!part) return;
                            if (/^\s+$/.test(part)) { fragment.appendChild(document.createTextNode(' ')); return; }
                            const outer = document.createElement('span');
                            outer.className = 'w';
                            const inner = document.createElement('span');
                            inner.className = 'wi';
                            inner.style.setProperty('--i', index++);
                            inner.textContent = part;
                            outer.appendChild(inner);
                            fragment.appendChild(outer);
                        });
                        child.replaceWith(fragment);
                    } else if (child.nodeType === 1) {
                        walk(child);
                    }
                });
            };
            walk(root);
        });
    }

    // Aparición de elementos al entrar en pantalla
    function initReveal() {
        // En móvil/tablet las tarjetas de metodología son una lista normal: también aparecen con reveal
        const willPin = !reduceMotion && hasGSAP() && window.matchMedia('(min-width: 1024px)').matches;
        if (!willPin) $$('.p-card, .p-end').forEach((el) => el.classList.add('reveal'));

        const targets = $$('.reveal, .split');
        if (!hasIO || reduceMotion) { targets.forEach((el) => el.classList.add('in')); return; }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in');
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
        targets.forEach((el) => observer.observe(el));
    }

    // Contadores animados
    function initCounters() {
        const counters = $$('[data-count]');
        if (!counters.length || !hasIO || reduceMotion) return;

        const run = (el) => {
            const to = Number(el.dataset.count);
            const start = performance.now();
            const duration = 1700;
            const step = (now) => {
                const p = Math.min((now - start) / duration, 1);
                el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))).toLocaleString('es-MX');
                if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        };

        counters.forEach((el) => { el.textContent = '0'; });
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                run(entry.target);
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.6 });
        counters.forEach((el) => observer.observe(el));
    }

    /* =================================================================
       5. HEADER, MENÚ, NAVEGACIÓN
       ================================================================= */
    function initWhatsAppLinks() {
        $$('[data-wa]').forEach((a) => {
            a.href = waURL(MESSAGES[a.dataset.wa] || MESSAGES.general);
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        });

        // Datos de contacto: solo se muestran los que tienen valor
        const phone = formatPhone();
        if (phone) $$('[data-bind="phone"]').forEach((el) => { el.textContent = phone; });

        const bindings = { email: CONFIG.email, address: CONFIG.address, hours: CONFIG.hours };
        Object.keys(bindings).forEach((key) => {
            const value = bindings[key];
            if (!value) return;
            $$('[data-bind="' + key + '"]').forEach((el) => {
                el.textContent = value;
                if (key === 'email' && el.tagName === 'A') el.href = 'mailto:' + value;
            });
            $$('[data-contact="' + key + '"]').forEach((el) => { el.hidden = false; });
        });

        if (isPlaceholderNumber()) {
            console.warn('[Proyectos Especializados] Configura el número de WhatsApp en CONFIG.whatsapp (app.js).');
        }
    }

    function initHeader() {
        const header = $('#header');
        const sentinel = $('#top-sentinel');
        if (!header) return;
        if (hasIO && sentinel) {
            new IntersectionObserver(([entry]) => {
                header.classList.toggle('is-stuck', !entry.isIntersecting);
            }).observe(sentinel);
        } else {
            header.classList.add('is-stuck');
        }
    }

    const menuApi = { close: () => {} };

    function initMenu() {
        const burger = $('#burger');
        const menu = $('#menu');
        const header = $('#header');
        if (!burger || !menu) return;

        menu.inert = true;

        const open = () => {
            menu.inert = false;
            menu.classList.add('is-open');
            header.classList.add('is-menu-open');
            burger.setAttribute('aria-expanded', 'true');
            burger.setAttribute('aria-label', 'Cerrar menú');
            document.documentElement.classList.add('menu-open');
            if (lenis) lenis.stop();
        };
        const close = () => {
            if (!menu.classList.contains('is-open')) return;
            menu.classList.remove('is-open');
            header.classList.remove('is-menu-open');
            burger.setAttribute('aria-expanded', 'false');
            burger.setAttribute('aria-label', 'Abrir menú');
            document.documentElement.classList.remove('menu-open');
            menu.inert = true;
            if (lenis) lenis.start();
        };
        menuApi.close = close;

        burger.addEventListener('click', () => (menu.classList.contains('is-open') ? close() : open()));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('is-open')) { close(); burger.focus(); }
        });
        window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) close(); });
    }

    // Anclas internas con scroll suave y compensación del header fijo
    function initAnchors() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;
            const id = link.getAttribute('href');
            if (!id || id === '#') return;

            let target = null;
            try { target = document.querySelector(id); } catch (err) { return; }
            if (!target) return;

            e.preventDefault();
            menuApi.close();

            const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 70;
            if (lenis) {
                lenis.scrollTo(target, { offset: id === '#inicio' ? 0 : -(headerHeight - 1), duration: 1.6 });
            } else {
                target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
            }
            history.replaceState(null, '', id);
        });
    }

    // Marca el enlace de la sección visible
    function initScrollSpy() {
        if (!hasIO) return;
        const links = $$('.nav a');
        const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                // Secciones que no están en el menú (hero, banda, contacto) limpian el activo
                const active = byId.get(entry.target.id);
                links.forEach((l) => l.classList.toggle('is-active', l === active));
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        $$('main > section[id]').forEach((section) => observer.observe(section));
    }

    /* =================================================================
       6. HERO: RED DE PARTÍCULAS, TILT, FOCO DE LUZ
       ================================================================= */
    function initHeroNetwork() {
        const hero = $('.hero');
        const canvas = $('.hero-canvas');
        if (!hero || !canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0, height = 0, points = [], raf = 0, visible = true;
        const mouse = { x: -9999, y: -9999 };

        // Espectro de la marca (RGB). Un poco más saturado que en el CSS para que se lea sobre fondo claro.
        const SPECTRUM = [
            [240, 90, 62],   // coral
            [232, 150, 0],   // ámbar
            [124, 92, 252],  // violeta
            [20, 150, 214],  // cielo
            [130, 175, 20],  // lima
            [14, 168, 146]   // verde azulado
        ];
        const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = rect.width; height = rect.height;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const count = Math.round(clamp((width * height) / 17000, 26, 95));
            points = Array.from({ length: count }, (_, i) => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - .5) * .36,
                vy: (Math.random() - .5) * .36,
                r: Math.random() * 1.7 + 1,
                c: SPECTRUM[i % SPECTRUM.length]
            }));
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            const link = width < 700 ? 96 : 138;

            for (const p of points) {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                // El cursor aparta suavemente los nodos cercanos
                const dx = p.x - mouse.x, dy = p.y - mouse.y;
                const d = Math.hypot(dx, dy);
                if (d < 150 && d > 0) {
                    const force = (150 - d) / 150 * .7;
                    p.x += dx / d * force; p.y += dy / d * force;
                }
            }

            ctx.lineWidth = 1;
            for (let i = 0; i < points.length; i++) {
                const a = points[i];
                for (let j = i + 1; j < points.length; j++) {
                    const b = points[j];
                    const dx = a.x - b.x;
                    if (dx > link || dx < -link) continue;
                    const dy = a.y - b.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > link) continue;
                    // Cada conexión toma el color del nodo de origen
                    ctx.strokeStyle = rgba(a.c, ((1 - dist / link) * .38).toFixed(3));
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                }
                // Líneas desde el cursor hacia los nodos cercanos
                const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
                if (md < 180) {
                    ctx.strokeStyle = rgba(a.c, ((1 - md / 180) * .6).toFixed(3));
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
                }
            }

            for (const p of points) {
                ctx.fillStyle = rgba(p.c, .8);
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
            }
        };

        const loop = () => {
            if (!visible || document.hidden) { raf = 0; return; }
            draw();
            raf = requestAnimationFrame(loop);
        };
        const start = () => { if (!raf && !reduceMotion) raf = requestAnimationFrame(loop); };

        resize();
        if (reduceMotion) { draw(); } else { start(); }

        if (hasIO) {
            new IntersectionObserver(([entry]) => {
                visible = entry.isIntersecting;
                if (visible) start();
            }).observe(hero);
        }
        document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => { resize(); if (reduceMotion) draw(); }, 200);
        });

        if (finePointer) {
            let glowRaf = 0;
            hero.addEventListener('pointermove', (e) => {
                const rect = hero.getBoundingClientRect();
                mouse.x = e.clientX - canvas.getBoundingClientRect().left;
                mouse.y = e.clientY - canvas.getBoundingClientRect().top;
                if (glowRaf) return;
                glowRaf = requestAnimationFrame(() => {
                    hero.classList.add('has-pointer');
                    hero.style.setProperty('--gx', (e.clientX - rect.left) + 'px');
                    hero.style.setProperty('--gy', (e.clientY - rect.top) + 'px');
                    glowRaf = 0;
                });
            }, { passive: true });
            hero.addEventListener('pointerleave', () => {
                mouse.x = -9999; mouse.y = -9999;
                hero.classList.remove('has-pointer');
            });
        }
    }

    // Inclinación 3D del lente con el cursor
    function initHeroTilt() {
        const hero = $('.hero');
        const frame = $('.hv');
        const tilt = $('.hv-tilt');
        if (!hero || !frame || !tilt || !finePointer || reduceMotion) return;

        let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
        const loop = () => {
            cx += (tx - cx) * .08; cy += (ty - cy) * .08;
            tilt.style.setProperty('--ry', (cx * 9).toFixed(2) + 'deg');
            tilt.style.setProperty('--rx', (-cy * 9).toFixed(2) + 'deg');
            raf = (Math.abs(tx - cx) > .002 || Math.abs(ty - cy) > .002) ? requestAnimationFrame(loop) : 0;
        };
        hero.addEventListener('pointermove', (e) => {
            const rect = frame.getBoundingClientRect();
            tx = clamp(((e.clientX - rect.left) / rect.width - .5) * 2, -1.2, 1.2);
            ty = clamp(((e.clientY - rect.top) / rect.height - .5) * 2, -1.2, 1.2);
            if (!raf) raf = requestAnimationFrame(loop);
        }, { passive: true });
        hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
    }

    // Botones magnéticos (solo punteros finos)
    function initMagnetic() {
        if (!finePointer || reduceMotion) return;
        $$('[data-magnetic]').forEach((el) => {
            el.addEventListener('pointermove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = (e.clientX - (rect.left + rect.width / 2)) * .2;
                const y = (e.clientY - (rect.top + rect.height / 2)) * .28;
                el.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
            });
            el.addEventListener('pointerleave', () => { el.style.translate = ''; });
        });
    }

    // Foco de luz que sigue al cursor sobre las tarjetas de servicio
    function initSpotlight() {
        if (!finePointer) return;
        $$('[data-spot]').forEach((el) => {
            el.addEventListener('pointermove', (e) => {
                const rect = el.getBoundingClientRect();
                el.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
                el.style.setProperty('--my', (e.clientY - rect.top) + 'px');
            }, { passive: true });
        });
    }

    /* =================================================================
       7. INTERACCIONES: PESTAÑAS, FAQ, FORMULARIO, BOTÓN FLOTANTE
       ================================================================= */
    function initTabs() {
        const tabs = $$('[role="tab"]');
        const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
        if (!tabs.length) return;

        const select = (index, focus) => {
            tabs.forEach((tab, i) => {
                const on = i === index;
                tab.setAttribute('aria-selected', String(on));
                tab.tabIndex = on ? 0 : -1;
                if (panels[i]) {
                    panels[i].hidden = !on;
                    panels[i].classList.toggle('is-active', on);
                }
            });
            if (focus) tabs[index].focus();
        };

        tabs.forEach((tab, i) => {
            tab.addEventListener('click', () => select(i));
            tab.addEventListener('keydown', (e) => {
                const last = tabs.length - 1;
                const keys = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: last };
                if (!(e.key in keys)) return;
                e.preventDefault();
                const next = keys[e.key];
                select(next > last ? 0 : next < 0 ? last : next, true);
            });
        });
    }

    function initFAQ() {
        const questions = $$('.faq-q');
        questions.forEach((button) => {
            const answer = document.getElementById(button.getAttribute('aria-controls'));
            button.addEventListener('click', () => {
                const willOpen = button.getAttribute('aria-expanded') !== 'true';
                questions.forEach((other) => {
                    other.setAttribute('aria-expanded', 'false');
                    const otherAnswer = document.getElementById(other.getAttribute('aria-controls'));
                    if (otherAnswer) otherAnswer.classList.remove('is-open');
                });
                button.setAttribute('aria-expanded', String(willOpen));
                if (answer) answer.classList.toggle('is-open', willOpen);
            });
        });
    }

    function initForm() {
        const form = $('#quote-form');
        if (!form) return;

        const fields = {
            name: { input: $('#f-name'), error: $('#e-name') },
            service: { input: $('#f-service'), error: $('#e-service') }
        };
        const status = $('#form-status');
        const button = form.querySelector('button[type="submit"]');
        const buttonLabel = button.querySelector('span');
        const idleLabel = buttonLabel.textContent;

        Object.values(fields).forEach(({ input, error }) => {
            const clear = () => { input.removeAttribute('aria-invalid'); error.hidden = true; };
            input.addEventListener('input', clear);
            input.addEventListener('change', clear);
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            let firstInvalid = null;
            Object.values(fields).forEach(({ input, error }) => {
                const invalid = !input.value.trim();
                input.setAttribute('aria-invalid', String(invalid));
                error.hidden = !invalid;
                if (invalid && !firstInvalid) firstInvalid = input;
            });
            if (firstInvalid) { firstInvalid.focus(); status.textContent = ''; return; }

            const name = fields.name.input.value.trim();
            const service = fields.service.input.value;
            const phone = $('#f-phone').value.trim();
            const company = $('#f-company').value.trim();
            const message = $('#f-msg').value.trim();

            const lines = ['Hola, soy ' + name + (company ? ' de ' + company : '') + '.', 'Me interesa: ' + service + '.'];
            if (message) lines.push(message);
            if (phone) lines.push('Mi teléfono: ' + phone);
            lines.push('Vi su página y quisiera recibir una cotización.');
            const url = waURL(lines.join('\n'));

            button.disabled = true;
            buttonLabel.textContent = 'Abriendo WhatsApp…';

            const popup = window.open(url, '_blank');
            if (popup) popup.opener = null; else window.location.href = url;

            status.classList.add('is-ok');
            status.textContent = 'Listo. Abrimos WhatsApp con tu mensaje. ';
            const retry = document.createElement('a');
            retry.href = url; retry.target = '_blank'; retry.rel = 'noopener noreferrer';
            retry.textContent = 'Si no se abrió, haz clic aquí.';
            status.appendChild(retry);

            setTimeout(() => {
                form.reset();
                button.disabled = false;
                buttonLabel.textContent = idleLabel;
            }, 900);
        });
    }

    function initWhatsAppFloat() {
        const float = $('#wa-float');
        if (!float) return;
        setTimeout(() => {
            float.classList.add('is-visible');
            setTimeout(() => {
                float.classList.add('show-tip');
                setTimeout(() => float.classList.remove('show-tip'), 5000);
            }, 1200);
        }, 1400);
    }

    /* =================================================================
       8. SCROLL SUAVE Y MOVIMIENTO CON SCROLL
       ================================================================= */
    function initSmoothScroll() {
        if (reduceMotion || typeof window.Lenis === 'undefined') return null;

        const instance = new window.Lenis({
            duration: 1.25,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true
        });

        if (hasGSAP()) {
            window.gsap.registerPlugin(window.ScrollTrigger);
            instance.on('scroll', window.ScrollTrigger.update);
            window.gsap.ticker.add((time) => instance.raf(time * 1000));
            window.gsap.ticker.lagSmoothing(0);
        } else {
            const raf = (time) => { instance.raf(time); requestAnimationFrame(raf); };
            requestAnimationFrame(raf);
        }
        return instance;
    }

    function initScrollMotion() {
        if (reduceMotion || !hasGSAP()) return;
        const { gsap, ScrollTrigger } = window;
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.config({ ignoreMobileResize: true });

        // Barra de progreso de lectura
        gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });

        // Hero: el contenido se desplaza a distinta velocidad al salir
        gsap.to('.hero-visual', { yPercent: -9, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
        gsap.to('.hero-copy', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

        // Banda de marca: cada palabra se enciende al pasar
        gsap.utils.toArray('.band-word').forEach((word) => {
            gsap.fromTo(word, { opacity: 0.2, yPercent: 16 }, {
                opacity: 1, yPercent: 0, ease: 'none',
                scrollTrigger: { trigger: word, start: 'top 92%', end: 'top 58%', scrub: true }
            });
        });

        // Parallax de imágenes grandes
        [['.data-img', '.data-frame'], ['.adv-img', '.adv-frame']].forEach(([image, frame]) => {
            if (!$(image) || !$(frame)) return;
            gsap.fromTo(image, { yPercent: -6 }, {
                yPercent: 6, ease: 'none',
                scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true }
            });
        });

        // Metodología: scroll horizontal fijado (solo escritorio)
        const section = $('#metodologia');
        if (section) {
            const mm = gsap.matchMedia();
            mm.add('(min-width: 1024px)', () => {
                const pin = $('.process-pin', section);
                const track = $('.process-track', section);
                const bar = $('.process-progress span', section);
                section.classList.add('is-pinned');

                const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
                const tween = gsap.to(track, {
                    x: () => -distance(),
                    ease: 'none',
                    scrollTrigger: {
                        trigger: pin,
                        start: 'top top',
                        end: () => '+=' + distance(),
                        pin: true,
                        scrub: 0.6,
                        anticipatePin: 1,
                        invalidateOnRefresh: true,
                        onUpdate: (self) => { if (bar) bar.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')'; }
                    }
                });

                // Parallax horizontal de las fotos dentro de cada tarjeta
                $$('.p-card', section).forEach((card) => {
                    const image = $('.p-media img', card);
                    if (!image) return;
                    gsap.fromTo(image, { xPercent: 6 }, {
                        xPercent: -6, ease: 'none',
                        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
                    });
                });

                return () => { section.classList.remove('is-pinned'); };
            });
        }

        const refresh = () => ScrollTrigger.refresh();
        if (document.readyState === 'complete') refresh(); else window.addEventListener('load', refresh, { once: true });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    }

    /* =================================================================
       9. ARRANQUE
       ================================================================= */
    function boot() {
        safe('whatsapp', initWhatsAppLinks);
        safe('split', initSplitText);
        safe('tabs', initTabs);
        safe('faq', initFAQ);
        safe('form', initForm);
        safe('header', initHeader);
        safe('menu', initMenu);
        safe('anchors', initAnchors);

        const year = $('#year');
        if (year) year.textContent = String(new Date().getFullYear());

        runLoader().then(() => {
            safe('reveal', initReveal);
            safe('counters', initCounters);
            safe('network', initHeroNetwork);
            safe('tilt', initHeroTilt);
            safe('magnetic', initMagnetic);
            safe('spotlight', initSpotlight);
            safe('spy', initScrollSpy);
            safe('float', initWhatsAppFloat);
            lenis = safe('lenis', initSmoothScroll) || null;
            safe('scroll-motion', initScrollMotion);
        });
    }

    boot();
})();

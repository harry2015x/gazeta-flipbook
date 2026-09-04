'use client';

import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import styles from './page.module.css';

const pages = Array.from(
  { length: 16 },
  (_, i) => `/periodico/${String(i + 1).padStart(2, '0')}.jpg`
);

type PageFlipInstance = {
  flipNext: (
    corner?: 'top' | 'bottom' | 'bl' | 'br' | 'tl' | 'tr'
  ) => void;

  flipPrev: (
    corner?: 'top' | 'bottom' | 'bl' | 'br' | 'tl' | 'tr'
  ) => void;

  turnToPage: (page: number) => void;

  getCurrentPageIndex: () => number;
};

type BookRef = {
  pageFlip: () => PageFlipInstance;
};


/* =========================================================
   SONIDO DE PASO DE PAGINA
   ========================================================= */

function makePaperSound(ctx: AudioContext) {
  const duration = 0.22 + Math.random() * 0.12;

  const sampleRate = ctx.sampleRate;

  const buffer = ctx.createBuffer(
    1,
    Math.floor(sampleRate * duration),
    sampleRate
  );

  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;

    const attack = Math.min(1, t * 35);

    const decay = Math.pow(1 - t, 2.2);

    const texture =
      Math.random() * 2 -
      1 +
      Math.sin(t * 80) * 0.12 +
      Math.sin(t * 190) * 0.05;

    data[i] = texture * attack * decay * 0.045;
  }

  const source = ctx.createBufferSource();

  const filter = ctx.createBiquadFilter();

  const gain = ctx.createGain();

  filter.type = 'bandpass';

  filter.frequency.value =
    2500 + Math.random() * 900;

  filter.Q.value = 0.7;

  gain.gain.setValueAtTime(
    0.0001,
    ctx.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.55,
    ctx.currentTime + 0.015
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    ctx.currentTime + duration
  );

  source.buffer = buffer;

  source.connect(filter);

  filter.connect(gain);

  gain.connect(ctx.destination);

  source.start();
}


/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */

export default function Home() {
  const book = useRef<BookRef | null>(null);

  const audio = useRef<AudioContext | null>(null);

  const [page, setPage] = useState(1);

  const [sound, setSound] = useState(true);

  const [zoom, setZoom] = useState(1);

  const [thumbs, setThumbs] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  const [fullscreen, setFullscreen] = useState(false);


  /* Espejo de `sound` en un ref: así next/prev pueden vivir en
     un useCallback con dependencias vacías sin quedarse con un
     closure viejo del valor de sonido. */

  const soundRef = useRef(sound);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);


  /* Evita que se disparen varios flipNext/flipPrev mientras
     la animación anterior todavía está en curso: eso es lo que
     produce ese "salto" o tartamudeo al pulsar rápido. */

  const isFlipping = useRef(false);

  const onChangeState = useCallback((e: any) => {
    isFlipping.current = e?.data === 'flipping';
  }, []);


  /* =========================================================
     AUDIO
     ========================================================= */

  const startAudio = useCallback(() => {
    if (!audio.current) {
      audio.current = new AudioContext();
    }

    if (audio.current.state === 'suspended') {
      audio.current.resume();
    }
  }, []);


  const playPageSound = useCallback(() => {
    if (!soundRef.current) return;

    startAudio();

    if (audio.current) {
      makePaperSound(audio.current);
    }
  }, [startAudio]);


  /* =========================================================
     DETECTAR MOVIL
     ========================================================= */

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth <= 700);
    };

    checkScreen();

    window.addEventListener(
      'resize',
      checkScreen
    );

    return () => {
      window.removeEventListener(
        'resize',
        checkScreen
      );
    };
  }, []);


  /* =========================================================
     SIGUIENTE PAGINA
     ========================================================= */

  const next = useCallback(() => {
    if (isFlipping.current) return;

    startAudio();

    const flipbook = book.current?.pageFlip();

    flipbook?.flipNext();
  }, [startAudio]);


  /* =========================================================
     PAGINA ANTERIOR
     ========================================================= */

  const prev = useCallback(() => {
    if (isFlipping.current) return;

    startAudio();

    const flipbook = book.current?.pageFlip();

    flipbook?.flipPrev();
  }, [startAudio]);


  /* =========================================================
     IR A UNA PAGINA
     ========================================================= */

  const goToPage = useCallback(
    (index: number) => {
      startAudio();

      book.current?.pageFlip().turnToPage(index);

      setThumbs(false);
    },
    [startAudio]
  );


  /* =========================================================
     EVENTO FLIP
     ========================================================= */

  const onFlip = useCallback(
    (e: any) => {
      const index = Number(e?.data ?? 0);

      setPage(index + 1);

      playPageSound();
    },
    [playPageSound]
  );


  /* =========================================================
     TECLADO
     ========================================================= */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {

      // Ignora la repetición automática al mantener la tecla
      // presionada: si no, se encolan varios flips y la
      // animación se ve entrecortada en vez de fluida.
      if (e.repeat) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }

      if (e.key.toLowerCase() === 'm') {
        setSound((v) => !v);
      }

      if (e.key === 'Escape') {
        setThumbs(false);
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [next, prev]);


  /* =========================================================
     PANTALLA COMPLETA
     ========================================================= */

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(
        Boolean(document.fullscreenElement)
      );
    };

    document.addEventListener(
      'fullscreenchange',
      onFullscreenChange
    );

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        onFullscreenChange
      );
    };
  }, []);


  const toggleFullscreen = useCallback(async () => {
    try {

      if (!document.fullscreenElement) {

        await document.documentElement.requestFullscreen?.();

      } else {

        await document.exitFullscreen?.();

      }

    } catch {
      // El navegador puede bloquear fullscreen
      // en algunos contextos.
    }
  }, []);


  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);


  /* =========================================================
     INTERFAZ
     ========================================================= */

  return (
    <main
      className={styles.app}
      onPointerDown={startAudio}
    >

      {/* =====================================================
          BARRA SUPERIOR
          ===================================================== */}

      <header className={styles.topbar}>

        <div className={styles.brand}>

          <span className={styles.mark}>
            G
          </span>

          <div>

            <div className={styles.name}>
              GAZETA ABIERTA
            </div>

            <div className={styles.edition}>
              EDICIÓN 27 <b>•</b> AGOSTO 2025
            </div>

          </div>

        </div>


        <div className={styles.breadcrumb}>
          ARCHIVO <span>/</span> LECTURA INMERSIVA
        </div>


        <div className={styles.controls}>

          {/* Primera página */}

          <button
            title="Primera página"
            onClick={() => goToPage(0)}
          >
            ⟪
          </button>


          {/* Restablecer zoom */}

          <button
            title="Restablecer zoom"
            onClick={resetZoom}
          >
            ⌕
          </button>


          {/* Acercar */}

          <button
            title="Acercar"
            onClick={() =>
              setZoom((z) =>
                Math.min(1.35, z + 0.1)
              )
            }
          >
            ⊕
          </button>


          {/* Alejar */}

          <button
            title="Alejar"
            onClick={() =>
              setZoom((z) =>
                Math.max(0.8, z - 0.1)
              )
            }
          >
            ⊖
          </button>


          {/* Miniaturas */}

          <button
            title="Miniaturas"
            onClick={() =>
              setThumbs((v) => !v)
            }
          >
            ▦
          </button>


          {/* Pantalla completa */}

          <button
            title={
              fullscreen
                ? 'Salir de pantalla completa'
                : 'Pantalla completa'
            }
            onClick={toggleFullscreen}
          >
            ⛶
          </button>


          {/* Sonido */}

          <button
            title="Sonido"
            className={
              sound
                ? styles.soundOn
                : ''
            }
            onClick={() =>
              setSound((v) => !v)
            }
          >
            {sound ? '🔊' : '🔇'}
          </button>

        </div>

      </header>


      {/* =====================================================
          LECTOR
          ===================================================== */}

      <section className={styles.reader}>

        {/* Flecha izquierda */}

        <button
          className={`${styles.arrow} ${styles.left}`}
          onClick={prev}
          aria-label="Página anterior"
        >
          ‹
        </button>


        {/* ===================================================
            STAGE DEL LIBRO
            =================================================== */}

        <div
          className={styles.bookStage}
          style={{
            transform: `scale(${zoom})`,
          }}
        >

          {/* =================================================
              POSICIONAMIENTO DEL LIBRO
              ================================================= */}

          <div
            className={`${styles.bookWrap} ${
              page === 1
                ? styles.coverMode
                : page === pages.length
                ? styles.lastMode
                : styles.spreadMode
            }`}
          >

            {/* ===============================================
                FLIPBOOK

                El ancho/alto cambian según isMobile para que
                coincidan con los desplazamientos (140px / 180px)
                que usa el CSS en .coverMode/.lastMode: si el
                libro se dibuja a un tamaño y el CSS desplaza
                pensando en otro, la portada queda mal alineada
                al abrir/cerrar. La `key` fuerza un remount limpio
                al cruzar el breakpoint en vez de dejar que la
                librería intente mutar un tamaño ya inicializado.
                =============================================== */}

            <HTMLFlipBook
              key={isMobile ? 'mobile' : 'desktop'}

              ref={book as any}

              width={isMobile ? 280 : 360}

              height={isMobile ? 430 : 552}

              size="fixed"

              /* El tipo de react-pageflip exige estas cuatro
                 props aunque size="fixed" las ignore en tiempo
                 de ejecución; las igualamos a width/height para
                 que no describan un rango falso. */

              minWidth={isMobile ? 280 : 360}

              maxWidth={isMobile ? 280 : 360}

              minHeight={isMobile ? 430 : 552}

              maxHeight={isMobile ? 430 : 552}

              autoSize={false}

              showCover={true}

              mobileScrollSupport={true}

              useMouseEvents={true}

              drawShadow={true}

              maxShadowOpacity={0.6}

              flippingTime={700}

              onFlip={onFlip}

              onChangeState={onChangeState}

              className={styles.flipbook}

              style={{
                margin: '0 auto',
              }}

              startPage={page - 1}

              clickEventForward={true}

              usePortrait={false}

              swipeDistance={25}

              showPageCorners={true}

              disableFlipByClick={false}

              startZIndex={10}
            >

              {pages.map((src, i) => (

                <Paper
                  key={i}
                  src={src}
                  number={i + 1}
                />

              ))}

            </HTMLFlipBook>

          </div>

        </div>


        {/* Flecha derecha */}

        <button
          className={`${styles.arrow} ${styles.right}`}
          onClick={next}
          aria-label="Página siguiente"
        >
          ›
        </button>

      </section>


      {/* =====================================================
          PIE
          ===================================================== */}

      <footer className={styles.footer}>

        <div className={styles.progress}>

          <span
            style={{
              width: `${
                (page / pages.length) * 100
              }%`,
            }}
          />

        </div>


        <div className={styles.footerRow}>

          <span>
            PRIMERA
          </span>

          <strong>
            {String(page).padStart(2, '0')}
          </strong>

          <span>
            / {String(pages.length).padStart(2, '0')}
          </span>

          <span>
            ÚLTIMA
          </span>

          <em>
            •
          </em>

          <span>
            DESLIZA O USA ← →
          </span>

        </div>

      </footer>


      {/* =====================================================
          MINIATURAS
          ===================================================== */}

      {thumbs && (

        <aside className={styles.thumbs}>

          <div className={styles.thumbHead}>

            <span>
              PÁGINAS
            </span>

            <button
              onClick={() =>
                setThumbs(false)
              }
              aria-label="Cerrar miniaturas"
            >
              ×
            </button>

          </div>


          <div className={styles.thumbGrid}>

            {pages.map((src, i) => (

              <button
                key={i}
                className={
                  i === page - 1
                    ? styles.activeThumb
                    : ''
                }
                onClick={() =>
                  goToPage(i)
                }
              >

                <span>
                  {String(i + 1).padStart(2, '0')}
                </span>


                <img
                  src={src}
                  alt={`Miniatura página ${i + 1}`}
                  style={{
                    width: '100%',
                    height: '110px',
                    objectFit: 'cover',
                    display: 'block',
                    marginTop: '8px',
                  }}
                />

              </button>

            ))}

          </div>

        </aside>

      )}

    </main>
  );
}


/* =========================================================
   COMPONENTE DE PAGINA
   ========================================================= */

const Paper = forwardRef<HTMLElement, any>(
  function Paper(
    { src, number },
    ref
  ) {

    /*
      Página 1:
      portada → sin sombra de pliegue.

      Páginas pares:
      02, 04, 06... → lado izquierdo.

      Páginas impares:
      03, 05, 07... → lado derecho.

      Página 16:
      última → sin sombra de pliegue.
    */

    const pageClass =
      number > 1 &&
      number < pages.length
        ? number % 2 === 0
          ? styles.leftPage
          : styles.rightPage
        : '';

    return (

      <article
        ref={ref}

        className={`${styles.paper} ${pageClass}`}

        style={{
          padding: 0,
          background: '#fff',
        }}
      >

        <img
          src={src}
          alt={`Página ${number} del periódico`}

          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
          }}
        />

      </article>

    );
  }
);


Paper.displayName = 'Paper';

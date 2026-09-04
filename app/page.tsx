'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import styles from './page.module.css';

const pages = Array.from(
  { length: 16 },
  (_, i) => `/periodico/${String(i + 1).padStart(2, '0')}.jpg`
);

type PageFlipInstance = {
  flipNext: (corner?: 'top' | 'bottom' | 'bl' | 'br' | 'tl' | 'tr') => void;
  flipPrev: (corner?: 'top' | 'bottom' | 'bl' | 'br' | 'tl' | 'tr') => void;
  turnToPage: (page: number) => void;
  getCurrentPageIndex: () => number;
};

type BookRef = {
  pageFlip: () => PageFlipInstance;
};

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
  filter.frequency.value = 2500 + Math.random() * 900;
  filter.Q.value = 0.7;

  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.55, ctx.currentTime + 0.015);
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

export default function Home() {
  const book = useRef<BookRef | null>(null);
  const audio = useRef<AudioContext | null>(null);

  const [page, setPage] = useState(1);
  const [sound, setSound] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [thumbs, setThumbs] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const startAudio = () => {
    if (!audio.current) {
      audio.current = new AudioContext();
    }

    if (audio.current.state === 'suspended') {
      audio.current.resume();
    }
  };

  const playPageSound = () => {
    if (!sound) return;

    startAudio();

    if (audio.current) {
      makePaperSound(audio.current);
    }
  };

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth <= 700);
    };

    checkScreen();

    window.addEventListener('resize', checkScreen);

    return () => {
      window.removeEventListener('resize', checkScreen);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
  });

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
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

  const next = () => {
    startAudio();
  
    const flipbook = book.current?.pageFlip();
  
    if (flipbook) {
      console.log('Siguiente página');
      flipbook.flipNext();
    } else {
      console.log('Flipbook todavía no está disponible');
    }
  };
  
  const prev = () => {
    startAudio();
  
    const flipbook = book.current?.pageFlip();
  
    if (flipbook) {
      console.log('Página anterior');
      flipbook.flipPrev();
    } else {
      console.log('Flipbook todavía no está disponible');
    }
  };

  const goToPage = (index: number) => {
    startAudio();

    book.current?.pageFlip().turnToPage(index);

    setThumbs(false);
  };

  const onFlip = (e: any) => {
    const index = Number(e?.data ?? 0);

    setPage(index + 1);

    playPageSound();
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // El navegador puede bloquear fullscreen en algunos contextos.
    }
  };

  const resetZoom = () => {
    setZoom(1);
  };

  return (
    <main
      className={styles.app}
      onPointerDown={startAudio}
    >
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.mark}>G</span>

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
          <button
            title="Primera página"
            onClick={() => goToPage(0)}
          >
            ⟪
          </button>

          <button
            title="Restablecer zoom"
            onClick={resetZoom}
          >
            ⌕
          </button>

          <button
            title="Acercar"
            onClick={() =>
              setZoom((z) => Math.min(1.35, z + 0.1))
            }
          >
            ⊕
          </button>

          <button
            title="Alejar"
            onClick={() =>
              setZoom((z) => Math.max(0.8, z - 0.1))
            }
          >
            ⊖
          </button>

          <button
            title="Miniaturas"
            onClick={() => setThumbs((v) => !v)}
          >
            ▦
          </button>

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

          <button
            title="Sonido"
            className={sound ? styles.soundOn : ''}
            onClick={() => setSound((v) => !v)}
          >
            {sound ? '🔊' : '🔇'}
          </button>
        </div>
      </header>

      <section className={styles.reader}>
        <button
          className={`${styles.arrow} ${styles.left}`}
          onClick={prev}
          aria-label="Página anterior"
        >
          ‹
        </button>

        <div
          className={styles.bookStage}
          style={{
            transform: `scale(${zoom})`,
          }}
        >
   <div
  className={`${styles.bookWrap} ${
    page === 1 ? styles.coverMode : styles.spreadMode
  }`}
>
<HTMLFlipBook
  ref={book as any}
  width={360}
  height={552}
  size="fixed"
  minWidth={280}
  maxWidth={520}
  minHeight={395}
  maxHeight={735}
  showCover={true}
  mobileScrollSupport={true}
  useMouseEvents={true}
  drawShadow={true}
  maxShadowOpacity={0.75}
  flippingTime={850}
  onFlip={onFlip}
  className={styles.flipbook}
  style={{ margin: '0 auto' }}
  startPage={0}
  autoSize={true}
  clickEventForward={true}
  usePortrait={false}
  swipeDistance={25}
  showPageCorners={true}
  disableFlipByClick={false}
  startZIndex={10}
>
             {pages.map((src, i) => (
  <Paper key={i} src={src} number={i + 1} />
))}
            </HTMLFlipBook>
          </div>
        </div>

        <button
          className={`${styles.arrow} ${styles.right}`}
          onClick={next}
          aria-label="Página siguiente"
        >
          ›
        </button>
      </section>

      <footer className={styles.footer}>
        <div className={styles.progress}>
          <span
            style={{
              width: `${(page / pages.length) * 100}%`,
            }}
          />
        </div>

        <div className={styles.footerRow}>
          <span>PRIMERA</span>

          <strong>
            {String(page).padStart(2, '0')}
          </strong>

          <span>
            / {String(pages.length).padStart(2, '0')}
          </span>

          <span>ÚLTIMA</span>

          <em>•</em>

          <span>
            DESLIZA O USA ← →
          </span>
        </div>
      </footer>

      {thumbs && (
        <aside className={styles.thumbs}>
          <div className={styles.thumbHead}>
            <span>PÁGINAS</span>

            <button
              onClick={() => setThumbs(false)}
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
    onClick={() => goToPage(i)}
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
const Paper = forwardRef<HTMLElement, any>(function Paper(
  { src, number },
  ref
) {
  return (
    <article
      ref={ref}
      className={styles.paper}
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
});

Paper.displayName = 'Paper';
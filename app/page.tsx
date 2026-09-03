'use client';

import { useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import styles from './page.module.css';

const pages = [
  { type: 'cover', kicker: 'EDICIÓN ABIERTA', title: 'GAZETA\nABIERTA', subtitle: 'Noticias, cultura y ciudad', number: '01' },
  { type: 'news', section: 'CIUDAD', title: 'La ciudad vuelve a mirarse de frente', body: 'Una nueva conversación sobre lo que somos, lo que cambia y lo que todavía podemos construir juntos.', number: '02' },
  { type: 'feature', section: 'CULTURA', title: 'La memoria también se diseña', body: 'Historias, imágenes y voces que convierten una edición en un archivo vivo.', number: '03' },
  { type: 'news', section: 'ACTUALIDAD', title: 'Ideas que mueven la conversación', body: 'Un recorrido por los temas que están transformando la agenda local.', number: '04' },
  { type: 'photo', section: 'CRÓNICA', title: 'Donde empieza la mañana', body: 'Una mirada visual a las calles, sus personajes y sus pequeños rituales.', number: '05' },
  { type: 'news', section: 'TECNOLOGÍA', title: 'Lo digital ya no es una pantalla', body: 'Nuevas herramientas para contar, participar y entender el mundo.', number: '06' },
  { type: 'feature', section: 'OPINIÓN', title: 'Volver a leer despacio', body: 'En tiempos de desplazamiento infinito, una página también puede ser un lugar para quedarse.', number: '07' },
  { type: 'news', section: 'AGENDA', title: 'Lo que viene esta semana', body: 'Eventos, encuentros y recomendaciones para salir de la rutina.', number: '08' },
  { type: 'photo', section: 'CIUDAD', title: 'Una ciudad hecha de capas', body: 'Arquitectura, memoria y nuevos usos del espacio público.', number: '09' },
  { type: 'news', section: 'CIERRE', title: 'La última página no es el final', body: 'Una invitación a volver, compartir y seguir leyendo.', number: '10' }
];

type BookRef = { pageFlip: () => { flipNext: (corner?: 'top'|'bottom'|'bl'|'br'|'tl'|'tr') => void; flipPrev: (corner?: 'top'|'bottom'|'bl'|'br'|'tl'|'tr') => void; turnToPage: (page: number) => void; getCurrentPageIndex: () => number; } };

function makePaperSound(ctx: AudioContext) {
  const duration = 0.16 + Math.random() * 0.08;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    const envelope = Math.pow(1 - t, 2.5);
    data[i] = (Math.random() * 2 - 1) * envelope * (0.055 + 0.035 * Math.sin(t * 18));
  }
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  filter.type = 'bandpass';
  filter.frequency.value = 2100 + Math.random() * 1000;
  filter.Q.value = 0.8;
  gain.gain.value = 0.75;
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
}

export default function Home() {
  const book = useRef<BookRef | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const [page, setPage] = useState(1);
  const [sound, setSound] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [thumbs, setThumbs] = useState(false);

  const startAudio = () => {
    if (!audio.current) audio.current = new AudioContext();
    if (audio.current.state === 'suspended') audio.current.resume();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key.toLowerCase() === 'm') setSound(v => !v);
      if (e.key === 'Escape') setThumbs(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const next = () => { startAudio(); book.current?.pageFlip().flipNext(); };
  const prev = () => { startAudio(); book.current?.pageFlip().flipPrev(); };
  const onFlip = (e: any) => {
    setPage((e?.data ?? 0) + 1);
    if (sound && audio.current) makePaperSound(audio.current);
  };

  return (
    <main className={styles.app} onPointerDown={startAudio}>
      <header className={styles.topbar}>
        <div className={styles.brand}><span className={styles.mark}>G</span><div><div className={styles.name}>GAZETA ABIERTA</div><div className={styles.edition}>EDICIÓN 27 <b>•</b> AGOSTO 2025</div></div></div>
        <div className={styles.breadcrumb}>ARCHIVO <span>/</span> LECTURA INMERSIVA</div>
        <div className={styles.controls}>
          <button title="Primera página" onClick={() => { startAudio(); book.current?.pageFlip().turnToPage(0); }}>⟪</button>
          <button title="Buscar">⌕</button>
          <button title="Acercar" onClick={() => setZoom(z => Math.min(1.25, z + .1))}>⊕</button>
          <button title="Alejar" onClick={() => setZoom(z => Math.max(.8, z - .1))}>⊖</button>
          <button title="Miniaturas" onClick={() => setThumbs(v => !v)}>▦</button>
          <button title="Pantalla completa" onClick={() => document.documentElement.requestFullscreen?.()}>⛶</button>
          <button title="Sonido" className={sound ? styles.soundOn : ''} onClick={() => setSound(v => !v)}>{sound ? '🔊' : '🔇'}</button>
        </div>
      </header>

      <section className={styles.reader}>
        <button className={styles.arrow + ' ' + styles.left} onClick={prev}>‹</button>
        <div className={styles.bookWrap} style={{ transform: `scale(${zoom})` }}>
          <HTMLFlipBook
            ref={book as any}
            width={360}
            height={510}
            size="stretch"
            minWidth={280}
            maxWidth={520}
            minHeight={400}
            maxHeight={730}
            showCover={true}
            mobileScrollSupport={true}
            useMouseEvents={true}
            drawShadow={true}
            maxShadowOpacity={0.55}
            flippingTime={850}
            onFlip={onFlip}
            className={styles.flipbook}
            style={{ margin: '0 auto' }}
            startPage={0}
            startZIndex={0}
            autoSize={true}
            clickEventForward={true}
            usePortrait={true}
            swipeDistance={25}
            showPageCorners={true}
            disableFlipByClick={false}
          >
            {pages.map((p, i) => <Paper key={i} {...p} />)}
          </HTMLFlipBook>
        </div>
        <button className={styles.arrow + ' ' + styles.right} onClick={next}>›</button>
      </section>

      <footer className={styles.footer}>
        <div className={styles.progress}><span style={{ width: `${(page / pages.length) * 100}%` }} /></div>
        <div className={styles.footerRow}><span>PRIMERA</span><strong>{String(page).padStart(2,'0')}</strong><span>/ {String(pages.length).padStart(2,'0')}</span><span>ÚLTIMA</span><em>•</em><span>DESLIZA O USA ← →</span></div>
      </footer>

      {thumbs && <div className={styles.thumbs}><div className={styles.thumbHead}>PÁGINAS <button onClick={() => setThumbs(false)}>×</button></div><div className={styles.thumbGrid}>{pages.map((p,i)=><button key={i} className={i === page-1 ? styles.activeThumb : ''} onClick={() => { startAudio(); book.current?.pageFlip().turnToPage(i); setThumbs(false); }}><span>{String(i+1).padStart(2,'0')}</span><div>{p.title}</div></button>)}</div></div>}
    </main>
  );
}

function Paper(p: any) {
  return <article className={`${styles.paper} ${styles[p.type] || ''}`}>
    <div className={styles.paperTop}><span>GAZETA ABIERTA</span><span>EDICIÓN 27</span></div>
    {p.type === 'cover' ? <>
      <div className={styles.coverEyebrow}>{p.kicker}</div><h1>{p.title.split('\n').map((x:string,i:number)=><span key={i}>{x}</span>)}</h1><div className={styles.coverLine}/><p>{p.subtitle}</p><div className={styles.fakePhoto}><div className={styles.sun}/><div className={styles.city}/></div>
    </> : <>
      <div className={styles.section}>{p.section}</div><h2>{p.title}</h2><div className={styles.imageBlock}><span>{p.number}</span></div><p className={styles.body}>{p.body}</p><div className={styles.columns}><p>Una publicación pensada para leer con calma, descubrir detalles y volver sobre las historias.</p><p>Fotografía, datos y relatos se encuentran en una misma página para construir una mirada propia.</p></div>
    </>}
    <div className={styles.pageNo}>{p.number}</div>
  </article>;
}

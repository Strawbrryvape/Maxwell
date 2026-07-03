import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router';
import Lenis from 'lenis';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const frame = requestAnimationFrame(raf);

    // Mobile viewport height adjustment
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      window.removeEventListener('resize', setVh);
    };
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

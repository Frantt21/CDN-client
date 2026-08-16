import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { avatarUrl } from '../api';
import { useAuth } from '../auth/AuthContext';
import './CardNav.css';

function ArrowUpRightIcon() {
  return (
    <svg
      className="card-nav-link-icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

const CardNav = ({
  logo,
  logoAlt = 'Logo',
  brandText = 'CDN-backend',
  items,
  className = '',
  ease = 'power3.out',
  baseColor = '#151013',
  menuColor,
  buttonBgColor = '#49111C',
  buttonTextColor = '#F2F4F3',
  ctaLabel = 'Subir',
  ctaTo = '/upload',
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.userId, user?.avatarUrl]);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content');
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';

        // eslint-disable-next-line no-unused-expressions
        contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease
    });

    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = (i) => (el) => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div className={`card-nav-container ${className}`}>
      <nav ref={navRef} className={`card-nav ${isExpanded ? 'open' : ''}`} style={{ backgroundColor: baseColor }}>
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu();
              }
            }}
            role="button"
            aria-label={isExpanded ? t('nav.menuClose') : t('nav.menuOpen')}
            aria-expanded={isExpanded}
            tabIndex={0}
            style={{ color: menuColor || '#F2F4F3' }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <div className="logo-container">
            {logo ? (
              <img src={logo} alt={logoAlt} className="logo" />
            ) : (
              <button type="button" className="card-nav-brand" onClick={() => navigate('/')}>
                {brandText}
              </button>
            )}
          </div>

          <div className="card-nav-actions">
            <button
              type="button"
              className="card-nav-cta-button"
              style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
              onClick={() => navigate(ctaTo)}
            >
              {ctaLabel}
            </button>
            {user && (
              <Link
                className="card-nav-avatar"
                to={`/users/${user.username}`}
                aria-label={t('nav.profile')}
                title={user.nickname}
              >
                {user.avatarUrl && !avatarFailed ? (
                  <img
                    src={avatarUrl(user.userId)}
                    alt=""
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <span className="card-nav-avatar-initial">
                    {user.nickname[0]?.toUpperCase()}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) =>
                  lnk.to ? (
                    <Link
                      key={`${lnk.label}-${i}`}
                      className="nav-card-link"
                      to={lnk.to}
                      aria-label={lnk.ariaLabel}
                      onClick={toggleMenu}
                    >
                      <ArrowUpRightIcon />
                      {lnk.label}
                    </Link>
                  ) : (
                    <a
                      key={`${lnk.label}-${i}`}
                      className="nav-card-link"
                      href={lnk.href}
                      aria-label={lnk.ariaLabel}
                    >
                      <ArrowUpRightIcon />
                      {lnk.label}
                    </a>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;

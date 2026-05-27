document.addEventListener('DOMContentLoaded', () => {
  // 1. Mouse Tracking for Profile Tilt, Dynamic Glow, and Parallax Shapes
  const heroAvatar = document.querySelector('.hero-avatar');
  const cursorGlow = document.querySelector('.cursor-glow');
  const bgColorLayer = document.querySelector('.bg-color-layer');
  const sections = document.querySelectorAll('.section');
  const parallaxElements = document.querySelectorAll('.parallax-wrap');
  const navLinks = document.querySelectorAll('.nav-links a');

  // Cache/State variables to avoid layout thrashing in requestAnimationFrame
  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;
  let mouseX = windowWidth / 2;
  let mouseY = windowHeight / 2;
  let glowX = mouseX;
  let glowY = mouseY;
  let scrollY = window.pageYOffset || document.documentElement.scrollTop;

  // Cache section offsets and sizes
  let sectionOffsets = [];
  function cacheSectionOffsets() {
    sectionOffsets = [];
    sections.forEach((sec) => {
      sectionOffsets.push({
        top: sec.offsetTop,
        height: sec.offsetHeight
      });
    });
  }

  // Pre-parse speeds and link parent sections for logo/emoji parallax
  parallaxElements.forEach((el) => {
    el._speed = parseFloat(el.getAttribute('data-speed')) || 0.1;
    const parent = el.closest('.section');
    el._sectionIdx = Array.from(sections).indexOf(parent);
  });

  // Run initial cache population
  cacheSectionOffsets();

  // Re-cache offsets on window resize, along with viewport dimensions
  window.addEventListener('resize', () => {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    cacheSectionOffsets();
  });

  // Single unified render loop for all interactive coordinates (tilt, glow, scroll/mouse parallax)
  const isMobile = () => windowWidth <= 768;

  function updateVisuals() {
    // Desktop-only: avatar tilt + cursor glow (both cause paint jitter on touch devices)
    if (!isMobile()) {
      if (heroAvatar) {
        const rotateX = ((mouseY / windowHeight) - 0.5) * -30;
        const rotateY = ((mouseX / windowWidth) - 0.5) * 30;
        heroAvatar.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
      if (cursorGlow) {
        glowX += (mouseX - glowX) * 0.08;
        glowY += (mouseY - glowY) * 0.08;
        cursorGlow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;
      }
    }

    // Combined Scroll Parallax + Mouse Offset Parallax (desktop only, > 1024px)
    if (windowWidth > 1024) {
      parallaxElements.forEach((el) => {
        const speed = el._speed;
        let yScrollOffset = 0;
        const secInfo = sectionOffsets[el._sectionIdx];
        if (secInfo) {
          // Performance fix: skip DOM updates for elements in sections that are off-screen
          if (scrollY < secInfo.top - windowHeight - 200 || scrollY > secInfo.top + secInfo.height + 200) {
            return; 
          }
          const relativeScroll = scrollY - secInfo.top;
          yScrollOffset = relativeScroll * speed;
        } else {
          yScrollOffset = scrollY * speed;
        }
        const xMouseOffset = ((mouseX / windowWidth) - 0.5) * -40 * Math.abs(speed);
        const yMouseOffset = ((mouseY / windowHeight) - 0.5) * -40 * Math.abs(speed);
        el.style.transform = `translate3d(${xMouseOffset}px, ${yScrollOffset + yMouseOffset}px, 0)`;
      });
    }

    requestAnimationFrame(updateVisuals);
  }
  updateVisuals();

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  window.addEventListener('scroll', () => {
    scrollY = window.pageYOffset || document.documentElement.scrollTop;
  }, { passive: true });

  // 2. Scroll Reveal Animations (Intersection Observer)
  const reveals = document.querySelectorAll('.reveal');
  const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, revealOptions);

  reveals.forEach(reveal => {
    revealObserver.observe(reveal);
  });

  // 3. Smooth Scrolling for Navigation Links
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId.startsWith('#')) {
        e.preventDefault();
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // 4. Scroll-Based Theme Color Shifts (Darker premium versions)
  const sectionColors = {
    'hero': '#050810',      // Deeper Space Blue
    'about': '#090909',     // Deeper Charcoal Dark
    'services': '#050d10',  // Deeper Cyan
    'education': '#060a08', // Deep Forest Green-Black
    'projects': '#08050d',  // Deeper Purple
    'experience': '#0b0b0b',// Deeper Grey
    'contact': '#000000'    // Pure Black
  };

  const colorOptions = {
    threshold: 0.5 // Trigger when section is 50% visible
  };

  const colorObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        if (sectionColors[id]) {
          // Change color of fixed bg-color-layer rather than body to prevent layout redraws
          if (bgColorLayer) {
            bgColorLayer.style.backgroundColor = sectionColors[id];
          } else {
            document.body.style.backgroundColor = sectionColors[id];
          }
          
          // Update active nav link
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            }
          });
        }
      }
    });
  }, colorOptions);

  sections.forEach(section => {
    colorObserver.observe(section);
  });

  // 4b. Edu-card staggered entrance animation
  const eduSection = document.getElementById('education');
  if (eduSection) {
    const eduCards = Array.from(eduSection.querySelectorAll('.edu-card'));
    const eduObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          eduCards.forEach((card, i) => {
            setTimeout(() => {
              card.classList.add('edu-card--visible');
            }, i * 180);
          });
          eduObserver.disconnect();
        }
      });
    }, { threshold: 0.2 });
    eduObserver.observe(eduSection);
  }

  // 5. Card Deck Shuffle Controller
  const deck = document.querySelector('.project-deck');
  if (deck) {
    const cards = Array.from(deck.querySelectorAll('.project-card'));
    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const indicators = document.querySelectorAll('.deck-indicators .indicator');
    const N = cards.length;
    let activeIndex = 0;
    let isTransitioning = false;

    function lazyLoadIframes() {
      const mobile = isMobile();

      cards.forEach((card, i) => {
        const iframe = card.querySelector('iframe');
        if (!iframe) return;

        const pos = (i - activeIndex + N) % N;
        const dataSrc = iframe.getAttribute('data-src');

        // Determine if this card's iframe should be loaded/preloaded
        let shouldLoad = false;
        if (mobile) {
          // On mobile, preload only the active card (0) and the immediate next card (1) to keep it smooth
          shouldLoad = (pos === 0 || pos === 1);
        } else {
          // On PC/Desktop, preload active (0), next (1), and previous (N-1) cards
          // This keeps shuffling transitions forward and backward instant while releasing 25% CPU threads
          shouldLoad = (pos === 0 || pos === 1 || pos === N - 1);
        }

        if (shouldLoad) {
          // Load the source if it is not already loaded
          if (iframe.getAttribute('src') !== dataSrc && dataSrc) {
            iframe.setAttribute('src', dataSrc);
          }
        } else {
          // Unload background iframes to release memory & CPU threads
          if (iframe.getAttribute('src') !== 'about:blank') {
            iframe.setAttribute('src', 'about:blank');
          }
        }
      });
    }

    function updateDeck() {
      cards.forEach((card, i) => {
        // Calculate the stacked position relative to the activeIndex
        // 0 is active/top, N-1 is bottom/back
        const position = (i - activeIndex + N) % N;
        
        // If a card is currently playing a fly-out/in animation, we let the keyframes govern its transforms
        if (!card.classList.contains('shuffle-left') && 
            !card.classList.contains('shuffle-right') && 
            !card.classList.contains('shuffle-reverse')) {
          card.setAttribute('data-position', position);
        }
      });

      // Update active indicator dot
      indicators.forEach((indicator, idx) => {
        indicator.classList.toggle('active', idx === activeIndex);
      });

      // Only lazy load if not currently transitioning to avoid animation stutters
      if (!isTransitioning) {
        lazyLoadIframes();
      }
    }

    // Handle iframe updates when switching between mobile/desktop widths
    window.addEventListener('resize', lazyLoadIframes);

    function nextSlide() {
      if (isTransitioning) return;
      isTransitioning = true;

      const currentActiveCard = cards[activeIndex];
      currentActiveCard.classList.add('shuffle-left');

      // Update active index
      activeIndex = (activeIndex + 1) % N;
      
      // Update other cards immediately so they slide forward
      updateDeck();

      // Set the old active card to the bottom position immediately so it is in
      // the correct base state when the animation class is removed
      currentActiveCard.setAttribute('data-position', N - 1);

      // Clean up after animation finishes
      setTimeout(() => {
        currentActiveCard.classList.remove('shuffle-left');
        isTransitioning = false;
        lazyLoadIframes();
      }, 600); // matches the 0.6s CSS animation duration
    }

    function prevSlide() {
      if (isTransitioning) return;
      isTransitioning = true;

      // The card at the bottom of the stack (which is about to become active)
      // will fly in from behind and land on top
      const nextActiveIndex = (activeIndex - 1 + N) % N;
      const targetCard = cards[nextActiveIndex];

      // Add reverse shuffle animation to the card sliding in
      targetCard.classList.add('shuffle-reverse');
      
      // Set new active index
      activeIndex = nextActiveIndex;
      
      // Update other cards immediately so they slide back
      updateDeck();

      // Set the new active card to position 0 immediately so it is in
      // the correct base state when the animation class is removed
      targetCard.setAttribute('data-position', 0);

      setTimeout(() => {
        targetCard.classList.remove('shuffle-reverse');
        isTransitioning = false;
        lazyLoadIframes();
      }, 600);
    }

    // Direct click on indicators
    indicators.forEach((indicator) => {
      indicator.addEventListener('click', (e) => {
        if (isTransitioning) return;
        const targetIndex = parseInt(e.target.getAttribute('data-slide'), 10);
        if (targetIndex === activeIndex) return;

        // Shuffle until we reach the target index
        const diff = (targetIndex - activeIndex + N) % N;
        if (diff === 1) {
          nextSlide();
        } else if (diff === N - 1) {
          prevSlide();
        } else {
          // If jumping further, do a fast transition
          isTransitioning = true;
          activeIndex = targetIndex;
          updateDeck();
          // Force set position on all cards after a tiny delay
          setTimeout(() => {
            cards.forEach((c, idx) => {
              const pos = (idx - activeIndex + N) % N;
              c.setAttribute('data-position', pos);
            });
            isTransitioning = false;
            lazyLoadIframes();
          }, 300);
        }
      });
    });

    // Clicking background cards shuffles them to the front
    cards.forEach((card, index) => {
      card.addEventListener('click', (e) => {
        // If clicking inside the interactive launch button, do not shuffle
        if (e.target.closest('.card-action-btn')) return;

        const pos = parseInt(card.getAttribute('data-position'), 10);
        if (pos > 0 && !isTransitioning) {
          isTransitioning = true;
          activeIndex = index;
          updateDeck();
          
          setTimeout(() => {
            isTransitioning = false;
            lazyLoadIframes();
          }, 600);
        }
      });
    });

    // Event Listeners for Controls
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    // Auto Shuffle every 4 seconds - pauses when user is hovering the deck
    let autoShuffleInterval = setInterval(nextSlide, 4000);
    
    const container = document.querySelector('.project-deck-container');
    if (container) {
      let startX = 0;
      let currentX = 0;
      let isDragging = false;

      const handleDragStart = (e) => {
        if (e.target.closest('.card-action-btn') || e.target.closest('iframe')) return;
        isDragging = true;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        clearInterval(autoShuffleInterval);
      };

      const handleDragMove = (e) => {
        if (!isDragging) return;
        currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
      };

      const handleDragEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        const diffX = currentX - startX;
        
        if (Math.abs(diffX) > 50) {
          if (diffX > 0) prevSlide();
          else nextSlide();
        }
        clearInterval(autoShuffleInterval);
        autoShuffleInterval = setInterval(nextSlide, 4000);
      };

      container.addEventListener('touchstart', handleDragStart, { passive: true });
      container.addEventListener('touchmove', handleDragMove, { passive: true });
      container.addEventListener('touchend', handleDragEnd);

      container.addEventListener('mousedown', handleDragStart);
      container.addEventListener('mousemove', handleDragMove);
      container.addEventListener('mouseup', handleDragEnd);

      container.addEventListener('mouseenter', () => clearInterval(autoShuffleInterval));
      container.addEventListener('mouseleave', () => {
        if (isDragging) handleDragEnd();
        else autoShuffleInterval = setInterval(nextSlide, 4000);
      });
    }

    // Initialize positions
    updateDeck();
  }

  // 6. Preloader Screen Handler
  const handlePageLoad = () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('fade-out');
      document.body.classList.remove('loading');
    }
  };

  if (document.readyState === 'complete') {
    handlePageLoad();
  } else {
    window.addEventListener('load', handlePageLoad);
  }

});

// speech.js — 달누리반 디지털 놀이 아뜰리에 음성 엔진 및 data-say 바인딩
// 기술 제약: Speech를 그대로 재사용, 모든 새 화면에 읽어주기(data-say) 적용

(function(global) {
  'use strict';

  class SpeechEngine {
    constructor() {
      this.synth = (typeof window !== 'undefined' && 'speechSynthesis' in window) ? window.speechSynthesis : null;
      this.currentUtterance = null;
      this.audioPlayer = null;
    }

    say(text, onComplete) {
      if (!text || typeof text !== 'string') {
        if (onComplete) onComplete();
        return;
      }

      this.stop();

      // 브라우저 Web Speech TTS 활용 (부드러운 한국어 여성 음성 선호)
      if (this.synth) {
        try {
          const cleanText = text.replace(/[#*_`\[\]]/g, ' ').trim();
          const u = new SpeechSynthesisUtterance(cleanText);
          u.lang = 'ko-KR';
          u.rate = 0.95; // 유아 및 교실 환경에 맞는 안정적 낭독 속도
          u.pitch = 1.05;

          const voices = this.synth.getVoices ? this.synth.getVoices() : [];
          const koVoice = voices.find(v => v.lang.startsWith('ko') && (v.name.includes('Yuna') || v.name.includes('Heami') || v.name.includes('Google') || v.name.includes('Natural')));
          if (koVoice) u.voice = koVoice;

          u.onend = () => {
            this.currentUtterance = null;
            if (onComplete) onComplete();
          };
          u.onerror = (err) => {
            console.warn('Speech error fallback:', err);
            this.currentUtterance = null;
            if (onComplete) onComplete();
          };

          this.currentUtterance = u;
          this.synth.speak(u);
          return;
        } catch (e) {
          console.warn('SpeechSynthesis exception:', e);
        }
      }

      if (onComplete) onComplete();
    }

    stop() {
      if (this.synth) {
        try {
          this.synth.cancel();
        } catch (e) {}
      }
      this.currentUtterance = null;
    }

    // data-say 속성을 가진 요소를 찾아 터치/클릭/호버 시 읽어주기 등록
    bindDataSay(container) {
      if (!container) return;
      const elements = container.querySelectorAll('[data-say]');
      elements.forEach(el => {
        if (el.__hasDataSayBound) return;
        el.__hasDataSayBound = true;

        // 클릭 시 읽어주기
        el.addEventListener('click', (ev) => {
          // input이나 textarea 내부 클릭 시에는 방해하지 않음
          if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return;
          const msg = el.getAttribute('data-say');
          if (msg) {
            this.say(msg);
          }
        });

        // 스피커 아이콘 자동 부착 옵션 (클래스 say-icon이 있거나 명시된 경우)
        if (el.classList.contains('with-say-btn') && !el.querySelector('.mini-say-btn')) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'mini-say-btn';
          btn.setAttribute('aria-label', '소리 듣기');
          btn.innerHTML = '🔊';
          btn.onclick = (e) => {
            e.stopPropagation();
            this.say(el.getAttribute('data-say'));
          };
          el.appendChild(btn);
        }
      });
    }
  }

  const speechInstance = new SpeechEngine();
  global.Speech = speechInstance;

})(typeof window !== 'undefined' ? window : this);

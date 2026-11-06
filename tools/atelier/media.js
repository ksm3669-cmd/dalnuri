// media.js — 달누리반 디지털 놀이 아뜰리에 미디어 바구니 및 툴바
// 기술 제약: MediaBasket, mediaToolbar 재사용, 외부 라이브러리 금지

(function(global) {
  'use strict';

  class MediaBasketComponent {
    constructor(opts) {
      this.options = Object.assign({
        maxPhotos: 4,
        allowAudio: true,
        allowDrawing: true,
        onUpdate: () => {}
      }, opts);
      this.items = []; // { type: 'photo'|'voice'|'drawing', url, caption, createdAt }
    }

    addItem(item) {
      this.items.push(Object.assign({ id: 'm_' + Date.now(), createdAt: new Date().toISOString() }, item));
      this.options.onUpdate(this.items);
    }

    removeItem(id) {
      this.items = this.items.filter(it => it.id !== id);
      this.options.onUpdate(this.items);
    }

    render(container) {
      if (!container) return;
      container.innerHTML = `
        <div class="media-basket-wrap">
          <div class="media-basket-head">
            <span class="basket-badge">🧺 미디어 바구니</span>
            <span class="basket-count">${this.items.length}개 담김</span>
          </div>
          <div class="media-basket-grid">
            ${this.items.length === 0 ? '<div class="empty-basket">아직 담긴 미디어가 없어요.</div>' : ''}
            ${this.items.map(it => `
              <div class="media-item-card" data-id="${it.id}">
                ${it.type === 'photo' ? `<img src="${it.url}" alt="${it.caption || '사진'}">` : ''}
                ${it.type === 'voice' ? `<div class="voice-thumb">🎙️ 목소리 기록</div>` : ''}
                ${it.type === 'drawing' ? `<img src="${it.url}" alt="그림">` : ''}
                <div class="media-caption">${it.caption || ''}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  function renderMediaToolbar(container, handlers) {
    if (!container) return;
    container.innerHTML = `
      <div class="media-toolbar" role="toolbar" aria-label="기록 도구">
        <button type="button" class="tool-btn" data-action="photo" data-say="사진을 촬영하거나 골라요">
          <span class="tool-icon">📷</span>
          <span class="tool-label">사진</span>
        </button>
        <button type="button" class="tool-btn" data-action="voice" data-say="내 목소리로 이야기를 녹음해요">
          <span class="tool-icon">🎙️</span>
          <span class="tool-label">목소리</span>
        </button>
        <button type="button" class="tool-btn" data-action="drawing" data-say="손가락으로 그림을 그려요">
          <span class="tool-icon">🎨</span>
          <span class="tool-label">그림</span>
        </button>
        <button type="button" class="tool-btn" data-action="question" data-say="오늘 궁금한 질문을 남겨요">
          <span class="tool-icon">❓</span>
          <span class="tool-label">질문</span>
        </button>
      </div>
    `;

    container.querySelectorAll('.tool-btn').forEach(btn => {
      btn.onclick = () => {
        const action = btn.getAttribute('data-action');
        if (handlers && typeof handlers[action] === 'function') {
          handlers[action]();
        }
      };
    });

    if (global.Speech && typeof global.Speech.bindDataSay === 'function') {
      global.Speech.bindDataSay(container);
    }
  }

  global.MediaBasket = MediaBasketComponent;
  global.mediaToolbar = {
    render: renderMediaToolbar
  };

})(typeof window !== 'undefined' ? window : this);

// teacher.js — 달누리반 디지털 놀이 아뜰리에 교사 관리실
// A. 성장선 (Growth Line) 구현
// 요구사항: paneGrowth() 탭 추가 — 유아 선택 -> 시간축 SVG -> 점 선택 -> 좌우 비교
// 좌우 비교 화면: 그날의 사진 1장, 아이 문장 원문, 기분, 질문 표시
// "비교 기록으로 저장" -> appId: 'compare', work.payload = { leftId, rightId, note }

(function(global) {
  'use strict';

  // 주차별 가로축 좌표 매핑 (9월 1주 ~ 11월 4주)
  const TIMELINE_WEEKS = [
    { label: '9월 1주', key: '9월 1주', date: '2026-09-01' },
    { label: '9월 2주', key: '9월 2주', date: '2026-09-08' },
    { label: '9월 3주', key: '9월 3주', date: '2026-09-15' },
    { label: '9월 4주', key: '9월 4주', date: '2026-09-22' },
    { label: '10월 1주', key: '10월 1주', date: '2026-10-06' },
    { label: '10월 2주', key: '10월 2주', date: '2026-10-13' },
    { label: '10월 3주', key: '10월 3주', date: '2026-10-20' },
    { label: '10월 4주', key: '10월 4주', date: '2026-10-27' },
    { label: '11월 1주', key: '11월 1주', date: '2026-11-03' },
    { label: '11월 2주', key: '11월 2주', date: '2026-11-10' },
    { label: '11월 3주', key: '11월 3주', date: '2026-11-17' },
    { label: '11월 4주', key: '11월 4주', date: '2026-11-24' }
  ];

  class TeacherApp {
    constructor() {
      this.currentChildId = 'c1'; // 기본 선택: 자리프
      this.selectedLeftId = null;
      this.selectedRightId = null;
      this.unsubscribeStore = null;
    }

    init(container) {
      this.container = container;
      this.render();
    }

    render() {
      if (!this.container) return;
      this.container.innerHTML = `
        <div class="teacher-app-shell">
          <header class="teacher-header">
            <div class="header-left">
              <span class="role-badge">👩‍🏫 교사 관리실</span>
              <h1 class="header-title">달누리반 디지털 놀이 아뜰리에</h1>
            </div>
            <nav class="teacher-tabs" role="tablist">
              <button type="button" class="tab-btn active" data-tab="growth" data-say="성장선 탭을 엽니다">
                🌱 성장선 (Growth Line)
              </button>
              <button type="button" class="tab-btn" data-tab="works" data-say="작품 목록 탭을 엽니다">
                📁 전체 기록
              </button>
            </nav>
          </header>
          <main id="teacherTabContent" class="teacher-content"></main>
        </div>
      `;

      // 탭 전환 이벤트 바인딩
      const tabBtns = this.container.querySelectorAll('.tab-btn');
      tabBtns.forEach(btn => {
        btn.onclick = () => {
          tabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const tab = btn.getAttribute('data-tab');
          if (tab === 'growth') {
            this.paneGrowth(document.getElementById('teacherTabContent'));
          } else {
            this.paneWorks(document.getElementById('teacherTabContent'));
          }
        };
      });

      // 기본 탭 실행: paneGrowth()
      this.paneGrowth(document.getElementById('teacherTabContent'));

      if (global.Speech && typeof global.Speech.bindDataSay === 'function') {
        global.Speech.bindDataSay(this.container);
      }
    }

    // =========================================================================
    // A. 성장선 (Growth Line) 구현
    // =========================================================================
    paneGrowth(paneContainer) {
      if (!paneContainer) return () => {};

      // 이전 구독 해제
      if (this.unsubscribeStore) {
        this.unsubscribeStore();
        this.unsubscribeStore = null;
      }

      const store = global.Store;
      const children = store.getChildren();
      if (!this.currentChildId && children.length > 0) {
        this.currentChildId = children[0].id;
      }

      const renderView = () => {
        const child = store.getChild(this.currentChildId);
        const works = store.getWorks(this.currentChildId);

        // 기본 좌우 비교 선택 초기화: 첫 기록(9월)과 마지막 기록(11월)
        if (works.length >= 2) {
          if (!this.selectedLeftId || !works.some(w => w.id === this.selectedLeftId)) {
            this.selectedLeftId = works[0].id;
          }
          if (!this.selectedRightId || !works.some(w => w.id === this.selectedRightId) || this.selectedRightId === this.selectedLeftId) {
            this.selectedRightId = works[works.length - 1].id;
          }
        } else if (works.length === 1) {
          this.selectedLeftId = works[0].id;
          this.selectedRightId = works[0].id;
        } else {
          this.selectedLeftId = null;
          this.selectedRightId = null;
        }

        const leftWork = store.getWork(this.selectedLeftId);
        const rightWork = store.getWork(this.selectedRightId);

        paneContainer.innerHTML = `
          <div class="pane-growth-wrapper">
            <!-- 1. 유아 선택 바 -->
            <section class="growth-section child-selector-bar">
              <div class="section-label-row">
                <span class="sub-label">👧🧒 달누리반 유아 선택</span>
                <span class="tip-pill" data-say="아이를 선택하면 시간순 성장선을 볼 수 있습니다">아이의 변화가 시간순으로 한 줄에 이어집니다</span>
              </div>
              <div class="child-chips-scroll">
                ${children.map(c => `
                  <button type="button" class="child-chip ${c.id === this.currentChildId ? 'selected' : ''}" 
                          data-child-id="${c.id}" 
                          data-say="${c.name} 어린이의 성장선을 봅니다">
                    <span class="chip-avatar">${c.avatar}</span>
                    <span class="chip-name">${c.name}</span>
                  </button>
                `).join('')}
              </div>
            </section>

            <!-- 2. 시간축 SVG 성장선 영역 -->
            <section class="growth-section timeline-card">
              <div class="timeline-header">
                <div class="title-wrap">
                  <h2 class="timeline-title">
                    <span class="highlight-name">${child ? child.name : ''}</span>의 시간축 성장선
                  </h2>
                  <p class="timeline-desc">
                    가로축은 9월부터 11월까지 주 단위 시간이며, 각 점은 아이의 작품입니다. 점을 눌러 비교할 시점을 정하세요.
                  </p>
                </div>
                <div class="timeline-legend">
                  <span class="legend-item"><span class="dot-sample dot-regular"></span> 일반 활동</span>
                  <span class="legend-item"><span class="dot-sample dot-compare"></span> 🌟 비교 기록</span>
                  <span class="legend-item"><span class="dot-sample dot-selected-l"></span> 왼쪽 선택</span>
                  <span class="legend-item"><span class="dot-sample dot-selected-r"></span> 오른쪽 선택</span>
                </div>
              </div>

              <!-- 순수 SVG 직접 그리기 (외부 차트 라이브러리 일절 배제) -->
              <div class="svg-timeline-container">
                ${this.renderTimelineSVG(works)}
              </div>
            </section>

            <!-- 3. 두 시점 좌우 비교 (Side-by-Side Comparison) — 핵심 기능! -->
            <section class="growth-section compare-section">
              <div class="compare-header">
                <div>
                  <h3 class="compare-title">⚖️ 두 시점 좌우 나란히 비교하기</h3>
                  <p class="compare-sub">과거와 현재의 원문 문장, 기분, 질문을 나란히 놓아 성장의 변화를 눈으로 확인합니다.</p>
                </div>
                <div class="compare-action-slot">
                  <button type="button" id="saveCompareBtn" class="btn-primary-action" data-say="두 작품의 비교 기록을 한 장으로 저장합니다">
                    🌟 이 둘을 비교 기록으로 저장
                  </button>
                </div>
              </div>

              <div class="compare-grid">
                <!-- 왼쪽 시점 (과거 / 이전) -->
                <div class="compare-col left-col">
                  <div class="col-header">
                    <span class="col-tag tag-left">시점 1 (이전 기록)</span>
                    <span class="col-date">${leftWork ? leftWork.date + ' (' + leftWork.week + ')' : '선택 없음'}</span>
                  </div>
                  ${this.renderWorkCard(leftWork, 'left')}
                </div>

                <!-- 비교 전환 및 요약 브릿지 -->
                <div class="compare-bridge">
                  <div class="bridge-arrow">➔</div>
                  <div class="bridge-badge">성장 증거</div>
                  <div class="bridge-caption">원문 문장과 호기심의 변화</div>
                </div>

                <!-- 오른쪽 시점 (현재 / 최근) -->
                <div class="compare-col right-col">
                  <div class="col-header">
                    <span class="col-tag tag-right">시점 2 (최근 기록)</span>
                    <span class="col-date">${rightWork ? rightWork.date + ' (' + rightWork.week + ')' : '선택 없음'}</span>
                  </div>
                  ${this.renderWorkCard(rightWork, 'right')}
                </div>
              </div>

              <!-- 교사용 관찰 메모 입력란 -->
              <div class="teacher-note-panel">
                <label for="compareNoteInput" class="note-label">📝 교사 관찰 단서 및 맥락 기록 (선택 사항)</label>
                <textarea id="compareNoteInput" class="note-textarea" rows="2" 
                          placeholder="예: 숲속 나뭇잎 탐색에서 세계 여러 나라의 음식 문화 원인 탐구로 질문이 심화되고 문장 길이가 확장됨."></textarea>
              </div>
            </section>
          </div>
        `;

        // 유아 칩 클릭 이벤트
        paneContainer.querySelectorAll('.child-chip').forEach(btn => {
          btn.onclick = () => {
            this.currentChildId = btn.getAttribute('data-child-id');
            this.selectedLeftId = null;
            this.selectedRightId = null;
            renderView();
          };
        });

        // 타임라인 SVG 점 클릭 이벤트
        paneContainer.querySelectorAll('.timeline-node').forEach(node => {
          node.onclick = () => {
            const workId = node.getAttribute('data-work-id');
            // 점 클릭 시: 좌측 슬롯이 비었으면 좌측, 아니면 우측으로 순환 선택
            if (this.selectedLeftId === workId) {
              // 이미 좌측이면 우측 선택 해제 또는 토글
            } else if (this.selectedRightId === workId) {
              this.selectedRightId = null;
            } else if (!this.selectedLeftId) {
              this.selectedLeftId = workId;
            } else {
              this.selectedRightId = workId;
            }
            renderView();
          };
        });

        // 비교 카드 내 [왼쪽으로 설정] / [오른쪽으로 설정] 버튼
        paneContainer.querySelectorAll('.btn-set-slot').forEach(btn => {
          btn.onclick = () => {
            const slot = btn.getAttribute('data-slot');
            const wid = btn.getAttribute('data-work-id');
            if (slot === 'left') this.selectedLeftId = wid;
            if (slot === 'right') this.selectedRightId = wid;
            renderView();
          };
        });

        // "비교 기록으로 저장" 클릭
        const saveBtn = paneContainer.querySelector('#saveCompareBtn');
        if (saveBtn) {
          saveBtn.onclick = () => {
            if (!leftWork || !rightWork) {
              alert('비교할 두 시점의 작품을 먼저 선택해 주세요.');
              return;
            }
            if (leftWork.id === rightWork.id) {
              alert('서로 다른 두 시점의 작품을 선택해야 성장의 변화를 비교할 수 있습니다.');
              return;
            }

            const noteInput = paneContainer.querySelector('#compareNoteInput');
            const noteText = noteInput ? noteInput.value.trim() : '';

            // 프롬프트 기술 명세에 따른 저장 구조:
            // work.appId = 'compare', work.payload = { leftId, rightId, note }
            const compareWork = {
              childId: this.currentChildId,
              date: new Date().toISOString().split('T')[0],
              week: rightWork.week || '11월',
              appId: 'compare',
              appName: '성장 비교 카드',
              title: `${leftWork.week} vs ${rightWork.week} 성장 기록`,
              sentence: `[${leftWork.week}] "${leftWork.sentence}" ➔ [${rightWork.week}] "${rightWork.sentence}"`,
              mood: rightWork.mood || '🌟 빛나요',
              question: `지난 질문: "${leftWork.question}" ➔ 새 질문: "${rightWork.question}"`,
              photo: rightWork.photo || leftWork.photo,
              photoCaption: `${leftWork.title} & ${rightWork.title} 나란히 보기`,
              mediaStats: { photos: 2, voice: 1, drawing: 1 },
              payload: {
                leftId: leftWork.id,
                rightId: rightWork.id,
                leftTitle: leftWork.title,
                rightTitle: rightWork.title,
                leftDate: leftWork.date,
                rightDate: rightWork.date,
                note: noteText || '두 시점의 탐구 질문과 문장 표현 변화를 연결하여 비교 기록으로 생성함'
              }
            };

            const created = store.addWork(compareWork);
            this.selectedRightId = created.id; // 새로 만들어진 비교 카드를 활성화
            alert(`🌟 [${child ? child.name : ''}] 어린이의 성장 비교 카드가 저장되어 포트폴리오에 등록되었습니다!`);
            renderView();
          };
        }

        if (global.Speech && typeof global.Speech.bindDataSay === 'function') {
          global.Speech.bindDataSay(paneContainer);
        }
      };

      // 스토어 변경 구독
      this.unsubscribeStore = store.subscribe(() => {
        renderView();
      });

      renderView();

      // 화면을 떠날 때 해제할 cleanup 함수 반환
      return () => {
        if (this.unsubscribeStore) {
          this.unsubscribeStore();
          this.unsubscribeStore = null;
        }
      };
    }

    // 시간축 SVG 렌더러 (순수 SVG, 외부 라이브러리 없음)
    renderTimelineSVG(works) {
      const svgW = 1000;
      const svgH = 220;
      const padX = 60;
      const stepX = (svgW - padX * 2) / (TIMELINE_WEEKS.length - 1);
      const axisY = 120;

      // 주차별 X좌표 계산
      const getXByWeek = (weekStr, dateStr) => {
        const idx = TIMELINE_WEEKS.findIndex(w => w.key === weekStr || w.label === weekStr);
        if (idx !== -1) return padX + idx * stepX;
        // 날짜 파싱 fallback
        if (dateStr) {
          const d = new Date(dateStr);
          const start = new Date('2026-09-01').getTime();
          const end = new Date('2026-11-30').getTime();
          const ratio = Math.max(0, Math.min(1, (d.getTime() - start) / (end - start)));
          return padX + ratio * (svgW - padX * 2);
        }
        return padX;
      };

      // 작품들을 시간순으로 배치하고 X, Y 좌표 지정
      const points = works.map((w, i) => {
        const x = getXByWeek(w.week, w.date);
        // 점들이 살짝 물결치듯 자연스러운 높낮이를 갖게 함
        const yOffset = (i % 2 === 0) ? -24 : 24;
        const y = w.appId === 'compare' ? axisY - 45 : axisY + yOffset;
        return { work: w, x, y };
      });

      // 점들을 잇는 스플라인 경로(곡선) 생성
      let pathD = '';
      if (points.length > 0) {
        pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          const mx = (prev.x + curr.x) / 2;
          pathD += ` C ${mx} ${prev.y}, ${mx} ${curr.y}, ${curr.x} ${curr.y}`;
        }
      }

      return `
        <svg viewBox="0 0 ${svgW} ${svgH}" class="growth-line-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#C9974A" stop-opacity="0.6"/>
              <stop offset="50%" stop-color="#E8672A" stop-opacity="0.9"/>
              <stop offset="100%" stop-color="#4F8A3A" stop-opacity="0.8"/>
            </linearGradient>
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>

          <!-- 1. 배경 그리드 및 주차별 세로 점선 -->
          ${TIMELINE_WEEKS.map((tw, idx) => {
            const x = padX + idx * stepX;
            return `
              <g class="svg-week-tick">
                <line x1="${x}" y1="20" x2="${x}" y2="${axisY + 60}" stroke="#E7E2F0" stroke-width="1.5" stroke-dasharray="3,4" />
                <text x="${x}" y="${axisY + 78}" text-anchor="middle" font-size="11.5" fill="#7A5A44" font-weight="600">${tw.label}</text>
              </g>
            `;
          }).join('')}

          <!-- 2. 중앙 메인 시간축 가로선 -->
          <line x1="${padX - 20}" y1="${axisY}" x2="${svgW - padX + 20}" y2="${axisY}" stroke="#D1C7BD" stroke-width="2.5" stroke-linecap="round"/>

          <!-- 3. 성장 연결선 곡선 -->
          ${points.length > 1 ? `<path d="${pathD}" fill="none" stroke="url(#lineGrad)" stroke-width="3.5" stroke-linecap="round" />` : ''}

          <!-- 4. 각 작품 노드(점) 렌더링 -->
          ${points.map(pt => {
            const w = pt.work;
            const isLeft = (w.id === this.selectedLeftId);
            const isRight = (w.id === this.selectedRightId);
            const isCompare = (w.appId === 'compare');

            let fill = '#FFFFFF';
            let stroke = '#E8672A';
            let r = 16;
            if (isCompare) {
              fill = '#FFF3DE';
              stroke = '#C9974A';
              r = 20;
            }
            if (isLeft) stroke = '#1B6B93';
            if (isRight) stroke = '#D8352A';

            return `
              <g class="timeline-node ${isLeft ? 'node-selected-left' : ''} ${isRight ? 'node-selected-right' : ''} ${isCompare ? 'node-compare' : ''}" 
                 data-work-id="${w.id}" 
                 transform="translate(${pt.x}, ${pt.y})" 
                 cursor="pointer"
                 data-say="${w.week}의 작품: ${w.title}. 아이가 말한 문장: ${w.sentence}">
                <!-- 선택 시 외부 링 강조 -->
                ${(isLeft || isRight) ? `<circle r="${r + 7}" fill="none" stroke="${isLeft ? '#1B6B93' : '#D8352A'}" stroke-width="2.5" opacity="0.5" filter="url(#glowEffect)" />` : ''}
                <!-- 본체 원 -->
                <circle r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${isLeft || isRight || isCompare ? 3.5 : 2.5}" />
                <!-- 노드 내부 아이콘 -->
                <text y="4.5" text-anchor="middle" font-size="${isCompare ? '14' : '11'}" fill="#3A2418" font-weight="700">
                  ${isCompare ? '🌟' : (w.appId === '1' ? '📖' : (w.appId === '2' ? '🎨' : '🍜'))}
                </text>
                <!-- 상단 날짜 및 제목 미니 라벨 -->
                <rect x="-45" y="-34" width="90" height="18" rx="9" fill="rgba(255,255,255,0.92)" stroke="${stroke}" stroke-width="1"/>
                <text x="0" y="-21" text-anchor="middle" font-size="9.5" font-weight="700" fill="#2E2B3D">
                  ${isLeft ? '👈 좌측 ' : ''}${isRight ? '👉 우측 ' : ''}${w.week}
                </text>
              </g>
            `;
          }).join('')}
        </svg>
      `;
    }

    // 비교 카드 개별 뷰 렌더러
    renderWorkCard(work, slot) {
      if (!work) {
        return `
          <div class="empty-work-slot">
            <div class="slot-icon">🔍</div>
            <p>위 타임라인에서 작품 점을 터치하여<br>비교할 시점을 지정하세요.</p>
          </div>
        `;
      }

      const isCompareCard = (work.appId === 'compare');

      return `
        <div class="work-detail-card ${isCompareCard ? 'is-compare-card' : ''}">
          <div class="card-top-row">
            <span class="app-tag-pill">${work.appName || '놀이 탐구'}</span>
            <h4 class="card-work-title">${work.title}</h4>
            <div class="slot-switch-btns">
              <button type="button" class="btn-slot-switch ${slot === 'left' ? 'active-slot' : ''}" 
                      data-slot="left" data-work-id="${work.id}" title="왼쪽 시점으로 지정">
                👈 좌
              </button>
              <button type="button" class="btn-slot-switch ${slot === 'right' ? 'active-slot' : ''}" 
                      data-slot="right" data-work-id="${work.id}" title="오른쪽 시점으로 지정">
                우 👉
              </button>
            </div>
          </div>

          <!-- 1. 그날의 사진 1장 -->
          <div class="card-photo-box">
            <img src="${work.photo}" alt="${work.photoCaption || work.title}" class="work-image" 
                 onerror="this.src='../assets/달누리반_나만의_세계음식도감_표지.png';">
            <div class="photo-caption-tag">${work.photoCaption || '교실 놀이 기록 사진'}</div>
          </div>

          <!-- 2. 그날 아이가 말한 문장 (원문 그대로) -->
          <div class="sentence-speech-bubble" data-say="아이의 문장: ${work.sentence}">
            <div class="bubble-speaker">
              <span class="bubble-icon">💬</span>
              <span class="bubble-title">그날 아이가 말한 문장 (원문 그대로)</span>
              <button type="button" class="btn-bubble-listen" onclick="Speech.say('${work.sentence.replace(/'/g, "\\'")}')">🔊 듣기</button>
            </div>
            <p class="sentence-text">"${work.sentence}"</p>
          </div>

          <!-- 3. 그날의 기분과 질문 -->
          <div class="mood-question-grid">
            <div class="fact-box mood-box" data-say="기분: ${work.mood}">
              <span class="fact-label">😊 그날의 기분</span>
              <span class="fact-value">${work.mood || '신나요'}</span>
            </div>
            <div class="fact-box question-box" data-say="남긴 질문: ${work.question}">
              <span class="fact-label">❓ 그날 남긴 질문</span>
              <p class="question-value">"${work.question || '질문 없음'}"</p>
            </div>
          </div>

          ${isCompareCard && work.payload && work.payload.note ? `
            <div class="compare-note-view">
              <span class="note-tag">📋 저장된 교사 관찰 메모</span>
              <p class="note-content">${work.payload.note}</p>
            </div>
          ` : ''}
        </div>
      `;
    }

    // 전체 기록 열람 탭
    paneWorks(paneContainer) {
      if (!paneContainer) return;
      const store = global.Store;
      const works = store.getWorks(this.currentChildId);
      const child = store.getChild(this.currentChildId);

      paneContainer.innerHTML = `
        <div class="pane-works-wrapper">
          <div class="works-header">
            <h3>📂 [${child ? child.name : ''}] 어린이의 전체 기록 (${works.length}건)</h3>
            <p>아이의 모든 놀이 작품과 성장 비교 카드가 영구 보관됩니다.</p>
          </div>
          <div class="works-list-grid">
            ${works.map(w => `
              <div class="work-summary-card">
                <img src="${w.photo}" alt="" class="summary-thumb" onerror="this.src='../assets/consistent_slide_1.png';">
                <div class="summary-body">
                  <span class="summary-week">${w.week} · ${w.date}</span>
                  <h4 class="summary-title">${w.title}</h4>
                  <p class="summary-sentence">"${w.sentence}"</p>
                  <div class="summary-meta">
                    <span>${w.mood}</span>
                    <span>❓ ${w.question}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      if (global.Speech && typeof global.Speech.bindDataSay === 'function') {
        global.Speech.bindDataSay(paneContainer);
      }
    }
  }

  const teacherInstance = new TeacherApp();
  global.Teacher = teacherInstance;

})(typeof window !== 'undefined' ? window : this);

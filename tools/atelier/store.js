// store.js — 달누리반 디지털 놀이 아뜰리에 데이터 스토어
// 기술 제약: Store를 그대로 재사용, 앱별 데이터는 work.payload에만 저장, 상태 구독(subscribe) 및 해제 지원

(function(global) {
  'use strict';

  const STORAGE_KEY_WORKS = 'dalnuri_atelier_works_v1';
  const STORAGE_KEY_CHILDREN = 'dalnuri_atelier_children_v1';

  // 달누리반 14명 유아 명부
  const DEFAULT_CHILDREN = [
    { id: 'c1', name: '자리프', avatar: '👦', group: '달누리반', color: '#4F8A3A' },
    { id: 'c2', name: '정윤우', avatar: '🧒', group: '달누리반', color: '#2B2A4C' },
    { id: 'c3', name: '이은우', avatar: '👧', group: '달누리반', color: '#E8672A' },
    { id: 'c4', name: '이누리', avatar: '👧', group: '달누리반', color: '#C9974A' },
    { id: 'c5', name: '박찬영', avatar: '👦', group: '달누리반', color: '#3A2418' },
    { id: 'c6', name: '강도윤', avatar: '👦', group: '달누리반', color: '#1B6B93' },
    { id: 'c7', name: '김하늘', avatar: '👧', group: '달누리반', color: '#7A5A44' },
    { id: 'c8', name: '이지아', avatar: '👧', group: '달누리반', color: '#D8352A' },
    { id: 'c9', name: '최민준', avatar: '👦', group: '달누리반', color: '#5B4B8A' },
    { id: 'c10', name: '송유진', avatar: '👧', group: '달누리반', color: '#4E9F3D' },
    { id: 'c11', name: '장지혁', avatar: '👦', group: '달누리반', color: '#D35400' },
    { id: 'c12', name: '이미영', avatar: '👧', group: '달누리반', color: '#16A085' },
    { id: 'c13', name: '서아인', avatar: '👧', group: '달누리반', color: '#8E44AD' },
    { id: 'c14', name: '백승우', avatar: '👦', group: '달누리반', color: '#2C3E50' }
  ];

  // 9월부터 11월까지의 시간순 초기 시드 작품 데이터
  // 프롬프트 핵심 전제: 9월 "재밌었어요" -> 11월 "왜 저렇게 되는지 궁금해요"의 변화가 확연히 보이도록 구성
  const DEFAULT_WORKS = [
    {
      id: 'work_c1_01',
      childId: 'c1',
      date: '2026-09-08',
      week: '9월 2주',
      appId: '1',
      appName: '가을 숲 관찰',
      title: '빨간 나뭇잎 주운 날',
      sentence: '재밌었어요. 잎이 빨갛게 변해요.',
      mood: '😊 신나요',
      question: '왜 나뭇잎 색깔이 달라져요?',
      photo: '../assets/watercolor_finished_dish.png',
      photoCaption: '숲에서 주운 단풍잎과 열매',
      mediaStats: { photos: 1, voice: 1, drawing: 0 },
      payload: { category: 'nature_exploration', toolUsed: 'camera' }
    },
    {
      id: 'work_c1_02',
      childId: 'c1',
      date: '2026-09-22',
      week: '9월 4주',
      appId: '2',
      appName: '가을 흙 미술놀이',
      title: '찰흙으로 빚은 도토리 둥지',
      sentence: '도토리 친구들이 추울까 봐 지붕을 만들어 주었어요.',
      mood: '🥰 따뜻해요',
      question: '다람쥐는 도토리를 어디에 숨길까요?',
      photo: '../assets/art_clay_paperplate_scene.png',
      photoCaption: '종이접시와 찰흙으로 꾸민 도토리 보금자리',
      mediaStats: { photos: 1, voice: 1, drawing: 1 },
      payload: { material: 'clay', toolUsed: 'drawing_pad' }
    },
    {
      id: 'work_c1_03',
      childId: 'c1',
      date: '2026-10-13',
      week: '10월 2주',
      appId: '3',
      appName: '키오스크 식당놀이',
      title: '가을 열매 식당 주문표',
      sentence: '친구들이 도토리 빵을 많이 주문해서 냠냠코인을 열 개 모았어요.',
      mood: '🥳 자랑스러워요',
      question: '가게를 더 크게 만들려면 어떻게 해요?',
      photo: '../assets/kiosk_roleplay_restaurant_scene.png',
      photoCaption: '화면에서 주문하고 영수증을 뽑는 식당놀이',
      mediaStats: { photos: 1, voice: 1, drawing: 0 },
      payload: { coinsEarned: 10, role: 'chef' }
    },
    {
      id: 'work_c1_04',
      childId: 'c1',
      date: '2026-10-27',
      week: '10월 4주',
      appId: '1',
      appName: '생각지도 탐구',
      title: '쌀과 밀로 만든 음식 지도',
      sentence: '우리나라 밥이랑 떡은 쌀로 만들고 피자랑 빵은 밀로 만든다는 걸 알았어요.',
      mood: '💡 신기해요',
      question: '쌀이랑 밀은 땅에서 어떻게 자라요?',
      photo: '../assets/달누리_생각지도_15x15_더블버블맵_쌀음식비교.jpg',
      photoCaption: '쌀과 밀의 공통점과 차이점을 분류한 생각지도',
      mediaStats: { photos: 1, voice: 1, drawing: 1 },
      payload: { mapType: 'double_bubble', subject: 'grain' }
    },
    {
      id: 'work_c1_05',
      childId: 'c1',
      date: '2026-11-03',
      week: '11월 1주',
      appId: '1',
      appName: '세계 음식 그림책',
      title: '방글라데시 키추리와 노란 카레',
      sentence: '방글라데시 키추리에는 노란 카레 가루가 들어가는데 향기가 톡 쏘고 왜 저렇게 되는지 궁금해요. 우리 집 카레랑 비교해보고 싶어요.',
      mood: '🤔 호기심 가득',
      question: '향신료 냄새는 왜 바람을 타고 멀리까지 퍼져요?',
      photo: '../assets/달누리반_나만의_세계음식도감_표지.png',
      photoCaption: '세계 음식 백과사전 탐색 후 완성한 나만의 그림책',
      mediaStats: { photos: 1, voice: 1, drawing: 1 },
      payload: { country: '방글라데시', food: '키추리' }
    },
    // 정윤우 시드 기록
    {
      id: 'work_c2_01',
      childId: 'c2',
      date: '2026-09-10',
      week: '9월 2주',
      appId: '1',
      appName: '가을 곤충 탐색',
      title: '잠자리 눈 관찰하기',
      sentence: '좋았어요. 잠자리가 날아다녀요.',
      mood: '😃 즐거워요',
      question: '잠자리는 어디로 날아가요?',
      photo: '../assets/play_images/play_img_01.webp',
      photoCaption: '잠자리 날개와 눈을 돋보기로 본 모습',
      mediaStats: { photos: 1, voice: 1, drawing: 0 },
      payload: { category: 'insect' }
    },
    {
      id: 'work_c2_02',
      childId: 'c2',
      date: '2026-11-04',
      week: '11월 1주',
      appId: '1',
      appName: '세계 곡식 관찰',
      title: '밀가루 반죽과 글루텐 실험',
      sentence: '밀가루에 물을 넣고 주무르니까 끈적끈적해졌는데 왜 물만 넣어도 쫀득해지는지 원리가 궁금해요. 쌀가루는 왜 덜 끈적거리는지 실험해보고 싶어요.',
      mood: '🧐 진지해요',
      question: '밀가루 속에는 끈적거리는 풀 같은 게 숨어 있나요?',
      photo: '../assets/달누리_A3_세계의곡식관찰판.png',
      photoCaption: '밀과 쌀의 곡식 가루 반죽 촉감 탐색',
      mediaStats: { photos: 1, voice: 1, drawing: 1 },
      payload: { experiment: 'flour_dough' }
    }
  ];

  class AtelierStore {
    constructor() {
      this.listeners = new Set();
      this.children = this.loadChildren();
      this.works = this.loadWorks();
    }

    loadChildren() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_CHILDREN);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('Store: children load fallback', e);
      }
      return DEFAULT_CHILDREN.slice();
    }

    loadWorks() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_WORKS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Store: works load fallback', e);
      }
      return DEFAULT_WORKS.slice();
    }

    saveWorks() {
      try {
        localStorage.setItem(STORAGE_KEY_WORKS, JSON.stringify(this.works));
      } catch (e) {
        console.warn('Store: saveWorks failed', e);
      }
    }

    saveChildren() {
      try {
        localStorage.setItem(STORAGE_KEY_CHILDREN, JSON.stringify(this.children));
      } catch (e) {
        console.warn('Store: saveChildren failed', e);
      }
    }

    notify() {
      for (const listener of this.listeners) {
        try {
          listener(this);
        } catch (err) {
          console.error('Store listener error:', err);
        }
      }
    }

    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      this.listeners.add(listener);
      // 구독 해제 함수 반환
      return () => {
        this.listeners.delete(listener);
      };
    }

    getChildren() {
      return this.children.slice();
    }

    getChild(childId) {
      return this.children.find(c => c.id === childId) || null;
    }

    getWorks(childId) {
      let list = this.works.filter(w => w.childId === childId);
      // 시간순(오래된 순 -> 최신순) 정렬
      return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    getWork(workId) {
      return this.works.find(w => w.id === workId) || null;
    }

    addWork(workData) {
      const newWork = Object.assign({}, workData, {
        id: workData.id || ('work_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)),
        createdAt: new Date().toISOString()
      });
      // 기술 제약 검증: 앱별 데이터는 반드시 work.payload에만 보관
      if (!newWork.payload) {
        newWork.payload = {};
      }
      this.works.push(newWork);
      this.saveWorks();
      this.notify();
      return newWork;
    }

    deleteWork(workId) {
      const idx = this.works.findIndex(w => w.id === workId);
      if (idx !== -1) {
        this.works.splice(idx, 1);
        this.saveWorks();
        this.notify();
        return true;
      }
      return false;
    }

    resetToDefault() {
      this.children = DEFAULT_CHILDREN.slice();
      this.works = DEFAULT_WORKS.slice();
      this.saveChildren();
      this.saveWorks();
      this.notify();
    }
  }

  // 싱글톤 인스턴스 전역 노출
  const storeInstance = new AtelierStore();
  global.Store = storeInstance;

})(typeof window !== 'undefined' ? window : this);

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Music, Users, Trophy, Settings, Play, Pause, RotateCcw,
  Volume2, VolumeX, Eye, Shield, Sparkles, CheckCircle2,
  XCircle, DoorOpen, Lock, Unlock, UserPlus, HelpCircle,
  ChevronRight, ChevronLeft, Award, Crown, Compass, Layers,
  Smartphone, Monitor, Sliders, Bell, Heart, HandMetal, Smile,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCw, LogOut,
  Plus, Trash2, Edit3, Check, AlertTriangle, Radio
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore, doc, setDoc, getDoc, onSnapshot, collection, updateDoc, deleteDoc
} from 'firebase/firestore';

// ==========================================
// 0. FIREBASE & MULTIPLAYER INITIALIZATION
// ==========================================
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCA1K9nYC3UDIy-MU6XFJFK9PUh8OAFPPs",
  authDomain: "hanwoori-choir-game.firebaseapp.com",
  projectId: "hanwoori-choir-game",
  storageBucket: "hanwoori-choir-game.firebasestorage.app",
  messagingSenderId: "659716969127",
  appId: "1:659716969127:web:e31ade6b013306c41a4182"
};

let app = null;
let auth = null;
let db = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'hanwoori-choir-20th';

try {
  let firebaseConfig = DEFAULT_FIREBASE_CONFIG;
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    firebaseConfig = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
  } else if (import.meta.env && import.meta.env.VITE_FIREBASE_CONFIG) {
    try {
      firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
    } catch (err) {
      console.warn('VITE_FIREBASE_CONFIG parse error, using default:', err);
    }
  }

  if (firebaseConfig && firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.warn('Firebase init fallback to local BroadcastChannel mode:', e);
}

// ==========================================
// 1. CONSTANTS, AVATAR PRESETS & SAMPLE QUIZZES
// ==========================================
const MAP_WIDTH = 1200;
const MAP_HEIGHT = 800;

// 한우리 합창단 20기 공식 단원 명단 (이름 및 휴대폰 뒷번호 4자리)
const OFFICIAL_MEMBERS = [
  { no: 1, name: '최예진', shortName: '예진', phone: '9908', avatarId: 'haeun', isAdmin: false },
  { no: 2, name: '송주아', shortName: '주아', phone: '3949', avatarId: 'yujin', isAdmin: false },
  { no: 3, name: '심병수', shortName: '병수', phone: '3051', avatarId: 'dowon', isAdmin: false },
  { no: 4, name: '이원배', shortName: '원배', phone: '8439', avatarId: 'minseok', isAdmin: false },
  { no: 5, name: '한승환', shortName: '승환', phone: '8070', avatarId: 'hyuno', isAdmin: false },
  { no: 6, name: '고태율', shortName: '태율', phone: '4004', avatarId: 'dion', isAdmin: false },
  { no: 7, name: '사제환', shortName: '제환', phone: '8836', avatarId: 'conductor', isAdmin: false },
  { no: 8, name: '이현주', shortName: '현주', phone: '0540', avatarId: 'chaewon', isAdmin: false },
  { no: 9, name: '이경환', shortName: '경환', phone: '2591', avatarId: 'dawon', isAdmin: false },
  { no: 10, name: '최지은', shortName: '지은', phone: '8697', avatarId: 'seohyun', isAdmin: false },
  { no: 11, name: '김인애', shortName: '인애', phone: '3992', avatarId: 'soohyun', isAdmin: false },
  { no: 12, name: '이유정', shortName: '유정', phone: '2839', avatarId: 'soyoung', isAdmin: false },
  { no: 13, name: '황유빈', shortName: '유빈', phone: '2901', avatarId: 'haeun', isAdmin: false },
  { no: 14, name: '황동원', shortName: '동원', phone: '', avatarId: 'dowon', isAdmin: false }, // 뒷번호 미등록 유연 허용
  { no: 15, name: '김다솔', shortName: '다솔', phone: '1208', avatarId: 'chaewon', isAdmin: false },
  { no: 16, name: '김석준', shortName: '석준', phone: '2918', avatarId: 'conductor', isAdmin: true }, // 관리자
  { no: 17, name: '이민우', shortName: '민우', phone: '4637', avatarId: 'minseok', isAdmin: false },
  { no: 18, name: '이대건', shortName: '대건', phone: '0222', avatarId: 'hyuno', isAdmin: false },
  { no: 19, name: '이상언', shortName: '상언', phone: '4015', avatarId: 'dowon', isAdmin: false },
];

// 한우리 합창단 20기 일러스트 실물 SD 캐릭터 프리셋 (총 13종)
const AVATAR_PRESETS = [
  { id: 'conductor', name: '마에스트로 연주복', sprite: 'conductor', defaultNick: '단원', hair: 'short_parted', hairColor: '#3a2618', outfit: '#f5efe6', bottom: '#2b2b2b', acc: 'baton', skin: '#ffe4d6' },
  { id: 'hyuno', name: '따뜻한 브라운 코트', sprite: 'hyuno', defaultNick: '단원', hair: 'medium_wave', hairColor: '#5c3c24', outfit: '#eee5d8', bottom: '#4a3b2c', acc: 'none', skin: '#ffe4d6' },
  { id: 'dowon', name: '클래식 네이비 수트', sprite: 'dowon', defaultNick: '단원', hair: 'neat_boy', hairColor: '#242024', outfit: '#2b3548', bottom: '#1e2430', acc: 'tie', skin: '#ffe2d1' },
  { id: 'minseok', name: '단정한 화이트 셔츠', sprite: 'minseok', defaultNick: '단원', hair: 'parted_boy', hairColor: '#232b38', outfit: '#eef2f7', bottom: '#2e3846', acc: 'glasses', skin: '#ffe2d1' },
  { id: 'dawon', name: '내추럴 보브 숏컷', sprite: 'dawon', defaultNick: '단원', hair: 'short_parted', hairColor: '#594233', outfit: '#f7f3ef', bottom: '#42352b', acc: 'note', skin: '#ffe4d6' },
  { id: 'dion', name: '시크 다크 블레이저', sprite: 'dion', defaultNick: '단원', hair: 'neat_boy', hairColor: '#1f242d', outfit: '#2c3038', bottom: '#1f2229', acc: 'badge', skin: '#ffe4d6' },
  { id: 'chaewon', name: '단정한 카라 원피스', sprite: 'chaewon', defaultNick: '단원', hair: 'bob_cute', hairColor: '#b5926b', outfit: '#697a8c', bottom: '#3a4450', acc: 'collar', skin: '#ffe6d8' },
  { id: 'seohyun', name: '우아한 골드 웨이브', sprite: 'seohyun', defaultNick: '단원', hair: 'wavy_long', hairColor: '#b88658', outfit: '#e8d8c8', bottom: '#5c4636', acc: 'ribbon', skin: '#ffe8dc' },
  { id: 'soohyun', name: '러블리 리본 헤어', sprite: 'soohyun', defaultNick: '단원', hair: 'half_tie', hairColor: '#6b442a', outfit: '#d96b6b', bottom: '#f5e6e8', acc: 'bow', skin: '#ffe6d8' },
  { id: 'yujin', name: '발랄한 핑키 트윈', sprite: 'yujin', defaultNick: '단원', hair: 'twintail', hairColor: '#e87a90', outfit: '#f4a7b9', bottom: '#3b4254', acc: 'hairpin', skin: '#ffeaf0' },
  { id: 'soyoung', name: '따뜻한 베레모 코트', sprite: 'soyoung', defaultNick: '단원', hair: 'braid_warm', hairColor: '#69462d', outfit: '#d9c2a6', bottom: '#5c4330', acc: 'beret', skin: '#ffe6d8' },
  { id: 'haeun', name: '로맨틱 롱헤어', sprite: 'haeun', defaultNick: '단원', hair: 'long_straight', hairColor: '#3b2e35', outfit: '#f0e6ec', bottom: '#483b42', acc: 'headband', skin: '#ffe8e8' },
  { id: 'puppy', name: '귀여운 마스코트 뽀삐', sprite: 'puppy', defaultNick: '단원', hair: 'round_boy', hairColor: '#ffffff', outfit: '#ffffff', bottom: '#ffffff', acc: 'none', skin: '#ffffff' },
];

// 레거시 아바타 ID 매핑 테이블 (기존 사용자 호환)
const AVATAR_ID_MAP = {
  yejin: 'haeun',
  jua: 'yujin',
  byungsoo: 'dowon',
  wonbae: 'minseok',
  seunghwan: 'hyuno',
  taeyul: 'dion',
  jehwan: 'conductor',
  hyunjoo: 'chaewon',
  kyunghwan: 'dawon',
  jieun: 'seohyun',
  inae: 'soohyun',
  yujeong: 'soyoung',
  yubin: 'haeun',
  dongwon: 'dowon',
  dasol: 'chaewon',
  conductor: 'conductor',
  minwoo: 'minseok',
  daegeon: 'hyuno',
  sangeon: 'dowon',
  puppy: 'puppy'
};

// 음악실 로비 내 가구 충돌 박스 및 Y-Sorting(깊이 정렬) 기준선 정의
const LOBBY_OBSTACLES = [
  // 상단 벽 및 창문/책장 영역
  { id: 'top_wall', name: '상단 칠판 벽면', x: 0, y: 0, w: 1200, h: 255, sortY: 255 },
  { id: 'left_bookshelf', name: '좌측 악보 책장', x: 0, y: 255, w: 115, h: 310, sortY: 540 },
  { id: 'right_bookshelf', name: '우측 악기 수납장', x: 1085, y: 255, w: 115, h: 310, sortY: 540 },
  // 중앙 그랜드 피아노
  { id: 'grand_piano', name: '중앙 그랜드 피아노', x: 515, y: 270, w: 225, h: 125, sortY: 380 },
  { id: 'piano_bench', name: '피아노 의자', x: 490, y: 392, w: 72, h: 42, sortY: 425 },
  // 좌측 하단 라운지 테이블 구역
  { id: 'lounge_table', name: '좌하단 티테이블 라운지', x: 45, y: 585, w: 295, h: 185, sortY: 720 },
  // 우측 하단 공지사항 데스크 구역
  { id: 'notice_desk', name: '우하단 공지사항 데스크', x: 880, y: 635, w: 300, h: 165, sortY: 750 },
  // 우측 강아지 & 미니 테이블
  { id: 'right_mini_table', name: '우측 미니 모니터 테이블', x: 1055, y: 495, w: 120, h: 95, sortY: 575 },
];

// 퀴즈방 출입문 포털 영역
const PORTALS = {
  music: { id: 'music', name: '🎵 음악 퀴즈방', sub: '헷갈리는 명곡 10선!', x: 120, y: 215, w: 175, h: 145, entryX: 205, entryY: 335, color: '#ff8da1' },
  person: { id: 'person', name: '💡 합창단·트렌드 퀴즈방', sub: '누구/무엇일까요?', x: 905, y: 215, w: 175, h: 145, entryX: 990, entryY: 335, color: '#6ec6ff' },
};

// 확정된 음악 퀴즈 10문항 & 합창단/트렌드 맞춤형 퀴즈 데이터
const INITIAL_QUIZZES = [
  // [파트 1] 헷갈리는 레전드 음악 퀴즈 10선 (room: 'music')
  {
    id: 'm1',
    room: 'music',
    title: '음악 Q1. [레전드 댄스 매치] 지금 나오는 이 신나는 나이트풍 전주는 어느 곡일까요?',
    desc: '신지의 시원한 고음과 김종민·빽가의 추임새! 인트로 비트만 듣고 A/B 구역으로 이동하세요!',
    optionA: '코요태 - 순정',
    optionB: '코요태 - 비몽',
    answer: 'A',
    melodyId: 'good_day',
    duration: 15
  },
  {
    id: 'm2',
    room: 'music',
    title: '음악 Q2. [여름 혼성그룹 매치] 쿨(COOL)의 경쾌한 이 전주! 정확한 곡 제목은?',
    desc: '"와우~ 여름이다!" 대사 직후 나오는 통통 튀는 반주입니다. 과연 어느 곡일까요?',
    optionA: '쿨(COOL) - 해변의 여인',
    optionB: '쿨(COOL) - 애상',
    answer: 'A',
    melodyId: 'butterfly',
    duration: 15
  },
  {
    id: 'm3',
    room: 'music',
    title: '음악 Q3. [90년대 극악 난이도] 터보의 강렬한 유로 댄스 신스 전주! 이 곡은?',
    desc: '전주 3초만 들으면 90년대 가요 고수들도 반반 갈리는 터보의 명곡 매치입니다!',
    optionA: '터보 - Love Is... (3+3=0)',
    optionB: '터보 - 나 어릴 적 꿈',
    answer: 'A',
    melodyId: 'christmas',
    duration: 15
  },
  {
    id: 'm4',
    room: 'music',
    title: '음악 Q4. [아이유 대작 매치] 화려한 오케스트라 스트링으로 시작하는 이 곡은?',
    desc: '이민수 작곡가 + 김이나 작사가 콤비의 쌍둥이 명곡! 전주 현악기 선율을 잘 들어보세요.',
    optionA: '아이유 - 좋은 날 (Good Day)',
    optionB: '아이유 - 너랑 나 (You & I)',
    answer: 'A',
    melodyId: 'good_day',
    duration: 15
  },
  {
    id: 'm5',
    room: 'music',
    title: '음악 Q5. [노래방 록발라드 매치] 애절한 피아노와 스트링 인트로! 버즈의 어느 곡일까요?',
    desc: '떼창은 완벽하게 할 줄 알지만 전주만 들으면 제목이 헷갈리는 버즈 양대 산맥!',
    optionA: '버즈 - 가시',
    optionB: '버즈 - 겁쟁이',
    answer: 'A',
    melodyId: 'butterfly',
    duration: 15
  },
  {
    id: 'm6',
    room: 'music',
    title: '음악 Q6. [동물 록밴드 매치] 체리필터의 강렬한 기타와 드럼 사운드! 이 노래는?',
    desc: '제목에 둘 다 동물이 들어가서 급하게 뛰어가다 반대로 잘못 들어가는 단원 속출 주의!',
    optionA: '체리필터 - 낭만고양이',
    optionB: '체리필터 - 오리날다',
    answer: 'A',
    melodyId: 'christmas',
    duration: 15
  },
  {
    id: 'm7',
    room: 'music',
    title: '음악 Q7. [미디엄 템포 매치] 2000년대를 휩쓴 SG워너비의 따스하고 웅장한 전주!',
    desc: '하모니카와 스트링 선율이 벅차오르는 이 인트로는 어느 곡일까요?',
    optionA: 'SG워너비 - 라라라',
    optionB: 'SG워너비 - 내 사람',
    answer: 'B',
    melodyId: 'butterfly',
    duration: 15
  },
  {
    id: 'm8',
    room: 'music',
    title: '음악 Q8. [폭주 기관차 발라드] 슬프게 시작하다 후렴에서 급발진하는 다비치의 곡은?',
    desc: '곡 구조가 쌍둥이처럼 닮은 다비치의 히트곡! 지금 나오는 전주는 어느 쪽일까요?',
    optionA: '다비치 - 8282',
    optionB: '다비치 - 사랑과 전쟁',
    answer: 'A',
    melodyId: 'good_day',
    duration: 15
  },
  {
    id: 'm9',
    room: 'music',
    title: '음악 Q9. [대세 밴드 매치] 합창단과 페스티벌에서 가장 사랑받는 DAY6의 이 전주는?',
    desc: '청량한 드럼과 건반 사운드로 시작하는 데이식스의 명곡을 맞혀보세요!',
    optionA: '데이식스(DAY6) - 한 페이지가 될 수 있게',
    optionB: '데이식스(DAY6) - 예뻤어',
    answer: 'A',
    melodyId: 'christmas',
    duration: 15
  },
  {
    id: 'm10',
    room: 'music',
    title: '음악 Q10. [결승 감성 매치] 이승철 보컬의 서정적인 인트로 선율! 정확한 곡명은?',
    desc: '부활의 명곡과 이승철 솔로 명곡의 대결! 마지막까지 집중해서 이동하세요!',
    optionA: '부활 - 네버엔딩 스토리',
    optionB: '이승철 - 인연',
    answer: 'A',
    melodyId: 'butterfly',
    duration: 15
  },

  // [파트 2] 합창단 상식 & 단원 저격 & 최신 트렌드 퀴즈 (room: 'person')
  {
    id: 'p1',
    room: 'person',
    title: '합창단 Q1. [음악 용어] 악보에서 "점점 여리게(작게)" 부르라는 뜻의 이탈리아어 용어는?',
    desc: '크레센도(점점 크게)의 반대말입니다! 순간적으로 헷갈리지 말고 정답 구역으로 뛰어가세요!',
    optionA: '디크레센도 (Decrescendo)',
    optionB: '안단테 (Andante)',
    answer: 'A',
    duration: 15
  },
  {
    id: 'p2',
    room: 'person',
    title: '합창단 Q2. [성악 상식] 여성 최고 음역대인 "소프라노(Soprano)"의 이탈리아어 어원 뜻은?',
    desc: '합창단원이라면 솔깃할 성악 상식! 과연 소프라노의 원래 어원은 무엇일까요?',
    optionA: '"가장 높은 / 위쪽의" 라는 뜻',
    optionB: '"맑게 울리는 종소리" 라는 뜻',
    answer: 'A',
    duration: 15
  },
  {
    id: 'p3',
    room: 'person',
    title: '합창단 Q3. [단원 스페셜] 우리 합창단 "김다솔" 단원의 이름에 담긴 진짜 뜻은 무엇일까요?',
    desc: '🔥 힌트: 지금 경기장 안에서 움직이는 [김다솔] 단원을 찾아 쫄쫄 따라가 보세요! (낚시 주의!)',
    optionA: '순우리말: 다보록하게 가지가 많이 퍼진 어린 소나무',
    optionB: '한자 이름: 많을 다(多) + 거느릴 솔(率)',
    answer: 'A',
    duration: 18
  },
  {
    id: 'p4',
    room: 'person',
    title: '합창단 Q4. [최신 트렌드 밈] 요즘 쇼츠를 휩쓴 뮤지컬 데스노트 "L을 보여줘?" 밈의 핵심은?',
    desc: '"L을 보여줘? (L! L!)" 밈에서 나오는 결정적인 제스처와 대사 포인트를 골라주세요!',
    optionA: '강렬한 눈빛과 손가락 L 포즈로 폭풍 샤우팅!',
    optionB: '조용히 의자에 쭈그려 앉아 막대사탕 먹기',
    answer: 'A',
    duration: 15
  },
  {
    id: 'p5',
    room: 'person',
    title: '합창단 Q5. [발성 밸런스] 합창할 때 바른 자세로 소리를 낼 때 배(복부)와 어깨의 상태는?',
    desc: '매주 연습 시간마다 강조하는 발성의 기본! 올바른 호흡과 이완 방법을 선택하세요!',
    optionA: '복부는 단단히 지지하되 어깨와 목은 완전히 힘을 뺀다',
    optionB: '소리를 멀리 보내기 위해 어깨와 목까지 온몸에 힘을 꽉 준다',
    answer: 'A',
    duration: 15
  }
];

// ==========================================
// 2. WEB AUDIO SYNTHESIZER (효과음 및 음악 퀴즈 샘플 멜로디)
// ==========================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration = 0.15, type = 'sine', delay = 0, vol = 0.12) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // ignore audio context errors
    }
  }

  playSelect() {
    this.playTone(523.25, 0.1, 'triangle', 0, 0.1);
    this.playTone(659.25, 0.12, 'triangle', 0.08, 0.1);
  }

  playTick(urgent = false) {
    this.playTone(urgent ? 880 : 440, 0.06, 'sine', 0, urgent ? 0.15 : 0.08);
  }

  playTrapdoorDrop() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // 쿵! 바닥 열리는 소리 + 아래로 추락하는 슬라이드 사운드
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 1.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {}
  }

  playFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.25, 'triangle', idx * 0.12, 0.16);
    });
    this.playTone(1046.5, 0.6, 'sine', 0.48, 0.2);
  }

  playSampleMelody(melodyId) {
    if (melodyId === 'good_day') {
      const seq = [
        [523.25, 0], [587.33, 0.2], [659.25, 0.4], [783.99, 0.6],
        [880.0, 0.85], [783.99, 1.1], [659.25, 1.35], [1046.5, 1.6]
      ];
      seq.forEach(([f, d]) => this.playTone(f, 0.2, 'triangle', d, 0.15));
    } else if (melodyId === 'butterfly') {
      const seq = [
        [392.0, 0], [440.0, 0.25], [493.88, 0.5], [587.33, 0.75],
        [659.25, 1.05], [587.33, 1.35], [783.99, 1.65]
      ];
      seq.forEach(([f, d]) => this.playTone(f, 0.24, 'sine', d, 0.16));
    } else {
      const seq = [
        [659.25, 0], [659.25, 0.22], [659.25, 0.45],
        [659.25, 0.75], [659.25, 0.97], [659.25, 1.2],
        [659.25, 1.5], [783.99, 1.7], [523.25, 1.9], [587.33, 2.1], [659.25, 2.3]
      ];
      seq.forEach(([f, d]) => this.playTone(f, 0.18, 'triangle', d, 0.15));
    }
  }
}

const soundFX = new SoundEngine();

// ==========================================
// 3. CANVAS DRAWING HELPERS (원본 음악실 완벽 복원 & 독립 아바타 렌더러)
// ==========================================

// 둥근 사각형 헬퍼
function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// 3.0 아바타 스프라이트 프리로더 (4방향 × 4프레임 워킹 애니메이션 + 단일 스프라이트 폴백)
const AVATAR_SPRITES = {};       // { name: Image }  — static fallback
const AVATAR_WALK_FRAMES = {};   // { name_dir_frame: Image }

const AVATAR_SPRITE_NAMES = [
  'conductor', 'dowon', 'hyuno', 'yujin', 'chaewon', 'seohyun',
  'dion', 'minseok', 'soyoung', 'soohyun', 'dawon', 'haeun', 'puppy'
];

// Characters that have full 4-direction walk frames available
const WALK_ANIM_CHARS = new Set(['conductor', 'hyuno']);
const WALK_DIRS = ['down', 'left', 'right', 'up'];
const WALK_FRAME_COUNT = 4;

if (typeof window !== 'undefined') {
  AVATAR_SPRITE_NAMES.forEach((name) => {
    // Static fallback sprite
    const img = new Image();
    img.src = `${import.meta.env.BASE_URL}avatars/${name}.png?v=20261126_v2`;
    AVATAR_SPRITES[name] = img;

    // Walk animation frames (only for chars that have them)
    if (WALK_ANIM_CHARS.has(name)) {
      WALK_DIRS.forEach((dir) => {
        for (let f = 0; f < WALK_FRAME_COUNT; f++) {
          const fi = new Image();
          fi.src = `${import.meta.env.BASE_URL}avatars/${name}_${dir}_${f}.png?v=20261127`;
          AVATAR_WALK_FRAMES[`${name}_${dir}_${f}`] = fi;
        }
      });
    }
  });
}

// Helper: get the right walk frame image for a player
function getWalkFrame(spriteKey, dir, time, isMoving) {
  if (!WALK_ANIM_CHARS.has(spriteKey)) return null;
  const dirMap = { left: 'left', right: 'right', up: 'up', down: 'down' };
  const d = dirMap[dir] || 'down';
  // 4-frame cycle at ~8fps when moving, hold frame 0 when idle
  const frameIdx = isMoving ? Math.floor(time * 8) % WALK_FRAME_COUNT : 0;
  const key = `${spriteKey}_${d}_${frameIdx}`;
  const img = AVATAR_WALK_FRAMES[key];
  return (img && img.complete && img.naturalWidth > 0) ? img : null;
}

// 3.0.1 대기실 배경 이미지 프리로더 (고화질 크리스마스 배경 일러스트)
let lobbyBgImage = null;
if (typeof window !== 'undefined') {
  lobbyBgImage = new Image();
  lobbyBgImage.src = `${import.meta.env.BASE_URL}lobby_bg.jpg?v=20261126_v2`;
}

// 3.1 배경 레이어 (선명화 처리된 사진 배경 우선 사용 + 폴백 캔버스)
function drawMusicRoomBackground(ctx, time, gameState) {
  if (lobbyBgImage && lobbyBgImage.complete && lobbyBgImage.naturalWidth > 0) {
    ctx.drawImage(lobbyBgImage, 0, 0, MAP_WIDTH, MAP_HEIGHT);

    // 포털 개방/대기 상태 배지만 깔끔하게 표시
    const portals = [
      { x: 118, y: 145, w: 180, isOpen: gameState.openRoom === 'music' },
      { x: 902, y: 145, w: 180, isOpen: gameState.openRoom === 'person' }
    ];
    portals.forEach(({ x, y, w, isOpen }) => {
      ctx.save();
      ctx.fillStyle = isOpen ? '#10b981' : 'rgba(30,41,59,0.75)';
      drawRoundedRect(ctx, x + w / 2 - 46, y - 16, 92, 24, 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isOpen ? '🔓 입장 가능!' : '🔒 대기중', x + w / 2, y);
      ctx.restore();
    });
    return;
  }

  // 1) 전체 바닥 (따뜻한 파스텔 원목 마루 - 폴백)
  const floorGrad = ctx.createLinearGradient(0, 220, 0, MAP_HEIGHT);
  floorGrad.addColorStop(0, '#c98e54');
  floorGrad.addColorStop(0.5, '#b87b43');
  floorGrad.addColorStop(1, '#98602e');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 220, MAP_WIDTH, MAP_HEIGHT - 220);

  // 원목 마루 판자 결 & 따뜻한 조명 반사광
  ctx.strokeStyle = 'rgba(92, 50, 20, 0.25)';
  ctx.lineWidth = 1.5;
  for (let y = 240; y < MAP_HEIGHT; y += 34) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(MAP_WIDTH, y);
    ctx.stroke();
    for (let x = (y % 68) * 2; x < MAP_WIDTH; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 12, y + 34);
      ctx.stroke();
    }
  }

  // 중앙 바닥 은은한 스포트라이트 앰비언트 조명
  const spotGrad = ctx.createRadialGradient(600, 460, 50, 600, 460, 480);
  spotGrad.addColorStop(0, 'rgba(255, 232, 185, 0.38)');
  spotGrad.addColorStop(1, 'rgba(255, 232, 185, 0)');
  ctx.fillStyle = spotGrad;
  ctx.fillRect(0, 220, MAP_WIDTH, MAP_HEIGHT - 220);

  // 2) 상단 정면 벽 & 좌우 측면 벽
  const wallGrad = ctx.createLinearGradient(0, 0, 0, 250);
  wallGrad.addColorStop(0, '#d8c3a8');
  wallGrad.addColorStop(1, '#ebd9c0');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, MAP_WIDTH, 250);

  // 벽면 웨인스코팅 몰딩 & 걸레받이
  ctx.fillStyle = '#c49a6c';
  ctx.fillRect(0, 236, MAP_WIDTH, 16);
  ctx.strokeStyle = '#9e7348';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 236, MAP_WIDTH, 16);

  // 3) 좌측 밤하늘 창문 & 커튼 (원본 좌상단 야경 창문 재현)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(130, 0);
  ctx.lineTo(130, 235);
  ctx.lineTo(0, 310);
  ctx.closePath();
  ctx.fillStyle = '#25335a';
  ctx.fill();

  // 밤하늘 별빛 & 빌딩 실루엣
  ctx.fillStyle = '#18223d';
  ctx.fillRect(8, 155, 28, 120);
  ctx.fillRect(42, 135, 35, 130);
  ctx.fillRect(82, 165, 30, 100);
  ctx.fillStyle = '#ffd97d';
  [[22, 45], [65, 35], [40, 88], [90, 70], [28, 118], [75, 110]].forEach(([sx, sy], i) => {
    const twinkle = 1.5 + Math.sin(time * 3 + i) * 1;
    ctx.beginPath();
    ctx.arc(sx, sy, twinkle, 0, Math.PI * 2);
    ctx.fill();
  });
  // 창틀 격자
  ctx.strokeStyle = '#6e4e32';
  ctx.lineWidth = 5;
  ctx.strokeRect(4, 4, 118, 230);
  ctx.beginPath();
  ctx.moveTo(62, 4);
  ctx.lineTo(62, 234);
  ctx.moveTo(4, 115);
  ctx.lineTo(122, 115);
  ctx.stroke();
  // 따뜻한 베이지 커튼
  ctx.fillStyle = '#d4b59e';
  ctx.beginPath();
  ctx.moveTo(112, 0);
  ctx.quadraticCurveTo(95, 120, 125, 240);
  ctx.lineTo(142, 240);
  ctx.lineTo(142, 0);
  ctx.fill();
  ctx.restore();

  // 4) 상단 중앙 대형 칠판 (Hanwoori Choir 20기 합창단)
  const boardX = 335;
  const boardY = 18;
  const boardW = 530;
  const boardH = 195;

  // 칠판 나무 프레임
  ctx.fillStyle = '#8c5832';
  drawRoundedRect(ctx, boardX - 8, boardY - 8, boardW + 16, boardH + 16, 8);
  ctx.fill();

  // 칠판 초록색 보드면
  const chalkGrad = ctx.createLinearGradient(boardX, boardY, boardX, boardY + boardH);
  chalkGrad.addColorStop(0, '#1c3b2e');
  chalkGrad.addColorStop(1, '#264d3d');
  ctx.fillStyle = chalkGrad;
  drawRoundedRect(ctx, boardX, boardY, boardW, boardH, 4);
  ctx.fill();

  // 칠판 상단 크리스마스 솔가지 & 알록달록 LED 전구 가랜드
  ctx.fillStyle = '#265838';
  for (let i = 0; i < 22; i++) {
    const lx = boardX + 12 + i * 24;
    const ly = boardY - 2 + Math.sin(i * 1.3) * 5;
    ctx.beginPath();
    ctx.arc(lx, ly, 10, 0, Math.PI * 2);
    ctx.fill();
    // 솔잎 질감 점
    ctx.fillStyle = '#1c452b';
    ctx.fillRect(lx - 4, ly - 2, 8, 3);
    ctx.fillStyle = '#265838';
  }

  // 칠판 중앙 크리스마스 리스 (Wreath)
  const wx = boardX + boardW / 2;
  const wy = boardY - 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(wx, wy, 24, 0, Math.PI * 2);
  ctx.strokeStyle = '#1d5432';
  ctx.lineWidth = 14;
  ctx.stroke();
  // 리스 장식 베리
  ctx.fillStyle = '#e63946';
  [[-16, 0], [16, 0], [0, 16], [-11, 11], [11, 11]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(wx + dx, wy + dy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
  // 리스 상단 빨간 리본
  ctx.fillStyle = '#d90429';
  ctx.beginPath();
  ctx.ellipse(wx - 7, wy - 16, 8, 5, -0.4, 0, Math.PI * 2);
  ctx.ellipse(wx + 7, wy - 16, 8, 5, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(wx - 3, wy - 18, 6, 6);
  ctx.restore();

  // 크리스마스 알록달록 반짝이는 LED 전구 빛 (빨강, 초록, 골드, 화이트)
  const bulbColors = ['#ff4d4d', '#2ecc71', '#ffd700', '#ffffff', '#ff7675', '#00cec9'];
  for (let i = 0; i < 11; i++) {
    const bx = boardX + 25 + i * 48;
    const by = boardY + 6 + Math.sin(i) * 4;
    const color = bulbColors[(i + Math.floor(time * 2)) % bulbColors.length];
    const glow = ctx.createRadialGradient(bx, by, 1, bx, by, 16);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(bx, by, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bx, by, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 칠판 상단 나무 프레임에 소복이 쌓인 눈꽃 캡 (Snow Cap)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(boardX - 8, boardY - 6);
  for (let sx = boardX - 8; sx <= boardX + boardW + 8; sx += 20) {
    ctx.lineTo(sx + 10, boardY - 6 + (Math.sin(sx * 0.2) > 0 ? 5 : 1));
  }
  ctx.lineTo(boardX + boardW + 8, boardY - 10);
  ctx.lineTo(boardX - 8, boardY - 10);
  ctx.closePath();
  ctx.fill();

  // 칠판 텍스트 ('삼성 한우리 합창단 20기' 단독 정중앙 메인 타이틀)
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff9e6';
  ctx.shadowColor = 'rgba(255, 215, 0, 0.85)';
  ctx.shadowBlur = 14;
  ctx.font = 'bold 38px "Noto Serif KR", "Georgia", serif';
  ctx.fillText('삼성 한우리 합창단 20기', boardX + boardW / 2, boardY + 115);
  ctx.shadowBlur = 0;
  ctx.restore();

  // 칠판 좌측 위 선반 & 고양이 (귀여운 산타 모자)
  ctx.fillStyle = '#8c5832';
  ctx.fillRect(215, 78, 100, 10);
  // 포인세티아 화분
  ctx.fillStyle = '#c87d55';
  ctx.fillRect(225, 55, 22, 23);
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.arc(236, 48, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(236, 48, 4, 0, Math.PI * 2);
  ctx.fill();
  // 검은 고양이
  ctx.fillStyle = '#232026';
  ctx.beginPath();
  ctx.arc(285, 62, 13, 0, Math.PI * 2); // 몸통
  ctx.arc(285, 45, 9, 0, Math.PI * 2);  // 머리
  ctx.fill();
  // 고양이 산타 모자
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.moveTo(279, 39);
  ctx.lineTo(291, 39);
  ctx.lineTo(285, 26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(285, 25, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(278, 38, 14, 3);
  // 고양이 노란 눈
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(281, 43, 3, 3);
  ctx.fillRect(287, 43, 3, 3);

  // 5) 우측 상단 합창단 단체 액자 & 크리스마스 산타 양말 장식
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(915, 16, 155, 98);
  ctx.fillStyle = '#2d3142';
  ctx.fillRect(922, 23, 141, 84);
  // 액자 속 미니 단원들 도트 표현
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      ctx.fillStyle = '#ffdfcc';
      ctx.beginPath();
      ctx.arc(938 + c * 15, 45 + r * 18, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = r === 1 ? '#f4a7b9' : '#4a5878';
      ctx.fillRect(934 + c * 15, 50 + r * 18, 8, 8);
    }
  }

  // 우측 벽 아기자기한 크리스마스 양말 장식 (튀어나가던 Music People 보드 대체)
  ctx.save();
  [1125, 1150].forEach((sx, i) => {
    ctx.fillStyle = i === 0 ? '#e63946' : '#2a9d8f';
    ctx.beginPath();
    ctx.moveTo(sx, 65);
    ctx.lineTo(sx + 14, 65);
    ctx.lineTo(sx + 14, 92);
    ctx.lineTo(sx + 22, 98);
    ctx.lineTo(sx + 18, 106);
    ctx.lineTo(sx, 98);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - 2, 63, 18, 6);
  });
  ctx.restore();

  // 6) 중앙 원형 크리스마스 버건디 러그 (그랜드 피아노 아래)
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(545, 415, 185, 85, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#8b2635'; // 화사한 크리스마스 와인 레드
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#ffd166'; // 따뜻한 골드 테두리
  ctx.stroke();
  // 러그 내부 금빛 원
  ctx.beginPath();
  ctx.ellipse(545, 415, 155, 70, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 7) 좌측 하단 라운지 원형 러그 (높은음자리표 문양)
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(180, 685, 165, 92, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#2d5a3f'; // 크리스마스 포레스트 그린
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffd166';
  ctx.stroke();
  ctx.font = '42px serif';
  ctx.fillStyle = 'rgba(255, 209, 102, 0.5)';
  ctx.fillText('𝄞', 75, 710);
  ctx.restore();

  // 8) 하단 중앙 Welcome 매트 (삼성 한우리 합창단 20기)
  const matX = 415;
  const matY = 640;
  const matW = 370;
  const matH = 115;
  ctx.save();
  ctx.fillStyle = '#7a1f2d';
  drawRoundedRect(ctx, matX - 8, matY - 8, matW + 16, matH + 16, 8);
  ctx.fill();
  ctx.fillStyle = '#1e4d34';
  drawRoundedRect(ctx, matX, matY, matW, matH, 4);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.strokeRect(matX + 8, matY + 8, matW - 16, matH - 16);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff9e6';
  ctx.font = 'bold 28px "Georgia", "Noto Serif KR", serif';
  ctx.fillText('🎄 Merry Christmas! 🎄', matX + matW / 2, matY + 52);
  ctx.font = 'bold 20px "Noto Sans KR", sans-serif';
  ctx.fillStyle = '#ffd166';
  ctx.fillText('삼성 한우리 합창단 20기', matX + matW / 2, matY + 88);
  ctx.font = '26px serif';
  ctx.fillText('❄️', matX + 42, matY + 68);
  ctx.fillText('❄️', matX + matW - 42, matY + 68);
  ctx.restore();

  // 9) 왼쪽 음악 퀴즈방 아치형 포털 (파스텔 핑크)
  drawPortalArch(ctx, {
    x: 118,
    y: 145,
    w: 180,
    h: 205,
    title: '🎵 음악 퀴즈방',
    subtitle: '노래를 듣고 맞혀보세요!',
    isPink: true,
    isOpen: gameState.openRoom === 'music',
    time
  });

  // 10) 오른쪽 인물 퀴즈방 아치형 포털 (파스텔 블루)
  drawPortalArch(ctx, {
    x: 902,
    y: 145,
    w: 180,
    h: 205,
    title: '👤 인물 퀴즈방',
    subtitle: '누구일까요?',
    isPink: false,
    isOpen: gameState.openRoom === 'person',
    time
  });

  // 11) 칠판 앞 첼로 & 보면대 장식
  ctx.save();
  ctx.fillStyle = '#8f4722';
  ctx.beginPath();
  ctx.ellipse(355, 235, 16, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(352, 185, 6, 40);
  // 보면대
  ctx.strokeStyle = '#2d2d2d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(405, 220);
  ctx.lineTo(405, 268);
  ctx.moveTo(392, 268);
  ctx.lineTo(418, 268);
  ctx.stroke();
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(388, 200, 34, 22);
  ctx.restore();

  // 12) 우측 귀여운 하얀 강아지 (원본 이미지 오른쪽 포메라니안/말티즈 마스코트)
  ctx.save();
  const dogX = 1005;
  const dogY = 515;
  const dogBounce = Math.sin(time * 4) * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(dogX, dogY + 18, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(dogX, dogY + 6 + dogBounce, 14, 0, Math.PI * 2);
  ctx.arc(dogX - 4, dogY - 8 + dogBounce, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9cfc7';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // 강아지 눈/코
  ctx.fillStyle = '#2b2b2b';
  ctx.beginPath();
  ctx.arc(dogX - 8, dogY - 10 + dogBounce, 2, 0, Math.PI * 2);
  ctx.arc(dogX, dogY - 10 + dogBounce, 2, 0, Math.PI * 2);
  ctx.arc(dogX - 4, dogY - 6 + dogBounce, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 13) 대기실 아기자기한 화분 장식들 (공간을 따뜻하고 싱그럽게 연출)
  const drawPottedPlant = (px, py, scale = 1, flowerColor = null) => {
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b85d3b';
    ctx.beginPath();
    ctx.moveTo(-14, 12);
    ctx.lineTo(14, 12);
    ctx.lineTo(18, -12);
    ctx.lineTo(-18, -12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#cf6f4c';
    ctx.fillRect(-20, -16, 40, 6);
    ctx.fillStyle = '#4a2e1b';
    ctx.beginPath();
    ctx.ellipse(0, -14, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    const leafColors = ['#2d6a4f', '#40916c', '#52b788', '#74c69d'];
    [
      [-12, -26, 12, 20, -0.4],
      [12, -26, 12, 20, 0.4],
      [0, -32, 14, 22, 0],
      [-18, -18, 10, 16, -0.7],
      [18, -18, 10, 16, 0.7]
    ].forEach(([lx, ly, lw, lh, rot], idx) => {
      ctx.fillStyle = leafColors[idx % leafColors.length];
      ctx.beginPath();
      ctx.ellipse(lx, ly, lw, lh, rot, 0, Math.PI * 2);
      ctx.fill();
    });
    if (flowerColor) {
      ctx.fillStyle = flowerColor;
      ctx.beginPath();
      ctx.arc(0, -32, 6, 0, Math.PI * 2);
      ctx.arc(-8, -26, 5, 0, Math.PI * 2);
      ctx.arc(8, -26, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(0, -32, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  drawPottedPlant(88, 355, 1.1);
  drawPottedPlant(280, 360, 0.95, '#ffffff'); // 백합 꽃 화분
  drawPottedPlant(775, 360, 0.95, '#ff85a1'); // 핑크 꽃 화분
  drawPottedPlant(1125, 365, 1.05);

  // 14) 상단 천장 전체 알록달록 반짝이는 LED 크리스마스 전구 스트링 (0 ~ 1200)
  ctx.save();
  const ceilingBulbs = ['#ff4d4d', '#2ecc71', '#ffd700', '#ffffff', '#ff7675', '#00cec9'];
  for (let x = 15; x < MAP_WIDTH - 15; x += 36) {
    const by = 8 + Math.sin(x * 0.05) * 6;
    const color = ceilingBulbs[Math.floor((x / 36 + time * 3) % ceilingBulbs.length)];
    const glow = ctx.createRadialGradient(x, by, 1, x, by, 15);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, by, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, by, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 포털 아치 그리기 헬퍼
function drawPortalArch(ctx, { x, y, w, h, title, subtitle, isPink, isOpen, time }) {
  ctx.save();
  const mainColor = isPink ? '#f7d1d8' : '#cce8fa';
  const borderColor = isPink ? '#e598a8' : '#7ab8e6';
  const glowColor = isPink ? 'rgba(255, 115, 155, 0.65)' : 'rgba(80, 185, 255, 0.65)';
  const innerDark = isPink ? '#6b2d3e' : '#1e4263';

  // 외벽 아치 프레임
  ctx.fillStyle = mainColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + 75);
  ctx.quadraticCurveTo(x, y, x + w / 2, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + 75);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 내부 통로 공간
  const inX = x + 26;
  const inY = y + 72;
  const inW = w - 52;
  const inH = h - 72;

  const innerGrad = ctx.createLinearGradient(inX, inY, inX, inY + inH);
  innerGrad.addColorStop(0, innerDark);
  innerGrad.addColorStop(1, isPink ? '#ff9ebb' : '#85d1ff');
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.moveTo(inX, inY + inH);
  ctx.lineTo(inX, inY + 35);
  ctx.quadraticCurveTo(inX, inY, inX + inW / 2, inY);
  ctx.quadraticCurveTo(inX + inW, inY, inX + inW, inY + 35);
  ctx.lineTo(inX + inW, inY + inH);
  ctx.closePath();
  ctx.fill();

  // 개방 상태일 때 반짝이는 바닥 화살표 & 광원 효과
  const pulse = 0.65 + Math.sin(time * 4) * 0.25;
  ctx.save();
  ctx.globalAlpha = isOpen ? pulse : 0.35;
  ctx.fillStyle = isPink ? '#ff8da6' : '#75c9ff';
  ctx.beginPath();
  const arrowCx = x + w / 2;
  const arrowCy = y + h + 18;
  ctx.moveTo(arrowCx, arrowCy - 34);
  ctx.lineTo(arrowCx + 34, arrowCy - 6);
  ctx.lineTo(arrowCx + 16, arrowCy - 6);
  ctx.lineTo(arrowCx + 22, arrowCy + 26);
  ctx.lineTo(arrowCx - 22, arrowCy + 26);
  ctx.lineTo(arrowCx - 16, arrowCy - 6);
  ctx.lineTo(arrowCx - 34, arrowCy - 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 상단 간판 텍스트
  ctx.textAlign = 'center';
  ctx.fillStyle = isPink ? '#6e2b3a' : '#1b3f60';
  ctx.font = 'bold 20px "Noto Sans KR", sans-serif';
  ctx.fillText(title, x + w / 2, y + 40);
  ctx.font = '12px "Noto Sans KR", sans-serif';
  ctx.fillText(subtitle, x + w / 2, y + 60);

  // 개방/잠금 배지 표시
  ctx.fillStyle = isOpen ? '#10b981' : 'rgba(30,41,59,0.75)';
  drawRoundedRect(ctx, x + w / 2 - 46, y - 16, 92, 24, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
  ctx.fillText(isOpen ? '🔓 입장 가능!' : '🔒 대기중', x + w / 2, y);

  if (isOpen) {
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  ctx.restore();
}

// 3.2 Y-Sorting 대상 가구 오브젝트 렌더러 (캐릭터가 가구 뒤로 가면 자연스럽게 가려짐)
function getFurnitureDrawables(noticeText) {
  if (lobbyBgImage && lobbyBgImage.complete && lobbyBgImage.naturalWidth > 0) {
    return [];
  }
  return [
    // 1) 중앙 그랜드 피아노 (sortY: 380)
    {
      id: 'furniture_piano',
      sortY: 380,
      draw: (ctx) => {
        ctx.save();
        // 피아노 그림자
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath();
        ctx.ellipse(620, 395, 115, 38, 0, 0, Math.PI * 2);
        ctx.fill();

        // 피아노 다리 3개
        ctx.fillStyle = '#141414';
        ctx.fillRect(535, 355, 12, 48);
        ctx.fillRect(705, 345, 12, 48);
        ctx.fillRect(625, 365, 12, 48);

        // 그랜드 피아노 바디
        ctx.fillStyle = '#18181c';
        ctx.strokeStyle = '#40404a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(518, 320);
        ctx.lineTo(665, 255);
        ctx.quadraticCurveTo(735, 255, 735, 315);
        ctx.lineTo(630, 370);
        ctx.lineTo(518, 355);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 피아노 내부 황금색 프레임 & 현
        ctx.fillStyle = '#c89b52';
        ctx.beginPath();
        ctx.moveTo(548, 315);
        ctx.lineTo(665, 270);
        ctx.lineTo(718, 308);
        ctx.lineTo(620, 350);
        ctx.closePath();
        ctx.fill();

        // 열린 피아노 뚜껑 (Open Lid)
        ctx.fillStyle = 'rgba(20, 20, 26, 0.92)';
        ctx.beginPath();
        ctx.moveTo(535, 305);
        ctx.lineTo(675, 225);
        ctx.lineTo(728, 272);
        ctx.lineTo(605, 325);
        ctx.closePath();
        ctx.fill();
        // 지지대 막대
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(645, 325);
        ctx.lineTo(665, 265);
        ctx.stroke();

        // 피아노 건반
        ctx.fillStyle = '#faf8f5';
        ctx.beginPath();
        ctx.moveTo(512, 336);
        ctx.lineTo(605, 362);
        ctx.lineTo(615, 348);
        ctx.lineTo(524, 324);
        ctx.closePath();
        ctx.fill();

        // 피아노 위 악보
        ctx.fillStyle = '#fffdf7';
        ctx.fillRect(558, 286, 36, 26);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.strokeRect(558, 286, 36, 26);
        ctx.restore();
      }
    },
    // 2) 피아노 의자 (sortY: 425)
    {
      id: 'furniture_bench',
      sortY: 425,
      draw: (ctx) => {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(488, 418, 76, 18);
        ctx.fillStyle = '#222228';
        drawRoundedRect(ctx, 490, 390, 72, 32, 5);
        ctx.fill();
        ctx.strokeStyle = '#454552';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    },
    // 3) 피아노 뒤 우측 크리스마스 트리 & 선물 상자들 (sortY: 270)
    {
      id: 'furniture_xmas_tree',
      sortY: 270,
      draw: (ctx) => {
        ctx.save();
        const tx = 745;
        const ty = 210;

        // 트리 바닥 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(tx + 30, ty + 95, 38, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // 트리 나무 밑동 (화분)
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(tx + 22, ty + 78, 16, 18);
        ctx.fillStyle = '#a0522d';
        ctx.fillRect(tx + 18, ty + 74, 24, 6);

        // 3단 상록수
        // 3단 (하단)
        ctx.fillStyle = '#1e5631';
        ctx.beginPath();
        ctx.moveTo(tx - 6, ty + 76);
        ctx.lineTo(tx + 66, ty + 76);
        ctx.lineTo(tx + 30, ty + 42);
        ctx.closePath();
        ctx.fill();

        // 2단 (중단)
        ctx.fillStyle = '#2d6a4f';
        ctx.beginPath();
        ctx.moveTo(tx + 2, ty + 50);
        ctx.lineTo(tx + 58, ty + 50);
        ctx.lineTo(tx + 30, ty + 22);
        ctx.closePath();
        ctx.fill();

        // 1단 (상단)
        ctx.fillStyle = '#40916c';
        ctx.beginPath();
        ctx.moveTo(tx + 8, ty + 28);
        ctx.lineTo(tx + 52, ty + 28);
        ctx.lineTo(tx + 30, ty + 2);
        ctx.closePath();
        ctx.fill();

        // 트리 오너먼트 방울
        const ornaments = [
          { dx: 14, dy: 66, c: '#e63946' },
          { dx: 34, dy: 70, c: '#ffd700' },
          { dx: 48, dy: 64, c: '#48cae4' },
          { dx: 20, dy: 42, c: '#f72585' },
          { dx: 42, dy: 44, c: '#ffd700' },
          { dx: 30, dy: 24, c: '#e63946' },
        ];
        ornaments.forEach((o) => {
          ctx.fillStyle = o.c;
          ctx.beginPath();
          ctx.arc(tx + o.dx, ty + o.dy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // 꼭대기 황금 별
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 8;
        ctx.font = '18px serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', tx + 30, ty + 2);
        ctx.shadowBlur = 0;

        // 트리 밑 선물 상자들
        // 빨간 선물 상자
        ctx.fillStyle = '#d90429';
        ctx.fillRect(tx - 4, ty + 80, 16, 14);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(tx + 3, ty + 80, 3, 14);
        ctx.fillRect(tx - 4, ty + 85, 16, 3);

        // 노란 선물 상자
        ctx.fillStyle = '#ffb703';
        ctx.fillRect(tx + 48, ty + 82, 14, 12);
        ctx.fillStyle = '#e63946';
        ctx.fillRect(tx + 53, ty + 82, 3, 12);
        ctx.fillRect(tx + 48, ty + 86, 14, 3);

        ctx.restore();
      }
    },
    // 4) 좌측 악보 책장 & 입간판 (sortY: 540)
    {
      id: 'furniture_left_shelf',
      sortY: 540,
      draw: (ctx) => {
        ctx.save();
        // 책장 본체
        ctx.fillStyle = '#8b5732';
        ctx.fillRect(0, 325, 92, 185);
        ctx.fillStyle = '#5e381d';
        ctx.fillRect(8, 340, 76, 48);
        ctx.fillRect(8, 398, 76, 48);
        ctx.fillRect(8, 456, 76, 42);
        // 책 꽃이
        const bookColors = ['#e07a5f', '#3d405b', '#81b29a', '#f2cc8f', '#d68c72'];
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = bookColors[i % bookColors.length];
          ctx.fillRect(12 + i * 11, 350, 9, 36);
          ctx.fillRect(14 + i * 11, 408, 9, 36);
        }
        // GOOD MUSIC GOOD PEOPLE 입간판
        ctx.fillStyle = '#f3e5d3';
        drawRoundedRect(ctx, 25, 495, 76, 108, 6);
        ctx.fill();
        ctx.strokeStyle = '#b58d67';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#6e4f35';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('GOOD', 63, 522);
        ctx.fillText('MUSIC', 63, 540);
        ctx.fillText('GOOD', 63, 558);
        ctx.fillText('PEOPLE', 63, 576);
        ctx.fillText('♡', 63, 594);
        ctx.restore();
      }
    },
    // 5) 우측 수납장 & 미니 테이블 (sortY: 575)
    {
      id: 'furniture_right_shelf',
      sortY: 575,
      draw: (ctx) => {
        ctx.save();
        // 우측 수납장
        ctx.fillStyle = '#8b5732';
        ctx.fillRect(1105, 320, 95, 190);
        ctx.fillStyle = '#5e381d';
        ctx.fillRect(1114, 336, 76, 72);
        ctx.fillRect(1114, 418, 76, 76);

        // 우측 원형 미니 테이블 & 모니터
        ctx.fillStyle = '#a86e3e';
        ctx.beginPath();
        ctx.ellipse(1115, 535, 52, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2b2d38';
        ctx.fillRect(1095, 488, 42, 32);
        ctx.restore();
      }
    },
    // 6) 좌하단 원형 티테이블 라운지 (sortY: 720)
    {
      id: 'furniture_lounge',
      sortY: 720,
      draw: (ctx) => {
        ctx.save();
        // 원형 나무 난간
        ctx.strokeStyle = '#7d4d27';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(178, 680, 145, Math.PI * 0.65, Math.PI * 1.85);
        ctx.stroke();

        // 원형 티테이블
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(178, 668, 78, 44, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#b57844';
        ctx.strokeStyle = '#7d4d27';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(178, 650, 76, 42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 테이블 위 펼쳐진 악보 책 & 메트로놈 & 찻잔
        ctx.fillStyle = '#fcf8f0';
        ctx.fillRect(150, 636, 38, 24);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.strokeRect(150, 636, 38, 24);
        // 메트로놈
        ctx.fillStyle = '#6e3b1e';
        ctx.beginPath();
        ctx.moveTo(140, 615);
        ctx.lineTo(152, 642);
        ctx.lineTo(128, 642);
        ctx.closePath();
        ctx.fill();
        // 핑크 & 화이트 스툴 쿠션 의자
        ctx.fillStyle = '#d98a8a';
        ctx.beginPath();
        ctx.ellipse(135, 725, 26, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f0e6d8';
        ctx.beginPath();
        ctx.ellipse(215, 725, 26, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
    // 7) 우하단 공지사항 데스크 & 보드 (sortY: 750)
    {
      id: 'furniture_notice_desk',
      sortY: 750,
      draw: (ctx) => {
        ctx.save();
        // 하단 우측 나무 데스크
        ctx.fillStyle = '#8f5932';
        ctx.beginPath();
        ctx.moveTo(860, 710);
        ctx.lineTo(1180, 650);
        ctx.lineTo(1200, 795);
        ctx.lineTo(860, 795);
        ctx.closePath();
        ctx.fill();

        // 공지사항 보드 프레임
        const bx = 1045;
        const by = 560;
        ctx.fillStyle = '#754624';
        drawRoundedRect(ctx, bx, by, 140, 168, 8);
        ctx.fill();
        ctx.fillStyle = '#f5e8d7';
        drawRoundedRect(ctx, bx + 8, by + 22, 124, 136, 4);
        ctx.fill();

        // 상단 '공지사항' 타이틀
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f7e6d0';
        ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
        ctx.fillText('📌 오늘의 안건', bx + 70, by + 16);

        // 보드 속 손글씨 문구 ("배신자 이민우 20기 재가입 투표")
        ctx.fillStyle = '#2b1810';
        ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
        const defaultLines = ['오늘의 안건', '"배신자 이민우', '20기 재가입 투표"'];
        const lines = noticeText ? noticeText.split('\n') : defaultLines;
        lines.slice(0, 4).forEach((line, idx) => {
          ctx.fillText(line, bx + 70, by + 56 + idx * 24);
        });
        ctx.fillStyle = '#d90429';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('🎄 Hanwoori 20기 🎄', bx + 70, by + 144);
        ctx.restore();
      }
    }
  ];
}

// 3.2.1 크리스마스 눈 내리는 효과 (화이트 크리스마스 풍성한 눈송이 FX)
function drawChristmasSnow(ctx, time) {
  ctx.save();
  for (let i = 0; i < 68; i++) {
    const speed = 25 + (i % 7) * 12;
    const x = ((i * 29 + Math.sin(time * 0.9 + i * 1.6) * 32) % MAP_WIDTH + MAP_WIDTH) % MAP_WIDTH;
    const y = (i * 21 + time * speed) % MAP_HEIGHT;
    const isBig = i % 5 === 0;
    const r = isBig ? 2.8 : 1.4 + (i % 3) * 0.6;
    ctx.fillStyle = isBig ? 'rgba(255, 255, 255, 0.88)' : 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // 큰 눈송이는 부드러운 반짝임 블러
    if (isBig) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// 3.3 퀴즈방 (음악 퀴즈방 / 인물 퀴즈방) 전용 배경 및 함정 바닥(Trapdoor) 렌더러
function drawQuizRoomBackground(ctx, time, gameState, currentQuiz) {
  const isMusic = gameState.activeRoom === 'music';
  // 배경 벽면
  const bgGrad = ctx.createLinearGradient(0, 0, 0, MAP_HEIGHT);
  bgGrad.addColorStop(0, isMusic ? '#3b1d2e' : '#1b2d48');
  bgGrad.addColorStop(1, '#12131a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  // 상단 스테이지 전광판 영역
  ctx.fillStyle = '#1e2230';
  drawRoundedRect(ctx, 80, 18, 1040, 195, 16);
  ctx.fill();
  ctx.strokeStyle = isMusic ? '#ff7eb3' : '#6ec6ff';
  ctx.lineWidth = 4;
  ctx.stroke();

  // 전광판 헤더
  ctx.textAlign = 'center';
  ctx.fillStyle = isMusic ? '#ff9ebb' : '#85d1ff';
  ctx.font = 'bold 20px "Noto Sans KR", sans-serif';
  ctx.fillText(
    isMusic ? '🎵 한우리 20기 음악 퀴즈방 (A / B 서바이벌)' : '👤 한우리 20기 인물 퀴즈방 (A / B 서바이벌)',
    MAP_WIDTH / 2,
    52
  );

  // 현재 문제 텍스트 표시
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 25px "Noto Sans KR", sans-serif';
  const qTitle = currentQuiz ? currentQuiz.title : '사회자가 곧 다음 퀴즈 문제를 출제합니다!';
  ctx.fillText(qTitle, MAP_WIDTH / 2, 95);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '16px "Noto Sans KR", sans-serif';
  const qDesc = currentQuiz ? currentQuiz.desc : 'A 구역(왼쪽) 또는 B 구역(오른쪽)으로 캐릭터를 이동하여 정답을 선택하세요.';
  ctx.fillText(qDesc, MAP_WIDTH / 2, 130);

  // 보기 A vs 보기 B 안내 카드
  if (currentQuiz) {
    // A 보기 배지
    ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
    drawRoundedRect(ctx, 130, 148, 430, 48, 10);
    ctx.fill();
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffe4e6';
    ctx.font = 'bold 18px "Noto Sans KR", sans-serif';
    ctx.fillText(`🅰️ ${currentQuiz.optionA}`, 345, 178);

    // B 보기 배지
    ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
    drawRoundedRect(ctx, 640, 148, 430, 48, 10);
    ctx.fill();
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#dbeafe';
    ctx.font = 'bold 18px "Noto Sans KR", sans-serif';
    ctx.fillText(`🅱️ ${currentQuiz.optionB}`, 855, 178);
  }

  // ==========================================
  // 좌측 A 구역 바닥 & 우측 B 구역 바닥 (오답 시 바닥이 열리는 Trapdoor 연출!)
  // ==========================================
  const isRevealed = gameState.quizPhase === 'revealed' || gameState.quizPhase === 'eliminating';
  const correctAns = currentQuiz?.answer || 'A';
  const trapProgress = gameState.trapdoorOpen ? Math.min(1, gameState.trapdoorProgress || 1) : 0;

  // 1) 심연(Abyss) 어두운 구덩이 먼저 그리기
  ctx.fillStyle = '#07070c';
  ctx.fillRect(60, 235, 1080, 520);
  // 구덩이 내부 격자 깊이감
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let gx = 80; gx < 1140; gx += 45) {
    ctx.beginPath();
    ctx.moveTo(gx, 235);
    ctx.lineTo(gx, 755);
    ctx.stroke();
  }

  // 2) A 구역 바닥 플랫폼 (x: 60 ~ 580, y: 235 ~ 755)
  const aIsWrong = isRevealed && correctAns !== 'A';
  const aOpenRatio = aIsWrong ? trapProgress : 0;
  ctx.save();
  ctx.beginPath();
  ctx.rect(60, 235, 520, 520);
  ctx.clip();

  // 문이 양옆으로 갈라지며 열리는 효과
  const halfW = 260 * (1 - aOpenRatio * 0.92);
  ctx.fillStyle = isRevealed && correctAns === 'A' ? '#be123c' : '#881337';
  ctx.fillRect(60, 235, halfW, 520);
  ctx.fillRect(580 - halfW, 235, halfW, 520);

  // A 구역 네온 테두리 & 대형 A 마크
  ctx.strokeStyle = '#fb7185';
  ctx.lineWidth = 6;
  ctx.strokeRect(64, 239, 512, 512);
  if (aOpenRatio < 0.4) {
    ctx.fillStyle = 'rgba(255, 228, 230, 0.22)';
    ctx.font = 'bold 180px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('A', 320, 540);
    ctx.font = 'bold 24px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#fecdd3';
    ctx.fillText(currentQuiz ? currentQuiz.optionA : 'A 구역', 320, 610);
  }
  ctx.restore();

  // 3) B 구역 바닥 플랫폼 (x: 620 ~ 1140, y: 235 ~ 755)
  const bIsWrong = isRevealed && correctAns !== 'B';
  const bOpenRatio = bIsWrong ? trapProgress : 0;
  ctx.save();
  ctx.beginPath();
  ctx.rect(620, 235, 520, 520);
  ctx.clip();

  const bHalfW = 260 * (1 - bOpenRatio * 0.92);
  ctx.fillStyle = isRevealed && correctAns === 'B' ? '#1d4ed8' : '#1e3a8a';
  ctx.fillRect(620, 235, bHalfW, 520);
  ctx.fillRect(1140 - bHalfW, 235, bHalfW, 520);

  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 6;
  ctx.strokeRect(624, 239, 512, 512);
  if (bOpenRatio < 0.4) {
    ctx.fillStyle = 'rgba(219, 234, 254, 0.22)';
    ctx.font = 'bold 180px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('B', 880, 540);
    ctx.font = 'bold 24px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#bfdbfe';
    ctx.fillText(currentQuiz ? currentQuiz.optionB : 'B 구역', 880, 610);
  }
  ctx.restore();

  // 4) 중앙 중립 경계선 (미선택 시 탈락 구역)
  if (!isRevealed) {
    ctx.fillStyle = '#334155';
    ctx.fillRect(580, 235, 40, 520);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('중립', 600, 480);
    ctx.fillText('탈락', 600, 500);
  }
}

// 3.4 귀여운 2D SD 아바타 독립 렌더러 (이동/대기/환호/추락 애니메이션 + 동적 닉네임)
function drawChibiAvatar(ctx, player, isMe, time) {
  const preset = AVATAR_PRESETS.find((p) => p.id === player.avatarId) || AVATAR_PRESETS[0];
  const { x, y, dir = 'down', isMoving = false, status = 'alive', fallProgress = 0, emote = null } = player;

  ctx.save();

  // 탈락 추락 중일 때 회전 및 축소 연출
  if (status === 'falling') {
    const scale = Math.max(0.05, 1 - fallProgress * 0.95);
    ctx.translate(x, y + fallProgress * 170);
    ctx.rotate(fallProgress * Math.PI * 5);
    ctx.scale(scale, scale);
  } else {
    ctx.translate(x, y);
  }

  // 관전자(탈락자) 반투명 처리
  if (status === 'spectator') {
    ctx.globalAlpha = 0.42;
  }

  // 걷기/대기/환호 애니메이션 오프셋 계산
  const walkCycle = isMoving ? Math.sin(time * 14) : 0;
  const idleCycle = Math.sin(time * 3.2 + (player.seed || 0)) * 1.8;
  const cheerJump = status === 'cheering' || emote === '🙌' ? Math.abs(Math.sin(time * 10)) * -14 : 0;
  const bodyY = (isMoving ? Math.abs(walkCycle) * -5 : idleCycle) + cheerJump;

  // 1) 바닥 그림자 (추락 중에는 작아짐)
  if (status !== 'falling') {
    ctx.fillStyle = isMe ? 'rgba(250, 204, 21, 0.45)' : 'rgba(30, 15, 5, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 2, isMe ? 22 : 17, isMe ? 9 : 7, 0, 0, Math.PI * 2);
    ctx.fill();
    if (isMe) {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // 2) 아바타 렌더링: 4방향 워킹 프레임 우선 → 단일 스프라이트 → 캔버스 폴백
  const spriteKey = preset.sprite || AVATAR_ID_MAP[player.avatarId] || player.avatarId;

  // 2a) 4방향 워킹 애니메이션 프레임 시도
  const walkFrame = getWalkFrame(spriteKey, dir, time, isMoving);
  if (walkFrame) {
    ctx.save();
    const targetH = spriteKey === 'puppy' ? 52 : 72;
    const targetW = walkFrame.naturalWidth * (targetH / walkFrame.naturalHeight);
    ctx.drawImage(walkFrame, -targetW / 2, -targetH + bodyY, targetW, targetH);
    ctx.restore();
  } else {
    // 2b) 단일 스프라이트 폴백 (방향별 좌우 반전 처리)
    const spriteImg = AVATAR_SPRITES[spriteKey];
    const isSpriteLoaded = spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0;

    if (isSpriteLoaded) {
      ctx.save();
      if (dir === 'left') ctx.scale(-1, 1);
      const targetH = spriteKey === 'puppy' ? 48 : 64;
      const targetW = spriteImg.naturalWidth * (targetH / spriteImg.naturalHeight);
      ctx.drawImage(spriteImg, -targetW / 2, -targetH + bodyY, targetW, targetH);
      ctx.restore();
    } else {
    // 2) 뒷머리 (롱헤어/트윈테일 등 - 폴백)
    ctx.fillStyle = preset.hairColor;
    if (['wavy_long', 'long_straight', 'half_tie'].includes(preset.hair)) {
      ctx.beginPath();
      ctx.ellipse(0, bodyY - 26, 20, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (preset.hair === 'twintail') {
      ctx.beginPath();
      ctx.ellipse(-20, bodyY - 28, 8, 15, 0.3, 0, Math.PI * 2);
      ctx.ellipse(20, bodyY - 28, 8, 15, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3) 귀여운 SD 다리 & 신발 애니메이션
    const leftFootY = bodyY - 6 + walkCycle * 5;
    const rightFootY = bodyY - 6 - walkCycle * 5;
    ctx.fillStyle = '#2b211b';
    ctx.beginPath();
    ctx.ellipse(-6, leftFootY, 5.5, 4.5, 0, 0, Math.PI * 2);
    ctx.ellipse(6, rightFootY, 5.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4) SD 몸통 / 의상 (파스텔 코트, 원피스, 정장 등)
    ctx.fillStyle = preset.outfit;
    ctx.strokeStyle = '#3b281e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-11, bodyY - 25);
    ctx.lineTo(11, bodyY - 25);
    ctx.quadraticCurveTo(15, bodyY - 9, 13, bodyY - 8);
    ctx.lineTo(-13, bodyY - 8);
    ctx.quadraticCurveTo(-15, bodyY - 9, -11, bodyY - 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 하의/치마 포인트
    ctx.fillStyle = preset.bottom;
    ctx.fillRect(-11, bodyY - 12, 22, 4);

    // 넥타이/리본/지휘봉 액세서리
    if (preset.acc === 'tie' || preset.acc === 'bowtie') {
      ctx.fillStyle = '#e63946';
      ctx.fillRect(-2, bodyY - 23, 4, 8);
    } else if (preset.acc === 'ribbon' || preset.acc === 'bow') {
      ctx.fillStyle = '#ff758f';
      ctx.beginPath();
      ctx.arc(0, bodyY - 22, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5) 양팔 흔들기 (환호 시 만세)
    const armSwing = isMoving ? walkCycle * 6 : 0;
    ctx.fillStyle = preset.outfit;
    ctx.strokeStyle = '#3b281e';
    ctx.lineWidth = 1.8;
    // 왼팔
    ctx.beginPath();
    if (status === 'cheering' || emote === '🙌') {
      ctx.ellipse(-15, bodyY - 28, 4.5, 8, -0.5, 0, Math.PI * 2);
    } else {
      ctx.ellipse(-14, bodyY - 18 + armSwing, 4.5, 7, 0.2, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
    // 오른팔
    ctx.beginPath();
    if (status === 'cheering' || emote === '🙌') {
      ctx.ellipse(15, bodyY - 28, 4.5, 8, 0.5, 0, Math.PI * 2);
    } else {
      ctx.ellipse(14, bodyY - 18 - armSwing, 4.5, 7, -0.2, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();

    // 지휘자일 경우 오른손에 지휘봉 표시
    if (preset.acc === 'baton') {
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, bodyY - 20);
      ctx.lineTo(26, bodyY - 32 + Math.sin(time * 8) * 4);
      ctx.stroke();
    }

    // 6) 동글동글한 SD 얼굴
    const headY = bodyY - 40;
    const dirOffsetX = dir === 'left' ? -2.5 : dir === 'right' ? 2.5 : 0;

    ctx.fillStyle = preset.skin;
    ctx.strokeStyle = '#3b281e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, headY, 17.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 7) 눈, 볼터치, 표정 (방향이 위쪽 'up'이 아닐 때만 얼굴 이목구비 표시)
    if (dir !== 'up') {
      ctx.fillStyle = 'rgba(255, 130, 150, 0.55)';
      ctx.beginPath();
      ctx.ellipse(-9 + dirOffsetX, headY + 4, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.ellipse(9 + dirOffsetX, headY + 4, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      const isBlinking = Math.sin(time * 2.5 + (player.seed || 1)) > 0.96;
      ctx.fillStyle = '#261811';
      ctx.strokeStyle = '#261811';
      ctx.lineWidth = 2;

      if (status === 'falling') {
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('> <', dirOffsetX, headY + 3);
      } else if (isBlinking || status === 'cheering') {
        ctx.beginPath();
        ctx.arc(-6.5 + dirOffsetX, headY + 1, 3.5, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(6.5 + dirOffsetX, headY + 1, 3.5, Math.PI, 0);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(-6.5 + dirOffsetX, headY + 1, 3, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(6.5 + dirOffsetX, headY + 1, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-7.5 + dirOffsetX, headY - 1, 1.3, 0, Math.PI * 2);
        ctx.arc(5.5 + dirOffsetX, headY - 1, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      if (preset.acc === 'glasses') {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(-11 + dirOffsetX, headY - 3, 8, 6);
        ctx.strokeRect(3 + dirOffsetX, headY - 3, 8, 6);
        ctx.beginPath();
        ctx.moveTo(-3 + dirOffsetX, headY);
        ctx.lineTo(3 + dirOffsetX, headY);
        ctx.stroke();
      }

      ctx.strokeStyle = '#7c4032';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(dirOffsetX, headY + 5.5, 2.2, 0, Math.PI);
      ctx.stroke();
    }

    // 8) 앞머리 & 정수리 헤어스타일
    ctx.fillStyle = preset.hairColor;
    ctx.strokeStyle = '#3b281e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    if (dir === 'up') {
      ctx.arc(0, headY, 18.2, 0, Math.PI * 2);
    } else {
      ctx.arc(0, headY - 4, 18, Math.PI * 0.92, Math.PI * 2.08);
      ctx.quadraticCurveTo(8, headY - 6, 0, headY - 3);
      ctx.quadraticCurveTo(-8, headY - 6, -17, headY - 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (preset.acc === 'beret') {
      ctx.fillStyle = '#e6ccb2';
      ctx.strokeStyle = '#5c4028';
      ctx.beginPath();
      ctx.ellipse(2, headY - 16, 16, 7, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore();

  // 9) 머리 위 이모티콘 버블 & 동적 참가자 닉네임 배지 (절대 배경에 고정되지 않은 실시간 레이어)
  if (status !== 'falling' && player.nickname) {
    ctx.save();
    const tagY = y + bodyY - 68;

    if (emote) {
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(emote, x, tagY - 18 + Math.sin(time * 8) * 3);
    }

    ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
    const displayNick = status === 'spectator' ? `👻 ${player.nickname}` : player.nickname;
    const textWidth = ctx.measureText(displayNick).width;
    const pillW = Math.max(46, textWidth + 18);
    const pillH = 22;

    ctx.fillStyle = isMe ? 'rgba(20, 83, 45, 0.92)' : 'rgba(28, 25, 23, 0.78)';
    drawRoundedRect(ctx, x - pillW / 2, tagY - pillH / 2, pillW, pillH, 11);
    ctx.fill();

    ctx.strokeStyle = isMe ? '#4ade80' : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = isMe ? 2 : 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isMe ? '#fef08a' : '#ffffff';
    ctx.fillText(displayNick, x, tagY + 0.5);
    ctx.restore();
  }
}

// 3.5 아바타 선택용 실물 미니 컴포넌트 (일러스트 크롭 실물 스프라이트 렌더링)
function AvatarThumbnail({ avatarId, size = 64 }) {
  const preset = AVATAR_PRESETS.find((p) => p.id === avatarId) || AVATAR_PRESETS[0];
  const spriteKey = preset?.sprite || AVATAR_ID_MAP[avatarId] || avatarId;

  return (
    <div
      className="flex items-center justify-center overflow-hidden"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <img
        src={`${import.meta.env.BASE_URL}avatars/${spriteKey}.png?v=20261126_v2`}
        alt={preset?.name || avatarId}
        className="max-w-full max-h-full object-contain drop-shadow pointer-events-none select-none transition-transform hover:scale-105"
      />
    </div>
  );
}

// 관리자 시뮬레이션용 AI 단원 봇 생성 헬퍼 (기본 꺼짐)
function createInitialBots() {
  const initialSpots = [
    { presetIdx: 15, x: 545, y: 315 },
    { presetIdx: 0, x: 310, y: 505 },
    { presetIdx: 1, x: 535, y: 655 },
    { presetIdx: 2, x: 405, y: 565 },
    { presetIdx: 3, x: 795, y: 745 },
    { presetIdx: 4, x: 585, y: 560 },
    { presetIdx: 5, x: 880, y: 645 },
    { presetIdx: 6, x: 430, y: 685 },
    { presetIdx: 7, x: 960, y: 525 },
    { presetIdx: 8, x: 175, y: 495 },
    { presetIdx: 9, x: 350, y: 770 },
    { presetIdx: 10, x: 775, y: 575 },
    { presetIdx: 11, x: 995, y: 745 },
    { presetIdx: 12, x: 465, y: 430 },
    { presetIdx: 13, x: 640, y: 495 },
    { presetIdx: 14, x: 840, y: 445 },
    { presetIdx: 16, x: 600, y: 610 },
  ];
  return initialSpots.map((spot, idx) => {
    const p = AVATAR_PRESETS[spot.presetIdx] || AVATAR_PRESETS[0];
    return {
      id: `bot_${p.id}_${idx}`,
      nickname: `AI단원 ${idx + 1}`,
      avatarId: p.id,
      isBot: true,
      room: 'lobby',
      x: spot.x,
      y: spot.y,
      targetX: null,
      targetY: null,
      dir: 'down',
      isMoving: false,
      status: 'alive',
      fallProgress: 0,
      selectedChoice: null,
      score: 0,
      correctCount: 0,
      wins: 0,
      gamesPlayed: 1,
      emote: null,
      seed: idx * 1.7
    };
  });
}

// ==========================================
// 4. MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  // 화면 모드: 'player' (참가자 /), 'admin' (사회자 /admin), 'screen' (행사장 스크린 /screen)
  const [viewMode, setViewMode] = useState('player');
  const [user, setUser] = useState(null);

  // 참가자 본인 프로필 및 입장 상태
  const [hasJoined, setHasJoined] = useState(false);
  const [userNameInput, setUserNameInput] = useState('');
  const [phoneLast4Input, setPhoneLast4Input] = useState('');
  const [loginAvatarId, setLoginAvatarId] = useState(() => {
    return AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)].id;
  });
  const [myNickname, setMyNickname] = useState('');
  const [myPhoneLast4, setMyPhoneLast4] = useState('');
  const [myAvatarId, setMyAvatarId] = useState('yejin');
  const [myId, setMyId] = useState(() => 'p_' + Math.random().toString(36).slice(2, 9));

  // Phase 1 검증용 디버그 오버레이 토글 (충돌 영역 / Y-Sorting 기준선 / 원본 구성 체크리스트)
  const [showCollisionDebug, setShowCollisionDebug] = useState(false);
  const [showPhase1Modal, setShowPhase1Modal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  // 퀴즈 문제 목록 상태 (관리자 추가/수정 가능)
  const [quizzes, setQuizzes] = useState(INITIAL_QUIZZES);

  // 통합 서버 게임 상태 (Socket.IO / Firestore / BroadcastChannel 동기화)
  const [gameState, setGameState] = useState({
    activeRoom: 'lobby',      // 'lobby' | 'music' | 'person'
    openRoom: 'music',        // 로비에서 현재 열려있는 포털: 'none' | 'music' | 'person'
    quizPhase: 'waiting',     // 'waiting' | 'question' | 'locked' | 'revealed' | 'winner'
    currentQuizId: 'm1',
    timer: 15,
    maxTimer: 15,
    autoMode: false,          // 사회자 자동 진행 여부
    trapdoorOpen: false,
    trapdoorProgress: 0,
    noticeText: '오늘의 안건\n"배신자 이민우\n20기 재가입 투표"',
    scorePerCorrect: 10,
    winnerBonus: 50,
    lastWinnerName: '',
  });

  // 참가자 전체 목록 (기본은 빈 배열 - 실제 로그인한 단원들만 실시간으로 등장하여 활동합니다)
  const [players, setPlayers] = useState([]);
  const [botsEnabled, setBotsEnabled] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(true);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [newQuizForm, setNewQuizForm] = useState({
    room: 'music',
    title: '',
    desc: '',
    optionA: '',
    optionB: '',
    answer: 'A',
    duration: 15
  });

  // 키보드 및 모바일 조이스틱 입력 Ref
  const keysPressedRef = useRef({});
  const joystickVectorRef = useRef({ dx: 0, dy: 0, active: false });
  const canvasRef = useRef(null);
  const animTimeRef = useRef(0);
  const broadcastRef = useRef(null);

  // 현재 선택된 문제 객체
  const currentQuiz = useMemo(
    () => quizzes.find((q) => q.id === gameState.currentQuizId) || quizzes[0],
    [quizzes, gameState.currentQuizId]
  );

  // 내 캐릭터 객체
  const myPlayer = useMemo(
    () => players.find((p) => p.id === myId) || null,
    [players, myId]
  );

  // 현재 접속 중인 활성 플레이어 목록 (예진봇/과거 유령 세션 원천 차단 & 닉네임 유일성 보장)
  const activePlayers = useMemo(() => {
    const now = Date.now();
    const map = new Map();
    players.forEach((p) => {
      // 1. 봇 비활성 시 모든 봇 완전 차단
      if (p.isBot && !botsEnabled) return;
      // 2. 닉네임 없는 더미 차단
      if (!p.nickname) return;
      // 3. 내 자신은 로그인 완료 전까지 렌더링 제외 (스크린 모드 제외)
      if (p.id === myId && !hasJoined && viewMode !== 'screen') return;
      // 4. 내 자신이 아닌 다른 세션은 lastActive가 없거나 30초 이상 비활성이면 오프라인 간주하여 제외 (유령 예진 완벽 차단!)
      if (p.id !== myId) {
        if (!p.lastActive || (now - p.lastActive > 30000)) return;
      }

      // 5. 동일 닉네임은 무조건 최신 활동 세션 1개만 허용
      const existing = map.get(p.nickname);
      if (!existing || (p.lastActive || 0) > (existing.lastActive || 0)) {
        map.set(p.nickname, p);
      }
    });
    return Array.from(map.values());
  }, [players, botsEnabled, myId, hasJoined, viewMode]);

  // ==========================================
  // 5. FIREBASE & MULTI-TAB REALTIME SYNC
  // ==========================================
  const lastPlayerSyncTimeRef = useRef(0);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.warn('Firebase Auth warning:', e);
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // 브라우저 탭 간 실시간 동기화 (BroadcastChannel)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('hanwoori_choir_party_channel');
      bc.onmessage = (ev) => {
        const { type, payload } = ev.data || {};
        if (type === 'SYNC_GAME_STATE') {
          setGameState((prev) => ({ ...prev, ...payload }));
        } else if (type === 'SYNC_PLAYER_MOVE') {
          setPlayers((prev) => {
            const exists = prev.some((p) => p.id === payload.id);
            if (!exists) return [...prev, payload];
            return prev.map((p) => (p.id === payload.id ? { ...p, ...payload } : p));
          });
        } else if (type === 'SYNC_ALL_PLAYERS') {
          setPlayers(payload);
        }
      };
      broadcastRef.current = bc;
      return () => bc.close();
    }
  }, []);

  // Firestore 게임 상태 브로드캐스트 & 저장
  const broadcastState = useCallback((newState) => {
    setGameState((prev) => {
      const updated = typeof newState === 'function' ? newState(prev) : { ...prev, ...newState };
      if (broadcastRef.current) {
        broadcastRef.current.postMessage({ type: 'SYNC_GAME_STATE', payload: updated });
      }
      if (db && user) {
        const stateRef = doc(db, 'hanwoori_party', 'gameState');
        setDoc(stateRef, updated, { merge: true }).catch((err) => console.warn('GameState save error:', err));
      }
      return updated;
    });
  }, [user]);

  // Firestore 게임 상태 실시간 구독
  useEffect(() => {
    if (!db || !user) return;
    const stateRef = doc(db, 'hanwoori_party', 'gameState');
    const unsub = onSnapshot(
      stateRef,
      (snap) => {
        if (snap.exists()) {
          setGameState((prev) => ({ ...prev, ...snap.data() }));
        }
      },
      (err) => console.warn('Firestore snapshot warning:', err)
    );
    return () => unsub();
  }, [user]);

  // Firestore 플레이어 실시간 동기화 헬퍼 (쓰로틀링 적용)
  const syncPlayerToFirestore = useCallback((playerData, force = false) => {
    if (!db || !user || !playerData) return;
    const now = performance.now();
    if (!force && now - lastPlayerSyncTimeRef.current < 150) {
      return; // 쓰로틀링 (150ms 이내 중복 전송 방지)
    }
    lastPlayerSyncTimeRef.current = now;
    const playerDocRef = doc(db, 'hanwoori_party_players', playerData.id);
    setDoc(playerDocRef, playerData, { merge: true }).catch((err) => console.warn('Player sync error:', err));
  }, [user]);

  // Firestore 전체 플레이어 실시간 구독 (스마트폰 & PC & 스크린 실시간 크로스 디바이스 연동)
  useEffect(() => {
    if (!db || !user) return;
    const playersColRef = collection(db, 'hanwoori_party_players');
    const unsub = onSnapshot(
      playersColRef,
      (snap) => {
        const now = Date.now();
        const remotePlayers = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          // 1. 관리자가 봇을 활성화하지 않았는데 봇 문서가 남아있으면 Firestore에서 즉시 영구 삭제
          if (data.isBot && !botsEnabled) {
            deleteDoc(doc(db, 'hanwoori_party_players', docSnap.id)).catch(() => {});
            return;
          }
          // 2. lastActive가 없거나 30초 이상 비활성인 유령 세션(과거의 예진 등)은 Firestore에서 자동 영구 삭제
          if (data.id !== myId && (!data.lastActive || (now - data.lastActive > 30000))) {
            deleteDoc(doc(db, 'hanwoori_party_players', docSnap.id)).catch(() => {});
            return;
          }
          remotePlayers.push(data);
        });

        setPlayers((prev) => {
          const map = new Map();
          // 1. 봇이 활성화되어 있을 때만 기존 봇 유지
          if (botsEnabled) {
            prev.filter((p) => p.isBot).forEach((bot) => map.set(bot.id, bot));
          }

          // 2. 원격 플레이어 적용 (동일 닉네임 중복 완벽 제거 & 내 캐릭터 단일화)
          remotePlayers.forEach((rp) => {
            const isMe = rp.id === myId || (myNickname && rp.nickname === myNickname);
            if (isMe) {
              const current = prev.find((p) => p.id === myId || p.nickname === myNickname) || rp;
              map.set(myId, {
                ...current,
                id: myId,
                nickname: myNickname || rp.nickname,
                score: rp.score !== undefined ? rp.score : current.score,
                wins: rp.wins !== undefined ? rp.wins : current.wins,
                correctCount: rp.correctCount !== undefined ? rp.correctCount : current.correctCount,
                status: rp.status || current.status,
                lastActive: Date.now()
              });
            } else {
              // 다른 단원: 동일 닉네임 중복 제거 (가장 최근 1개만 유지)
              const existingWithSameNick = Array.from(map.values()).find((p) => p.nickname === rp.nickname);
              if (!existingWithSameNick) {
                map.set(rp.id, rp);
              }
            }
          });
          return Array.from(map.values());
        });
      },
      (err) => console.warn('Firestore players snapshot warning:', err)
    );
    return () => unsub();
  }, [user, myId, myNickname, botsEnabled]);

  // 내 활성 상태 주기적 하트비트 전송 (15초마다 lastActive 갱신)
  useEffect(() => {
    if (!hasJoined || !myId || !myNickname) return;
    const interval = setInterval(() => {
      const me = players.find((p) => p.id === myId);
      if (me) {
        syncPlayerToFirestore({ ...me, lastActive: Date.now() }, false);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [hasJoined, myId, myNickname, players, syncPlayerToFirestore]);

  // ==========================================
  // 6. COLLISION DETECTION & MOVEMENT ENGINE
  // ==========================================
  const isPositionBlocked = useCallback((nx, ny, room) => {
    // 화면 경계 체크
    if (nx < 55 || nx > MAP_WIDTH - 55 || ny < 245 || ny > MAP_HEIGHT - 30) {
      return true;
    }
    if (room === 'lobby') {
      for (const obs of LOBBY_OBSTACLES) {
        if (nx >= obs.x && nx <= obs.x + obs.w && ny >= obs.y && ny <= obs.y + obs.h) {
          return true;
        }
      }
    }
    return false;
  }, []);

  // 로컬 스토리지에서 이전 입력 정보 복원 (자동 입장은 하지 않고 입력 필드 편의만 제공)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hanwoori_user_profile');
      if (saved) {
        const { name, phone, avatarId } = JSON.parse(saved);
        if (name) {
          setUserNameInput(name);
          setPhoneLast4Input(phone || '');
          if (avatarId) {
            setLoginAvatarId(avatarId);
            setMyAvatarId(avatarId);
          }
        }
      }
    } catch (e) {
      console.warn('Profile restore error:', e);
    }
  }, []);

  // 로그인 화면에서 [이름 - 휴대폰 뒷번호] 입력 후 단원 명단 검증 및 입장
  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault();
    const cleanName = userNameInput.trim().replace(/\s+/g, '');
    const cleanPhone = phoneLast4Input.trim().slice(-4);

    if (!cleanName) {
      alert('본인 이름을 입력해주세요! (예: 최예진 또는 예진)');
      return;
    }

    // 1. 단원 명단 대조 (전체 이름 또는 성 제외 이름 일치 확인)
    const member = OFFICIAL_MEMBERS.find(
      (m) => m.name === cleanName || m.shortName === cleanName
    );

    if (!member) {
      alert(`[${userNameInput}] 님은 한우리 20기 단원 명단에서 찾을 수 없습니다.\n본인 성함을 다시 한번 확인해주세요! (예: 최예진, 송주아 등)`);
      return;
    }

    // 2. 휴대폰 뒷번호 대조 (황동원 단원은 뒷번호 미등록이므로 번호 없이도 통과 허용)
    if (member.phone) {
      if (!cleanPhone || cleanPhone.length < 4) {
        alert('휴대폰 뒷번호 4자리를 입력해주세요!');
        return;
      }
      if (cleanPhone !== member.phone) {
        alert(`[${member.name}] 단원님의 등록된 휴대폰 뒷번호와 일치하지 않습니다.\n뒷번호 4자리를 다시 확인해주세요!`);
        return;
      }
    }

    // 관리자(김석준 - 2918) 로그인 시 관리자 권한 활성화
    if (member.isAdmin) {
      setAdminUnlocked(true);
    }

    const assignedAvatarId = loginAvatarId || member.avatarId || AVATAR_PRESETS[0].id;
    const finalNick = member.name;
    const finalPhone = cleanPhone || member.phone || '0000';
    const playerId = `u_${finalPhone}_${member.name}`;

    setMyId(playerId);
    setMyNickname(finalNick);
    setMyPhoneLast4(finalPhone);
    setMyAvatarId(assignedAvatarId);
    setHasJoined(true);
    soundFX.playFanfare();

    try {
      localStorage.setItem('hanwoori_user_profile', JSON.stringify({
        id: playerId,
        name: finalNick,
        phone: finalPhone,
        avatarId: assignedAvatarId,
        isAdmin: member.isAdmin || false
      }));
    } catch (err) {}

    setPlayers((prev) => {
      // 내 닉네임과 일치하는 과거/임시 캐릭터 전부 청소 후 내 캐릭터 1개만 등록
      const filtered = prev.filter((p) => p.id !== playerId && p.nickname !== finalNick);
      const existing = prev.find((p) => p.id === playerId || p.nickname === finalNick);
      const myData = existing
        ? { ...existing, id: playerId, nickname: finalNick, avatarId: assignedAvatarId, lastActive: Date.now() }
        : {
            id: playerId,
            nickname: finalNick,
            avatarId: assignedAvatarId,
            isBot: false,
            room: gameState.activeRoom,
            x: 580 + (Math.random() * 60 - 30),
            y: 650 + (Math.random() * 40 - 20),
            targetX: null,
            targetY: null,
            dir: 'up',
            isMoving: false,
            status: 'alive',
            fallProgress: 0,
            selectedChoice: null,
            score: 0,
            correctCount: 0,
            wins: 0,
            gamesPlayed: 1,
            emote: '🎵',
            seed: Math.random() * 10,
            lastActive: Date.now()
          };

      if (broadcastRef.current) {
        broadcastRef.current.postMessage({ type: 'SYNC_PLAYER_MOVE', payload: myData });
      }
      syncPlayerToFirestore(myData, true);
      return [...filtered, myData];
    });

    if (member.isAdmin) {
      alert(`환영합니다, 관리자 ${member.name}님!\n사회자 콘솔(/admin)과 스크린 모드를 이용하실 수 있습니다.`);
    }
  };

  // 로비에서 내 이름만 즉시 수정
  const handleUpdateMyName = (e) => {
    if (e) e.preventDefault();
    const cleanName = myNickname.trim();
    if (!cleanName) return;
    soundFX.playSelect();

    try {
      const saved = localStorage.getItem('hanwoori_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        localStorage.setItem('hanwoori_user_profile', JSON.stringify({
          ...parsed,
          name: cleanName
        }));
      }
    } catch (err) {}

    setPlayers((prev) => {
      const existing = prev.find((p) => p.id === myId);
      if (!existing) return prev;
      const updated = { ...existing, nickname: cleanName };
      syncPlayerToFirestore(updated, true);
      return prev.map((p) => (p.id === myId ? updated : p));
    });
    alert('이름이 성공적으로 변경되었습니다!');
  };

  // 다른 사람으로 로그인 (로그아웃)
  const handleLogout = () => {
    if (window.confirm('다른 사람으로 다시 로그인하시겠습니까?')) {
      try {
        localStorage.removeItem('hanwoori_user_profile');
      } catch (e) {}
      setHasJoined(false);
      setUserNameInput('');
      setPhoneLast4Input('');
    }
  };

  // 키보드 WASD / 방향키 이벤트 리스너
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'w', 'arrowdown', 's', 'arrowleft', 'a', 'arrowright', 'd'].includes(k)) {
        keysPressedRef.current[k] = true;
      }
    };
    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase();
      keysPressedRef.current[k] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 퀴즈방 A / B 버튼 터치 시 해당 구역으로 자동 이동 (방식 B)
  // 수동 조작(조이스틱/키보드) 입력 시 즉시 자동 이동 취소되고 수동 조작으로 전환됨!
  const handleSelectZoneAutoWalk = (zone) => {
    if (!myPlayer || myPlayer.status !== 'alive') return;
    if (gameState.quizPhase === 'locked' || gameState.quizPhase === 'revealed') return;

    soundFX.playSelect();
    const targetX = zone === 'A' ? 280 + (Math.random() * 120 - 60) : 900 + (Math.random() * 120 - 60);
    const targetY = 470 + (Math.random() * 140 - 70);

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === myId) {
          const updated = { ...p, targetX, targetY, selectedChoice: zone };
          syncPlayerToFirestore(updated, true);
          return updated;
        }
        return p;
      })
    );
  };

  // 로비에서 개방된 퀴즈방 출입문으로 자동 이동 및 입장
  const handleWalkToPortal = (portalKey) => {
    const portal = PORTALS[portalKey];
    if (!portal) return;
    soundFX.playSelect();
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === myId
          ? { ...p, targetX: portal.entryX, targetY: portal.entryY }
          : p
      )
    );
  };

  // 감정표현 이모티콘 발송
  const triggerEmote = (emoji) => {
    soundFX.playSelect();
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === myId) {
          const updated = { ...p, emote: emoji };
          syncPlayerToFirestore(updated, true);
          return updated;
        }
        return p;
      })
    );
    setTimeout(() => {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === myId && p.emote === emoji) {
            const cleared = { ...p, emote: null };
            syncPlayerToFirestore(cleared, true);
            return cleared;
          }
          return p;
        })
      );
    }, 2500);
  };

  // ==========================================
  // 7. QUIZ TIMER & SERVER AUTHORITATIVE JUDGE
  // ==========================================
  // 정답 공개 및 오답 구역 바닥 개방 (서버 판정)
  const executeRevealAndEliminate = useCallback(() => {
    const ans = currentQuiz?.answer || 'A';
    soundFX.playTrapdoorDrop();

    broadcastState((prev) => ({
      ...prev,
      quizPhase: 'revealed',
      trapdoorOpen: true,
      trapdoorProgress: 1
    }));

    setPlayers((prevPlayers) => {
      // 현재 퀴즈방에 살아있는 참가자들 확인
      const aliveInRoom = prevPlayers.filter((p) => p.status === 'alive');
      // 서버가 각 캐릭터의 최종 구역(A: x < 580, B: x > 620)을 기준으로 엄격 판정
      const survivors = aliveInRoom.filter((p) => {
        const zone = p.x < 580 ? 'A' : p.x > 620 ? 'B' : 'NONE';
        return zone === ans;
      });

      return prevPlayers.map((p) => {
        if (p.status !== 'alive') return p;
        const finalZone = p.x < 580 ? 'A' : p.x > 620 ? 'B' : 'NONE';
        const isCorrect = finalZone === ans;

        if (isCorrect) {
          return {
            ...p,
            status: 'cheering',
            selectedChoice: finalZone,
            score: p.score + (gameState.scorePerCorrect || 10),
            correctCount: p.correctCount + 1,
            emote: '🎉'
          };
        } else {
          return {
            ...p,
            status: 'falling',
            selectedChoice: finalZone,
            fallProgress: 0.02,
            emote: '😱'
          };
        }
      });
    });

    // 2.6초 후 추락한 오답자들을 관전자 모드로 전환하고 생존자 수 체크
    setTimeout(() => {
      setPlayers((prevPlayers) => {
        const updated = prevPlayers.map((p) => {
          if (p.status === 'falling') {
            return { ...p, status: 'spectator', fallProgress: 1, isMoving: false, targetX: null, targetY: null };
          }
          if (p.status === 'cheering') {
            return { ...p, status: 'alive', emote: null };
          }
          return p;
        });

        const remainingAlive = updated.filter((p) => p.status === 'alive');
        if (remainingAlive.length === 1) {
          // 최후의 생존자 1명 결정 -> 즉시 우승 처리!
          const winner = remainingAlive[0];
          soundFX.playFanfare();
          broadcastState((st) => ({
            ...st,
            quizPhase: 'winner',
            lastWinnerName: winner.nickname
          }));
          return updated.map((p) =>
            p.id === winner.id
              ? { ...p, score: p.score + (gameState.winnerBonus || 50), wins: p.wins + 1, emote: '👑' }
              : p
          );
        }
        return updated;
      });
    }, 2600);
  }, [currentQuiz, broadcastState, gameState.scorePerCorrect, gameState.winnerBonus]);

  // 1초 타이머 루프
  useEffect(() => {
    if (gameState.quizPhase !== 'question') return;

    const interval = setInterval(() => {
      setGameState((prev) => {
        if (prev.quizPhase !== 'question') return prev;
        if (prev.timer > 1) {
          soundFX.playTick(prev.timer <= 4);
          return { ...prev, timer: prev.timer - 1 };
        } else {
          // 제한시간 종료 -> 이동 및 선택 잠금 (locked)
          soundFX.playTick(true);
          if (prev.autoMode) {
            setTimeout(() => executeRevealAndEliminate(), 1800);
          }
          return { ...prev, timer: 0, quizPhase: 'locked' };
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.quizPhase, executeRevealAndEliminate]);

  // ==========================================
  // 8. 60FPS GAME ANIMATION & BOT AI LOOP
  // ==========================================
  useEffect(() => {
    let animationFrameId;
    let lastTimestamp = performance.now();

    const updateAndRender = (now) => {
      const dt = Math.min(0.05, (now - lastTimestamp) / 1000);
      lastTimestamp = now;
      animTimeRef.current += dt;
      const time = animTimeRef.current;

      // 키보드/조이스틱 입력 벡터 계산
      const keys = keysPressedRef.current;
      let manualDx = 0;
      let manualDy = 0;
      if (keys['arrowleft'] || keys['a']) manualDx -= 1;
      if (keys['arrowright'] || keys['d']) manualDx += 1;
      if (keys['arrowup'] || keys['w']) manualDy -= 1;
      if (keys['arrowdown'] || keys['s']) manualDy += 1;

      if (joystickVectorRef.current.active) {
        manualDx = joystickVectorRef.current.dx;
        manualDy = joystickVectorRef.current.dy;
      }

      const hasManualInput = Math.abs(manualDx) > 0.05 || Math.abs(manualDy) > 0.05;
      const isMovementLocked =
        gameState.activeRoom !== 'lobby' &&
        (gameState.quizPhase === 'locked' || gameState.quizPhase === 'revealed');

      // 플레이어 및 AI 합창단원 위치 업데이트
      setPlayers((prevPlayers) => {
        let stateChanged = false;
        const nextPlayers = prevPlayers.map((p) => {
          // 추락 애니메이션 진행
          if (p.status === 'falling') {
            stateChanged = true;
            return { ...p, fallProgress: Math.min(1, (p.fallProgress || 0) + dt * 0.75) };
          }

          // 관전자이거나 선택 잠금 시간이면 이동 불가
          if (p.status === 'spectator' || isMovementLocked) {
            if (p.isMoving) {
              stateChanged = true;
              return { ...p, isMoving: false };
            }
            return p;
          }

          let vx = 0;
          let vy = 0;
          let nextTargetX = p.targetX;
          let nextTargetY = p.targetY;

          // 1) 내 캐릭터 조작 처리
          if (p.id === myId) {
            if (!hasJoined && viewMode !== 'screen') {
              return p; // 로그인 전에는 맵에서 이동하지 않음
            }
            if (hasManualInput) {
              // 수동 조작 시 자동 이동(targetX/Y) 즉시 취소
              nextTargetX = null;
              nextTargetY = null;
              const len = Math.hypot(manualDx, manualDy) || 1;
              vx = (manualDx / len) * 210;
              vy = (manualDy / len) * 210;
            } else if (nextTargetX !== null && nextTargetY !== null) {
              const dist = Math.hypot(nextTargetX - p.x, nextTargetY - p.y);
              if (dist < 8) {
                nextTargetX = null;
                nextTargetY = null;
              } else {
                vx = ((nextTargetX - p.x) / dist) * 220;
                vy = ((nextTargetY - p.y) / dist) * 220;
              }
            }
          }
          // 2) AI 합창단원 봇 자율 행동
          else if (p.isBot && botsEnabled) {
            if (nextTargetX !== null && nextTargetY !== null) {
              const dist = Math.hypot(nextTargetX - p.x, nextTargetY - p.y);
              if (dist < 10) {
                nextTargetX = null;
                nextTargetY = null;
              } else {
                vx = ((nextTargetX - p.x) / dist) * 145;
                vy = ((nextTargetY - p.y) / dist) * 145;
              }
            } else if (Math.random() < 0.015) {
              if (gameState.activeRoom === 'lobby') {
                // 로비 산책
                const rx = 180 + Math.random() * 840;
                const ry = 360 + Math.random() * 380;
                if (!isPositionBlocked(rx, ry, 'lobby')) {
                  nextTargetX = rx;
                  nextTargetY = ry;
                }
              } else if (gameState.quizPhase === 'question') {
                // 퀴즈 문제 출제 중이면 A 또는 B 구역으로 이동
                const pickA = Math.random() < 0.55;
                nextTargetX = pickA ? 140 + Math.random() * 360 : 680 + Math.random() * 360;
                nextTargetY = 300 + Math.random() * 380;
              }
            }
          }

          if (vx === 0 && vy === 0) {
            if (p.isMoving || p.targetX !== nextTargetX) {
              stateChanged = true;
              return { ...p, isMoving: false, targetX: nextTargetX, targetY: nextTargetY };
            }
            return p;
          }

          stateChanged = true;
          let nx = p.x + vx * dt;
          let ny = p.y + vy * dt;

          // 충돌 체크 (X축, Y축 슬라이딩 처리)
          if (isPositionBlocked(nx, ny, gameState.activeRoom)) {
            if (!isPositionBlocked(nx, p.y, gameState.activeRoom)) {
              ny = p.y;
            } else if (!isPositionBlocked(p.x, ny, gameState.activeRoom)) {
              nx = p.x;
            } else {
              nx = p.x;
              ny = p.y;
              nextTargetX = null;
              nextTargetY = null;
            }
          }

          // 바라보는 방향 계산
          let dir = p.dir;
          if (Math.abs(vx) > Math.abs(vy)) {
            dir = vx > 0 ? 'right' : 'left';
          } else if (Math.abs(vy) > 0) {
            dir = vy > 0 ? 'down' : 'up';
          }

          // 로비에서 열린 퀴즈방 출입문 포털에 도달했는지 체크
          if (
            p.id === myId &&
            gameState.activeRoom === 'lobby' &&
            gameState.openRoom !== 'none'
          ) {
            const openPortal = PORTALS[gameState.openRoom];
            if (
              openPortal &&
              Math.hypot(nx - openPortal.entryX, ny - openPortal.entryY) < 42
            ) {
              // 포털 입장 트리거!
              setTimeout(() => handleEnterQuizRoom(gameState.openRoom), 50);
            }
          }

          const selectedChoice =
            gameState.activeRoom !== 'lobby'
              ? nx < 580
                ? 'A'
                : nx > 620
                ? 'B'
                : null
              : null;

          return {
            ...p,
            x: nx,
            y: ny,
            dir,
            isMoving: true,
            targetX: nextTargetX,
            targetY: nextTargetY,
            selectedChoice
          };
        });

        if (stateChanged) {
          const me = nextPlayers.find((p) => p.id === myId);
          if (me && me.isMoving) {
            syncPlayerToFirestore(me);
          }
          return nextPlayers;
        }
        return prevPlayers;
      });

      // ==========================================
      // CANVAS RENDERING PIPELINE (Y-Sorting 적용)
      // ==========================================
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

        if (gameState.activeRoom === 'lobby') {
          // 1) 음악실 바닥 & 벽면 & 포털 렌더링
          drawMusicRoomBackground(ctx, time, gameState);

          // 2) Y-Sorting: 가구 오브젝트들과 참가자 아바타들을 Y좌표 기준으로 정렬하여 렌더링
          const furnitureList = getFurnitureDrawables(gameState.noticeText);

          const renderables = [
            ...furnitureList.map((f) => ({ type: 'furniture', sortY: f.sortY, draw: f.draw })),
            ...activePlayers.map((p) => ({
              type: 'avatar',
              sortY: p.y,
              draw: (c) => drawChibiAvatar(c, p, p.id === myId, time)
            }))
          ];

          renderables.sort((a, b) => a.sortY - b.sortY);
          renderables.forEach((item) => item.draw(ctx));

          // 3) Phase 1 검증용 디버그 오버레이 (충돌 히트박스 & Y-Sorting 기준선 표시)
          if (showCollisionDebug) {
            ctx.save();
            LOBBY_OBSTACLES.forEach((obs) => {
              ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
              ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2;
              ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 11px sans-serif';
              ctx.fillText(`충돌:${obs.name} (sortY:${obs.sortY})`, obs.x + 6, obs.y + 16);
            });
            Object.values(PORTALS).forEach((pt) => {
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 3;
              ctx.setLineDash([6, 4]);
              ctx.strokeRect(pt.x, pt.y, pt.w, pt.h);
              ctx.setLineDash([]);
            });
            ctx.restore();
          }
        } else {
          // 퀴즈방 (음악 퀴즈방 / 인물 퀴즈방) 렌더링
          drawQuizRoomBackground(ctx, time, gameState, currentQuiz);

          const sortedPlayers = [...activePlayers].sort((a, b) => a.y - b.y);
          sortedPlayers.forEach((p) => drawChibiAvatar(ctx, p, p.id === myId, time));
        }

        // 로비 및 퀴즈방 전체 크리스마스 흩날리는 눈송이 파티클 FX
        drawChristmasSnow(ctx, time);
      }

      animationFrameId = requestAnimationFrame(updateAndRender);
    };

    animationFrameId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    activePlayers,
    gameState,
    currentQuiz,
    myId,
    showCollisionDebug,
    isPositionBlocked
  ]);

  // ==========================================
  // 9. HOST / ADMIN CONTROL FUNCTIONS
  // ==========================================
  // 특정 퀴즈방으로 전원 입장 또는 개방
  const handleEnterQuizRoom = (roomKey) => {
    soundFX.playSelect();
    const firstRoomQuiz = quizzes.find((q) => q.room === roomKey) || quizzes[0];
    broadcastState({
      activeRoom: roomKey,
      openRoom: roomKey,
      quizPhase: 'waiting',
      currentQuizId: firstRoomQuiz.id,
      timer: firstRoomQuiz.duration || 15,
      maxTimer: firstRoomQuiz.duration || 15,
      trapdoorOpen: false,
      trapdoorProgress: 0
    });

    // 참가자들을 퀴즈방 중앙 대기 위치로 배치
    setPlayers((prev) =>
      prev.map((p, i) => ({
        ...p,
        room: roomKey,
        status: 'alive',
        fallProgress: 0,
        selectedChoice: null,
        targetX: null,
        targetY: null,
        x: 340 + (i % 6) * 100 + (Math.random() * 20 - 10),
        y: 380 + Math.floor(i / 6) * 95
      }))
    );
  };

  // 문제 시작 & 카운트다운 시작
  const handleStartQuestion = (quizId = gameState.currentQuizId) => {
    const targetQuiz = quizzes.find((q) => q.id === quizId) || currentQuiz;
    soundFX.playSelect();
    if (targetQuiz.room === 'music' && targetQuiz.melodyId) {
      soundFX.playSampleMelody(targetQuiz.melodyId);
    }

    broadcastState({
      currentQuizId: targetQuiz.id,
      quizPhase: 'question',
      timer: targetQuiz.duration || 15,
      maxTimer: targetQuiz.duration || 15,
      trapdoorOpen: false,
      trapdoorProgress: 0
    });

    // AI 봇들이 문제 시작과 함께 A 또는 B 구역으로 이동하도록 타겟 부여
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.status !== 'alive') return p;
        if (!p.isBot) return { ...p, targetX: null, targetY: null };
        const pickA = Math.random() < 0.55;
        return {
          ...p,
          targetX: pickA ? 130 + Math.random() * 380 : 670 + Math.random() * 380,
          targetY: 310 + Math.random() * 380
        };
      })
    );
  };

  // 전원 탈락 시 직전 생존자 부활 (예외 규칙 대응)
  const handleReviveAllInRoom = () => {
    soundFX.playFanfare();
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        status: 'alive',
        fallProgress: 0,
        x: 360 + Math.random() * 480,
        y: 380 + Math.random() * 260,
        targetX: null,
        targetY: null
      }))
    );
    broadcastState({
      quizPhase: 'waiting',
      trapdoorOpen: false,
      trapdoorProgress: 0
    });
  };

  // 사회자 수동 개별 단원 즉시 탈락(바닥 추락!) 또는 부활 버튼 핸들러
  const handleTogglePlayerEliminate = (targetPlayerId) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== targetPlayerId) return p;
        if (p.status === 'alive' || p.status === 'cheering') {
          soundFX.playTrapdoorDrop();
          // 2.2초 후 관전자로 전환
          setTimeout(() => {
            setPlayers((curr) =>
              curr.map((item) =>
                item.id === targetPlayerId && item.status === 'falling'
                  ? { ...item, status: 'spectator', fallProgress: 1, isMoving: false }
                  : item
              )
            );
          }, 2200);
          return { ...p, status: 'falling', fallProgress: 0.05, emote: '😱', isMoving: false, targetX: null, targetY: null };
        } else {
          soundFX.playSelect();
          return { ...p, status: 'alive', fallProgress: 0, emote: '✨', x: 600, y: 480 };
        }
      })
    );
  };

  // 현재 문제의 정답(A/B) 즉시 변경 (예: 김다솔 문제에서 사회자가 A/B 정답을 실시간으로 바꿀 때 유용)
  const handleToggleCurrentQuizAnswer = () => {
    if (!currentQuiz) return;
    const nextAns = currentQuiz.answer === 'A' ? 'B' : 'A';
    setQuizzes((prev) =>
      prev.map((q) => (q.id === currentQuiz.id ? { ...q, answer: nextAns } : q))
    );
  };

  // 게임 종료 후 음악실 로비로 전원 복귀
  const handleReturnToLobby = () => {
    soundFX.playSelect();
    broadcastState({
      activeRoom: 'lobby',
      quizPhase: 'waiting',
      trapdoorOpen: false,
      trapdoorProgress: 0
    });

    setPlayers((prev) =>
      prev.map((p, idx) => ({
        ...p,
        room: 'lobby',
        status: 'alive',
        fallProgress: 0,
        selectedChoice: null,
        targetX: null,
        targetY: null,
        gamesPlayed: p.gamesPlayed + 1,
        x: 240 + (idx % 6) * 135,
        y: 440 + Math.floor(idx / 6) * 95
      }))
    );
  };

  // 새 퀴즈 등록
  const handleAddQuiz = (e) => {
    e.preventDefault();
    if (!newQuizForm.title.trim()) return;
    const created = {
      ...newQuizForm,
      id: 'q_' + Date.now(),
      melodyId: newQuizForm.room === 'music' ? 'good_day' : undefined
    };
    setQuizzes((prev) => [...prev, created]);
    setNewQuizForm({
      room: 'music',
      title: '',
      desc: '',
      optionA: '',
      optionB: '',
      answer: 'A',
      duration: 15
    });
  };

  // 실시간 A / B 분포 및 생존자 통계
  const roomStats = useMemo(() => {
    const alive = players.filter((p) => p.status === 'alive' || p.status === 'cheering');
    const spectators = players.filter((p) => p.status === 'spectator' || p.status === 'falling');
    const countA = alive.filter((p) => p.x < 580).length;
    const countB = alive.filter((p) => p.x > 620).length;
    const countNeutral = alive.length - countA - countB;
    return { aliveCount: alive.length, spectatorCount: spectators.length, countA, countB, countNeutral };
  }, [players]);

  // 누적 점수 순위표 정렬
  const sortedLeaderboard = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score || b.wins - a.wins);
  }, [players]);

  // ==========================================
  // 10. VIRTUAL JOYSTICK TOUCH HANDLERS (모바일 조작)
  // ==========================================
  const handleJoystickMove = (dx, dy) => {
    joystickVectorRef.current = { dx, dy, active: true };
  };
  const handleJoystickRelease = () => {
    joystickVectorRef.current = { dx: 0, dy: 0, active: false };
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col select-none overflow-x-hidden">
      {/* ==========================================
          TOP NAVIGATION BAR (참가자 / 사회자 / 대형스크린 전환 및 Phase 1 검증)
      ========================================== */}
      <header className="bg-stone-900/95 border-b border-amber-900/40 px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-30 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center shadow-md">
            <Music className="w-5 h-5 text-stone-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base text-amber-100 tracking-tight">
                삼성 한우리 합창단 20기 송년회 🎄
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                실시간 {players.length}명 접속중
              </span>
              {user ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium hidden sm:inline">
                  🔥 Firebase 연결됨
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700 font-medium hidden sm:inline">
                  📡 로컬 모드
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400 hidden sm:block">
              원본 음악실 완벽 재현 · 독립 SD 아바타 · 실시간 A/B 서바이벌 퀴즈
            </p>
          </div>
        </div>

        {/* 3대 핵심 뷰 전환 탭 (/ , /admin , /screen) */}
        <div className="flex items-center gap-1.5 bg-stone-950/90 p-1 rounded-xl border border-stone-800">
          <button
            onClick={() => setViewMode('player')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'player'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>참가자 화면 (/)</span>
          </button>
          <button
            onClick={() => setViewMode('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'admin'
                ? 'bg-rose-500 text-white shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>사회자 (/admin)</span>
          </button>
          <button
            onClick={() => setViewMode('screen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'screen'
                ? 'bg-sky-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>행사장 스크린 (/screen)</span>
          </button>
        </div>

        {/* 우측 유틸리티 버튼 (Phase 1 검증, 충돌 박스, 순위표, 음소거) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowPhase1Modal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Phase 1~5 검증</span>
          </button>
          <button
            onClick={() => setShowCollisionDebug((v) => !v)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 transition ${
              showCollisionDebug
                ? 'bg-rose-500/25 border-rose-400 text-rose-200'
                : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
            }`}
            title="가구 충돌 영역 및 Y-Sorting 깊이 기준선 보기"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">충돌/레이어</span>
          </button>
          <button
            onClick={() => setShowLeaderboardModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-300 text-xs font-semibold flex items-center gap-1"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>순위표</span>
          </button>
          <button
            onClick={() => {
              soundFX.muted = !soundMuted;
              setSoundMuted(!soundMuted);
            }}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300"
            title="효과음 켜기/끄기"
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* ==========================================
          MAIN CONTENT AREA (뷰 모드에 따른 레이아웃 구성)
      ========================================== */}
      <main className="flex-1 flex flex-col lg:flex-row gap-3 p-2 sm:p-4 max-w-[1600px] w-full mx-auto items-center lg:items-stretch">
        {/* LEFT / CENTER: 실시간 인터랙티브 음악실 & 퀴즈방 캔버스 */}
        <div className="flex-1 flex flex-col items-center justify-center w-full relative">
          {/* 상단 상태 배너 (현재 위치, 타이머, 생존자 현황, 포털 바로가기) */}
          <div className="w-full max-w-[1100px] mb-2 flex flex-wrap items-center justify-between gap-2 bg-stone-900/90 border border-stone-800 px-3.5 py-2 rounded-2xl shadow-md">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                {gameState.activeRoom === 'lobby'
                  ? '🎹 한우리 20기 음악실 로비'
                  : gameState.activeRoom === 'music'
                  ? '🎵 음악 퀴즈방 (서바이벌)'
                  : '👤 인물 퀴즈방 (서바이벌)'}
              </span>

              {gameState.activeRoom === 'lobby' ? (
                <div className="flex items-center gap-1.5 text-xs text-stone-300">
                  <span>현재 열린 방:</span>
                  {gameState.openRoom === 'music' && (
                    <button
                      onClick={() => handleEnterQuizRoom('music')}
                      className="px-2.5 py-1 rounded-lg bg-pink-500 hover:bg-pink-400 text-stone-950 font-bold animate-pulse flex items-center gap-1"
                    >
                      <DoorOpen className="w-3.5 h-3.5" /> 음악 퀴즈방 입장하기
                    </button>
                  )}
                  {gameState.openRoom === 'person' && (
                    <button
                      onClick={() => handleEnterQuizRoom('person')}
                      className="px-2.5 py-1 rounded-lg bg-sky-400 hover:bg-sky-300 text-stone-950 font-bold animate-pulse flex items-center gap-1"
                    >
                      <DoorOpen className="w-3.5 h-3.5" /> 인물 퀴즈방 입장하기
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    생존 {roomStats.aliveCount}명
                  </span>
                  <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-400">
                    관전 {roomStats.spectatorCount}명
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                    A구역: {roomStats.countA}명
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                    B구역: {roomStats.countB}명
                  </span>
                </div>
              )}
            </div>

            {/* 퀴즈 카운트다운 타이머 & 내 점수 */}
            <div className="flex items-center gap-3">
              {gameState.activeRoom !== 'lobby' && (
                <div
                  className={`px-3 py-1 rounded-xl font-extrabold text-sm flex items-center gap-1.5 border ${
                    gameState.quizPhase === 'question' && gameState.timer <= 5
                      ? 'bg-rose-600 text-white border-rose-300 animate-bounce'
                      : 'bg-stone-800 text-amber-300 border-stone-700'
                  }`}
                >
                  <span>⏱️ 제한시간: {gameState.timer}초</span>
                  <span className="text-[11px] font-normal text-stone-300">
                    ({gameState.quizPhase === 'question'
                      ? '선택 중'
                      : gameState.quizPhase === 'locked'
                      ? '이동 잠금!'
                      : gameState.quizPhase === 'revealed'
                      ? '정답 공개/추락!'
                      : gameState.quizPhase === 'winner'
                      ? '우승자 탄생!'
                      : '대기중'})
                  </span>
                </div>
              )}

              {myPlayer && (
                <div className="text-xs bg-stone-800 px-3 py-1 rounded-xl border border-stone-700 flex items-center gap-2">
                  <span className="text-stone-400">내 캐릭터:</span>
                  <span className="font-bold text-amber-300">{myPlayer.nickname}</span>
                  <span className="text-emerald-400 font-bold">{myPlayer.score}점</span>
                  {myPlayer.status === 'spectator' && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200 text-[10px]">
                      👻 관전자 모드
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 캔버스 래퍼 */}
          <div className="relative w-full max-w-[1100px] aspect-[3/2] rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-900/50 bg-stone-900">
            <canvas
              ref={canvasRef}
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              className="w-full h-full block object-contain"
            />

            {/* 우상단 참가자 수 캡슐 (현재 실제 온라인 접속자만 정확히 카운트) */}
            <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-md border border-stone-600/60 px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-100 shadow-lg pointer-events-none">
              <Users className="w-4 h-4 text-amber-300" />
              <span>참가자 {activePlayers.length}명</span>
            </div>

            {/* 최후의 생존자 우승 발표 오버레이 */}
            {gameState.quizPhase === 'winner' && (
              <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center mb-3 animate-bounce">
                  <Crown className="w-11 h-11 text-amber-300" />
                </div>
                <p className="text-amber-300 font-bold text-sm uppercase tracking-widest mb-1">
                  HANWOORI CHOIR 20TH SURVIVAL WINNER
                </p>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-2">
                  🎉 {gameState.lastWinnerName || '우승자'} 단원 최종 우승! 🎉
                </h2>
                <p className="text-stone-300 text-sm sm:text-base mb-6">
                  최후의 생존자 보너스 +50점이 누적되었습니다!
                </p>
                <button
                  onClick={handleReturnToLobby}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 text-stone-950 font-extrabold text-sm shadow-xl hover:brightness-110 transition"
                >
                  🎹 전원 음악실 로비로 복귀하기
                </button>
              </div>
            )}

            {/* 퀴즈방 안일 때: 방식 B (화면의 A 또는 B 버튼 터치 시 자동 이동) 오버레이 버튼 */}
            {gameState.activeRoom !== 'lobby' && myPlayer?.status === 'alive' && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10 w-[92%] sm:w-auto justify-center">
                <button
                  onClick={() => handleSelectZoneAutoWalk('A')}
                  disabled={gameState.quizPhase === 'locked' || gameState.quizPhase === 'revealed'}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-xl border-2 transition-all flex items-center justify-center gap-2 ${
                    myPlayer.selectedChoice === 'A'
                      ? 'bg-rose-600 text-white border-white scale-105'
                      : 'bg-rose-950/90 hover:bg-rose-800 text-rose-100 border-rose-500/60'
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-white text-rose-600 flex items-center justify-center font-black">
                    A
                  </span>
                  <span>A구역 자동이동</span>
                </button>

                <button
                  onClick={() => handleSelectZoneAutoWalk('B')}
                  disabled={gameState.quizPhase === 'locked' || gameState.quizPhase === 'revealed'}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-xl border-2 transition-all flex items-center justify-center gap-2 ${
                    myPlayer.selectedChoice === 'B'
                      ? 'bg-blue-600 text-white border-white scale-105'
                      : 'bg-blue-950/90 hover:bg-blue-800 text-blue-100 border-blue-500/60'
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-white text-blue-600 flex items-center justify-center font-black">
                    B
                  </span>
                  <span>B구역 자동이동</span>
                </button>
              </div>
            )}
          </div>

          {/* ==========================================
              BOTTOM MOBILE TOUCH CONTROLS & EMOTES (모바일 D-Pad 조이스틱 + 포털 이동 + 감정표현)
          ========================================== */}
          {viewMode !== 'screen' && (
            <div className="w-full max-w-[1100px] mt-3 grid grid-cols-1 md:grid-cols-3 gap-2.5 bg-stone-900/90 border border-stone-800 p-3 rounded-2xl">
              {/* 1) 모바일 가상 방향 패드 (터치 & 마우스 지원, 안내문구 제거로 깔끔) */}
              <div className="flex items-center justify-center">
                <div className="grid grid-cols-3 gap-1.5 w-32 h-32 bg-stone-950 p-2 rounded-2xl border border-stone-800 shadow-inner">
                  <div />
                  <button
                    onMouseDown={() => handleJoystickMove(0, -1)}
                    onMouseUp={handleJoystickRelease}
                    onMouseLeave={handleJoystickRelease}
                    onTouchStart={(e) => { e.preventDefault(); handleJoystickMove(0, -1); }}
                    onTouchEnd={handleJoystickRelease}
                    className="bg-stone-800 active:bg-amber-500 active:text-stone-950 rounded-xl flex items-center justify-center text-stone-200 transition"
                  >
                    <ArrowUp className="w-6 h-6" />
                  </button>
                  <div />
                  <button
                    onMouseDown={() => handleJoystickMove(-1, 0)}
                    onMouseUp={handleJoystickRelease}
                    onMouseLeave={handleJoystickRelease}
                    onTouchStart={(e) => { e.preventDefault(); handleJoystickMove(-1, 0); }}
                    onTouchEnd={handleJoystickRelease}
                    className="bg-stone-800 active:bg-amber-500 active:text-stone-950 rounded-xl flex items-center justify-center text-stone-200 transition"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <div className="bg-stone-900 rounded-xl flex items-center justify-center text-[10px] text-stone-500 font-bold">
                    이동
                  </div>
                  <button
                    onMouseDown={() => handleJoystickMove(1, 0)}
                    onMouseUp={handleJoystickRelease}
                    onMouseLeave={handleJoystickRelease}
                    onTouchStart={(e) => { e.preventDefault(); handleJoystickMove(1, 0); }}
                    onTouchEnd={handleJoystickRelease}
                    className="bg-stone-800 active:bg-amber-500 active:text-stone-950 rounded-xl flex items-center justify-center text-stone-200 transition"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </button>
                  <div />
                  <button
                    onMouseDown={() => handleJoystickMove(0, 1)}
                    onMouseUp={handleJoystickRelease}
                    onMouseLeave={handleJoystickRelease}
                    onTouchStart={(e) => { e.preventDefault(); handleJoystickMove(0, 1); }}
                    onTouchEnd={handleJoystickRelease}
                    className="bg-stone-800 active:bg-amber-500 active:text-stone-950 rounded-xl flex items-center justify-center text-stone-200 transition"
                  >
                    <ArrowDown className="w-6 h-6" />
                  </button>
                  <div />
                </div>
              </div>

              {/* 2) 로비 포털 원클릭 이동 & 감정표현 버튼 */}
              <div className="flex flex-col justify-between gap-2">
                <span className="text-xs font-bold text-stone-400">
                  빠른 출입문 이동 & 감정표현
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {gameState.activeRoom === 'lobby' ? (
                    <>
                      <button
                        onClick={() => handleWalkToPortal('music')}
                        className="flex-1 px-3 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-200 text-xs font-bold"
                      >
                        🎵 음악 퀴즈방 문 앞 이동
                      </button>
                      <button
                        onClick={() => handleWalkToPortal('person')}
                        className="flex-1 px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-bold"
                      >
                        👤 인물 퀴즈방 문 앞 이동
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleReturnToLobby}
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold"
                    >
                      🎹 음악실 로비로 돌아가기
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {['🎵', '❤️', '👏', '🙌', '✨'].map((emo) => (
                    <button
                      key={emo}
                      onClick={() => triggerEmote(emo)}
                      className="flex-1 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-base border border-stone-700 active:scale-95 transition"
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3) 내 닉네임(이름) 변경만 깔끔하게 제공 */}
              <form onSubmit={handleUpdateMyName} className="flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-stone-950 border border-stone-800 flex items-center justify-center overflow-hidden">
                      <AvatarThumbnail avatarId={myAvatarId} size={36} />
                    </div>
                    <span className="text-xs font-bold text-stone-300">내 닉네임(이름)</span>
                  </div>
                  {myPhoneLast4 && (
                    <span className="text-[11px] text-amber-300 font-medium">
                      📱 뒷번호 {myPhoneLast4}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={myNickname}
                    onChange={(e) => setMyNickname(e.target.value)}
                    placeholder="변경할 이름 입력"
                    maxLength={10}
                    className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow active:scale-95 transition"
                  >
                    이름 변경
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-[11px] text-stone-400 hover:text-rose-400 underline"
                  >
                    다른 사람으로 로그인 →
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ==========================================
            RIGHT SIDEBAR PANEL (뷰 모드별 맞춤 제어판)
        ========================================== */}
        {viewMode === 'admin' && (
          <aside className="w-full lg:w-[420px] bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col gap-4 max-h-[88vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-400" />
                <h2 className="font-extrabold text-base text-white">
                  사회자 컨트롤 콘솔 (/admin)
                </h2>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                관리자 인증됨
              </span>
            </div>

            {/* 1. 퀴즈방 개방 및 이동 제어 */}
            <div className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-800 space-y-2.5">
              <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <DoorOpen className="w-4 h-4" /> 1단계: 퀴즈방 개방 및 단원 이동
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => broadcastState({ openRoom: 'music' })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    gameState.openRoom === 'music'
                      ? 'bg-pink-500 text-stone-950 border-pink-300'
                      : 'bg-stone-900 text-stone-300 border-stone-700'
                  }`}
                >
                  🎵 음악 퀴즈방 문 열기
                </button>
                <button
                  onClick={() => broadcastState({ openRoom: 'person' })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    gameState.openRoom === 'person'
                      ? 'bg-sky-400 text-stone-950 border-sky-200'
                      : 'bg-stone-900 text-stone-300 border-stone-700'
                  }`}
                >
                  👤 인물 퀴즈방 문 열기
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() => handleEnterQuizRoom('music')}
                  className="py-2 rounded-lg bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/40 text-pink-200 text-xs font-bold"
                >
                  음악방 전원입장
                </button>
                <button
                  onClick={() => handleEnterQuizRoom('person')}
                  className="py-2 rounded-lg bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/40 text-sky-200 text-xs font-bold"
                >
                  인물방 전원입장
                </button>
                <button
                  onClick={handleReturnToLobby}
                  className="py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs font-bold"
                >
                  로비 전원복귀
                </button>
              </div>
            </div>

            {/* 2. 문제 선택 및 퀴즈 진행 제어 (수동/자동 모드) */}
            <div className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Play className="w-4 h-4" /> 2단계: 퀴즈 출제 및 바닥 추락 제어
                </h3>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gameState.autoMode}
                    onChange={(e) => broadcastState({ autoMode: e.target.checked })}
                    className="rounded accent-amber-500"
                  />
                  <span className="text-stone-300">타이머 후 자동 추락</span>
                </label>
              </div>

              <select
                value={gameState.currentQuizId}
                onChange={(e) => broadcastState({ currentQuizId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
              >
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    [{q.room === 'music' ? '음악' : '인물'}] {q.title} (정답:{q.answer})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStartQuestion(gameState.currentQuizId)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <Play className="w-4 h-4" /> 문제 시작 (타이머)
                </button>
                <button
                  onClick={executeRevealAndEliminate}
                  className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <Sparkles className="w-4 h-4" /> 정답 공개 & 바닥 추락!
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {currentQuiz?.room === 'music' && (
                  <button
                    onClick={() => soundFX.playSampleMelody(currentQuiz.melodyId || 'good_day')}
                    className="py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[11px] font-bold flex items-center justify-center gap-1"
                  >
                    <Radio className="w-3.5 h-3.5" /> 전주 멜로디
                  </button>
                )}
                <button
                  onClick={handleToggleCurrentQuizAnswer}
                  className="py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[11px] font-bold flex items-center justify-center gap-1"
                  title="현재 문제의 정답을 A ↔ B로 즉시 전환합니다"
                >
                  정답 전환 (현재:{currentQuiz?.answer})
                </button>
                <button
                  onClick={handleReviveAllInRoom}
                  className="py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-bold flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 전원 부활
                </button>
              </div>
            </div>

            {/* 2-1. 단원별 수동 즉시 탈락(바닥 추락) / 부활 제어판 */}
            <div className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> 단원 개별 즉시 탈락(추락) / 부활 제어
                </h3>
                <span className="text-[10px] text-stone-400">버튼 클릭 시 즉시 반영</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {players.map((p) => {
                  const isAlive = p.status === 'alive' || p.status === 'cheering';
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-200">{p.nickname}</span>
                        <span className="text-[10px] text-stone-400">
                          ({p.selectedChoice ? `${p.selectedChoice}구역` : '미선택'} · {p.score}점)
                        </span>
                      </div>
                      <button
                        onClick={() => handleTogglePlayerEliminate(p.id)}
                        className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition ${
                          isAlive
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {isAlive ? '💥 즉시 추락' : '✨ 부활시키기'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. 음악실 칠판/공지사항 문구 및 AI 단원 봇 제어 */}
            <div className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-300">
                  3단계: 합창단 AI 시뮬레이션 & 공지사항
                </h3>
                <button
                  onClick={() => {
                    setBotsEnabled((prevEnabled) => {
                      const next = !prevEnabled;
                      if (next) {
                        setPlayers((curr) => {
                          const bots = createInitialBots();
                          const map = new Map(curr.map((p) => [p.id, p]));
                          bots.forEach((b) => map.set(b.id, b));
                          return Array.from(map.values());
                        });
                      } else {
                        setPlayers((curr) => curr.filter((p) => !p.isBot));
                      }
                      return next;
                    });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    botsEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {botsEnabled ? '🤖 테스트용 AI 단원 활성중' : '🤖 테스트용 AI 단원 소환 (기본 꺼짐)'}
                </button>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={gameState.noticeText.replace(/\n/g, ' ')}
                  onChange={(e) => broadcastState({ noticeText: e.target.value })}
                  placeholder="우하단 공지사항 보드 문구"
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs text-white"
                />
              </div>
            </div>

            {/* 4. 새 문제 직접 등록 폼 */}
            <form onSubmit={handleAddQuiz} className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-800 space-y-2">
              <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <Plus className="w-4 h-4" /> 새 퀴즈 문제 추가
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={newQuizForm.room}
                  onChange={(e) => setNewQuizForm({ ...newQuizForm, room: e.target.value })}
                  className="px-2 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs"
                >
                  <option value="music">🎵 음악 퀴즈방</option>
                  <option value="person">👤 인물 퀴즈방</option>
                </select>
                <select
                  value={newQuizForm.answer}
                  onChange={(e) => setNewQuizForm({ ...newQuizForm, answer: e.target.value })}
                  className="px-2 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs"
                >
                  <option value="A">정답: A 구역</option>
                  <option value="B">정답: B 구역</option>
                </select>
              </div>
              <input
                type="text"
                value={newQuizForm.title}
                onChange={(e) => setNewQuizForm({ ...newQuizForm, title: e.target.value })}
                placeholder="문제 제목 입력"
                className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={newQuizForm.optionA}
                  onChange={(e) => setNewQuizForm({ ...newQuizForm, optionA: e.target.value })}
                  placeholder="보기 A 입력"
                  className="px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs"
                />
                <input
                  type="text"
                  value={newQuizForm.optionB}
                  onChange={(e) => setNewQuizForm({ ...newQuizForm, optionB: e.target.value })}
                  placeholder="보기 B 입력"
                  className="px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs"
              >
                문제 목록에 추가하기
              </button>
            </form>
          </aside>
        )}


      </main>

      {/* ==========================================
          MODAL 0: 본인 이름-휴대폰 뒷번호 파티 로그인 모달
      ========================================== */}
      {!hasJoined && viewMode !== 'screen' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-stone-900 border-2 border-amber-500/50 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center shadow-lg">
                <Music className="w-8 h-8 text-stone-950" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-100 tracking-tight">
                삼성 한우리 합창단 20기
              </h2>
              <p className="text-xs sm:text-sm text-amber-300 font-bold">
                🎄 2026 송년의 밤 & 크리스마스 파티 🎄
              </p>
              <p className="text-[11px] text-stone-400">
                본인 이름과 휴대폰 뒷번호 4자리를 입력하고 입장해주세요.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300">
                    1. 본인 이름 (직접 입력)
                  </label>
                  <span className="text-[10px] text-stone-400">한우리 20기 단원</span>
                </div>

                <input
                  type="text"
                  required
                  value={userNameInput}
                  onChange={(e) => setUserNameInput(e.target.value)}
                  placeholder="본인 성함을 직접 입력하세요 (예: 최예진)"
                  maxLength={10}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300">
                    2. 휴대폰 뒷번호 (4자리)
                  </label>
                  {userNameInput.includes('황동원') || userNameInput === '동원' ? (
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      * 번호 없이 바로 입장 가능
                    </span>
                  ) : null}
                </div>
                <input
                  type="tel"
                  required={!(userNameInput.includes('황동원') || userNameInput === '동원')}
                  value={phoneLast4Input}
                  onChange={(e) => setPhoneLast4Input(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder={
                    userNameInput.includes('황동원') || userNameInput === '동원'
                      ? '황동원 단원은 비워두셔도 됩니다'
                      : '본인 휴대폰 뒷번호 4자리 (예: 9908)'
                  }
                  maxLength={4}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-sm text-white tracking-widest placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-stone-500">
                  * 등록된 20기 단원 명단과 대조하여 본인 확인 및 점수가 저장됩니다.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300">
                    3. 내 캐릭터 아바타 선택
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomIdx = Math.floor(Math.random() * AVATAR_PRESETS.length);
                      setLoginAvatarId(AVATAR_PRESETS[randomIdx].id);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[11px] font-bold transition active:scale-95 cursor-pointer"
                  >
                    🎲 랜덤으로 뽑기
                  </button>
                </div>

                {/* 선택된 아바타 실물 하이라이트 미리보기 */}
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-stone-950 border border-amber-500/40">
                  <div className="w-16 h-16 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0">
                    <AvatarThumbnail avatarId={loginAvatarId} size={64} />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-amber-200 text-sm flex items-center gap-1.5">
                      <span>{AVATAR_PRESETS.find((a) => a.id === loginAvatarId)?.name}</span>
                      <span className="text-[10px] font-normal text-stone-400 bg-stone-800 px-1.5 py-0.5 rounded">선택됨</span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      랜덤 버튼을 누르거나 아래 목록에서 원하는 캐릭터를 터치해 고를 수 있습니다!
                    </p>
                  </div>
                </div>

                {/* 아바타 19종 실물 그리드 (실제 게임 화면 캐릭터 렌더링) */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1.5 bg-stone-950 rounded-2xl border border-stone-800">
                  {AVATAR_PRESETS.map((av) => {
                    const isSelected = loginAvatarId === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setLoginAvatarId(av.id)}
                        className={`p-1.5 rounded-xl text-center transition border flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-md scale-95'
                            : 'bg-stone-900/90 hover:bg-stone-800 border-stone-800 text-stone-300'
                        }`}
                      >
                        <AvatarThumbnail avatarId={av.id} size={48} />
                        <div className={`truncate text-[10px] mt-0.5 w-full font-bold ${isSelected ? 'text-amber-300' : 'text-stone-300'}`}>
                          {av.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-rose-500 text-stone-950 font-black text-sm sm:text-base shadow-xl hover:brightness-110 active:scale-95 transition"
              >
                🎹 파티 입장하기
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 1: PHASE 1~5 구현 검증 및 Windows 서버 가이드
      ========================================== */}
      {showPhase1Modal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h2 className="text-lg font-extrabold text-amber-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Hanwoori Choir 20기 송년회 — Phase 1~5 검증 리포트
              </h2>
              <button
                onClick={() => setShowPhase1Modal(false)}
                className="text-stone-400 hover:text-white text-sm font-bold"
              >
                닫기 ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-stone-950 border border-emerald-500/30 space-y-1.5">
                <div className="font-bold text-emerald-400 text-sm">
                  ✅ Phase 1 검증 (디자인 & 배경 분리 & 독립 아바타)
                </div>
                <p>• <b>고정 캐릭터/닉네임 완전 제거:</b> 원본 그림을 그대로 덮어쓰지 않고, 음악실 마루·칠판·그랜드피아노·이젤·티테이블·Welcome 매트·공지사항·하얀 강아지·밤하늘 창문을 깨끗한 배경 레이어로 완벽 복원했습니다.</p>
                <p>• <b>독립 아바타 16종 & 동적 닉네임:</b> 지휘자, 예진, 주아, 병수, 원배, 승환, 태율, 제환, 현주, 경환, 지은, 인애, 유정, 유빈, 규민, 동원, 다석, 김다솔 등 18종의 SD 아바타가 독립된 투명 레이어로 생성되며 실시간 닉네임이 표시됩니다.</p>
                <p>• <b>가구 충돌 및 Y-Sorting 가림 효과:</b> 피아노나 테이블 뒤로 걸어가면 가구가 캐릭터 하단을 자연스럽게 가립니다. (상단 <kbd className="px-1.5 py-0.5 bg-stone-800 rounded">충돌/레이어</kbd> 버튼으로 히트박스 확인 가능)</p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-950 border border-amber-500/30 space-y-1.5">
                <div className="font-bold text-amber-300 text-sm">
                  ✅ Phase 2 ~ 5 검증 (멀티플레이, 퀴즈방, 바닥 추락, 사회자/스크린)
                </div>
                <p>• <b>방식 A & 방식 B 동시 지원:</b> 퀴즈방에서 조이스틱/키보드로 직접 이동(방식 A)하거나, 하단 A/B 버튼을 터치해 자동 이동(방식 B)할 수 있으며, 자동 이동 중 수동 조작 시 즉시 수동 조작으로 전환됩니다.</p>
                <p>• <b>오답 구역 바닥 열림 & 추락 연출:</b> 정답 공개 시 오답 구역 바닥 플랫폼이 양옆으로 열리며 캐릭터들이 회전하며 아래로 추락하고 관전자 모드(👻)로 전환됩니다.</p>
                <p>• <b>Windows PC 로컬 서버 & QR 접속 안내:</b> 가정용 Windows PC에서 Node.js + Vite(`npm run dev -- --host`)로 실행 후 동일 Wi-Fi 또는 포트포워딩/ngrok 주소를 QR코드로 생성하면 단원 30~50명이 앱 설치 없이 스마트폰 브라우저로 즉시 접속할 수 있습니다.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowCollisionDebug(true);
                  setShowPhase1Modal(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-200 text-xs font-bold"
              >
                충돌/Y-Sorting 디버그 켜기
              </button>
              <button
                onClick={() => setShowPhase1Modal(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-extrabold"
              >
                확인 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: 전체 누적 점수 및 종합 순위표
      ========================================== */}
      {showLeaderboardModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h2 className="text-lg font-extrabold text-amber-300 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                한우리 합창단 20기 송년회 종합 순위표
              </h2>
              <button
                onClick={() => setShowLeaderboardModal(false)}
                className="text-stone-400 hover:text-white text-sm font-bold"
              >
                닫기 ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {sortedLeaderboard.map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs border ${
                    p.id === myId
                      ? 'bg-amber-500/20 border-amber-400 text-white font-bold'
                      : 'bg-stone-950 border-stone-800 text-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-black ${
                        idx === 0
                          ? 'bg-amber-400 text-stone-950'
                          : idx === 1
                          ? 'bg-stone-300 text-stone-950'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-sm flex items-center gap-1.5">
                        <span>{p.nickname}</span>
                        {p.id === myId && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            나 (Me)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        정답 {p.correctCount}회 · 우승 {p.wins}회 · 참가 {p.gamesPlayed}게임
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-emerald-400">{p.score}점</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

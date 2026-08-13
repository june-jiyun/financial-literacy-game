# 금융문맹 탈출하기 — 금융 학습 시뮬레이션 게임 (MVP)

금융 초보자가 가상 월급으로 주식 3~5턴을 직접 플레이하고, 각 턴의 주가 변동
원인을 지표와 함께 이해하도록 만든 정적 웹 게임입니다. 백엔드가 없어 링크만
열면 바로 실행됩니다.

명세는 [`docs/seed.yaml`](docs/seed.yaml), 기획은 [`docs/PRD.md`](docs/PRD.md)에 있습니다.

## 실행

```bash
npm ci          # 의존성 설치 (처음 한 번)
npm run dev     # 개발 서버 — 터미널에 뜨는 주소를 브라우저에서 열기
```

## 검증

```bash
npm run validate   # 시나리오 불변식 검사 (원인 연결·기여도 합·정답 유일성)
npm test           # 테스트 53개
npm run build      # 프로덕션 빌드 → dist/
```

`npm run validate`는 모든 시나리오 세트의 모든 기업-턴에 대해 세 가지를 검사합니다.

- 모든 주가 변동에 원인 카드가 1개 이상 연결되어 있다
- 원인 카드 기여도(%p) 합이 그 턴 주가 변동률과 일치한다
- 기여도 절댓값 최댓값이 유일하다 (정답 원인이 항상 하나로 정해진다)

시나리오 데이터를 손으로 고친 뒤에는 반드시 이걸 돌려야 합니다. 게임의 학습
설계가 이 세 조건에 걸려 있습니다.

## 배포

`main`에 푸시하면 GitHub Actions가 검증·테스트·빌드를 거쳐 GitHub Pages로
자동 배포합니다 ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

최초 1회만 저장소 설정이 필요합니다.

1. GitHub에서 새 저장소를 만들고 `main`을 푸시한다
2. 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 바꾼다
3. **Actions** 탭에서 배포가 끝나면 `https://<사용자명>.github.io/<저장소명>/` 주소가 나온다

빌드는 `base: './'` 설정으로 상대경로 자산을 내보내므로, 위와 같은 하위 경로
주소에서도 그대로 동작합니다.

## 구조

```
data/scenarios/set-{a,b,c}.json   고정 시나리오 3세트 (재플레이 시 A→B→C 전환)
scripts/validate-scenarios.mjs    시나리오 불변식 검사기
src/features/turn/                선택→공개 채점 순서, 채점 대상 기업 결정
src/features/session/             세트 전환, "n턴 중 m턴 정답" 집계, 결산 화면
src/features/cashflow/            월급·생활비·현금·투자금·손익 화면
src/App.tsx                       화면 전환과 턴 진행
```

## 이번 MVP에서 만들지 않은 것

경험치·레벨업·해금, 부동산과 가상 도시, 로그인·서버 저장, 모바일 앱,
실시간 시세 연동, 시나리오 랜덤 생성.


- 주제 : AI 페르소나 기반 고객 성향 조사 서비스
- 최종 출력은 JSON 형식

[ PRD (Product Requirements Document) ]
**버전:** v0.9 (Draft)
**대상:** SMB(10~200명 규모), 리테일·이커머스·교육·SaaS 기업
**MVP 출시 목표:** CSV 업로드 기반 페르소나 생성 + 메시지 반응 시뮬레이션

---

# 1. 제품 개요 (Product Overview)

## 1.1 제품 요약

본 제품은 사용자가 **고객 데이터를 CSV로 업로드하면**, 시스템이 자동으로 **고객 클러스터링·AI 페르소나 생성·메시지 반응 시뮬레이션**을 수행해 SMB 기업도 손쉽게 고객 성향 기반 마케팅 인사이트를 확보할 수 있도록 하는 SaaS 서비스다.

---

## 1.2 문제 정의 (Problems)

SMB 기업은 다음과 같은 문제를 공통적으로 갖는다:

* 전문 리서치 인력 부재 → 고객 데이터 분석 어려움
* 설문 기반 리서치 비용 부담(월 수십~수백만 원)
* 구매/행동 패턴을 활용한 데이터 기반 페르소나 부재
* 마케팅 메시지의 타깃 적합도 검증 방법이 없음

**→ MVP는 ‘데이터 업로드만으로 고객 페르소나를 5분 이내 생성’하는 문제 해결에 집중**

---

## 1.3 핵심 가치 제안 (Value Proposition)

* **Inbound-ready**: CSV 1개만으로 즉시 분석 시작
* **전문가 수준 페르소나 자동 생성**
* **문구·콘텐츠 반응 시뮬레이션 지원**
* **한 달 리서치 시간을 하루로 축소**

---

# 2. 대상 사용자 정의 (Target Users)

## 2.1 1차 대상 (MVP 기준)

* **SMB 마케터**

  * 월간 캠페인 기획
  * 고객 행동 이해 필요

* **서비스 운영자**

  * 고객 세그먼트 확인
  * 이탈/문의 패턴 확인

## 2.2 사용자 주요 페인포인트

* SQL, Python 등 기술 역량 부족
* CRM/CDP 미보유
* 간단한 엑셀 기반 데이터만 보유

---

# 3. 사용 시나리오 (User Scenarios)

### 시나리오 A — 페르소나 생성

1. 사용자가 CSV 업로드
2. 데이터 구조 자동 파악
3. 시스템이 자동 클러스터링 수행
4. 3~7개의 페르소나 생성
5. 대시보드에서 페르소나별 특성(연령/행동/선호요인)을 시각화

### 시나리오 B — 메시지 테스트

1. 사용자가 마케팅 문구 입력
2. 페르소나별 반응(긍정/중립/부정) 예측
3. 어떤 문구가 어떤 고객군에게 적합한지 비교표 제공

---

# 4. MVP 범위 (Scope)

## 포함되는 기능 (In Scope)

* CSV 업로드
* 기본 데이터 정규화
* 자동 클러스터링(KMeans)
* AI 기반 페르소나 설명 생성
* 메시지 반응 시뮬레이션(텍스트 기반)
* 대시보드(페르소나 리스트, 인사이트 차트)
* PDF 리포트 자동 생성

## 제외되는 기능 (Out of Scope)

* API/CRM 연동
* 엔터프라이즈 보안(SSO, 감사로그)
* 실시간 데이터 파이프라인
* 고급 UX 테스트(이미지/랜딩페이지 분석)

---

# 5. 요구사항 상세 (Requirements)

---

## 5.1 기능 요구사항 (Functional Requirements)

### **[FR-001] CSV 업로드**

* 사용자는 CSV 파일을 업로드할 수 있어야 한다.
* 시스템은 컬럼 자동 매핑을 수행해야 한다.

  * 필수 컬럼: user_id, purchase_count OR last_action_date OR basic demographics
* 업로드 용량: 최대 50MB

---

### **[FR-002] 데이터 전처리**

* 결측치 처리(평균/빈도 대체 또는 제거)
* 범주형 변수 자동 인코딩(LabelEncoding)
* 날짜 변수 → 최근성(recency) 수치화
* 수치형 변수를 표준화(StandardScaler)

---

### **[FR-003] 클러스터링 수행**

* 기본 알고리즘: KMeans (k=3~7 자동 탐색)
* 최적 K값 방법: 실루엣 스코어 기반
* 출력: 고객군 ID(cluster_id)

---

### **[FR-004] AI 페르소나 프로필 생성**

각 클러스터별로 다음 항목을 생성한다:

* 이름 (예: “실속형 실버 고객”, “트렌디 조기구매자”)
* 핵심 특징 요약
* 행동 패턴
* 구매 결정 요인
* 콘텐츠 선호도
* 위험 신호(이탈·불만 포인트)

> 생성 방식: GPT 모델 기반 자연어 생성

---

### **[FR-005] 메시지 반응 시뮬레이션**

* 입력: 마케팅 문구 200자 이내
* 출력:

  * 페르소나별 예상 반응(긍정/중립/부정)
  * 반응 이유
  * 문구 개선 제안

---

### **[FR-006] 대시보드**

* 페르소나 리스트
* 페르소나 상세 페이지
* 반응 차트
* 데이터 요약(성별/연령/지역/구매력 등)

---

### **[FR-007] 리포트 생성**

* PDF 다운로드
* 포함 내용: 페르소나 6개 이하, 특징 요약, 메시지 반응도 표

---

## 5.2 비기능 요구사항 (Non-Functional Requirements)

### 성능

* 페르소나 생성 시간: **5분 이내**
* 메시지 테스트 응답 시간: **3초 이내**

### 보안

* CSV 데이터는 업로드 후 24시간 이내 삭제
* PII 자동 비식별 처리(이름, 전화번호 제거)

### 안정성

* 업로드 실패율 1% 이하
* 파일 최대 10,000~50,000 row 처리 가능

---

# 6. 데이터 요구사항 (Data Requirements)

### 입력 데이터 스키마 예시

| 컬럼             | 타입       | 설명         |
| -------------- | -------- | ---------- |
| user_id        | string   | 고유 사용자 ID  |
| gender         | string   | M/F        |
| age            | int      | 연령         |
| region         | string   | 지역         |
| last_visit     | datetime | 마지막 방문일    |
| purchase_count | int      | 최근 6개월 구매수 |
| category       | string   | 주요 구매 카테고리 |

### 전처리 후 내부 데이터 구조(JSON)

```json
{
  "user_id": "A1001",
  "features": {
    "age": 32,
    "region": "Seoul",
    "recency": 12,
    "purchase_count": 5,
    "category_encoded": 7
  },
  "cluster_id": 2
}
```

---

# 7. **AI 페르소나 생성 알고리즘 (파이프라인)**

## 파이프라인 전체 구조

```
CSV 업로드
 → 데이터 검증
 → 전처리(결측치/인코딩)
 → 특징 추출(Recency/Frequency/Category Encoding)
 → 클러스터링(K=3~7 최적값 자동)
 → 클러스터별 Summary Stats 계산
 → LLM 기반 페르소나 설명 생성
 → 메시지 테스트(선택)
 → 대시보드/리포트 출력
```

---

## 단계별 알고리즘 상세

### **① 데이터 로딩**

* CSV → Pandas DataFrame
* 컬럼 자동 인식 (schema inference)

### **② 데이터 전처리**

* Missing value imputation
* Categorical → Label Encoding
* Numeric → Standard scaling
* Date → Recency 변환(오늘 − last_visit)

---

### **③ 특징(feature) 추출**

* RFM 기반 특징 생성
* category, device, region 등은 one-hot 또는 LabelEncoding
* PCA 2~5차원 축소(시각화용에는 선택적 적용)

---

### **④ 클러스터링**

* 알고리즘: KMeans
* K값 후보: 3~7
* 평가 지표: silhouette score
* Best K값 자동 선택
* cluster_id 저장

---

### **⑤ 클러스터 Summary 생성**

각 그룹에 대해:

* 평균/중앙값
* 대표 행동 패턴
* 주요 변수 가중치
* 텍스트 요약 입력값 자동 생성

LLM 입력 Prompt 예시:

```
"이 고객군의 특징을 5줄 이내로 요약하고 페르소나 이름을 지어줘. 
주요 특성: {summary_stats}"
```

---

### **⑥ 페르소나 설명 생성 (LLM)**

* 특징 요약
* 구매 요인
* 행동 패턴
* 선호 콘텐츠
* 마케팅 활용 가이드

출력 JSON 예시:

```json
{
  "persona_name": "트렌드 민감형 2030 여성",
  "summary": "신제품 탐색 성향이 강하고 구매 전 리뷰 탐색을 자주 함",
  "motivation": "새로운 브랜드 시도",
  "risk_signal": "리뷰 평점이 낮으면 빠르게 이탈",
  "content_preference": "짧은 영상·후기 중심 콘텐츠"
}
```

---

### **⑦ 메시지 반응 시뮬레이션**

프롬프트 예시:

```
이 페르소나가 아래 문구에 어떤 반응을 보일지 예측해줘.
문구: "{message}"
페르소나 특성: "{persona_profile}"
출력: 긍정 / 중립 / 부정, 그리고 이유를 서술하라.
```

---

### **⑧ 대시보드·PDF 출력**

* 페르소나 리스트 표시
* 클러스터링 결과 시각화(간단한 막대/파이 차트)
* PDF 자동 렌더링

---

# 8. 성공 지표 (Success Metrics, KPI)

| KPI                 | 목표             |
| ------------------- | -------------- |
| 페르소나 생성 정확도(사용자 평가) | 80% 이상 “준수 이상” |
| 메시지 반응 시뮬레이션 유용성    | 70% 이상 긍정      |
| 업로드→결과까지 시간         | 5분 이내          |
| 트라이얼→유료 전환율         | 10% 이상         |

---

# 9. 위험 요소 및 대응 전략 (Risks & Mitigation)

| 리스크         | 상세           | 대응               |
| ----------- | ------------ | ---------------- |
| 데이터 품질 편차   | 결측·이상치       | 자동 정규화 강화        |
| CSV 스키마 불일치 | 컬럼명 다양       | 컬럼 추천/자동 매핑      |
| LLM 결과 변동성  | 일관성 문제       | 템플릿 기반 Prompt 고정 |
| 개인정보 포함     | 전화번호/이름 등 유입 | 자동 비식별/마스킹       |

---


[ 주요 기능 ]
- 관리자 메뉴 : 사용자 관리(권한, 이력 등), 접속자 통계 그래프(리로드 버튼 javascript fetch() 사용)
- 일반 사용자 메뉴 : SMB용 맞게 판단해 작성


[ 주요 Tree 구조]

project/

├─ app/                                  # FastAPI 주요 애플리케이션 코드

│  ├─ main.py                            # FastAPI 엔트리포인트 (app 생성, router include, middleware)

│  ├─ config/                            # 설정 관련 디렉토리

│  │  └─ settings.py                     # DB, JWT, 환경설정 등

│  ├─ routers/                           # 라우터 모음(비동기 기반 API)

│  │  ├─ index_router.py                 # 기본 엔드포인트 (예: health check)

│  │  └─ users_router.py                 # CRUD 예제 라우터 (쿼리 기반)

│  ├─ dependencies/                      # 의존성 주입(DI) 관련 모듈

│  │  ├─ db_connection.py                # DB 연결 의존성 (세션 or pure connection)

│  │  └─ auth.py                         # 인증/인가 관련 DI (JWT/Token 검증)

│  ├─ services/                          # 비즈니스 로직 계층

│  │  └─ users_service.py                # CRUD 처리 로직 (SQL query 사용)

│  ├─ repositories/                      # DB 접근 계층

│  │  └─ users_repository.py             # SQL 쿼리 기반 CRUD 처리

│  ├─ templates/                         # jinja2 템플릿 폴더

│  │  └─ index.html                      # 기본 템플릿 (BS5 적용)

│  ├─ static/                            # 정적 파일 (CSS, JS, 이미지 등)

│  │  ├─ css/                            # Bootstrap5 커스텀 CSS 등

│  │  └─ js/

│  ├─ auth/                              # 인증/인가 관련 기능

│  │  ├─ jwt_handler.py                  # JWT 생성·검증 로직

│  │  └─ password_handler.py             # 암호 해싱/검증

│  └─ middlewares/                       # 미들웨어 관리

│     └─ logging_middleware.py           # Request/Response Logging 미들웨어

│

├─ db/                                   # DB 관련 (마이그레이션, SQL 파일)

│  ├─ schema.sql                         # 테이블 생성 SQL

│  └─ queries/                           # CRUD에 필요한 순수 SQL 저장

│     └─ users.sql

│

├─ tests/                                # Test 파일 모음

│  ├─ test_users.py                      # CRUD 테스트 (pytest)

│  └─ test_auth.py                       # 인증 기능 테스트

│

├─ docs/                                 # 문서화 폴더

│  ├─ api_spec.md                        # API 명세 (Swagger/Redoc 참고)

│  └─ system_architecture.md             # 프로젝트 구조 설명

│

├─ requirements.txt                      # Python 패키지 리스트

└─ run.py                                # uvicorn 실행 스크립트





[ 기술 스팩 ]

FastAPI를 활용하여 기본 라우팅 및 비동기 구조를 구현할 수 있다.

FastAPI에서 의존성 주입(Dependency Injection)을 활용한 구조화된 코드를 작성할 수 있다.

FastAPI를 활용하여 CRUD API를 구현하고 테스트할 수 있다.

인증·인가(OAuth2/JWT 가능) 기본 Session/Token 기반 구조를 이해하고 적용할 수 있다.

FastAPI 서버 실행, 라우팅 구조, 미들웨어 활용 등을 프로젝트 형태로 구성할 수 있다.

FastAPI를 활용하여 기본 API 엔드포인트를 구현할 수 있다.

FastAPI에서 Request/Response 흐름을 이해하고 활용할 수 있다.

Pydantic 모델 사용 제외

비동기(Async) 기반 라우팅을 작성할 수 있다.

FastAPI + DB(PostgreSQL 등) 연동을 활용한 CRUD API를 구현할 수 있다.

CRUD 는 순수 query로 처리 방식 사용

API 문서화 자동 생성(Swagger, Redoc)을 설명하고 활용할 수 있다.

jinja2 template과 BS5 사용
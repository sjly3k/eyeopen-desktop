# AI 모델 매니저 & 눈 감지 기능

이 프로젝트는 이미지에서 눈의 상태(열림/감김)를 자동으로 감지하는 AI 모델 매니저를 제공합니다.

## 주요 기능

### 1. AIModelManager

- 내장된 AI 모델을 통한 눈 상태 감지
- 다중 모델 지원 및 관리
- 실시간 처리 및 배치 처리
- 모델 성능 통계 및 모니터링

### 2. ImageManager 확장

- 이미지 업로드 시 자동 눈 감지
- 눈 상태별 이미지 분류
- 감지 결과 저장 및 관리

## 사용법

### 기본 사용법

```typescript
// EditorEngine에서 AI 모델 매니저 접근
const aiModel = editorEngine.aiModel;
const imageManager = editorEngine.image;

// 이미지에서 눈 상태 감지
const file = new File(['...'], 'image.jpg', { type: 'image/jpeg' });
const result = await aiModel.detectEyeState(file);

if (result) {
    console.log(`눈이 ${result.isOpen ? '열려있습니다' : '감겨있습니다'}`);
    console.log(`신뢰도: ${result.confidence * 100}%`);
}
```

### 이미지 업로드와 함께 눈 감지

```typescript
// 이미지 업로드와 동시에 눈 감지
const result = await imageManager.uploadWithEyeDetection(file);
if (result.eyeDetection) {
    console.log('눈 감지 완료:', result.eyeDetection);
}
```

### 이미지 분류

```typescript
// 눈이 열린 이미지들
const openEyeImages = imageManager.openEyeImages;

// 눈이 감긴 이미지들
const closedEyeImages = imageManager.closedEyeImages;

// 모든 감지 결과
const allResults = imageManager.allEyeDetectionResults;
```

### 배치 처리

```typescript
// 여러 이미지에 대해 배치 처리
const images = [file1, file2, file3];
const results = await aiModel.batchDetectEyeState(images);
```

## AI 모델 관리

### 모델 설정

```typescript
// 모델 설정 업데이트
aiModel.updateModelConfig('eye-detection-v1', {
    confidenceThreshold: 0.8,
    isEnabled: true,
});

// 새로운 모델 추가
aiModel.addModel({
    modelId: 'eye-detection-v2',
    modelName: 'Enhanced Eye Detection',
    modelType: 'eye-detection',
    version: '2.0.0',
    isEnabled: true,
    confidenceThreshold: 0.75,
});
```

### 모델 통계

```typescript
// 모델 성능 통계 확인
const stats = aiModel.getModelStats('eye-detection-v1');
if (stats) {
    console.log(`총 예측: ${stats.totalPredictions}`);
    console.log(`평균 처리 시간: ${stats.avgProcessingTime}ms`);
}
```

## 컴포넌트 사용법

```tsx
import { EyeDetectionExample } from '@/components/EyeDetectionExample';

// 컴포넌트에서 사용
<EyeDetectionExample editorEngine={editorEngine} />;
```

## 설정

### MainChannels 추가

AI 모델 관련 IPC 채널들이 `packages/models/src/constants/ipc.ts`에 추가되었습니다:

- `RUN_AI_MODEL`: AI 모델 실행
- `GET_AI_MODEL_STATUS`: 모델 상태 확인
- `UPDATE_AI_MODEL_CONFIG`: 모델 설정 업데이트
- `LOAD_AI_MODEL`: 모델 로드
- `UNLOAD_AI_MODEL`: 모델 언로드

### 메인 프로세스 구현

실제 AI 모델 실행은 메인 프로세스에서 구현해야 합니다:

```typescript
// electron/main/ai-model/index.ts (예시)
ipcMain.handle(MainChannels.RUN_AI_MODEL, async (event, args) => {
    const { modelId, imageData, modelType } = args;

    // AI 모델 실행 로직
    const result = await runEyeDetectionModel(imageData);

    return {
        success: true,
        isOpen: result.isOpen,
        confidence: result.confidence,
    };
});
```

## 성능 최적화

1. **이미지 압축**: 업로드 전 이미지 압축으로 처리 속도 향상
2. **배치 처리**: 여러 이미지를 한 번에 처리
3. **캐싱**: 동일한 이미지에 대한 중복 처리 방지
4. **비동기 처리**: UI 블로킹 방지

## 에러 처리

```typescript
try {
    const result = await aiModel.detectEyeState(file);
    if (result) {
        // 성공 처리
    } else {
        // 감지 실패
        console.warn('눈 감지에 실패했습니다.');
    }
} catch (error) {
    // 에러 처리
    console.error('AI 모델 실행 중 오류:', error);
}
```

## 확장 가능성

이 구조는 다른 AI 모델들도 쉽게 추가할 수 있도록 설계되었습니다:

- 얼굴 감지
- 감정 분석
- 객체 인식
- 텍스트 인식 (OCR)

새로운 모델 타입을 추가하려면 `AIModelConfig`의 `modelType`에 새로운 타입을 추가하고 해당 처리 로직을 구현하면 됩니다.

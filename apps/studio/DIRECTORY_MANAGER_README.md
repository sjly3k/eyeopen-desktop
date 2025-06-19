# 디렉토리 관리 시스템 & AI 모델 통합

이 프로젝트는 **실제 파일 시스템**을 스캔하여 디렉토리 구조를 관리하고 AI 모델을 통해 이미지에서 눈의 상태를 감지하는 통합 시스템을 제공합니다.

## 주요 기능

### 1. DirectoryManager

- **실제 파일 시스템 스캔**: 실제 디렉토리 구조를 자동으로 감지
- 트리 구조의 디렉토리 및 이미지 관리
- 노드 선택 및 확장/축소 기능
- 디렉토리별 통계 계산

### 2. ImageManager

- 이미지 정보 관리 및 선택 기능
- 눈 감지 결과 저장 및 필터링
- 경로 기반 이미지 검색

### 3. IntegratedDirectoryManager

- **실제 파일 시스템과 AI 모델의 통합 관리**
- 배치 처리 및 자동 눈 감지
- 이미지 업로드 및 분류
- **실시간 디렉토리 감시**

### 4. DirectoryTree 컴포넌트

- 왼쪽 레이어에 표시되는 트리 뷰
- 실시간 눈 감지 상태 표시
- 직관적인 폴더/이미지 아이콘

## 실제 디렉토리 스캔 기능

### 지원하는 이미지 형식

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- BMP (.bmp)
- WebP (.webp)
- SVG (.svg)
- TIFF (.tiff, .tif)

### 자동 메타데이터 추출

- 파일 크기
- 수정 날짜
- 이미지 크기 (width, height)
- MIME 타입

## 사용법

### 기본 사용법

```typescript
import { IntegratedDirectoryManager } from '@/lib/directory/integrated-manager';

// EditorEngine과 함께 초기화
const directoryManager = new IntegratedDirectoryManager(editorEngine);

// 실제 디렉토리 스캔
await directoryManager.scanDirectoryStructure('/Users/jamie.lee/Pictures');

// 이미지 업로드 및 눈 감지
const file = new File(['...'], 'image.jpg', { type: 'image/jpeg' });
const result = await directoryManager.uploadImageToDirectory(file, '/Users/jamie.lee/Pictures');
```

### 디렉토리 관리

```typescript
// 실제 디렉토리 스캔
await directoryManager.scanDirectoryStructure('/path/to/your/images');

// 디렉토리 새로고침 (파일 시스템 변경 감지)
await directoryManager.refreshDirectory('/path/to/your/images');

// 디렉토리 감시 설정 (실시간 변경 감지)
await directoryManager.watchDirectory('/path/to/your/images');

// 디렉토리 추가 (수동)
const directoryId = directoryManager.directory.addDirectory('New Folder', '/path/to/new-folder');

// 이미지 노드 추가
const imageNodeId = directoryManager.directory.addImageNode({
    name: 'image.jpg',
    path: '/path/to/new-folder/image.jpg',
    parentId: directoryId,
    mimeType: 'image/jpeg',
    size: 1024000,
    lastModified: new Date(),
});

// 노드 선택
directoryManager.directory.toggleNodeSelection(imageNodeId);

// 디렉토리 확장/축소
directoryManager.directory.toggleNodeExpansion(directoryId);
```

### 이미지 관리

```typescript
// 이미지 추가
const imageId = directoryManager.image.addImage({
    name: 'photo.jpg',
    path: '/path/to/photo.jpg',
    mimeType: 'image/jpeg',
    size: 2048000,
    lastModified: new Date(),
});

// 눈 감지 결과 업데이트
directoryManager.image.updateEyeDetection(imageId, {
    isOpen: true,
    confidence: 0.85,
    timestamp: Date.now(),
});

// 이미지 필터링
const openEyeImages = directoryManager.image.openEyeImages;
const closedEyeImages = directoryManager.image.closedEyeImages;
const undetectedImages = directoryManager.image.undetectedImages;
```

### AI 모델 통합

```typescript
// 선택된 이미지들에 대해 눈 감지
await directoryManager.detectEyesForSelectedImages();

// 특정 디렉토리의 모든 이미지에 대해 눈 감지
await directoryManager.detectEyesForDirectory('/Users/jamie.lee/Pictures');

// 필터링된 이미지 가져오기
const openEyeImages = directoryManager.filterSelectedImages('open-eyes');
const closedEyeImages = directoryManager.filterSelectedImages('closed-eyes');
const undetectedImages = directoryManager.filterSelectedImages('undetected');
```

## 컴포넌트 사용법

### DirectoryTree 컴포넌트

```tsx
import { DirectoryTree } from '@/components/DirectoryTree';

// 왼쪽 패널에 표시
<DirectoryTree directoryManager={directoryManager.directory} />;
```

### 통합 예시 컴포넌트

```tsx
import { IntegratedDirectoryExample } from '@/components/IntegratedDirectoryExample';

// 전체 시스템 사용 예시
<IntegratedDirectoryExample editorEngine={editorEngine} />;
```

## 실제 디렉토리 스캔 예시

```
📁 /Users/jamie.lee/Pictures (실제 디렉토리)
├── 📁 Family Photos
│   ├── 🖼️ mom.jpg 👁️ (85%)
│   ├── 🖼️ dad.jpg 😴 (92%)
│   └── 🖼️ sister.jpg 👁️ (78%)
├── 📁 Vacation 2024
│   ├── 🖼️ beach.jpg
│   ├── 🖼️ mountain.jpg
│   └── 🖼️ sunset.jpg
└── 📁 Work
    ├── 🖼️ meeting.jpg 😴 (88%)
    └── 🖼️ presentation.jpg 👁️ (91%)
```

## 메인 프로세스 구현

실제 파일 시스템 스캔은 메인 프로세스에서 처리됩니다:

```typescript
// apps/studio/electron/main/directory/index.ts
export function setupDirectoryHandlers(): void {
    ipcMain.handle(MainChannels.SCAN_DIRECTORY_STRUCTURE, async (event, args) => {
        const { rootPath, includeImages, includeSubdirectories } = args;
        return await scanDirectoryStructure(rootPath, includeImages, includeSubdirectories);
    });
}
```

## 성능 최적화

1. **지연 로딩**: 디렉토리 확장 시에만 자식 노드 로드
2. **캐싱**: 이미지 메타데이터 및 감지 결과 캐싱
3. **배치 처리**: 여러 이미지 동시 처리
4. **메모리 관리**: 불필요한 데이터 자동 정리
5. **파일 시스템 감시**: 실시간 변경 감지

## 확장 가능성

이 시스템은 다음과 같이 확장할 수 있습니다:

- **다중 AI 모델**: 얼굴 감지, 감정 분석 등
- **클라우드 통합**: 원격 저장소 지원
- **협업 기능**: 다중 사용자 지원
- **고급 필터링**: 날짜, 크기, 태그 기반 필터링
- **내보내기 기능**: 결과 리포트 생성
- **백업 기능**: 감지 결과 자동 백업

## 에러 처리

```typescript
try {
    await directoryManager.scanDirectoryStructure('/path/to/images');
} catch (error) {
    console.error('디렉토리 스캔 실패:', error);
    // 사용자에게 에러 메시지 표시
}

try {
    await directoryManager.detectEyesForSelectedImages();
} catch (error) {
    console.error('눈 감지 실패:', error);
    // 사용자에게 에러 메시지 표시
}

try {
    await directoryManager.uploadImageToDirectory(file, '/path/to/images');
} catch (error) {
    console.error('업로드 실패:', error);
    // 업로드 실패 처리
}
```

## 설정 및 커스터마이징

### 기본 디렉토리 설정

```typescript
// 기본 이미지 디렉토리 설정
const defaultImageDirectories = [
    '/Users/jamie.lee/Pictures',
    '/Users/jamie.lee/Downloads',
    '/Users/jamie.lee/Desktop',
];
```

### AI 모델 설정

```typescript
// AI 모델 설정 업데이트
editorEngine.aiModel.updateModelConfig('eye-detection-v1', {
    confidenceThreshold: 0.8,
    isEnabled: true,
});
```

### 파일 시스템 감시 설정

```typescript
// 디렉토리 감시 설정
await directoryManager.watchDirectory('/Users/jamie.lee/Pictures', true);
```

이 시스템을 통해 실제 파일 시스템의 이미지들을 효율적으로 관리하고 AI 모델을 활용한 자동 분류를 수행할 수 있습니다. 사용자는 자신의 컴퓨터에 있는 실제 이미지 폴더를 선택하여 즉시 분석을 시작할 수 있습니다.

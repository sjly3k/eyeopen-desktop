import { makeAutoObservable } from 'mobx';
import { nanoid } from 'nanoid/non-secure';
import type { ImageInfo, EyeDetectionResult } from './types';

export class ImageManager {
    private images: Map<string, ImageInfo> = new Map();
    private selectedImageIds: Set<string> = new Set();

    constructor() {
        makeAutoObservable(this);
    }

    /**
     * 이미지 정보를 추가합니다.
     */
    addImage(imageInfo: Omit<ImageInfo, 'id'>): string {
        const id = nanoid();
        const image: ImageInfo = {
            id,
            ...imageInfo,
        };
        this.images.set(id, image);
        return id;
    }

    /**
     * 이미지 정보를 업데이트합니다.
     */
    updateImage(id: string, updates: Partial<ImageInfo>): void {
        const image = this.images.get(id);
        if (image) {
            this.images.set(id, { ...image, ...updates });
        }
    }

    /**
     * 이미지를 제거합니다.
     */
    removeImage(id: string): void {
        this.images.delete(id);
        this.selectedImageIds.delete(id);
    }

    /**
     * 이미지 선택 상태를 토글합니다.
     */
    toggleImageSelection(id: string): void {
        if (this.selectedImageIds.has(id)) {
            this.selectedImageIds.delete(id);
        } else {
            this.selectedImageIds.add(id);
        }
    }

    /**
     * 모든 이미지 선택을 해제합니다.
     */
    clearSelection(): void {
        this.selectedImageIds.clear();
    }

    /**
     * 여러 이미지를 선택합니다.
     */
    selectImages(ids: string[]): void {
        this.clearSelection();
        ids.forEach((id) => this.selectedImageIds.add(id));
    }

    /**
     * 눈 감지 결과를 업데이트합니다.
     */
    updateEyeDetection(id: string, eyeDetection: EyeDetectionResult): void {
        const image = this.images.get(id);
        if (image) {
            this.updateImage(id, { eyeDetection });
        }
    }

    /**
     * 경로로 이미지를 찾습니다.
     */
    getImageByPath(path: string): ImageInfo | undefined {
        return Array.from(this.images.values()).find((img) => img.path === path);
    }

    /**
     * 디렉토리 경로로 이미지들을 필터링합니다.
     */
    getImagesByDirectory(directoryPath: string): ImageInfo[] {
        return Array.from(this.images.values()).filter((img) => img.path.startsWith(directoryPath));
    }

    /**
     * 눈이 열린 이미지들을 가져옵니다.
     */
    get openEyeImages(): ImageInfo[] {
        return Array.from(this.images.values()).filter((img) => img.eyeDetection?.isOpen === true);
    }

    /**
     * 눈이 감긴 이미지들을 가져옵니다.
     */
    get closedEyeImages(): ImageInfo[] {
        return Array.from(this.images.values()).filter((img) => img.eyeDetection?.isOpen === false);
    }

    /**
     * 눈 감지가 완료된 이미지들을 가져옵니다.
     */
    get detectedImages(): ImageInfo[] {
        return Array.from(this.images.values()).filter((img) => img.eyeDetection !== undefined);
    }

    /**
     * 눈 감지가 완료되지 않은 이미지들을 가져옵니다.
     */
    get undetectedImages(): ImageInfo[] {
        return Array.from(this.images.values()).filter((img) => img.eyeDetection === undefined);
    }

    // Getters
    get allImages(): ImageInfo[] {
        return Array.from(this.images.values());
    }

    get selectedImages(): ImageInfo[] {
        return Array.from(this.selectedImageIds)
            .map((id) => this.images.get(id)!)
            .filter(Boolean);
    }

    get selectedImageIdList(): string[] {
        return Array.from(this.selectedImageIds);
    }

    get totalImages(): number {
        return this.images.size;
    }

    get totalSize(): number {
        return Array.from(this.images.values()).reduce((sum, img) => sum + img.size, 0);
    }

    /**
     * 리소스를 정리합니다.
     */
    dispose(): void {
        this.images.clear();
        this.selectedImageIds.clear();
    }
}

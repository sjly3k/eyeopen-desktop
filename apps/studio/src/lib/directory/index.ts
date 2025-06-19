import { makeAutoObservable } from 'mobx';
import { nanoid } from 'nanoid/non-secure';
import { ImageManager } from './image';
import type { DirectoryNode, DirectoryStructure, DirectoryStats } from './types';

export class DirectoryManager {
    private imageManager = new ImageManager();
    private directoryStructure: DirectoryStructure;
    private selectedNodeIds: Set<string> = new Set();
    private expandedNodeIds: Set<string> = new Set();

    constructor() {
        makeAutoObservable(this);
        this.directoryStructure = this.createEmptyStructure();
    }

    /**
     * 빈 디렉토리 구조를 생성합니다.
     */
    private createEmptyStructure(): DirectoryStructure {
        const root: DirectoryNode = {
            id: 'root',
            name: 'Root',
            type: 'directory',
            path: '/',
            children: [],
            isExpanded: true,
        };

        return {
            root,
            flatMap: new Map([[root.id, root]]),
        };
    }

    /**
     * 디렉토리 노드를 추가합니다.
     */
    addDirectory(name: string, path: string, parentId: string = 'root'): string {
        const id = nanoid();
        const node: DirectoryNode = {
            id,
            name,
            type: 'directory',
            path,
            parentId,
            children: [],
            isExpanded: false,
        };

        this.directoryStructure.flatMap.set(id, node);

        // 부모 노드에 자식 추가
        const parent = this.directoryStructure.flatMap.get(parentId);
        if (parent && parent.children) {
            parent.children.push(node);
        }

        return id;
    }

    /**
     * 이미지 노드를 추가합니다.
     */
    addImageNode(imageInfo: {
        name: string;
        path: string;
        parentId: string;
        mimeType: string;
        size: number;
        lastModified: Date;
        dimensions?: { width: number; height: number };
    }): string {
        const id = nanoid();
        const node: DirectoryNode = {
            id,
            name: imageInfo.name,
            type: 'image',
            path: imageInfo.path,
            parentId: imageInfo.parentId,
            metadata: {
                size: imageInfo.size,
                lastModified: imageInfo.lastModified,
                mimeType: imageInfo.mimeType,
                dimensions: imageInfo.dimensions,
            },
        };

        this.directoryStructure.flatMap.set(id, node);

        // 부모 노드에 자식 추가
        const parent = this.directoryStructure.flatMap.get(imageInfo.parentId);
        if (parent && parent.children) {
            parent.children.push(node);
        }

        return id;
    }

    /**
     * 노드를 제거합니다.
     */
    removeNode(id: string): void {
        const node = this.directoryStructure.flatMap.get(id);
        if (!node) {
            return;
        }

        // 부모 노드에서 제거
        if (node.parentId) {
            const parent = this.directoryStructure.flatMap.get(node.parentId);
            if (parent && parent.children) {
                parent.children = parent.children.filter((child) => child.id !== id);
            }
        }

        // 자식 노드들도 재귀적으로 제거
        if (node.children) {
            node.children.forEach((child) => this.removeNode(child.id));
        }

        this.directoryStructure.flatMap.delete(id);
        this.selectedNodeIds.delete(id);
        this.expandedNodeIds.delete(id);
    }

    /**
     * 노드 선택 상태를 토글합니다.
     */
    toggleNodeSelection(id: string): void {
        if (this.selectedNodeIds.has(id)) {
            this.selectedNodeIds.delete(id);
        } else {
            this.selectedNodeIds.add(id);
        }
    }

    /**
     * 노드 확장/축소 상태를 토글합니다.
     */
    toggleNodeExpansion(id: string): void {
        const node = this.directoryStructure.flatMap.get(id);
        if (!node || node.type !== 'directory') {
            return;
        }

        if (this.expandedNodeIds.has(id)) {
            this.expandedNodeIds.delete(id);
            node.isExpanded = false;
        } else {
            this.expandedNodeIds.add(id);
            node.isExpanded = true;
        }
    }

    /**
     * 모든 노드 선택을 해제합니다.
     */
    clearSelection(): void {
        this.selectedNodeIds.clear();
    }

    /**
     * 경로로 노드를 찾습니다.
     */
    getNodeByPath(path: string): DirectoryNode | undefined {
        return Array.from(this.directoryStructure.flatMap.values()).find(
            (node) => node.path === path,
        );
    }

    /**
     * 디렉토리 경로의 모든 이미지 노드를 가져옵니다.
     */
    getImageNodesByDirectory(directoryPath: string): DirectoryNode[] {
        return Array.from(this.directoryStructure.flatMap.values()).filter(
            (node) => node.type === 'image' && node.path.startsWith(directoryPath),
        );
    }

    /**
     * 선택된 노드들을 가져옵니다.
     */
    get selectedNodes(): DirectoryNode[] {
        return Array.from(this.selectedNodeIds)
            .map((id) => this.directoryStructure.flatMap.get(id)!)
            .filter(Boolean);
    }

    /**
     * 선택된 이미지 노드들을 가져옵니다.
     */
    get selectedImageNodes(): DirectoryNode[] {
        return this.selectedNodes.filter((node) => node.type === 'image');
    }

    /**
     * 확장된 디렉토리 노드들을 가져옵니다.
     */
    get expandedDirectories(): DirectoryNode[] {
        return Array.from(this.expandedNodeIds)
            .map((id) => this.directoryStructure.flatMap.get(id)!)
            .filter((node) => node && node.type === 'directory');
    }

    /**
     * 디렉토리 통계를 계산합니다.
     */
    getDirectoryStats(directoryPath: string): DirectoryStats {
        const imageNodes = this.getImageNodesByDirectory(directoryPath);
        const totalImages = imageNodes.length;

        let openEyeImages = 0;
        let closedEyeImages = 0;
        let totalSize = 0;
        let totalConfidence = 0;
        let confidenceCount = 0;

        imageNodes.forEach((node) => {
            if (node.metadata?.size) {
                totalSize += node.metadata.size;
            }

            if (node.metadata?.eyeDetection) {
                if (node.metadata.eyeDetection.isOpen) {
                    openEyeImages++;
                } else {
                    closedEyeImages++;
                }
                totalConfidence += node.metadata.eyeDetection.confidence;
                confidenceCount++;
            }
        });

        return {
            totalImages,
            openEyeImages,
            closedEyeImages,
            totalSize,
            averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
        };
    }

    /**
     * 전체 디렉토리 통계를 계산합니다.
     */
    get totalStats(): DirectoryStats {
        return this.getDirectoryStats('/');
    }

    // Getters
    get root(): DirectoryNode {
        return this.directoryStructure.root;
    }

    get flatMap(): Map<string, DirectoryNode> {
        return this.directoryStructure.flatMap;
    }

    get image() {
        return this.imageManager;
    }

    /**
     * 리소스를 정리합니다.
     */
    dispose(): void {
        this.imageManager.dispose();
        this.directoryStructure.flatMap.clear();
        this.selectedNodeIds.clear();
        this.expandedNodeIds.clear();
    }
}

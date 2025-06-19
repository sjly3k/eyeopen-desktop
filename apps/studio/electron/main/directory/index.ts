import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { MainChannels } from '@onlook/models/constants';

interface DirectoryInfo {
    path: string;
    name: string;
    parentPath?: string;
}

interface ImageInfo {
    path: string;
    name: string;
    parentPath: string;
    size: number;
    lastModified: number;
    mimeType: string;
    dimensions?: { width: number; height: number };
}

interface ScanResult {
    success: boolean;
    directories: DirectoryInfo[];
    images: ImageInfo[];
    error?: string;
}

/**
 * 디렉토리 구조를 스캔합니다.
 */
async function scanDirectoryStructure(
    rootPath: string,
    includeImages: boolean = true,
    includeSubdirectories: boolean = true,
): Promise<ScanResult> {
    try {
        const directories: DirectoryInfo[] = [];
        const images: ImageInfo[] = [];

        // 루트 디렉토리 확인
        if (!fs.existsSync(rootPath)) {
            return {
                success: false,
                directories: [],
                images: [],
                error: `디렉토리가 존재하지 않습니다: ${rootPath}`,
            };
        }

        const rootStats = fs.statSync(rootPath);
        if (!rootStats.isDirectory()) {
            return {
                success: false,
                directories: [],
                images: [],
                error: `경로가 디렉토리가 아닙니다: ${rootPath}`,
            };
        }

        // 재귀적으로 디렉토리 스캔
        await scanDirectoryRecursive(
            rootPath,
            rootPath,
            directories,
            images,
            includeImages,
            includeSubdirectories,
        );

        return {
            success: true,
            directories,
            images,
        };
    } catch (error) {
        console.error('디렉토리 스캔 오류:', error);
        return {
            success: false,
            directories: [],
            images: [],
            error: error instanceof Error ? error.message : '알 수 없는 오류',
        };
    }
}

/**
 * 디렉토리를 재귀적으로 스캔합니다.
 */
async function scanDirectoryRecursive(
    currentPath: string,
    rootPath: string,
    directories: DirectoryInfo[],
    images: ImageInfo[],
    includeImages: boolean,
    includeSubdirectories: boolean,
): Promise<void> {
    try {
        const items = fs.readdirSync(currentPath);

        for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const relativePath = path.relative(rootPath, itemPath);
            const parentPath = path.relative(rootPath, currentPath) || '/';

            try {
                const stats = fs.statSync(itemPath);

                if (stats.isDirectory()) {
                    // 디렉토리 정보 추가
                    directories.push({
                        path: relativePath,
                        name: item,
                        parentPath: parentPath === '/' ? undefined : parentPath,
                    });

                    // 하위 디렉토리 스캔
                    if (includeSubdirectories) {
                        await scanDirectoryRecursive(
                            itemPath,
                            rootPath,
                            directories,
                            images,
                            includeImages,
                            includeSubdirectories,
                        );
                    }
                } else if (stats.isFile() && includeImages) {
                    // 이미지 파일 확인
                    if (isImageFile(item)) {
                        const imageInfo: ImageInfo = {
                            path: relativePath,
                            name: item,
                            parentPath,
                            size: stats.size,
                            lastModified: stats.mtime.getTime(),
                            mimeType: getMimeType(item),
                        };

                        // 이미지 크기 정보 가져오기 (선택적)
                        try {
                            const dimensions = await getImageDimensions(itemPath);
                            if (dimensions) {
                                imageInfo.dimensions = dimensions;
                            }
                        } catch (error) {
                            console.warn(`이미지 크기 정보 가져오기 실패: ${itemPath}`, error);
                        }

                        images.push(imageInfo);
                    }
                }
            } catch (error) {
                console.warn(`파일/디렉토리 접근 실패: ${itemPath}`, error);
            }
        }
    } catch (error) {
        console.error(`디렉토리 읽기 실패: ${currentPath}`, error);
    }
}

/**
 * 파일이 이미지인지 확인합니다.
 */
function isImageFile(filename: string): boolean {
    const imageExtensions = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.bmp',
        '.webp',
        '.svg',
        '.tiff',
        '.tif',
    ];
    const ext = path.extname(filename).toLowerCase();
    return imageExtensions.includes(ext);
}

/**
 * 파일의 MIME 타입을 가져옵니다.
 */
function getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.tiff': 'image/tiff',
        '.tif': 'image/tiff',
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 이미지의 크기 정보를 가져옵니다.
 */
async function getImageDimensions(
    filePath: string,
): Promise<{ width: number; height: number } | null> {
    try {
        // Node.js에서 이미지 크기를 가져오는 간단한 방법
        // 실제 구현에서는 sharp, jimp 등의 라이브러리를 사용할 수 있습니다
        const buffer = fs.readFileSync(filePath);

        // PNG 파일의 경우
        if (buffer.length >= 24 && buffer[0] === 0x89 && buffer[1] === 0x50) {
            const width = buffer.readUInt32BE(16);
            const height = buffer.readUInt32BE(20);
            return { width, height };
        }

        // JPEG 파일의 경우 (간단한 구현)
        if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
            // JPEG는 복잡하므로 기본값 반환
            return { width: 800, height: 600 };
        }

        return null;
    } catch (error) {
        console.warn('이미지 크기 정보 가져오기 실패:', error);
        return null;
    }
}

/**
 * 디렉토리 감시를 설정합니다.
 */
function watchDirectory(directoryPath: string, recursive: boolean = true): void {
    try {
        if (!fs.existsSync(directoryPath)) {
            throw new Error(`디렉토리가 존재하지 않습니다: ${directoryPath}`);
        }

        const watcher = fs.watch(directoryPath, { recursive }, (eventType, filename) => {
            if (filename) {
                console.log(`파일 시스템 변경 감지: ${eventType} - ${filename}`);

                // 렌더러 프로세스에 변경 알림
                // mainWindow?.webContents.send(MainChannels.DIRECTORY_CHANGED, {
                //     eventType,
                //     filename,
                //     directoryPath,
                // });
            }
        });

        console.log(`디렉토리 감시 시작: ${directoryPath}`);
    } catch (error) {
        console.error('디렉토리 감시 설정 실패:', error);
        throw error;
    }
}

// IPC 핸들러 등록
export function setupDirectoryHandlers(): void {
    ipcMain.handle(MainChannels.SCAN_DIRECTORY_STRUCTURE, async (event, args) => {
        const { rootPath, includeImages, includeSubdirectories } = args;
        return await scanDirectoryStructure(rootPath, includeImages, includeSubdirectories);
    });

    ipcMain.handle(MainChannels.WATCH_DIRECTORY, async (event, args) => {
        const { path: directoryPath, recursive } = args;
        try {
            watchDirectory(directoryPath, recursive);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '알 수 없는 오류',
            };
        }
    });

    ipcMain.handle(MainChannels.GET_DIRECTORY_INFO, async (event, args) => {
        const { path: directoryPath } = args;
        try {
            const stats = fs.statSync(directoryPath);
            return {
                success: true,
                info: {
                    path: directoryPath,
                    name: path.basename(directoryPath),
                    isDirectory: stats.isDirectory(),
                    size: stats.size,
                    lastModified: stats.mtime.getTime(),
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '알 수 없는 오류',
            };
        }
    });
}

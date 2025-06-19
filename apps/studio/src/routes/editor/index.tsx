import { EditPanel } from './EditPanel';
import { HotkeysModal } from './HotkeysModal';
import { LayersPanel } from './LayersPanel';
import { Toolbar } from './Toolbar';
import { EditorTopBar } from './TopBar';

export function ProjectEditor() {
    return (
        <>
            <div className="relative flex flex-col h-[calc(100vh-2.60rem)] select-none">
                <div className="w-full">
                    <EditorTopBar />
                </div>
                <div className="flex flex-row">
                    <div className="h-[calc(100%-5rem)] animate-layer-panel-in">
                        <LayersPanel />
                    </div>

                    <div className="flex-1">
                        <div>사진이 들어갈 자리</div>
                    </div>

                    <div className="h-[calc(100%-5rem)] animate-edit-panel-in">
                        <EditPanel />
                    </div>
                </div>

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-toolbar-up">
                    <Toolbar />
                </div>
            </div>
            <HotkeysModal />
        </>
    );
}

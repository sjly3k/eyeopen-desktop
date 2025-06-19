import { cn } from '@onlook/ui/utils';
import { observer } from 'mobx-react-lite';
import LayersTab from './LayersTab';
import { useEditorEngine } from '@/components/Context';

export const LayersPanel = observer(() => {
    return (
        <div className={cn('flex gap-0 h-[calc(100vh-5rem)]')}>
            <div className="flex-1 w-[280px] bg-background/95 rounded-xl">
                <div className="border backdrop-blur-xl h-full shadow overflow-auto p-0 rounded-r-xl">
                    <LayersTab />
                </div>
            </div>
        </div>
    );
});

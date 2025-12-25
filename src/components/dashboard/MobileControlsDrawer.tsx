import { Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ViewToggle, ViewConfig } from '@/components/dashboard/ViewToggle';
import { CurrencySwitcher } from '@/components/dashboard/CurrencySwitcher';
import { ShareAdvisorDialog } from '@/components/sharing/ShareAdvisorDialog';
import { Separator } from '@/components/ui/separator';

interface MobileControlsDrawerProps {
  viewConfig: ViewConfig;
  onViewConfigChange: (config: ViewConfig) => void;
  isViewingShared?: boolean;
}

export function MobileControlsDrawer({ 
  viewConfig, 
  onViewConfigChange,
  isViewingShared = false
}: MobileControlsDrawerProps) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 md:hidden">
          <Sliders size={14} />
          Controls
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Dashboard Controls</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-6">
          {/* View Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">View Mode</label>
            <ViewToggle config={viewConfig} onChange={onViewConfigChange} isMobileDrawer />
          </div>
          
          <Separator />
          
          {/* Currency Switcher */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Display Currency</label>
            <CurrencySwitcher isMobileDrawer />
          </div>
          
          {/* Share Advisor - only for non-shared view */}
          {!isViewingShared && (
            <>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Share Access</label>
                <ShareAdvisorDialog isMobileDrawer />
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
